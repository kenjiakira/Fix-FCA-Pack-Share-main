const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const imgurClientId = '34dc774b8c0ddae'; 

module.exports = {
    name: "imgur",
    info: "Tải ảnh để lấy link Imgur",
    usedby: 2,
    category: "Admin Commands",
    dev: "Hoàng Ngọc Từ",
    onPrefix: true,
    dmUser: false,
    nickName: ["imgur", "upload"],
    usages: "Reply nhiều ảnh hoặc video để tải lên Imgur",
    cooldowns: 5,

    onLaunch: async function ({ api, event, actions }) {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return await actions.reply("Vui lòng reply nhiều ảnh hoặc video để tải lên Imgur.", threadID, messageID);
        }

        const attachments = messageReply.attachments.filter(att => att.type === 'photo' || att.type === 'video');

        if (attachments.length === 0) {
            return await actions.reply("Vui lòng reply ít nhất một ảnh hoặc video để tải lên Imgur.", threadID, messageID);
        }

        let uploadPromises = attachments.map(async (attachment) => {
            const fileUrl = attachment.url;
            const fileExtension = attachment.type === 'photo' ? 'jpg' : 'mp4';
            const tempFilePath = path.join(__dirname, 'cache', `temp_file_${Date.now()}.${fileExtension}`);

            try {
                const response = await axios({
                    url: fileUrl,
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(tempFilePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const form = new FormData();
                form.append('image', fs.createReadStream(tempFilePath));

                const imgurResponse = await axios.post('https://api.imgur.com/3/image', form, {
                    headers: {
                        ...form.getHeaders(),
                        Authorization: `Client-ID ${imgurClientId}`
                    }
                });

                const imgurUrl = imgurResponse.data.data.link;

                console.log(`Ảnh đã được tải lên Imgur: ${imgurUrl}`);

                fs.unlinkSync(tempFilePath);

                return imgurUrl;

            } catch (error) {
                console.error(`Lỗi khi xử lý tệp ${fileUrl}:`, error);
                return `Lỗi khi tải ${fileUrl}`;
            }
        });

        try {
            const results = await Promise.all(uploadPromises);
            const successMessages = results.filter(result => result.startsWith('http')).map(url => `Tệp đã được tải lên Imgur: ${url}`).join('\n');
            const errorMessages = results.filter(result => result.startsWith('Lỗi')).join('\n');

            const message = `${successMessages}\n${errorMessages}`;
            await actions.reply(message || "Không có tệp nào được tải lên.", threadID, messageID);
        } catch (error) {
            console.error('Lỗi khi xử lý ảnh/video:', error);
            await actions.reply("Có lỗi xảy ra khi xử lý ảnh/video.", threadID, messageID);
        }
    }
};
