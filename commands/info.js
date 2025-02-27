const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    name: "info",
    info: "Xem thông tin người dùng",
    usedby: 5,
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
            const userFromThread = threadInfo.userInfo.find(u => u.id === uid);
            let userData = null;

            try {
                const userInfo = await api.getUserInfo(uid);
                userData = userInfo[uid];
            } catch (apiError) {
                console.error("API Error:", apiError);
            
                userData = {
                    name: userFromThread?.name || `Người dùng Facebook ${uid}`,
                    gender: userFromThread?.gender,
                    vanity: null,
                    isFriend: false,
                    isBirthday: false,
                    type: 'User'
                };
            }

            const isAdmin = threadInfo.adminIDs.some(admin => admin.id === uid);
            const joinedAt = new Date(threadInfo.timestamp);
            const nickname = threadInfo.nicknames[uid] || "Không có";
            
            const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            
            try {
                const tempAvatarPath = path.join(__dirname, "cache", "avatar_temp.jpg");
                const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(tempAvatarPath, Buffer.from(avatarResponse.data));

                const gender = userData.gender === 1 ? 'Nam' : userData.gender === 2 ? 'Nữ' : 'Không xác định';
                
                let msg = `👤 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗡𝗚𝗨̛𝗢̛̀𝗜 𝗗𝗨̀𝗡𝗚\n`;
                msg += `━━━━━━━━━━━━━━━━━━\n`;
                msg += `Tên: ${userData.name}\n`;
                msg += `UID: ${uid}\n`;
                msg += `Biệt danh: ${nickname}\n`;
                msg += `Giới tính: ${gender}\n`;
                msg += `Link Facebook: https://facebook.com/${uid}\n`;

                if (userData.vanity) msg += `Username: ${userData.vanity}\n`;
                if (userData.type) msg += `Loại tài khoản: ${userData.type}\n`;
                if (userData.isFriend !== undefined) msg += `Bạn bè: ${userData.isFriend ? 'Có' : 'Không'}\n`;
                if (userData.isBirthday !== undefined) msg += `Sinh nhật: ${userData.isBirthday ? 'Hôm nay 🎂' : 'Không'}\n`;
                
                msg += `Vai trò: ${isAdmin ? 'Quản trị viên 👑' : 'Thành viên'}\n`;
                msg += `\n👥 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗧𝗥𝗢𝗡𝗚 𝗡𝗛𝗢́𝗠\n`;
                msg += `Tham gia từ: ${joinedAt.toLocaleString('vi-VN')}\n`;
                msg += `Tổng tin nhắn: ${threadInfo.messageCount || 'Chưa có thống kê'}\n`;

                await api.sendMessage({
                    body: msg,
                    attachment: fs.createReadStream(tempAvatarPath)
                }, event.threadID, event.messageID);

                fs.unlinkSync(tempAvatarPath);
            } catch (avatarError) {
            
                let msg = `👤 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗡𝗚𝗨̛𝗢̛̀𝗜 𝗗𝗨̀𝗡𝗚\n`;
                msg += `━━━━━━━━━━━━━━━━━━\n`;
                msg += `Tên: ${userData.name}\n`;
                msg += `UID: ${uid}\n`;
                msg += `Biệt danh: ${nickname}\n`;
                msg += `Link Facebook: https://facebook.com/${uid}\n`;
                msg += `Vai trò: ${isAdmin ? 'Quản trị viên 👑' : 'Thành viên'}\n`;
                
                msg += `\n👥 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗧𝗥𝗢𝗡𝗚 𝗡𝗛𝗢́𝗠\n`;
                msg += `Tham gia từ: ${joinedAt.toLocaleString('vi-VN')}\n`;
                msg += `Tổng tin nhắn: ${threadInfo.messageCount || 'Chưa có thống kê'}\n`;
                
                await api.sendMessage(msg, event.threadID, event.messageID);
            }

        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            const errorMsg = error.error === 3252001 ? 
                "❌ Bot đang tạm thời bị Facebook chặn tính năng này. Vui lòng thử lại sau." :
                "❌ Đã xảy ra lỗi khi lấy thông tin người dùng.";
            await api.sendMessage(errorMsg, event.threadID);
        }
    }
};
