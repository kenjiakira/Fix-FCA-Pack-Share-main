const moment = require('moment');

module.exports = {
    name: "greet", 
    prog: "HNT",
    ver: 1.1,
    onEvents: async function ({ event, api }) {
        const greetKeywords = ["hello", "hi", "hai", "chào", "chao", "hí", "híí", "hì", "hìì", "lô", "hii", "helo", "hê nhô"];
        const byeKeywords = ["bye", "bai", "off", "byee", "pai", "paii"];
        const sleepKeywords = ["ngủ", "đi ngủ", "ngủ ngon", "ngủ nha", "ngủ đây", "ngủ đi", "ngủ thôi"];
        const greetStickerData = ["789355237820057", "445625802303278", "1554246411471073", "1151376801549337"];
        const byeStickerData = ["629261957190121", "657500430999881", "144885315685735"];
        const sleepStickerData = ["178528499292171", "1458993734132403", "290255108068856"]; 

        const currentHour = moment().hour();

        const getTimeOfDay = () => {
            if (currentHour >= 5 && currentHour < 12) return "morning";
            if (currentHour >= 12 && currentHour < 18) return "afternoon";
            if (currentHour >= 18 && currentHour < 22) return "evening";
            return "night";
        };

        const getGreetMessage = () => {
            const timeOfDay = getTimeOfDay();
            const greetBodiesMorning = [
                "Chào buổi sáng! 🌅 Cùng làm điều thú vị hôm nay nào! 💥",
                "Chào buổi sáng! 😊 Ngày mới, năng lượng mới, bắt đầu thôi! 🚀",
                "Hi! 👋 Một buổi sáng tuyệt vời đang chờ đón bạn đấy! 🌞",
            ];

            const greetBodiesAfternoon = [
                "Chào buổi chiều! 🌞 Cùng tận hưởng những khoảnh khắc tuyệt vời nào! 💪",
                "Chào buổi chiều! 😎 Chúc bạn có một buổi chiều năng động và tràn đầy năng lượng! 💥",
                "Hi! 👋 Chúc bạn có một buổi chiều thật tuyệt vời! 🌈",
            ];

            const greetBodiesEvening = [
                "Chào buổi tối! 🌙 Hy vọng bạn đã có một ngày tuyệt vời! 🌟",
                "Hi! 🌙 Buổi tối thật ấm áp, hy vọng bạn đã có một ngày đầy ắp niềm vui! 💫",
            ];

            const greetBodiesNight = [
                "Chào đêm khuya! 🌜 Đừng thức khuya quá nhé! 😴",
                "Muộn rồi! 🌛 Nhớ giữ gìn sức khỏe nha! 💫",
                "Hi! 🌙 Đêm khuya rồi, nhớ nghỉ ngơi đầy đủ nhé! ✨"
            ];

            if (timeOfDay === "morning") return greetBodiesMorning[Math.floor(Math.random() * greetBodiesMorning.length)];
            if (timeOfDay === "afternoon") return greetBodiesAfternoon[Math.floor(Math.random() * greetBodiesAfternoon.length)];
            if (timeOfDay === "evening") return greetBodiesEvening[Math.floor(Math.random() * greetBodiesEvening.length)];
            return greetBodiesNight[Math.floor(Math.random() * greetBodiesNight.length)];
        };

        const getByeMessage = () => {
            const timeOfDay = getTimeOfDay();
            const byeBodiesMorning = [
                "Tạm biệt! Hẹn gặp lại bạn sau nhé! 👋",
                "Chúc bạn một ngày tuyệt vời tiếp theo! Hẹn gặp lại! 💖",
            ];

            const byeBodiesAfternoon = [
                "Tạm biệt! Chúc bạn một buổi chiều vui vẻ và năng động! 💖",
                "Chúc bạn có một buổi chiều tuyệt vời tiếp theo! 🌞 Hẹn gặp lại! 👋",
            ];

            const byeBodiesEvening = [
                "Tạm biệt! 🌙 Chúc bạn một đêm ngon giấc, ngủ ngon và mơ đẹp! 😴",
                "Hẹn gặp lại! 🌙 Chúc bạn một đêm thật an yên và tỉnh dậy tràn đầy năng lượng! 💖",
            ];

            const byeBodiesNight = [
                "Chúc ngủ ngon! 🌙 Hãy nghỉ ngơi thật tốt nhé! 💤",
                "Đi ngủ thôi! 🌜 Chúc bạn có giấc ngủ thật ngon và những giấc mơ đẹp! 💫"
            ];

            if (timeOfDay === "morning") return byeBodiesMorning[Math.floor(Math.random() * byeBodiesMorning.length)];
            if (timeOfDay === "afternoon") return byeBodiesAfternoon[Math.floor(Math.random() * byeBodiesAfternoon.length)];
            if (timeOfDay === "evening") return byeBodiesEvening[Math.floor(Math.random() * byeBodiesEvening.length)];
            return byeBodiesNight[Math.floor(Math.random() * byeBodiesNight.length)];
        };

        const getSleepMessage = () => {
            const sleepMessages = [
                "Chúc bạn ngủ ngon! 🌙 Mơ đẹp nhé! 💫",
                "Ngủ ngon nha! 😴 Hẹn gặp lại vào ngày mai! ✨",
                "Một giấc ngủ thật ngon và bình yên nhé! 🌛",
                "Sweet dreams! 💫 Chúc bạn có những giấc mơ tuyệt vời! 🌠",
                "Đêm an lành nhé! 🌙 Ngủ ngon và nạp đầy năng lượng! 💝"
            ];
            return sleepMessages[Math.floor(Math.random() * sleepMessages.length)];
        };

        const { body, threadID, messageID } = event;

        if (body) { 
            const lowerBody = body.trim().toLowerCase();

            if (greetKeywords.includes(lowerBody)) {
                const greetMessage = getGreetMessage(); 
                const randomGreetSticker = greetStickerData[Math.floor(Math.random() * greetStickerData.length)];

                api.sendMessage({ body: greetMessage }, threadID, (err) => {
                    if (!err) {
                        setTimeout(() => {
                            api.sendMessage({ sticker: randomGreetSticker }, threadID);
                        }, 100);
                    }
                }, messageID);
            } 
         
            else if (byeKeywords.includes(lowerBody)) {
                const byeMessage = getByeMessage(); 
                const randomByeSticker = byeStickerData[Math.floor(Math.random() * byeStickerData.length)];

                api.sendMessage({ body: byeMessage }, threadID, (err) => {
                    if (!err) {
                        setTimeout(() => {
                            api.sendMessage({ sticker: randomByeSticker }, threadID);
                        }, 100);
                    }
                }, messageID);
            }
            else if (sleepKeywords.includes(lowerBody)) {
                const sleepMessage = getSleepMessage();
                const randomSleepSticker = sleepStickerData[Math.floor(Math.random() * sleepStickerData.length)];

                api.sendMessage({ body: sleepMessage }, threadID, (err) => {
                    if (!err) {
                        setTimeout(() => {
                            api.sendMessage({ sticker: randomSleepSticker }, threadID);
                        }, 100);
                    }
                }, messageID);
            }
        }
    }
};
