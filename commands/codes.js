const bwipjs = require('bwip-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jsQR = require('jsqr');
const sharp = require('sharp');

module.exports = {
    name: "codes",
    dev: "HNT",
    category: "Tiện Ích",
    info: "Tạo/Quét mã vạch, mã QR và rút gọn URL",
    usedby: 0,
    onPrefix: true,
    nickName: ["barcode", "qrscan", "shorten", "qr"],
    usages: "[barcode <số> | qrscan <reply ảnh> | shorten <URL> [-alias <tên>]]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target, actions }) {
        const { threadID, messageID, messageReply } = event;
        const command = target[0]?.toLowerCase();
        const args = target.slice(1);

        switch(command) {
            case "barcode":
                await this.createBarcode(api, event, args);
                break;
            case "qrscan":
                await this.scanQR(api, event);
                break;
            case "shorten":
                await this.shortenURL(actions, args);
                break;
            default:
                return api.sendMessage(
                    "📝 Hướng dẫn sử dụng:\n" +
                    "- !codes barcode [số]\n" +
                    "- !codes qrscan (reply ảnh chứa mã QR)\n" +
                    "- !codes shorten [URL] [-alias tên_tùy_chỉnh]",
                    threadID, messageID
                );
        }
    },

    createBarcode: async function(api, event, args) {
        const { threadID, messageID } = event;
        const text = args.join(" ");

        if (!text) {
            return api.sendMessage("Cách dùng: codes barcode [chữ số]", threadID, messageID);
        }

        if (!/^\d+$/.test(text)) {
            return api.sendMessage("⚠️ Vui lòng chỉ nhập các chữ số (0-9)", threadID, messageID);
        }

        if (text.length > 50) {
            return api.sendMessage("⚠️ Độ dài tối đa là 50 ký tự!", threadID, messageID);
        }

        const tempDir = path.join(__dirname, "cache");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const outputFile = path.join(tempDir, `${Date.now()}_barcode.png`);

        try {
            await new Promise((resolve, reject) => {
                bwipjs.toBuffer({
                    bcid: 'code128',
                    text: text,
                    scale: 3,
                    height: 10,
                    includetext: true,
                    textxalign: 'center',
                }, (err, png) => {
                    if (err) reject(err);
                    else {
                        fs.writeFileSync(outputFile, png);
                        resolve();
                    }
                });
            });

            await api.sendMessage(
                {
                    body: `🏷️ Mã vạch cho: ${text}`,
                    attachment: fs.createReadStream(outputFile)
                },
                threadID, messageID
            );

            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        } catch (error) {
            console.error("Barcode generation error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi tạo mã vạch!", threadID, messageID);
        }
    },

    scanQR: async function(api, event) {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply?.attachments?.[0]) {
            return api.sendMessage("Vui lòng reply một hình ảnh chứa mã QR để quét.", threadID, messageID);
        }

        const attachment = messageReply.attachments[0];
        if (attachment.type !== 'photo') {
            return api.sendMessage("Vui lòng reply một hình ảnh.", threadID, messageID);
        }

        try {
            const response = await axios({
                url: attachment.url,
                responseType: 'arraybuffer'
            });

            const image = await sharp(response.data)
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });

            const code = jsQR(
                new Uint8ClampedArray(image.data),
                image.info.width,
                image.info.height
            );

            if (code) {
                return api.sendMessage(`🔍 Kết quả quét mã QR:\n\n${code.data}`, threadID, messageID);
            } else {
                return api.sendMessage("❌ Không tìm thấy mã QR trong hình ảnh hoặc mã QR không hợp lệ.", threadID, messageID);
            }
        } catch (error) {
            console.error("QR scan error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi quét mã QR.", threadID, messageID);
        }
    },

    shortenURL: async function(actions, args) {
        const longUrl = args[0];
        const customAlias = args.includes('-alias') ? args[args.indexOf('-alias') + 1] : null;

        if (!longUrl) {
            return await actions.reply("📝 Cú pháp: codes shorten [URL] [-alias tên_tùy_chỉnh]");
        }

        try {
            new URL(longUrl);
        } catch {
            return await actions.reply("❌ URL không hợp lệ!");
        }

        try {
            let response;
            if (customAlias) {
                response = await axios.post('https://api.tinyurl.com/create', {
                    url: longUrl,
                    alias: customAlias
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });
                const shortUrl = response.data.data.tiny_url;
                await actions.reply(`✨ Liên kết đã được rút gọn:\n📎 URL gốc: ${longUrl}\n🔗 URL ngắn: ${shortUrl}\n✏️ Tên tùy chỉnh: ${customAlias}`);
            } else {
                response = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`);
                await actions.reply(`✨ Liên kết đã được rút gọn:\n📎 URL gốc: ${longUrl}\n🔗 URL ngắn: ${response.data}`);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                await actions.reply("⚠️ Tên tùy chỉnh đã được sử dụng hoặc không hợp lệ.");
            } else {
                await actions.reply("❌ Không thể rút gọn liên kết. Vui lòng thử lại sau.");
            }
        }
    }
};
