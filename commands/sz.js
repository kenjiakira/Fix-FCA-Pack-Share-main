const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Shazam } = require('node-shazam');

module.exports = {
    name: "sz",
    dev: "HNT",
    info: "Nhận diện bài hát từ audio/video",
    usages: "[reply audio/video]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, messageReply } = event;
        const cacheDir = path.join(__dirname, 'cache');

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }

        if (!messageReply?.attachments?.[0]) {
            return api.sendMessage("Vui lòng reply một audio hoặc video để nhận diện.", threadID, messageID);
        }

        const attachment = messageReply.attachments[0];
        if (!['audio', 'video'].includes(attachment.type)) {
            return api.sendMessage("Bot chỉ có thể nhận diện qua audio hoặc video.", threadID, messageID);
        }

        let loadingMsg;
        try {
            loadingMsg = await api.sendMessage("🎵 Đang nhận diện bài hát...", threadID);
            const audioPath = path.join(cacheDir, `shazam_${Date.now()}.mp3`);
            const response = await axios({
                url: attachment.url,
                responseType: 'stream'
            });

            await new Promise((resolve, reject) => {
                response.data
                    .pipe(fs.createWriteStream(audioPath))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            const shazam = new Shazam();
            const result = await shazam.fromFilePath(audioPath, false, 'vi');

            if (!result?.track) {
                throw new Error("Không thể nhận diện được bài hát này.");
            }

            let thumbnailAttachment = [];
            if (result.track.images?.coverart) {
                const imageResponse = await axios({
                    url: result.track.images.coverart,
                    responseType: 'arraybuffer'
                });
                const imagePath = path.join(cacheDir, `shazam_thumb_${Date.now()}.jpg`);
                fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
                thumbnailAttachment.push(fs.createReadStream(imagePath));
            }

            const message = {
                body: `🎵 Đã nhận diện bài hát:\n\n` +
                      `💠 Tên: ${result.track.title}\n` +
                      `👤 Ca sĩ: ${result.track.subtitle}\n` +
                      `📀 Album: ${result.track.sections?.[0]?.metadata?.find(m => m.title === 'Album')?.text || 'Không có'}\n` +
                      `📅 Phát hành: ${result.track.sections?.[0]?.metadata?.find(m => m.title === 'Released')?.text || 'Không rõ'}\n` +
                      `🎼 Thể loại: ${result.track.genres?.primary || 'Không rõ'}\n` +
                      (result.track.hub?.actions?.[1]?.uri ? `🎧 Link nghe: ${result.track.hub.actions[1].uri}\n` : '') +
                      `🌐 Shazam: ${result.track.url || 'Không có'}`,
                attachment: thumbnailAttachment
            };

            await api.sendMessage(message, threadID, () => {
               
                fs.unlinkSync(audioPath);
                if (thumbnailAttachment.length > 0) {
                    fs.unlinkSync(thumbnailAttachment[0].path);
                }
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            }, messageID);

        } catch (error) {
            console.error("Shazam Error:", error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\nVui lòng thử lại với đoạn audio rõ hơn.`,
                threadID,
                messageID
            );
        }
    }
};
