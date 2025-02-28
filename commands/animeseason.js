const axios = require('axios');
const translate = require('translate-google');

module.exports = {
    name: "animeseason",
    version: "1.0.0",
    dev: "HNT",
    category: "Anime",
    info: "Xem anime mùa hiện tại",
    usages: "animeseason [số trang]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const page = parseInt(target[0]) || 1;
        const perPage = 10;

        try {
            const season = getCurrentSeason();
            const year = new Date().getFullYear();

            const response = await axios.get(
                `https://api.jikan.moe/v4/seasons/${year}/${season}`
            );

            if (!response.data?.data?.length) {
                throw new Error("Không tìm thấy dữ liệu anime!");
            }

            const animes = response.data.data;
            const totalPages = Math.ceil(animes.length / perPage);

            if (page < 1 || page > totalPages) {
                return api.sendMessage(
                    `⚠️ Trang phải từ 1 đến ${totalPages}!`,
                    threadID, messageID
                );
            }

            const start = (page - 1) * perPage;
            const end = start + perPage;
            const pageAnimes = animes.slice(start, end);

            let msg = `🌸 ANIME ${season.toUpperCase()} ${year}\n`;
            msg += `Trang ${page}/${totalPages}\n\n`;

            for (let i = 0; i < pageAnimes.length; i++) {
                const anime = pageAnimes[i];
                const title = anime.title;
                const score = anime.score || "N/A";
                const episodes = anime.episodes || "??";
                const type = anime.type || "N/A";
                
                msg += `${start + i + 1}. ${title}\n`;
                msg += `⭐ Score: ${score}\n`;
                msg += `🎬 Tập: ${episodes}\n`;
                msg += `📺 Loại: ${type}\n\n`;
            }

            msg += `Dùng "animeseason ${page + 1}" để xem trang tiếp theo`;

            return api.sendMessage(msg, threadID, messageID);

        } catch (error) {
            console.error("Animeseason Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!",
                threadID, messageID
            );
        }
    }
};

function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return "winter";
    if (month >= 4 && month <= 6) return "spring";
    if (month >= 7 && month <= 9) return "summer";
    return "fall";
}
