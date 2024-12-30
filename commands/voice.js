const axios = require('axios');
const fs = require('fs');
const path = require('path');
const qs = require('qs');

module.exports = {
    name: "voice",
    info: "Chuyển văn bản thành giọng nói",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ["voice", "voic"],
    usages: "[giọng] [văn bản]",
    cooldowns: 5,

    onLaunch: async function ({ event, target, actions }) {
        try {
            const { createReadStream, unlinkSync, stat } = require("fs-extra");

            const apiKeys = [
                "4SlvedTzR2Hcy25uWKCDdsBFutWBi3sk",
                "iHOQNWBfNhWY6nMUHwSLDqSSmvB3QaSD",
                "QZ6ZWB1gOQvwm1hUurCYMOSBMVa8Od4s",
                "M5tMIANkCERIdGQvlVFnJImnXS4272Ny",
                "UnoK8MOAAhVQHxaUtAVRdk3KQv3sOdCl"
            ];
            
            const getRandomApiKey = () => {
                return apiKeys[Math.floor(Math.random() * apiKeys.length)];
            };

            const content = (event.type == "message_reply") ? event.messageReply.body : target.join(" ").trim();
            if (!content) {
                return await actions.reply("Vui lòng nhập văn bản cần chuyển thành giọng nói!");
            }
            if (content.length > 2000) {
                return await actions.reply("⚠️ Văn bản không được vượt quá 2000 ký tự. Vui lòng nhập lại.");
            }

            const speakerId = ["1", "2", "3", "4"].includes(target[0]) ? target[0] : "1";
            const textToSynthesize = (["1", "2", "3", "4"].includes(target[0]))
                ? content.slice(2).trim()
                : content;

            if (!textToSynthesize) {
                return await actions.reply("Văn bản đầu vào không được để trống.");
            }

            const filePath = path.join(__dirname, 'cache', `${event.threadID}_${event.senderID}.mp3`);

            let response;
            let retries = 3;
            while (retries > 0) {
                try {
                    response = await axios.post(
                        "https://api.zalo.ai/v1/tts/synthesize",
                        qs.stringify({
                            input: textToSynthesize,
                            speaker_id: speakerId,
                            encode_type: 1,
                        }),
                        {
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                                apikey: getRandomApiKey()
                            }
                        }
                    );
                    if (response.data.error_code === 0) break;
                    retries--;
                } catch (apiError) {
                    retries--;
                    if (retries === 0) {
                        console.error("API Request Error:", apiError.message);
                        return await actions.reply("⚠️ Tất cả API key đều thất bại. Vui lòng thử lại sau.");
                    }
                }
            }

            if (response.data.error_code !== 0) {
                return await actions.reply(`⚠️ Lỗi từ API: ${response.data.error_message}`);
            }

            const audioUrl = response.data.data.url;
            let audioResponse;
            try {
                audioResponse = await axios({
                    url: audioUrl,
                    method: 'GET',
                    responseType: 'stream'
                });
            } catch (downloadError) {
                console.error("Audio Download Error:", downloadError.message);
                return await actions.reply("⚠️ Không thể tải xuống tệp âm thanh. Vui lòng thử lại sau.");
            }

            const writer = fs.createWriteStream(filePath);
            audioResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', (err) => {
                    console.error("File Write Error:", err.message);
                    reject(err);
                });
            });

            const stats = await stat(filePath);
            const fileSizeInBytes = stats.size;
            const maxSizeBytes = 80 * 1024 * 1024;

            if (fileSizeInBytes > maxSizeBytes) {
                unlinkSync(filePath);
                return await actions.reply('⚠️ Không thể gửi tệp vì kích thước lớn hơn 80MB.');
            }

            await actions.reply({ attachment: createReadStream(filePath) });
            unlinkSync(filePath); 
        } catch (error) {
            console.error("Unexpected Error:", error.message);
            await actions.reply("Đã xảy ra lỗi khi thực hiện chuyển văn bản thành giọng nói.");
        }
    }
};
