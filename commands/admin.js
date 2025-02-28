const fs = require('fs');
const path = require('path');

module.exports = {
    name: "admin",
    dev: "HNT",
    category: "Khác",
    info: "Xem danh sách admin và mod bot",
    usages: "",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;
        
        try {
            const adminPath = path.join(__dirname, '..', 'admin.json');
            const userDataPath = path.join(__dirname, '..', 'events/cache/userData.json');
            
            const adminData = JSON.parse(fs.readFileSync(adminPath, 'utf8'));
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            
            const adminList = [];
            for (const adminUID of adminData.adminUIDs) {
                try {
                    const userInfo = await api.getUserInfo(adminUID);
                    if (userInfo[adminUID]) {
                        adminList.push({
                            uid: adminUID,
                            name: userInfo[adminUID].name || userData[adminUID]?.name || "Không xác định",
                            vanity: userInfo[adminUID].vanity || adminUID,
                            gender: userInfo[adminUID].gender || userData[adminUID]?.gender,
                            type: "Admin"
                        });
                    }
                } catch (err) {
                    console.error(`Không thể lấy thông tin của admin ${adminUID}:`, err);
                    adminList.push({
                        uid: adminUID,
                        name: userData[adminUID]?.name || "Không xác định",
                        vanity: adminUID,
                        gender: userData[adminUID]?.gender,
                        type: "Admin"
                    });
                }
            }

            const modList = [];
            for (const modUID of adminData.moderatorUIDs) {
                if (!modUID) continue;
                try {
                    const userInfo = await api.getUserInfo(modUID);
                    if (userInfo[modUID]) {
                        modList.push({
                            uid: modUID,
                            name: userInfo[modUID].name || userData[modUID]?.name || "Không xác định",
                            vanity: userInfo[modUID].vanity || modUID,
                            gender: userInfo[modUID].gender || userData[modUID]?.gender,
                            type: "Moderator"
                        });
                    }
                } catch (err) {
                    console.error(`Không thể lấy thông tin của mod ${modUID}:`, err);
                    modList.push({
                        uid: modUID,
                        name: userData[modUID]?.name || "Không xác định",
                        vanity: modUID,
                        gender: userData[modUID]?.gender,
                        type: "Moderator"
                    });
                }
            }

            let msg = "DANH SÁCH QUẢN LÝ\n";
            msg += "━━━━━━━━━━━━━━━━━━\n\n";
            
            msg += "👑 ADMIN:\n";
            if (adminList.length === 0) {
                msg += "Chưa có admin nào\n";
            } else {
                for (let i = 0; i < adminList.length; i++) {
                    const admin = adminList[i];
                    const genderIcon = admin.gender === 2 ? "👨" : admin.gender === 1 ? "👩" : "👤";
                    
                    msg += `${i + 1}. ${genderIcon} ${admin.name}\n`;
                    msg += `└─ ID: ${admin.uid}\n`;
                    msg += `└─ Link: https://fb.com/${admin.vanity}\n`;
                    if (i < adminList.length - 1) msg += "──────────────\n";
                }
            }

            msg += "\n⚔️ ĐIỀU HÀNH VIÊN:\n";
            if (modList.length === 0) {
                msg += "Chưa có ĐIỀU HÀNH VIÊN nào\n";
            } else {
                for (let i = 0; i < modList.length; i++) {
                    const mod = modList[i];
                    const genderIcon = mod.gender === 2 ? "👨" : mod.gender === 1 ? "👩" : "👤";
                    
                    msg += `${i + 1}. ${genderIcon} ${mod.name}\n`;
                    msg += `└─ ID: ${mod.uid}\n`;
                    msg += `└─ Link: https://fb.com/${mod.vanity}\n`;
                    if (i < modList.length - 1) msg += "──────────────\n";
                }
            }

            msg += "\n📊 THỐNG KÊ:\n";
            msg += `├─ Tổng Admin: ${adminList.length}\n`;
            msg += `└─ Tổng Mod: ${modList.length}`;

            return api.sendMessage(msg, threadID, messageID);
            
        } catch (error) {
            console.error('Lỗi đọc danh sách quản lý:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi đọc danh sách quản lý!", threadID, messageID);
        }
    }
};
