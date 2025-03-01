const axios = require('axios');

module.exports = {
    name: "animeop",
    dev: "HNT",
    category: "Anime",
    info: "Tìm nhạc mở đầu và kết thúc của anime",
    usages: [
        "animeop <tên anime> - Tìm tất cả OP/ED của anime"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const query = target.join(" ");
        
        if (!query) {
            return api.sendMessage("📌 Vui lòng nhập tên anime cần tìm!", threadID, messageID);
        }
        
        try {
            const animeResponse = await axios.get(
                `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`
            );
            
            if (!animeResponse.data?.data?.[0]) {
                return api.sendMessage("❌ Không tìm thấy anime này!", threadID, messageID);
            }
            
            const anime = animeResponse.data.data[0];
            const animeId = anime.mal_id;
            
            const themesResponse = await axios.get(
                `https://api.jikan.moe/v4/anime/${animeId}/themes`
            );
            
            if (!themesResponse.data?.data) {
                return api.sendMessage(
                    "❌ Không tìm thấy thông tin về nhạc của anime này!",
                    threadID, messageID
                );
            }
            
            const themes = themesResponse.data.data;
            const openings = themes.openings || [];
            const endings = themes.endings || [];
            
            let msg = `🎵 NHẠC ANIME: ${anime.title}\n\n`;
            
            if (openings.length > 0) {
                msg += `🎬 OPENING:\n`;
                openings.forEach((op, index) => {
                    msg += `${index + 1}. ${op}\n`;
                });
                msg += "\n";
            } else {
                msg += "🎬 OPENING: Không có thông tin\n\n";
            }
            
            if (endings.length > 0) {
                msg += `🏁 ENDING:\n`;
                endings.forEach((ed, index) => {
                    msg += `${index + 1}. ${ed}\n`;
                });
            } else {
                msg += "🏁 ENDING: Không có thông tin\n";
            }
            
            msg += `\n👉 Anime ID: ${animeId}`;
            msg += `\n📺 Link: ${anime.url}`;
            
            return api.sendMessage(msg, threadID, messageID);
            
        } catch (error) {
            console.error("Animeop Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!",
                threadID, messageID
            );
        }
    }
};
