const fs = require('fs');
const path = require('path');

module.exports = {
    name: "admin",
    dev: "HNT",
    category: "Khác",
    info: "Xem danh sách admin và mod bot, thêm/xóa DHV",
    usages: [
        "/admin - Xem danh sách",
        "/admin add dhv @tag - Thêm DHV bằng tag",
        "/admin add dhv <ID> - Thêm DHV bằng ID",
        "/admin del dhv @tag - Xóa DHV bằng tag",
        "/admin del dhv <ID> - Xóa DHV bằng ID"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, mentions, senderID } = event;
        const adminPath = path.join(__dirname, '..', 'admin.json');
        
        try {
            const adminData = JSON.parse(fs.readFileSync(adminPath, 'utf8'));

            if (target[0]?.toLowerCase() === "add" && target[1]?.toLowerCase() === "dhv") {
                if (!adminData.adminUIDs.includes(senderID)) {
                    return api.sendMessage("❌ Chỉ ADMIN mới có thể thêm DHV!", threadID, messageID);
                }

                let newModUID;
                if (event.type === 'message_reply') {
                    newModUID = event.messageReply.senderID;
                } 
                else if (Object.keys(mentions).length > 0) {
                    newModUID = Object.keys(mentions)[0];
                }
                else if (target[2]) {
                    newModUID = target[2];
                    if (!/^\d+$/.test(newModUID)) {
                        return api.sendMessage(
                            "📌 Cú pháp: add dhv [ID/Reply/@Tag]\n" +
                            "- ID: add dhv 100000123456789\n" +
                            "- Reply: Reply tin nhắn + add dhv\n" +
                            "- Tag: @mention + add dhv", 
                            threadID, messageID
                        );
                    }
                } else {
                    return api.sendMessage(
                        "📌 Cú pháp: add dhv [ID/Reply/@Tag]\n" +
                        "- ID: add dhv 100000123456789\n" +
                        "- Reply: Reply tin nhắn + add dhv\n" +
                        "- Tag: @mention + add dhv", 
                        threadID, messageID
                    );
                }

                if (adminData.moderatorUIDs.includes(newModUID)) {
                    return api.sendMessage("❌ Người này đã là DHV!", threadID, messageID);
                }

                try {
                    const userInfo = await api.getUserInfo(newModUID);
                    if (!userInfo[newModUID]) {
                        return api.sendMessage("❌ Không tìm thấy người dùng với ID này!", threadID, messageID);
                    }
                    
                    adminData.moderatorUIDs.push(newModUID);
                    fs.writeFileSync(adminPath, JSON.stringify(adminData, null, 2));
                    return api.sendMessage(`✅ Đã thêm ${userInfo[newModUID].name} làm Điều hành viên thành công!`, threadID, messageID);
                } catch (err) {
                    return api.sendMessage("❌ Không tìm thấy người dùng với ID này!", threadID, messageID);
                }
            }

            if (target[0]?.toLowerCase() === "del" && target[1]?.toLowerCase() === "dhv") {
                if (!adminData.adminUIDs.includes(senderID)) {
                    return api.sendMessage("❌ Chỉ ADMIN mới có thể xóa DHV!", threadID, messageID);
                }

                let modUID;
                if (event.type === 'message_reply') {
                    modUID = event.messageReply.senderID;
                } 
                else if (Object.keys(mentions).length > 0) {
                    modUID = Object.keys(mentions)[0];
                }
                else if (target[2]) {
                    modUID = target[2];
                    if (!/^\d+$/.test(modUID)) {
                        return api.sendMessage(
                            "📌 Cú pháp: del dhv [ID/Reply/@Tag]\n" +
                            "- ID: del dhv 100000123456789\n" +
                            "- Reply: Reply tin nhắn + del dhv\n" +
                            "- Tag: @mention + del dhv", 
                            threadID, messageID
                        );
                    }
                } else {
                    return api.sendMessage(
                        "📌 Cú pháp: del dhv [ID/Reply/@Tag]\n" +
                        "- ID: del dhv 100000123456789\n" +
                        "- Reply: Reply tin nhắn + del dhv\n" +
                        "- Tag: @mention + del dhv", 
                        threadID, messageID
                    );
                }

                const modIndex = adminData.moderatorUIDs.indexOf(modUID);
                if (modIndex === -1) {
                    return api.sendMessage("❌ Người này không phải là DHV!", threadID, messageID);
                }

                try {
                    const userInfo = await api.getUserInfo(modUID);
                    adminData.moderatorUIDs.splice(modIndex, 1);
                    fs.writeFileSync(adminPath, JSON.stringify(adminData, null, 2));
                    return api.sendMessage(`✅ Đã xóa ${userInfo[modUID].name} khỏi danh sách Điều hành viên!`, threadID, messageID);
                } catch (err) {
                    adminData.moderatorUIDs.splice(modIndex, 1);
                    fs.writeFileSync(adminPath, JSON.stringify(adminData, null, 2));
                    return api.sendMessage(`✅ Đã xóa ID: ${modUID} khỏi danh sách Điều hành viên!`, threadID, messageID);
                }
            }

            const userDataPath = path.join(__dirname, '..', 'events/cache/userData.json');
            
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
            console.error('Lỗi:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    }
};
