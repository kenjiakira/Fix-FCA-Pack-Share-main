const fs = require('fs');

module.exports = {
    name: "admin",
    aliases: ["qtv"],
    dev: "HNT",
    info: "Quản lý admin và mod của bot",
    usedby: 2,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "/admin add [admin/mod] [uid/reply] - Thêm admin/mod mới",
        "/admin remove [admin/mod] [uid/reply] - Xóa admin/mod",
        "/admin list - Xem danh sách admin và mod"
    ],

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageReply, senderID } = event;
        
        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const action = target[0]?.toLowerCase();
            const role = target[1]?.toLowerCase();
            const targetID = target[2] || messageReply?.senderID;

            if (!action || action === "list") {
                let admins = [], mods = [];
                
                for (const id of adminConfig.adminUIDs || []) {
                    try {
                        const info = await api.getUserInfo(id);
                        admins.push(`👤 ${info[id].name} (${id})`);
                    } catch {
                        admins.push(`👤 Unknown (${id})`);
                    }
                }
                
                for (const id of adminConfig.moderatorUIDs || []) {
                    try {
                        const info = await api.getUserInfo(id);
                        mods.push(`👤 ${info[id].name} (${id})`);
                    } catch {
                        mods.push(`👤 Unknown (${id})`);
                    }
                }

                return api.sendMessage(
                    "📑 DANH SÁCH QUẢN TRỊ BOT\n\n" +
                    "👑 ADMIN:\n" + (admins.length ? admins.join("\n") : "Không có") + "\n\n" +
                    "⭐ MODERATOR:\n" + (mods.length ? mods.join("\n") : "Không có"),
                    threadID
                );
            }

            if (!["add", "remove"].includes(action)) {
                return api.sendMessage("❌ Lệnh không hợp lệ! Sử dụng: add, remove, list", threadID);
            }

            if (!["admin", "mod"].includes(role)) {
                return api.sendMessage("❌ Vai trò không hợp lệ! Sử dụng: admin hoặc mod", threadID);
            }

            if (!targetID) {
                return api.sendMessage("❌ Vui lòng tag hoặc reply người dùng!", threadID);
            }

            const userInfo = await api.getUserInfo(targetID);
            const userName = userInfo[targetID]?.name || targetID;

            if (action === "add") {
                if (role === "admin") {
                    if (adminConfig.adminUIDs.includes(targetID)) {
                        return api.sendMessage("❌ Người dùng này đã là Admin!", threadID);
                    }
                    adminConfig.adminUIDs.push(targetID);
                } else { 
                    if (adminConfig.adminUIDs.includes(targetID)) {
                        return api.sendMessage("❌ Người dùng này đã là Admin, không thể thêm làm Mod!", threadID);
                    }
                    if (!adminConfig.moderatorUIDs) adminConfig.moderatorUIDs = [];
                    if (adminConfig.moderatorUIDs.includes(targetID)) {
                        return api.sendMessage("❌ Người dùng này đã là Mod!", threadID);
                    }
                    adminConfig.moderatorUIDs.push(targetID);
                }
            } else { 
                if (role === "admin") {
                    if (targetID === senderID) {
                        return api.sendMessage("❌ Bạn không thể tự xóa quyền admin của chính mình!", threadID);
                    }
                    if (!adminConfig.adminUIDs.includes(targetID)) {
                        return api.sendMessage("❌ Người dùng này không phải là Admin!", threadID);
                    }
                    adminConfig.adminUIDs = adminConfig.adminUIDs.filter(id => id !== targetID);
                } else { // mod
                    if (!adminConfig.moderatorUIDs?.includes(targetID)) {
                        return api.sendMessage("❌ Người dùng này không phải là Mod!", threadID);
                    }
                    adminConfig.moderatorUIDs = adminConfig.moderatorUIDs.filter(id => id !== targetID);
                }
            }

            fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));

            return api.sendMessage(
                `✅ Đã ${action === "add" ? "thêm" : "xóa"} ${role === "admin" ? "Admin" : "Mod"} thành công!\n` +
                `👤 Tên: ${userName}\n` +
                `🆔 ID: ${targetID}`,
                threadID
            );

        } catch (error) {
            console.error("Error in admin command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi trong quá trình xử lý!", threadID);
        }
    }
};
