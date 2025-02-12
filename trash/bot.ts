const moment = require('moment');

module.exports = {
    name: "bot", 
    prog: "HNT",
    ver: 1.0,

    onEvents: async function ({ event, api }) {
        const botKeywords = ["bot"];

        const getGreeting = () => {
            const hour = moment().hour();
            const greetings = {
                morning: ["Chào buổi sáng! 🌅 Cùng làm điều thú vị hôm nay nào! 💥", "Chào buổi sáng! 😊 Ngày mới, năng lượng mới, bắt đầu thôi! 🚀", "Hi! 👋 Một buổi sáng tuyệt vời đang chờ đón bạn đấy! 🌞"],
                afternoon: ["Chào buổi chiều! 🌞 Cùng tận hưởng những khoảnh khắc tuyệt vời nào! 💪", "Chào buổi chiều! 😎 Chúc bạn có một buổi chiều năng động và tràn đầy năng lượng! 💥", "Hi! 👋 Chúc bạn có một buổi chiều thật tuyệt vời! 🌈"],
                evening: ["Chào buổi tối! 🌙 Hy vọng bạn đã có một ngày tuyệt vời! 🌟", "Chào buổi tối! 👋 Đêm về rồi, đừng quên nghỉ ngơi để ngày mai tiếp tục thành công nhé! 💖", "Hi! 🌙 Buổi tối thật ấm áp, hy vọng bạn đã có một ngày đầy ắp niềm vui! 💫"]
            };

            let timeOfDay = hour >= 5 && hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
            return greetings[timeOfDay][Math.floor(Math.random() * greetings[timeOfDay].length)];
        };

        const { body, threadID, messageID } = event;

        if (body && botKeywords.includes(body.trim().toLowerCase())) {
            api.sendMessage({ body: getGreeting() }, threadID, messageID);
        }
    }
};
