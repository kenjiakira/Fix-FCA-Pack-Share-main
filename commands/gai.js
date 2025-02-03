const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "gai",
    usedby: 0,
    info: "xem ảnh gái",
    onPrefix: true,
    dev: "HNT",
    cooldowns: 10,

    config: {
        apiUrl: "https://api-gai-xinh.vercel.app/getRandomImage",
        timeout: 15000,  
        retries: 2      
    },

    async retryRequest(fn, retries = this.config.retries) {
        for (let i = 0; i <= retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === retries) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    },

    onLaunch: async function ({ event, api }) {
        try {
            const response = await this.retryRequest(() => 
                axios.get(this.config.apiUrl, {
                    timeout: this.config.timeout,
                    maxRedirects: 5,
                    validateStatus: function (status) {
                        return status >= 200 && status < 500;
                    }
                })
            );

            if (response.status === 401) {
                throw new Error('API yêu cầu xác thực. Vui lòng kiểm tra lại URL.');
            }

            if (!response.data || typeof response.data !== 'object') {
                console.error('Invalid response format:', response.data);
                throw new Error('API trả về dữ liệu không hợp lệ');
            }

            const imageUrl = response.data.imageUrl;
            if (!imageUrl || !imageUrl.startsWith('https://')) {
                throw new Error('URL ảnh không hợp lệ');
            }

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            const tempFilePath = path.join(cacheDir, `gai-${Date.now()}.jpg`);
            
            const imageResponse = await this.retryRequest(() =>
                axios.get(imageUrl, { 
                    responseType: 'arraybuffer',
                    timeout: this.config.timeout
                })
            );
            
            fs.writeFileSync(tempFilePath, imageResponse.data);

            await api.sendMessage({
                body: "『 🌸 』→ Ảnh của bạn đây\n『 💓 』→ Chúc bạn ngày mới tốt lành",
                attachment: fs.createReadStream(tempFilePath)
            }, event.threadID, () => {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (err) {
                    console.error('Error deleting temp file:', err);
                }
            });

        } catch (error) {
            console.error('Detailed error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config: error.config
            });
            
            let errorMsg = "❌ ";
            if (error.response?.status === 401) {
                errorMsg += "API cần xác thực, vui lòng liên hệ admin.";
            } else if (error.code === 'ECONNREFUSED') {
                errorMsg += "Không thể kết nối tới server.";
            } else if (error.code === 'ECONNABORTED') {
                errorMsg += "Server phản hồi quá chậm, đang thử lại...";
            } else {
                errorMsg += "Có lỗi xảy ra: " + error.message;
            }
            
            api.sendMessage(errorMsg, event.threadID);
        }
    }
};
