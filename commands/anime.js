const translate = require('translate-google');
const { getInfoFromName } = require('mal-scraper');
const request = require('request');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

module.exports = {
    name: "anime",
    info: "Tìm kiếm thông tin Anime.",
    dev: "ZiaRein",
    onPrefix: true,
    usedby: 0,
    dmUser: false,
    nickName: ["anime"],
    usages: "anime [tên anime cần tìm]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target, actions }) {
        const query = target.join(" ").trim();
        
        if (!query || query.length < 2) {
            return await actions.reply("❎ Vui lòng nhập tên anime cần tìm (ít nhất 2 ký tự)");
        }

        const cachePath = path.join(__dirname, 'cache');
        if (!fsSync.existsSync(cachePath)) {
            fsSync.mkdirSync(cachePath, { recursive: true });
        }

        try {
           
            const anime = await getInfoFromName(query);
            if (!anime) throw new Error("Không tìm thấy thông tin anime này");

            let imagePath = null;
            if (anime.picture) {
                imagePath = path.join(cachePath, `mal_${Date.now()}.${getImageExt(anime.picture)}`);
                await downloadImage(anime.picture, imagePath);
            }

            const translatedSynopsis = await translate(anime.synopsis || "Không có mô tả", { from: 'en', to: 'vi' });
            
            const msg = formatAnimeMessage(anime, translatedSynopsis);
            
            const attachments = imagePath ? [fsSync.createReadStream(imagePath)] : [];
            await actions.send(
                { body: msg, attachment: attachments },
                event.threadID,
                async () => {
                 
                    if (imagePath) {
                        try {
                            await fs.unlink(imagePath);
                        } catch (err) {
                            console.error("Failed to delete temp file:", err);
                        }
                    }
                },
                event.messageID
            );

        } catch (err) {
         
            console.error("Error fetching anime info:", err);
            return await actions.reply(`⚠️ Lỗi: ${err.message || "Không thể tìm thấy anime"}`);
        }
    }
};

function getImageExt(url) {
    return url.split('.').pop() || 'jpg';
}

function formatAnimeMessage(anime, synopsis) {
    return `📖 THÔNG TIN ANIME\n\n` +
           `🎥 Tên: ${anime.title}\n` +
           `🎌 Tên tiếng Nhật: ${anime.japaneseTitle}\n` +
           `📺 Loại: ${anime.type}\n` +
           `⚡️ Trạng thái: ${anime.status}\n` +
           `🗓️ Khởi chiếu: ${anime.premiered}\n` +
           `📡 Phát sóng: ${anime.broadcast}\n` +
           `📅 Ra mắt: ${anime.aired}\n` +
           `🎬 Nhà sản xuất: ${anime.producers}\n` +
           `🎓 Studio: ${anime.studios}\n` +
           `📝 Nguồn: ${anime.source}\n` +
           `🎞️ Số tập: ${anime.episodes}\n` +
           `⌛️ Thời lượng: ${anime.duration}\n` +
           `🎭 Thể loại: ${(anime.genres || ["Không có"]).join(", ")}\n` +
           `🌟 Độ phổ biến: ${anime.popularity}\n` +
           `🔝 Xếp hạng: ${anime.ranked}\n` +
           `🎖️ Điểm số: ${anime.score}\n` +
           `🔞 Đánh giá: ${anime.rating}\n\n` +
           `📝 Nội dung:\n${synopsis}\n\n` +
           `🌐 Link chi tiết: ${anime.url}`;
}

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        request(url)
            .on('error', reject)
            .pipe(fsSync.createWriteStream(dest))
            .on('close', resolve)
            .on('error', reject);
    });
}
