const axios = require('axios');
const fs = require('fs');
const path = require('path');
const translate = require('translate-google');

module.exports = {
    name: "mangainfo",
    version: "1.0.0",
    dev: "HNT",
    category: "Anime",
    info: "Tìm kiếm thông tin manga",
    usages: "mangainfo <tên manga>",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const query = target.join(" ");

        if (!query) {
            return api.sendMessage("📌 Vui lòng nhập tên manga cần tìm!", threadID, messageID);
        }

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&sfw=true&limit=1`);
            
            if (!response.data?.data?.[0]) {
                return api.sendMessage("❌ Không tìm thấy manga này!", threadID, messageID);
            }

            const manga = response.data.data[0];
            
            const imgResponse = await axios.get(manga.images.jpg.large_image_url || manga.images.jpg.image_url, { responseType: 'arraybuffer' });
            const imgPath = path.join(__dirname, 'cache', `manga_${Date.now()}.jpg`);
            fs.writeFileSync(imgPath, imgResponse.data);
            
            let synopsis = "Không có mô tả";
            if (manga.synopsis) {
                synopsis = await translate(manga.synopsis, { from: 'en', to: 'vi' });
            }

            const msg = `📚 THÔNG TIN MANGA\n\n` +
                       `📝 Tên: ${manga.title}\n` +
                       `✒️ Tên Nhật: ${manga.title_japanese || 'Không có'}\n` +
                       `📊 Xếp hạng: ${manga.rank || 'Không rõ'}\n` +
                       `⭐ Điểm: ${manga.score || 'Chưa có'}/10\n` +
                       `👍 Độ phổ biến: ${manga.popularity || 'Không rõ'}\n` +
                       `📑 Tập: ${manga.volumes || '?'} volumes / ${manga.chapters || '?'} chapters\n` +
                       `📰 Trạng thái: ${translateStatus(manga.status)}\n` +
                       `🎭 Thể loại: ${manga.genres.map(g => g.name).join(', ')}\n` +
                       `👨‍👩‍👧 Độ tuổi: ${manga.rating || 'Không rõ'}\n\n` +
                       `📖 Tóm tắt nội dung:\n${synopsis}\n\n` +
                       `🔗 Chi tiết: ${manga.url}`;

            await api.sendMessage(
                {
                    body: msg,
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => fs.unlinkSync(imgPath),
                messageID
            );

        } catch (error) {
            console.error("Mangainfo Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!",
                threadID, messageID
            );
        }
    }
};

function translateStatus(status) {
    switch(status) {
        case "Publishing": return "Đang xuất bản";
        case "Finished": return "Đã hoàn thành";
        case "On Hiatus": return "Tạm ngưng";
        case "Discontinued": return "Đã ngừng";
        case "Not yet published": return "Chưa xuất bản";
        default: return status;
    }
}
