const fs = require('fs');
const path = require('path');
const { allBalances } = require('../utils/currencies');

module.exports = {
    name: "top",
    dev: "HNT",
    usedby: 0,
    info: "Xem top 10 người giàu nhất server.",
    onPrefix: true,
    usages: ".top: Xem top 10 người chơi giàu nhất.",
    cooldowns: 0,

    onLaunch: async function({ api, event = [] }) {
        const { threadID, messageID, senderID } = event;

        let allBalancesData;
        try {
            allBalancesData = allBalances();
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu số dư:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi lấy dữ liệu người dùng.", threadID, messageID);
        }

        let userData;
        try {
            const rawData = fs.readFileSync('./events/cache/userData.json');
            userData = JSON.parse(rawData);
        } catch (error) {
            console.error("Lỗi khi đọc userData.json:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi đọc dữ liệu người dùng.", threadID, messageID);
        }

        const sortedBalances = Object.entries(allBalancesData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let topMessage = "💎 𝐓𝐨𝐩 𝟏𝟎 𝐍𝐠ư𝐨̛̀𝐢 𝐆𝐢𝐚̀𝐮 𝐍𝐡𝐚̂́𝐭 𝐒𝐞𝐫𝐯𝐞𝐫\n━━━━━━━━━━━━━━━━━━\n\n";

        const rankEmoji = ['👑', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        let userPosition = null;

        sortedBalances.forEach((entry, index) => {
            const userID = entry[0];
            const balance = entry[1];
            const userName = userData[userID] ? userData[userID].name : "Người dùng ẩn danh";
            const formattedBalance = balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

            topMessage += `${rankEmoji[index]} ${index + 1}. ${userName}\n💰 ${formattedBalance} Xu\n\n`;

            if (userID === senderID) {
                userPosition = index + 1;
            }
        });

        if (sortedBalances.length === 0) {
            topMessage = "❌ Chưa có người chơi nào trong hệ thống.";
        }

        if (userPosition !== null) {
            topMessage += `\n🎯 Vị trí của bạn: #${userPosition} trong top 10 người giàu nhất!`;
        } else {
            const userBalance = allBalancesData[senderID] || 0;
            const formattedUserBalance = userBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            topMessage += `\n💫 Bạn không có trong top 10.\n💰 Số xu hiện tại: ${formattedUserBalance} Xu`;
        }

        return api.sendMessage(topMessage, threadID, messageID);
    }
};
