const axios = require('axios');
const translate = require('translate-google');
const { getInfoFromName } = require('mal-scraper');
const request = require('request');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

module.exports = {
    name: "anime",
    category: "Anime",
    info: "Tìm kiếm thông tin Anime, nhân vật, ảnh, gợi ý, mùa hiện tại, và manga.",
    dev: "ZiaRein",
    onPrefix: true,
    usages: [
        "anime info <tên anime>",
        "anime char <tên nhân vật>",
        "anime pic [thể loại|list|wall <từ khóa>]",
        "anime rec [thể loại|tên anime]",
        "anime season [số trang]",
        "anime manga <tên manga>"
    ],
    cooldowns: 5,

    onLaunch: async function ({ api, event, target, actions }) {
        const { threadID, messageID } = event;
        const subcommand = target[0]?.toLowerCase();
        const query = target.slice(1).join(" ").trim();

        if (!subcommand) {
            return api.sendMessage(
                "📖 Hướng dẫn sử dụng lệnh anime:\n\n" +
                this.usages.map(u => `- ${u}`).join("\n"),
                threadID, messageID
            );
        }

        switch (subcommand) {
            case "info":
                return await this.handleAnimeInfo(api, event, query, actions);
            case "char":
                return await this.handleAnimeChar(api, event, query);
            case "pic":
                return await this.handleAnimePic(api, event, target.slice(1));
            case "rec":
                return await this.handleAnimeRec(api, event, query);
            case "season":
                return await this.handleAnimeSeason(api, event, query);
            case "manga":
                return await this.handleMangaInfo(api, event, query);
            default:
                return api.sendMessage("❌ Subcommand không hợp lệ!", threadID, messageID);
        }
    },
    handleWallpaper: async function(api, event, keywords) {
        const { threadID, messageID } = event;
        
        if (!keywords || keywords.length === 0) {
            return api.sendMessage(
                "📌 Vui lòng nhập từ khóa tìm kiếm!\nVí dụ: anime pic wall waifu",
                threadID,
                messageID
            );
        }
    
        const query = keywords.join(" ");
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    
        try {
            const response = await axios.get(
                `https://www.zerochan.net/search?q=${encodeURIComponent(query)}`,
                { responseType: "text" }
            );
    
            const imageUrls = response.data.match(/https:\/\/static\.zerochan\.net\/[^"]+\.full\.[^"]+/g);
            if (!imageUrls || imageUrls.length === 0) {
                return api.sendMessage(
                    "❌ Không tìm thấy hình ảnh phù hợp!",
                    threadID,
                    messageID
                );
            }
    
            const randomImage = imageUrls[Math.floor(Math.random() * imageUrls.length)];
            const imgResponse = await axios.get(randomImage, {
                responseType: "arraybuffer"
            });
    
            const imgPath = path.join(
                cacheDir,
                `wall_${Date.now()}.${randomImage.split(".").pop()}`
            );
    
            fs.writeFileSync(imgPath, imgResponse.data);
    
            await api.sendMessage(
                {
                    body: `🌸 Anime Wallpaper: ${query}`,
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => fs.unlinkSync(imgPath),
                messageID
            );
    
        } catch (error) {
            console.error("Wallpaper Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra khi tìm hình ảnh, vui lòng thử lại sau!",
                threadID,
                messageID
            );
        }
    },
    handleAnimeInfo: async function (api, event, query, actions) {
        if (!query || query.length < 2) {
            return await actions.reply("❎ Vui lòng nhập tên anime cần tìm (ít nhất 2 ký tự)");
        }

        const cachePath = path.join(__dirname, 'cache');
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath, { recursive: true });
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

            const attachments = imagePath ? [fs.createReadStream(imagePath)] : [];
            await actions.send(
                { body: msg, attachment: attachments },
                event.threadID,
                async () => {
                    if (imagePath) {
                        try {
                            await fsPromises.unlink(imagePath);
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
    },

    handleAnimeChar: async function (api, event, query) {
        if (!query) {
            return api.sendMessage("📌 Vui lòng nhập tên nhân vật cần tìm!", event.threadID, event.messageID);
        }

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`);
            if (!response.data?.data?.[0]) {
                return api.sendMessage("❌ Không tìm thấy thông tin nhân vật!", event.threadID, event.messageID);
            }

            const char = response.data.data[0];
            const about = await translate(char.about || "Không có thông tin", { from: 'en', to: 'vi' });

            const imgResponse = await axios.get(char.images.jpg.image_url, { responseType: 'arraybuffer' });
            const imgPath = path.join(__dirname, 'cache', `char_${Date.now()}.jpg`);
            fs.writeFileSync(imgPath, imgResponse.data);

            const msg = `👤 THÔNG TIN NHÂN VẬT\n\n` +
                       `📝 Tên: ${char.name}\n` +
                       `✒️ Tên khác: ${char.name_kanji || 'Không có'}\n` +
                       `👍 Độ yêu thích: ${char.favorites}\n\n` +
                       `📖 Giới thiệu:\n${about}\n\n` +
                       `🔗 Chi tiết: ${char.url}`;

            await api.sendMessage(
                {
                    body: msg,
                    attachment: fs.createReadStream(imgPath)
                },
                event.threadID,
                () => fs.unlinkSync(imgPath),
                event.messageID
            );

        } catch (error) {
            console.error("Animechar Error:", error);
            return api.sendMessage("❌ Đã có lỗi xảy ra, vui lòng thử lại sau!", event.threadID, event.messageID);
        }
    },

    handleAnimePic: async function (api, event, target) {
        const { threadID, messageID } = event;

        // Handle wallpaper command
        if (target[0] === "wall") {
            return await this.handleWallpaper(api, event, target.slice(1));
        }

        const categories = {
            waifu: "Waifu",
            neko: "Mèo nữ",
            shinobu: "Shinobu",
            megumin: "Megumin",
            // ...other categories...
        };

        if (!target[0] || target[0] === "random") {
            const randomCategory =
                Object.keys(categories)[
                    Math.floor(Math.random() * Object.keys(categories).length)
                ];
            target[0] = randomCategory;
        }

        if (target[0] === "list") {
            let msg = "📑 DANH SÁCH THỂ LOẠI:\n\n";
            Object.entries(categories).forEach(([key, value], index) => {
                msg += `${index + 1}. ${value} (${key})\n`;
            });
            msg += "\n👉 Dùng 'animepic <thể loại>' để xem ảnh";
            return api.sendMessage(msg, threadID, messageID);
        }

        const category = target[0].toLowerCase();
        if (!categories[category]) {
            return api.sendMessage(
                "❌ Thể loại không hợp lệ!\n👉 Dùng 'animepic list' để xem danh sách",
                threadID,
                messageID
            );
        }

        try {
            const response = await axios.get(
                `https://api.waifu.pics/sfw/${category}`
            );
            if (!response.data?.url) throw new Error("Không tìm thấy ảnh");

            const imgResponse = await axios.get(response.data.url, {
                responseType: "arraybuffer",
            });
            const imgPath = path.join(
                __dirname,
                "cache",
                `anime_${Date.now()}.${response.data.url.split(".").pop()}`
            );

            fs.writeFileSync(imgPath, imgResponse.data);

            await api.sendMessage(
                {
                    body: `🌸 Anime ${categories[category]}`,
                    attachment: fs.createReadStream(imgPath),
                },
                threadID,
                () => fs.unlinkSync(imgPath),
                messageID
            );
        } catch (error) {
            console.error("Animepic Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!",
                threadID,
                messageID
            );
        }
    },

    handleAnimeRec: async function (api, event, query) {
        const { threadID, messageID } = event;

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
                endpoint = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&order_by=score&sort=desc&limit=1`;
                type = "similar";
                data = { anime: query };
            }

            const response = await axios.get(endpoint);

            if (type === "random") {
                if (!response.data?.data?.length) {
                    throw new Error("Không tìm thấy anime nào!");
                }

                const randomRec = response.data.data[Math.floor(Math.random() * response.data.data.length)];
                const randomAnime = randomRec.entry[Math.floor(Math.random() * randomRec.entry.length)];

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
            } else if (type === "genre") {
                if (!response.data?.data?.length) {
                    throw new Error(`Không tìm thấy anime nào thuộc thể loại ${data.genre}!`);
                }

                let msg = `🎯 TOP 5 ANIME THỂ LOẠI ${data.genre.toUpperCase()}\n\n`;

                for (let i = 0; i < response.data.data.length; i++) {
                    const anime = response.data.data[i];
                    msg += `${i + 1}. ${anime.title}\n`;
                    msg += `⭐ Đánh giá: ${anime.score || "N/A"}/10\n`;
                    msg += `🎬 Số tập: ${anime.episodes || "?"}\n`;
                    msg += `📅 Năm: ${anime.year || "N/A"}\n\n`;
                }

                msg += `👉 Dùng lệnh "anime <tên anime>" để xem chi tiết về từng anime.`;

                return api.sendMessage(msg, threadID, messageID);
            } else if (type === "similar") {
                if (!response.data?.data?.length) {
                    throw new Error(`Không tìm thấy anime "${data.anime}"!`);
                }

                const selectedAnime = response.data.data[0];
                const genres = selectedAnime.genres.map(genre => genre.mal_id).join(",");

                const similarResponse = await axios.get(
                    `https://api.jikan.moe/v4/anime?genres=${genres}&order_by=score&sort=desc&limit=5`
                );

                if (!similarResponse.data?.data?.length) {
                    throw new Error("Không tìm thấy anime tương tự!");
                }

                const recommendations = similarResponse.data.data
                    .filter(anime => anime.mal_id !== selectedAnime.mal_id)
                    .slice(0, 5);

                let msg = `🎯 ANIME TƯƠNG TỰ "${selectedAnime.title}"\n\n`;

                for (let i = 0; i < recommendations.length; i++) {
                    const anime = recommendations[i];
                    msg += `${i + 1}. ${anime.title}\n`;
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
    },

    handleAnimeSeason: async function (api, event, query) {
        const { threadID, messageID } = event;
        const page = parseInt(query) || 1;
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

            msg += `Dùng "anime season ${page + 1}" để xem trang tiếp theo`;

            return api.sendMessage(msg, threadID, messageID);

        } catch (error) {
            console.error("Animeseason Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!",
                threadID, messageID
            );
        }
    },

    handleMangaInfo: async function (api, event, query) {
        if (!query) {
            return api.sendMessage("📌 Vui lòng nhập tên manga cần tìm!", event.threadID, event.messageID);
        }

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1`);
            if (!response.data?.data?.[0]) {
                return api.sendMessage("❌ Không tìm thấy thông tin manga!", event.threadID, event.messageID);
            }

            const manga = response.data.data[0];
            const synopsis = await translate(manga.synopsis || "Không có mô tả", { from: 'en', to: 'vi' });

            const msg = `📖 THÔNG TIN MANGA\n\n` +
                       `📚 Tên: ${manga.title}\n` +
                       `🎌 Tên tiếng Nhật: ${manga.title_japanese || "Không có"}\n` +
                       `📖 Tình trạng: ${manga.status}\n` +
                       `📅 Ngày phát hành: ${manga.published.string}\n` +
                       `📋 Số chương: ${manga.chapters || "?"}\n` +
                       `📓 Số tập: ${manga.volumes || "?"}\n` +
                       `🌟 Điểm số: ${manga.score || "N/A"}\n\n` +
                       `📝 Nội dung:\n${synopsis}\n\n` +
                       `🔗 Link chi tiết: ${manga.url}`;

            return api.sendMessage(msg, event.threadID, event.messageID);
        } catch (error) {
            console.error("MangaInfo Error:", error);
            return api.sendMessage("❌ Đã có lỗi xảy ra, vui lòng thử lại sau!", event.threadID, event.messageID);
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
            .pipe(fs.createWriteStream(dest))
            .on('close', resolve)
            .on('error', reject);
    });
}

function getGenreId(genre) {
    const genres = {
        action: 1,
        adventure: 2,
        cars: 3,
        comedy: 4,
        dementia: 5,
        demons: 6,
        mystery: 7,
        drama: 8,
        ecchi: 9,
        fantasy: 10,
        game: 11,
        hentai: 12,
        historical: 13,
        horror: 14,
        kids: 15,
        magic: 16,
        martialarts: 17,
        mecha: 18,
        music: 19,
        parody: 20,
        samurai: 21,
        romance: 22,
        school: 23,
        scifi: 24,
        shoujo: 25,
        shoujoai: 26,
        shounen: 27,
        shounenai: 28,
        space: 29,
        sports: 30,
        superpower: 31,
        vampire: 32,
        yaoi: 33,
        yuri: 34,
        harem: 35,
        sliceoflife: 36,
        supernatural: 37,
        military: 38,
        police: 39,
        psychological: 40,
        thriller: 41,
        seinen: 42,
        josei: 43,
    };

    return genres[genre] || null;
}

function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return "winter";
    if (month >= 4 && month <= 6) return "spring";
    if (month >= 7 && month <= 9) return "summer";
    return "fall";
}
