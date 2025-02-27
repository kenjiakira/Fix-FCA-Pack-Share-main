const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "gaiv",
    nickName: ["vdgai", "girlvid"],
    version: "1.0.0",
    category: "Giải Trí",
    usedby: 0,
    info: "Xem video gái xinh ngẫu nhiên",
    onPrefix: true,
    dev: "HNT",
    cooldowns: 30,
    
    config: {
        apiURL: "http://gau-api.click/girl-video",
        timeout: 60000,
        maxRetries: 3,
        downloadTimeout: 300000, 
        tempDir: path.join(__dirname, "cache")
    },

    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;
        let videoPath = null;
        let loadingMsg = null;

        try {
            loadingMsg = await api.sendMessage("⏳ Đang tải video, vui lòng đợi...", threadID);

            if (!fs.existsSync(this.config.tempDir)) {
                fs.mkdirSync(this.config.tempDir, { recursive: true });
            }

            let videoData;
            for (let i = 0; i < this.config.maxRetries; i++) {
                try {
                    const response = await axios.get(this.config.apiURL, {
                        timeout: this.config.timeout,
                        validateStatus: status => status === 200
                    });

                    if (response.data && response.data.url) {
                        videoData = response.data;
                        break;
                    }
                } catch (err) {
                    console.error(`Retry ${i + 1} failed:`, err.message);
                    if (i === this.config.maxRetries - 1) throw err;
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }

            if (!videoData || !videoData.url) {
                throw new Error("Không thể lấy được video từ API");
            }

            videoPath = path.join(this.config.tempDir, `gai_${Date.now()}.mp4`);
            const videoResponse = await axios({
                method: 'GET',
                url: videoData.url,
                responseType: 'stream',
                timeout: this.config.downloadTimeout
            });

            const writer = fs.createWriteStream(videoPath);
            videoResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await api.sendMessage({
                body: "『 🌸 』 Video gái xinh của bạn đây\n━━━━━━━━━━━━━━━━━━\n" +
                      `『 📊 』 Video số: ${videoData.index}/${videoData.total}\n`,

                attachment: fs.createReadStream(videoPath)
            }, threadID, async (error, info) => {
                try {
                    if (videoPath && fs.existsSync(videoPath)) {
                        fs.unlinkSync(videoPath);
                    }
                    
                    if (loadingMsg && loadingMsg.messageID) {
                        await api.unsendMessage(loadingMsg.messageID);
                    }

                    if (error) {
                        throw error;
                    }
                } catch (cleanupError) {
                    console.error('Cleanup Error:', cleanupError);
                }
            });

        } catch (error) {
            console.error('VideoGai Error:', error);
            
            let errorMessage = "❌ Đã xảy ra lỗi: ";
            
            if (error.code === 'ECONNABORTED') {
                errorMessage += "Timeout - API phản hồi quá chậm";
            } else if (error.response?.status === 429) {
                errorMessage += "API đang quá tải, vui lòng thử lại sau";
            } else if (error.response?.status === 403) {
                errorMessage += "Không có quyền truy cập API";
            } else if (error.response?.status === 404) {
                errorMessage += "Không tìm thấy video";
            } else {
                errorMessage += "Không thể tải video, vui lòng thử lại sau";
            }

            try {
                if (videoPath && fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath);
                }
                
                if (loadingMsg && loadingMsg.messageID) {
                    await api.unsendMessage(loadingMsg.messageID);
                }
            } catch (cleanupError) {
                console.error('Final Cleanup Error:', cleanupError);
            }

            return api.sendMessage(errorMessage, threadID, messageID);
        }
    }
};
