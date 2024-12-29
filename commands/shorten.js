const axios = require('axios');

module.exports = {
    name: "shorten",
    info: "Rút gọn liên kết dài thành liên kết ngắn.",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ["shorten", "rutgon", "url"],
    usages: "shortenurl [URL] [-alias tencustom]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target, actions }) {
        const args = target.join(' ').trim().split(' ');
        const longUrl = args[0];
        const customAlias = args.includes('-alias') ? args[args.indexOf('-alias') + 1] : null;

        if (!longUrl) {
            return await actions.reply("📝 Hướng dẫn sử dụng:\n- !shorten [URL]\n- !shorten [URL] -alias [tên tùy chỉnh]\n\nVí dụ:\n!shorten https://example.com\n!shorten https://example.com -alias website");
        }

        try {
            new URL(longUrl);
        } catch {
            return await actions.reply("❌ URL không hợp lệ! Vui lòng kiểm tra và thử lại.");
        }

        try {
            let response;
            if (customAlias) {
       
                response = await axios.post('https://api.tinyurl.com/create', {
                    url: longUrl,
                    alias: customAlias
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const shortUrl = response.data.data.tiny_url;
                await actions.reply(`✨ Liên kết đã được rút gọn:\n📎 URL gốc: ${longUrl}\n🔗 URL ngắn: ${shortUrl}\n✏️ Tên tùy chỉnh: ${customAlias}`);
            } else {
                response = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`);
                const shortUrl = response.data;
                await actions.reply(`✨ Liên kết đã được rút gọn:\n📎 URL gốc: ${longUrl}\n🔗 URL ngắn: ${shortUrl}`);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                await actions.reply("⚠️ Tên tùy chỉnh đã được sử dụng hoặc không hợp lệ. Vui lòng thử tên khác.");
            } else {
                await actions.reply("❌ Không thể rút gọn liên kết. Vui lòng kiểm tra URL và thử lại sau.");
            }
        }
    }
};
