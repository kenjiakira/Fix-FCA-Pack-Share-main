const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    name: "info",
    info: "Xem thông tin người dùng",
    usedby: 1,
    onPrefix: true,
    dev: "HNT",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        try {
            let uid;
            if (event.type === "message_reply") {
                uid = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                uid = Object.keys(event.mentions)[0];
            } else if (target[0]) {
                uid = target[0];
            } else {
                uid = event.senderID;
            }

            const threadInfo = await api.getThreadInfo(event.threadID);
            const userInfo = threadInfo.userInfo.find(user => user.id === uid);

            if (!userInfo) {
                return api.sendMessage("❌ Không thể tìm thấy thông tin người dùng.", event.threadID);
            }

            const isAdmin = threadInfo.adminIDs.includes(uid);
            const joinedAt = new Date(threadInfo.timestamp);
            const messageCount = threadInfo.messageCount;

            const nickname = threadInfo.nicknames[uid] || "Không có";

            const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            
            try {
                const tempAvatarPath = path.join(__dirname, "cache", "avatar_temp.jpg");
                const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(tempAvatarPath, Buffer.from(avatarResponse.data));

                const gender = userInfo.gender === 'MALE' ? 'Nam' : userInfo.gender === 'FEMALE' ? 'Nữ' : 'Không xác định';
                
                let msg = `👤 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗡𝗚𝗨̛𝗢̛̀𝗜 𝗗𝗨̀𝗡𝗚\n`;
                msg += `━━━━━━━━━━━━━━━━━━\n`;
                msg += `Tên: ${userInfo.name}\n`;
                msg += `UID: ${uid}\n`;
                msg += `Biệt danh: ${nickname}\n`;
                msg += `Giới tính: ${gender}\n`;
                msg += `Link Facebook: https://facebook.com/${uid}\n`;
                msg += `Tên người dùng: ${userInfo.username || 'Không có'}\n`;
                msg += `Vai trò: ${isAdmin ? 'Quản trị viên 👑' : 'Thành viên'}\n`;
                
                msg += `\n👥 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗧𝗥𝗢𝗡𝗚 𝗡𝗛𝗢́𝗠\n`;
                msg += `Tham gia từ: ${joinedAt.toLocaleString('vi-VN')}\n`;
                msg += `Tổng tin nhắn: ${messageCount || 'Chưa có thống kê'}\n`;
                
                await api.sendMessage({
                    body: msg,
                    attachment: fs.createReadStream(tempAvatarPath)
                }, event.threadID, event.messageID);

                fs.unlinkSync(tempAvatarPath);
            } catch (avatarError) {
         
                let msg = `👤 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗡𝗚𝗨̛𝗢̛̀𝗜 𝗗𝗨̀𝗡𝗚\n`;
                msg += `━━━━━━━━━━━━━━━━━━\n`;
                msg += `Tên: ${userInfo.name}\n`;
                msg += `UID: ${uid}\n`;
                msg += `Biệt danh: ${nickname}\n`;
                msg += `Link Facebook: https://facebook.com/${uid}\n`;
                msg += `Vai trò: ${isAdmin ? 'Quản trị viên 👑' : 'Thành viên'}\n`;
                
                msg += `\n👥 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗧𝗥𝗢𝗡𝗚 𝗡𝗛𝗢́𝗠\n`;
                msg += `Tham gia từ: ${joinedAt.toLocaleString('vi-VN')}\n`;
                msg += `Tổng tin nhắn: ${messageCount || 'Chưa có thống kê'}\n`;
                
                await api.sendMessage(msg, event.threadID, event.messageID);
            }

        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            await api.sendMessage("❌ Đã xảy ra lỗi khi lấy thông tin người dùng.", event.threadID);
        }
    }
};
