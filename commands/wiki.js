const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { image } = require('image-downloader');
const { WIKIPEDIA } = require('../utils/api');

const cacheDir = path.resolve(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirsSync(cacheDir);
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: "wiki",
    info: "Tra cứu thông tin từ Wikipedia",
    dev: "HNT",
    category: "Tiện Ích",
    onPrefix: true,
    usedby: 0,
    dmUser: false,
    nickName: ["wiki", "wikipedia"],
    usages: "wiki [en/vi] [từ khóa] | wiki [từ khóa]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        let lang = 'vi';
        let searchTerm = null;

        if (target && target.length > 0) {
            if (target[0].toLowerCase() === 'en' || target[0].toLowerCase() === 'vi') {
                lang = target[0].toLowerCase();
                searchTerm = target.slice(1).join(" ");
            } else {
                searchTerm = target.join(" ");
            }
        }

        const outputPath = path.resolve(cacheDir, 'wiki_image.jpg');

        try {
            if (!searchTerm) {
                const randomWikiArticle = await fetchRandomWikiArticle(lang);
                if (randomWikiArticle) {
                    if (randomWikiArticle.image && await checkImageUrl(randomWikiArticle.image)) {
                        await downloadImage(randomWikiArticle.image, outputPath);
                    }
                    const message = `📚 Wikipedia | Bài viết ngẫu nhiên\n\n${formatTitle(randomWikiArticle.title)}\n\n${formatContent(randomWikiArticle.extract)}\n\n🔗 Đọc thêm: ${randomWikiArticle.url}\n\n💡 Mẹo: Bạn có thể tìm kiếm bằng lệnh:\n• wiki [từ khóa] - Tìm bằng Tiếng Việt\n• wiki en [keyword] - Search in English`;
                    api.sendMessage({ body: message, attachment: [fs.createReadStream(outputPath)] }, event.threadID, () => {
                        try {
                            if (fs.existsSync(outputPath)) {
                                fs.unlinkSync(outputPath);
                            }
                        } catch (unlinkError) {
                            console.error(`Không thể xóa tệp ${outputPath}: ${unlinkError.message}`);
                        }
                    });
                } else {
                    api.sendMessage("Không thể tìm thấy thông tin ngẫu nhiên từ Wikipedia vào lúc này.", event.threadID);
                }
            } else {
                const baseUrl = lang === 'en' ? WIKIPEDIA.EN_URL : WIKIPEDIA.VI_URL;
                const apiUrl = `${baseUrl}/page/summary/${encodeURIComponent(searchTerm)}`;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        const response = await axios.get(apiUrl);
                        const wikiData = response.data;
                        if (wikiData.title && wikiData.extract) {
                            const imageUrl = wikiData.thumbnail ? wikiData.thumbnail.source : null;
                            let attachments = [];
                            if (imageUrl && await checkImageUrl(imageUrl)) {
                                await downloadImage(imageUrl, outputPath);
                                attachments.push(fs.createReadStream(outputPath));
                            }
                            const message = `📚 Wikipedia: ${wikiData.title}\n\n${wikiData.extract}\n\nĐọc thêm: ${wikiData.content_urls.desktop.page}`;
                            api.sendMessage({ body: message, attachment: attachments }, event.threadID, () => {
                                try {
                                    if (fs.existsSync(outputPath)) {
                                        fs.unlinkSync(outputPath);
                                    }
                                } catch (unlinkError) {
                                    console.error(`Không thể xóa tệp ${outputPath}: ${unlinkError.message}`);
                                }
                            });
                            return;
                        } else {
                            api.sendMessage("Không tìm thấy thông tin từ khóa này trên Wikipedia.", event.threadID);
                            return;
                        }
                    } catch (error) {
                        if (attempt === 3) {
                            api.sendMessage("Không thể truy xuất thông tin từ Wikipedia vào lúc này. Vui lòng thử lại sau.", event.threadID);
                        } else {
                            console.error(`Lỗi khi truy xuất thông tin: ${error.message}. Thử lại lần ${attempt}`);
                            await delay(2000);
                        }
                    }
                }
            }
        } catch (error) {
            api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, event.threadID);
        }
    }
};

function formatTitle(title) {
    return `📌 ${title.toUpperCase()}`;
}

function formatContent(content) {
    if (content.length > 2000) {
        return content.substring(0, 1997) + "...";
    }
    return content;
}

async function fetchRandomWikiArticle(lang = 'vi', retries = 3) {
    const baseUrl = lang === 'en' ? WIKIPEDIA.EN_URL : WIKIPEDIA.VI_URL;
    const apiUrl = `${baseUrl}/page/random/summary`;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(apiUrl);
            const wikiData = response.data;
            if (wikiData.title && wikiData.extract) {
                const imageUrl = wikiData.thumbnail ? wikiData.thumbnail.source : null;
                return {
                    title: wikiData.title,
                    extract: wikiData.extract,
                    url: wikiData.content_urls.desktop.page,
                    image: imageUrl
                };
            } else {
                return null;
            }
        } catch (error) {
            if (attempt === retries) {
                throw new Error("Không thể truy xuất thông tin từ Wikipedia vào lúc này. Vui lòng thử lại sau.");
            }
            console.error(`Lỗi khi truy xuất thông tin: ${error.message}. Thử lại lần ${attempt}`);
            await delay(2000);  
        }
    }
}

async function downloadImage(url, outputPath) {
    try {
        await image({ url, dest: outputPath });
        console.log(`Tải ảnh thành công từ ${url}`);
    } catch (error) {
        console.error(`Lỗi khi tải ảnh từ ${url}: ${error.message}`);
        throw new Error(`Không thể tải hình ảnh từ ${url}.`);
    }
}

async function checkImageUrl(url) {
    try {
        const response = await axios.head(url);
        return response.status === 200;
    } catch (error) {
        console.error(`Lỗi khi kiểm tra URL ${url}: ${error.message}`);
        return false;
    }
}
