module.exports = {
    name: "perm",
    dev: "HNT",
    usedby: 0, 
    nickName: ["perm", "quyền", "role"],
    info: "Xem quyền hạn của bản thân hoặc người được tag",
    onPrefix: true,
    cooldowns: 5,

    onLaunch: async function({ api, event }) {
        const { threadID, senderID, mentions } = event;
        const fs = require("fs");
        
        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const threadInfo = await api.getThreadInfo(threadID);
            const threadAdmins = threadInfo?.adminIDs?.map(admin => admin.id) || [];

            const targetID = Object.keys(mentions)[0] || senderID;
            let targetName = "Bạn";
            
            if(targetID !== senderID) {
                const userInfo = await api.getUserInfo(targetID);
                targetName = userInfo[targetID].name || "Người dùng";
            }

            const isAdmin = adminConfig.adminUIDs?.includes(targetID);
            const isMod = adminConfig.moderatorUIDs?.includes(targetID);
            const isThreadAdmin = threadAdmins.includes(targetID);

            let permInfo = {
                level: "Thành viên",
                color: "⚪",
                canUse: ["Lệnh cơ bản cho thành viên"],
                special: []
            };

            if (isAdmin) {
                permInfo = {
                    level: "Admin Bot",
                    color: "🔴",
                    canUse: [
                        "Tất cả lệnh trong hệ thống",
                        "Quản lý toàn bộ người dùng",
                        "Thêm/xóa admin, mod",
                        "Cài đặt và cấu hình bot"
                    ],
                    special: [
                        "Không bị giới hạn cooldown",
                        "Bypass mọi điều kiện sử dụng",
                        "Quyền truy cập console"
                    ]
                };
            } else if (isMod) {
                permInfo = {
                    level: "Điều hành viên",
                    color: "🟡",
                    canUse: [
                        "Lệnh quản lý người dùng",
                        "Lệnh quản trị nhóm nâng cao",
                        "Kiểm soát hoạt động bot"
                    ],
                    special: [
                        "Báo cáo tới admin"
                    ]
                };
            } else if (isThreadAdmin) {
                permInfo = {
                    level: "Quản trị viên",
                    color: "🟢",
                    canUse: [
                        "Lệnh quản lý nhóm cơ bản",
                        "Quản lý thành viên nhóm",
                        "Cài đặt nhóm"
                    ],
                    special: [
                        "Một số lệnh quản trị đặc biệt"
                    ]
                };
            }

            const msg = `${permInfo.color} THÔNG TIN QUYỀN HẠN ${permInfo.color}\n\n` +
                       `👤 Đối tượng: ${targetName}\n` +
                       `📊 Cấp bậc: ${permInfo.level}\n` +
                       `🔰 ID: ${targetID}\n\n` +
                       `📌 QUYỀN HẠN SỬ DỤNG:\n${permInfo.canUse.map(p => `  ▸ ${p}`).join("\n")}\n\n` +
                       `✨ ĐẶC QUYỀN:\n${permInfo.special.map(s => `  ▸ ${s}`).join("\n")}\n\n` +
                       `💡 Lưu ý: Quyền hạn có thể thay đổi tùy theo cài đặt của admin và nhóm`;

            return api.sendMessage(msg, threadID);

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã có lỗi xảy ra khi kiểm tra quyền hạn!", threadID);
        }
    }
};
