const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

module.exports = {
    name: "catbox",
    dev: "HNT",
    usedby: 2,
    info: "Lấy link Catbox từ video/gif",
    usages: "Reply một video/gif để lấy link",
    onPrefix: true,
    cooldowns: 5,

    onLaunch: async function({ api, event }) {
        try {
            if (event.type !== "message_reply" || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
                return api.sendMessage(
                    "❌ Vui lòng reply một video hoặc gif để lấy link!",
                    event.threadID,
                    event.messageID
                );
            }

            const attachment = event.messageReply.attachments[0];
            const url = attachment.url;
            
            if (!url || (!attachment.type === "video" && !attachment.type === "animated_image")) {
                return api.sendMessage(
                    "❌ File không được hỗ trợ. Chỉ upload được video hoặc gif!",
                    event.threadID
                );
            }

            const loadingMessage = await api.sendMessage(
                "⏳ Đang xử lý, vui lòng đợi...", 
                event.threadID
            );
            
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const tempPath = path.join(__dirname, "cache", `${Date.now()}.${attachment.type === "video" ? "mp4" : "gif"}`);
            fs.writeFileSync(tempPath, Buffer.from(response.data));

            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', fs.createReadStream(tempPath));

            const uploadResponse = await axios.post('https://catbox.moe/user/api.php', formData, {
                headers: formData.getHeaders()
            });

            fs.unlinkSync(tempPath);

            await api.unsendMessage(loadingMessage.messageID);

            return api.sendMessage(
                `✅ Link Catbox của bạn:\n${uploadResponse.data}`,
                event.threadID,
                event.messageID
            );

        } catch (error) {
            console.error('Catbox Error:', error);
            return api.sendMessage(
                "❌ Đã xảy ra lỗi trong quá trình upload!\nVui lòng thử lại sau.",
                event.threadID
            );
        }
    }
};
