const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    name: "crawler",
    info: "Phân tích cấu trúc website",
    usages: "crawler [url] [depth]",
    cooldowns: 20,
    usedby: 0,
    onPrefix: true,
    dev: "HNT",
    dmUser: false,

    onLaunch: async function({ api, event, target }) {
        const [url, depth = 2] = target;
        if (!url) return api.sendMessage("❌ Vui lòng nhập URL!", event.threadID);

        const msg = await api.sendMessage("⏳ Đang quét website...", event.threadID);

        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            
            const assets = {
                images: $('img').length,
                scripts: $('script').length,
                styles: $('link[rel="stylesheet"]').length,
                links: $('a').length,
                forms: $('form').length,
                pages: new Set(),
                errors: new Set()
            };

            const internalLinks = $('a[href^="/"], a[href^="' + url + '"]');
            let crawledPages = 0;

            for (let i = 0; i < internalLinks.length && i < depth * 5; i++) {
                const href = $(internalLinks[i]).attr('href');
                const fullUrl = href.startsWith('/') ? `${url}${href}` : href;
                
                try {
                    await axios.head(fullUrl);
                    assets.pages.add(fullUrl);
                    crawledPages++;
                } catch (error) {
                    assets.errors.add(fullUrl);
                }
            }

            const report = `🕷️ BÁO CÁO PHÂN TÍCH WEBSITE\n\n` +
                `📊 Thống kê tài nguyên:\n` +
                `- Trang đã quét: ${crawledPages}\n` +
                `- Trang lỗi: ${assets.errors.size}\n` +
                `- Hình ảnh: ${assets.images}\n` +
                `- Scripts: ${assets.scripts}\n` +
                `- Stylesheets: ${assets.styles}\n` +
                `- Links: ${assets.links}\n` +
                `- Forms: ${assets.forms}\n\n` +
                `🔍 Cấu trúc website:\n` +
                `- Độ sâu quét: ${depth} cấp\n` +
                `- URL gốc: ${url}\n\n` +
                (assets.errors.size > 0 ? 
                    `⚠️ Links lỗi:\n${Array.from(assets.errors).slice(0,5).join('\n')}` : 
                    '✅ Không phát hiện lỗi');

            api.unsendMessage(msg.messageID);
            return api.sendMessage(report, event.threadID);

        } catch (error) {
            api.unsendMessage(msg.messageID);
            return api.sendMessage(
                `❌ Lỗi khi quét website: ${error.message}`,
                event.threadID
            );
        }
    }
};
