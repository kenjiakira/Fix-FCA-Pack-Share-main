const axios = require("axios");
const translate = require('translate-google');

module.exports = {
    name: "joke",
    usedby: 0,
    info: "xem truyện cười ngẫu nhiên",
    dev: "HNT",
    onPrefix: true,
    usages: "joke",
    cooldowns: 5,

    onLaunch: async function ({ api, event, actions }) {
        const replyMessage = await actions.reply("Đang tìm kiếm truyện cười.......");

        try {
            const response = await axios.get("https://v2.jokeapi.dev/joke/Any?safe-mode");
            let joke = "";

            if (response.data.type === "single") {
                joke = response.data.joke;
            } else {
                joke = `${response.data.setup}\n${response.data.delivery}`;
            }

            const translatedJoke = await translate(joke, { to: 'vi' });

            const jokeMessage = `😄 TRUYỆN CƯỜI 😄\n\n` +
                              `🇻🇳 ${translatedJoke}\n\n` +
                              `🇬🇧 ${joke}\n\n` +
                              `━━━━━━━━━━━━━━━━━━━\n` +
                              `💡 Gõ "joke" để xem thêm truyện cười khác`;

            await actions.edit(jokeMessage, replyMessage.messageID);

        } catch (error) {
            console.error('Joke Command Error:', error);
            await actions.edit("❌ Đã xảy ra lỗi: " + error.message, replyMessage.messageID);
        }
    }
};
