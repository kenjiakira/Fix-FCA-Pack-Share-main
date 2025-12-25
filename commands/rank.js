const fs = require('fs');
const path = require('path');
const { createRankCard } = require('../game/canvas/rankCard');
const { getUserName } = require('../utils/userUtils');
const userDataPath = path.join(__dirname, '../database/cache/rankData.json');

module.exports = {
    name: 'rank',
    category: "Khác",
    info: 'Xem xếp hạng hiện tại của bạn',
    dev: 'HNT',
    usedby: 0,
    onPrefix: true, 
    dmUser: true,
    usages: 'rank',
    cooldowns: 5, 

    onLaunch: async function ({ api, event }) {
        try {
            const { threadID, senderID } = event;
            
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            const imagePath = path.join(cacheDir, 'rankImage.jpg');

            let userData;
            try {
                userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            } catch (err) {
                console.error("Error reading user data:", err);
                return api.sendMessage("❌ Chưa có dữ liệu xếp hạng!", threadID);
            }

            if (!userData[senderID]) {
                return api.sendMessage("📝 Bạn chưa có dữ liệu xếp hạng. Hãy tham gia trò chuyện để tích lũy điểm!", threadID);
            }

            try {
                const user = userData[senderID];
                const name = getUserName(senderID); 

                await createRankCard(
                    senderID,
                    name,
                    user.exp || 0,
                    user.level || 1,
                    user.rank || 1,
                    imagePath
                );

                if (fs.existsSync(imagePath)) {
                    await api.sendMessage({ 
                        attachment: fs.createReadStream(imagePath)
                    }, threadID, () => {
                        try {
                            fs.unlinkSync(imagePath);
                        } catch (unlinkErr) {
                            console.error("Error cleaning up image:", unlinkErr);
                        }
                    });
                }
            } catch (processError) {
                console.error("Error processing rank:", processError);
                return api.sendMessage("❌ Có lỗi xảy ra khi xử lý thông tin xếp hạng.", threadID);
            }
        } catch (error) {
            console.error("Rank command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi. Vui lòng thử lại sau.", event.threadID);
        }
    }
};