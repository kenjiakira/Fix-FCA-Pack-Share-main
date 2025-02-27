const fs = require("fs");

module.exports = {
    name: "admin",
    usedby: 0,
    dev: "HNT",
    onPrefix: true,
    cooldowns: 1,
    info: "Danh sách Quản trị viên và Điều hành viên",
    hide: false,

    onLaunch: async function ({ api, event, target }) {
        const { threadID } = event;
        
        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const userData = JSON.parse(fs.readFileSync("./events/cache/userData.json", "utf8"));
            
            const getUserInfo = async (uid) => {
                try {
                    const info = await api.getUserInfo(uid);
                    return info[uid]?.name || userData[uid]?.name || `Facebook User (${uid})`;
                } catch (e) {
                    return userData[uid]?.name || `Facebook User (${uid})`;
                }
            };

            if (adminConfig.adminUIDs.includes(event.senderID) && target.length > 0) {
                const [action, role, targetID] = target;
                const replyID = event.messageReply?.senderID;
                const finalTargetID = targetID || replyID;

                if ((action === "add" || action === "remove") && role && finalTargetID) {
                    if (role === "admin") {
                        if (action === "add") {
                            if (!adminConfig.adminUIDs.includes(finalTargetID)) {
                                adminConfig.adminUIDs.push(finalTargetID);
                                fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));
                                return api.sendMessage(`✅ Đã thêm Quản trị viên mới!`, threadID);
                            }
                        } else {
                            adminConfig.adminUIDs = adminConfig.adminUIDs.filter(id => id !== finalTargetID);
                            fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));
                            return api.sendMessage(`✅ Đã xóa Quản trị viên!`, threadID);
                        }
                    } else if (role === "mod") {
                        if (action === "add") {
                            if (!adminConfig.moderatorUIDs) adminConfig.moderatorUIDs = [];
                            if (!adminConfig.moderatorUIDs.includes(finalTargetID)) {
                                adminConfig.moderatorUIDs.push(finalTargetID);
                                fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));
                                return api.sendMessage(`✅ Đã thêm Điều hành viên mới!`, threadID);
                            }
                        } else {
                            if (adminConfig.moderatorUIDs) {
                                adminConfig.moderatorUIDs = adminConfig.moderatorUIDs.filter(id => id !== finalTargetID);
                                fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));
                                return api.sendMessage(`✅ Đã xóa Điều hành viên!`, threadID);
                            }
                        }
                    }
                }
            }

            let adminList = await Promise.all(adminConfig.adminUIDs.map(async uid => {
                const name = await getUserInfo(uid);
                return `👤 ${name}\n📍 ID: ${uid}`;
            }));

            let modList = [];
            if (adminConfig.moderatorUIDs && adminConfig.moderatorUIDs.length > 0) {
                modList = await Promise.all(adminConfig.moderatorUIDs.map(async uid => {
                    const name = await getUserInfo(uid);
                    return `👤 ${name}\n📍 ID: ${uid}`;
                }));
            }

            let message = ' [ ADMIN LIST ] \n\n';
            message += '👑 QUẢN TRỊ VIÊN:\n';
            message += adminList.join('\n') + '\n\n';
            
            if (modList.length > 0) {
                message += '👮 ĐIỀU HÀNH VIÊN:\n';
                message += modList.join('\n');
            }
            
            message += '\n════════════';

            return api.sendMessage(message, threadID);

        } catch (error) {
            console.error("Error in admin command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi lấy danh sách admin!", threadID);
        }
    }
};
