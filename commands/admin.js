const fs = require('fs');
const path = require('path');

module.exports = {
    name: "admin",
    dev: "HNT",
    category: "Khác",
    info: "Xem danh sách admin, mod và support team",
    usages: [
        "/admin - Xem danh sách quản trị viên"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;
        const adminPath = path.join(__dirname, '..', 'admin.json');
        
        try {
            const adminData = JSON.parse(fs.readFileSync(adminPath, 'utf8'));
            const userDataPath = path.join(__dirname, '..', 'events/cache/userData.json');
            
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        
            async function getUserInfoSafely(api, uid, userData) {
                try {
                    const userInfo = await api.getUserInfo(uid);
                    if (userInfo && userInfo[uid]) {
                        return {
                            uid: uid,
                            name: userInfo[uid].name || userData[uid]?.name || "Không xác định",
                            vanity: userInfo[uid].vanity || uid,
                            gender: userInfo[uid].gender || userData[uid]?.gender,
                            isValid: true
                        };
                    }
                } catch (err) {
                    console.log(`Info: Không thể lấy thông tin của ID ${uid}, sử dụng dữ liệu cached`);
                    return {
                        uid: uid,
                        name: userData[uid]?.name || "Người dùng Facebook",
                        vanity: uid,
                        gender: userData[uid]?.gender || 0,
                        isValid: false
                    };
                }
            }

            const adminList = [];
            for (const adminUID of adminData.adminUIDs) {
                if (!adminUID) continue;
                const info = await getUserInfoSafely(api, adminUID, userData);
                if (info) {
                    adminList.push({
                        ...info,
                        type: "Admin"
                    });
                }
            }

            const modList = [];
            for (const modUID of adminData.moderatorUIDs) {
                if (!modUID) continue;
                const info = await getUserInfoSafely(api, modUID, userData);
                if (info) {
                    modList.push({
                        ...info,
                        type: "Moderator"
                    });
                }
            }

            const supportList = [];
            for (const supportUID of (adminData.supportUIDs || [])) {
                if (!supportUID) continue;
                const info = await getUserInfoSafely(api, supportUID, userData);
                if (info) {
                    supportList.push({
                        ...info,
                        type: "SupportTeam"
                    });
                }
            }

            let msg = "👥 QUẢN LÝ HỆ THỐNG BOT\n";
            msg += "━━━━━━━━━━━━━━━━━━\n\n";

            msg += "👑 ADMIN:\n";
            if (adminList.length === 0) {
                msg += "Chưa có Admin nào\n\n";
            } else {
                for (let i = 0; i < adminList.length; i++) {
                    const admin = adminList[i];
                    const genderIcon = admin.gender === 2 ? "👨" : admin.gender === 1 ? "👩" : "👤";
                    
                    msg += `${genderIcon} ${admin.name}${!admin.isValid ? " (💾)" : ""}\n`;
                    msg += `   ├─ID: ${admin.uid}\n`;
                    msg += `   └─FB: facebook.com/${admin.vanity}\n`;
                    if (i < adminList.length - 1) msg += "\n";
                }
                msg += "\n";
            }

            if (modList.length > 0) {
                msg += "⚔️ ĐIỀU HÀNH VIÊN:\n";
                for (let i = 0; i < modList.length; i++) {
                    const mod = modList[i];
                    const genderIcon = mod.gender === 2 ? "👨" : mod.gender === 1 ? "👩" : "👤";
                    
                    msg += `${genderIcon} ${mod.name}${!mod.isValid ? " (💾)" : ""}\n`;
                    msg += `   ├─ID: ${mod.uid}\n`;
                    msg += `   └─FB: facebook.com/${mod.vanity}\n`;
                    if (i < modList.length - 1) msg += "\n";
                }
                msg += "\n";
            }

            if (supportList.length > 0) {
                msg += "💎 SUPPORT TEAM:\n";
                for (let i = 0; i < supportList.length; i++) {
                    const support = supportList[i];
                    const genderIcon = support.gender === 2 ? "👨" : support.gender === 1 ? "👩" : "👤";
                    
                    msg += `${genderIcon} ${support.name}${!support.isValid ? " (💾)" : ""}\n`;
                    msg += `   ├─ID: ${support.uid}\n`;
                    msg += `   └─FB: facebook.com/${support.vanity}\n`;
                    if (i < supportList.length - 1) msg += "\n";
                }
            }

            msg += "\n🤖 THÔNG TIN BOT:\n";
            msg += `Tên: ${adminData.botName || "AKI BOT"}\n`;
            msg += `Chủ sở hữu: ${adminData.ownerName || "Kenji Akira"}\n`;
            msg += `Prefix: ${adminData.prefix || "."}\n`;
            msg += `Facebook: facebook.com/${adminData.facebookLink || "61573427362389"}\n`;
            
            return api.sendMessage(msg, threadID, messageID);
            
        } catch (error) {
            console.error('Lỗi:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi tải thông tin!", threadID, messageID);
        }
    }
};
