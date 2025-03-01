const axios = require('axios');
const translate = require('translate-google');

module.exports = {
    name: "animerec",
    dev: "HNT",
    category: "Anime",
    info: "Gợi ý anime dựa trên từ khóa/thể loại",
    usages: [
        "animerec - Gợi ý ngẫu nhiên",
        "animerec <thể loại> - Gợi ý theo thể loại (action, romance, comedy...)",
        "animerec <tên anime> - Gợi ý dựa trên anime đã xem"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const query = target.join(" ");
        
        try {
            let endpoint, data, type;
            
            if (!query) {
                endpoint = "https://api.jikan.moe/v4/recommendations/anime";
                type = "random";
            } else if (query.length < 10) {
                const genreId = getGenreId(query.toLowerCase());
                if (genreId) {
                    endpoint = `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&limit=5`;
                    type = "genre";
                    data = { genre: query };
                } else {
                    return api.sendMessage("❌ Thể loại không hợp lệ!", threadID, messageID);
                }
            } else {
                // Similar to a specific anime
                endpoint = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&order_by=score&sort=desc&limit=1`;
                type = "similar";
                data = { anime: query };
            }
            
            const response = await axios.get(endpoint);
            
            if (type === "random") {
                if (!response.data?.data?.length) {
                    throw new Error("Không tìm thấy anime nào!");
                }
                
                // Get a random recommendation entry
                const randomRec = response.data.data[Math.floor(Math.random() * response.data.data.length)];
                const randomAnime = randomRec.entry[Math.floor(Math.random() * randomRec.entry.length)];
                
                // Translate the content
                const translatedContent = await translate(
                    randomRec.content.substring(0, 500) + (randomRec.content.length > 500 ? "..." : ""),
                    { from: 'en', to: 'vi' }
                );
                
                const msg = `🎯 ANIME GỢI Ý NGẪU NHIÊN\n\n` +
                           `📺 Anime: ${randomAnime.title}\n` +
                           `⭐ Đánh giá: ${randomAnime.score || "N/A"}/10\n` +
                           `📝 Lý do gợi ý:\n${translatedContent}\n\n` +
                           `🔗 Xem chi tiết: ${randomAnime.url}`;
                
                return api.sendMessage(msg, threadID, messageID);
            } 
            else if (type === "genre") {
                if (!response.data?.data?.length) {
                    throw new Error(`Không tìm thấy anime nào thuộc thể loại ${data.genre}!`);
                }
                
                let msg = `🎯 TOP 5 ANIME THỂ LOẠI ${data.genre.toUpperCase()}\n\n`;
                
                for (let i = 0; i < response.data.data.length; i++) {
                    const anime = response.data.data[i];
                    msg += `${i+1}. ${anime.title}\n`;
                    msg += `⭐ Đánh giá: ${anime.score || "N/A"}/10\n`;
                    msg += `🎬 Số tập: ${anime.episodes || "?"}\n`;
                    msg += `📅 Năm: ${anime.year || "N/A"}\n\n`;
                }
                
                msg += `👉 Dùng lệnh "anime <tên anime>" để xem chi tiết về từng anime.`;
                
                return api.sendMessage(msg, threadID, messageID);
            }
            else if (type === "similar") {
                // Get the anime first
                if (!response.data?.data?.length) {
                    throw new Error(`Không tìm thấy anime "${data.anime}"!`);
                }
                
                const selectedAnime = response.data.data[0];
                
                // Then get similar anime based on genre
                const genres = selectedAnime.genres.map(genre => genre.mal_id).join(",");
                
                const similarResponse = await axios.get(
                    `https://api.jikan.moe/v4/anime?genres=${genres}&order_by=score&sort=desc&limit=5`
                );
                
                if (!similarResponse.data?.data?.length) {
                    throw new Error("Không tìm thấy anime tương tự!");
                }
                
                // Filter out the selected anime from recommendations
                const recommendations = similarResponse.data.data
                    .filter(anime => anime.mal_id !== selectedAnime.mal_id)
                    .slice(0, 5);
                
                let msg = `🎯 ANIME TƯƠNG TỰ "${selectedAnime.title}"\n\n`;
                
                for (let i = 0; i < recommendations.length; i++) {
                    const anime = recommendations[i];
                    msg += `${i+1}. ${anime.title}\n`;
                    msg += `⭐ Đánh giá: ${anime.score || "N/A"}/10\n`;
                    msg += `🎬 Số tập: ${anime.episodes || "?"}\n`;
                    msg += `📅 Năm: ${anime.year || "N/A"}\n\n`;
                }
                
                msg += `👉 Dùng lệnh "anime <tên anime>" để xem chi tiết về từng anime.`;
                
                return api.sendMessage(msg, threadID, messageID);
            }
            
        } catch (error) {
            console.error("Animerec Error:", error);
            return api.sendMessage(
                `❌ Đã có lỗi xảy ra: ${error.message || "Không thể tìm gợi ý anime"}`,
                threadID, messageID
            );
        }
    }
};

function getGenreId(genre) {
    const genreMap = {
        "action": 1,
        "adventure": 2,
        "comedy": 4,
        "drama": 8,
        "fantasy": 10,
        "horror": 14,
        "mystery": 7,
        "romance": 22,
        "sci-fi": 24,
        "slice of life": 36,
        "sports": 30,
        "supernatural": 37,
        "thriller": 41,
        "hành động": 1,
        "phiêu lưu": 2,
        "hài hước": 4,
        "kịch": 8,
        "giả tưởng": 10,
        "kinh dị": 14,
        "bí ẩn": 7,
        "lãng mạn": 22,
        "khoa học viễn tưởng": 24,
        "đời thường": 36,
        "thể thao": 30,
        "siêu nhiên": 37,
        "gay cấn": 41
    };
    
    return genreMap[genre];
}
