const fs = require('fs');
const path = require('path');

module.exports = {
    name: "topexp",
    dev: "HNT",
    usedby: 0,
    category: "Khác",
    info: "Xem top 10 người tương tác nhiều nhất.",
    onPrefix: true,
    usages: ".topexp: Xem top 10 người tương tác nhiều nhất\n.topexp on: Ẩn danh tên của bạn\n.topexp unon: Hiện lại tên của bạn",
    cooldowns: 0,

    anonymousUsers: new Set(),

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const target = event.body.split(" ").slice(1);

        if (target[0] === "on") {
            this.anonymousUsers.add(senderID);
            return api.sendMessage("✅ Đã ẩn danh tên của bạn trong bảng xếp hạng!", threadID, messageID);
        }
        if (target[0] === "unon") {
            this.anonymousUsers.delete(senderID);
            return api.sendMessage("✅ Đã hiện lại tên của bạn trong bảng xếp hạng!", threadID, messageID);
        }

        try {
            const userDataPath = path.join(__dirname, '../events/cache/userData.json');
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

            const sortedUsers = Object.entries(userData)
                .map(([id, data]) => ({
                    id,
                    name: data.name || "Người dùng",
                    exp: data.exp || 0,
                    level: data.level || 1
                }))
                .sort((a, b) => b.exp - a.exp)
                .slice(0, 10);

            let topMessage = "⭐ 𝐓𝐨𝐩 𝟏𝟎 𝐓ươ𝐧𝐠 𝐓á𝐜 𝐍𝐡𝐢ề𝐮 𝐍𝐡ấ𝐭\n━━━━━━━━━━━━━━━━━━\n\n";
            const rankEmoji = ['👑', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            let userPosition = null;

            const rewards = {
                1: 300000, 
                2: 100000, 
                3: 50000 
            };

            sortedUsers.forEach((user, index) => {
                const displayName = this.anonymousUsers.has(user.id) ? 
                    "Người dùng ẩn danh #" + user.id.substring(0, 4) : 
                    user.name;

                const formattedExp = user.exp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                
                topMessage += `${rankEmoji[index]} ${index + 1}. ${displayName}\n`;
                topMessage += `⭐ Level: ${user.level}\n`;
                topMessage += `💫 EXP: ${formattedExp}\n`;

                if (rewards[index + 1]) {
                    topMessage += `💰 Thưởng: ${rewards[index + 1].toLocaleString('vi-VN')} Xu/ngày\n`;
                }
                topMessage += '\n';

                if (user.id === senderID) {
                    userPosition = index + 1;
                    if (rewards[index + 1]) {
                        const currentBalance = global.balance[user.id] || 0;
                        global.balance[user.id] = currentBalance + rewards[index + 1];
                        require('../utils/currencies').saveData();
                    }
                }
            });

            if (userPosition === null && userData[senderID]) {
                const userExp = userData[senderID].exp || 0;
                const userLevel = userData[senderID].level || 1;
                const formattedUserExp = userExp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                
                topMessage += `\n💫 Thông tin của bạn:\n`;
                topMessage += `⭐ Level: ${userLevel}\n`;
                topMessage += `💫 EXP: ${formattedUserExp}`;
            } else if (userPosition !== null) {
                topMessage += `\n🎯 Vị trí của bạn: #${userPosition} trong top 10!`;
            }

            topMessage += '\n📢 Phần thưởng đặc biệt:';
            topMessage += '\n👑 Top 1: 300,000Xu/ngày';
            topMessage += '\n🥈 Top 2: +100,000 Xu/ngày';
            topMessage += '\n🥉 Top 3: +50,000 Xu/ngày';

            return api.sendMessage(topMessage, threadID, messageID);

        } catch (error) {
            console.error("Error in topexp command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi lấy dữ liệu xếp hạng.", threadID, messageID);
        }
    }
};
