const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "guess",
    usedby: 0,
    dev: "HNT",
    info: "Trò chơi đoán hình ảnh",
    nickName: ["đoánhình", "đoán", "guess"],
    onPrefix: true,
    usages: "guess",
    cooldowns: 20,

    onReply: async function({ api, event, Reply }) {
        const { threadID, messageID, body } = event;
        if (!global.guess) global.guess = {};
        
        const userAnswer = body.toLowerCase().trim();
        const correctAnswer = global.guess[threadID]?.answer.toLowerCase();

        if (!correctAnswer) return;

        if (userAnswer === correctAnswer) {
            api.sendMessage("🎉 Chính xác! Bạn thật giỏi!", threadID, messageID);
            delete global.guess[threadID];
        } else {
            api.sendMessage("❌ Sai rồi! Hãy thử lại nhé!", threadID, messageID);
        }
    },

    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;
        if (!global.guess) global.guess = {};

        const topics = ['nature', 'animals', 'food', 'technology', 'architecture'];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        
        try {
         
            const response = await axios.get(`https://api.unsplash.com/photos/random?query=${randomTopic}&client_id=USC-YIdoZxMRxblaePKXocUs6Up7EAbqDbInZ0z5r4U`);
            const imageUrl = response.data.urls.regular;
            const answer = response.data.alt_description?.split(' ')[0] || randomTopic;

            const imgPath = path.join(__dirname, `../commands/cache/guess_${threadID}.jpg`);
            
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(imgPath, Buffer.from(imageResponse.data, 'binary'));

            const msg = await api.sendMessage({
                body: "🎮 Hãy đoán xem hình ảnh này là gì?\nGợi ý: Đáp án chỉ có một từ!",
                attachment: fs.createReadStream(imgPath)
            }, threadID, (error, info) => {
                if (error) return console.error(error);
                fs.unlinkSync(imgPath);
            });

            global.guess[threadID] = {
                answer: answer,
                messageID: msg.messageID
            };

            // Tự động xóa câu đố sau 60 giây nếu không ai trả lời
            setTimeout(() => {
                if (global.guess[threadID]) {
                    api.sendMessage(`⌛ Hết giờ! Đáp án là: ${answer}`, threadID);
                    delete global.guess[threadID];
                }
            }, 60000);

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ Đã có lỗi xảy ra khi tạo câu đố!", threadID, messageID);
        }
    }
};
