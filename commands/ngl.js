const axios = require('axios');

module.exports = {
    name: "ngl",
    usedby: 0,
    info: "Gửi tin nhắn ẩn danh qua ngl.link",
    dev: "HNT",
    onPrefix: true,
    usages: "[username] [số lần] [nội dung]",
    cooldowns: 10,

    onLaunch: async function ({ api, event, target }) {
        const args = event.body.split(' ');
        if (args.length < 4) {
            return api.sendMessage("『 𝗡𝗚𝗟 𝗦𝗣𝗔𝗠 』\n▭▭▭▭▭▭▭▭▭▭▭▭▭\n\n➜ Cách dùng: ngl [username] [số lần] [nội dung]\n➜ Ví dụ: ngl johndoe 5 Hello world!", event.threadID);
        }

        const username = args[1];
        const count = parseInt(args[2]);
        const message = args.slice(3).join(' ');

        if (!username || isNaN(count) || !message) {
            return api.sendMessage("『 𝗟𝗢̂̃𝗜 』\n▭▭▭▭▭▭▭▭▭▭▭▭▭\n\n➜ Vui lòng nhập đúng định dạng\n➜ ngl [username] [số lần] [nội dung]", event.threadID);
        }

        if (count <= 0 || count > 50) {
            return api.sendMessage("『 𝗟𝗢̂̃𝗜 』\n▭▭▭▭▭▭▭▭▭▭▭▭▭\n\n➜ Số lần gửi phải từ 1 đến 50!", event.threadID);
        }

        try {
            const headers = {
                'referer': `https://ngl.link/${username}`,
                'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
            };

            const data = {
                'username': username,
                'question': message,
                'deviceId': 'anonymous-' + Math.random().toString(36).substr(2, 9),
                'gameSlug': '',
                'referrer': ''
            };

            let successCount = 0;
            const progressMsg = await api.sendMessage("『 𝗧𝗜𝗘̂́𝗡 𝗧𝗥𝗜̀𝗡𝗛 』\n▭▭▭▭▭▭▭▭▭▭▭▭▭\n\n➜ Đang bắt đầu gửi tin nhắn...", event.threadID);

            for (let i = 0; i < count; i++) {
                const response = await axios.post('https://ngl.link/api/submit', data, { headers });
                if (response.status === 200) successCount++;
                
                if (i % 2 === 0 || i === count - 1) {
                    await api.editMessage({
                        body: `『 𝗧𝗜𝗘̂́𝗡 𝗧𝗥𝗜̀𝗡𝗛 』\n▭▭▭▭▭▭▭▭▭▭▭▭▭\n\n➜ Đã gửi: ${successCount}/${count}\n➜ Người nhận: @${username}\n➜ Tiến độ: ${Math.floor((successCount/count) * 100)}%`,
                        messageID: progressMsg.messageID,
                        threadID: event.threadID
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            await api.editMessage({
                body: `『 𝗧𝗛𝗔̀𝗡𝗛 𝗖𝗢̂𝗡𝗚 』\n▭▭▭▭▭▭▭▭▭▭▭▭▭\n\n➜ Đã gửi: ${successCount}/${count}\n➜ Người nhận: @${username}\n➜ Nội dung: ${message}`,
                messageID: progressMsg.messageID,
                threadID: event.threadID
            });
            setTimeout(() => api.unsendMessage(progressMsg.messageID), 10000);

        } catch (error) {
            return api.sendMessage({
                body: "『 𝗟𝗢̂̃𝗜 』\n▭▭▭▭▭▭▭▭▭▭▭▭▭\n\n➜ Đã xảy ra lỗi khi gửi tin nhắn!\n➜ Vui lòng thử lại sau!"
            }, event.threadID);
        }
    }
};