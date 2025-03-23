const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { image } = require('image-downloader');

const UNSPLASH_ACCESS_KEY = 'USC-YIdoZxMRxblaePKXocUs6Up7EAbqDbInZ0z5r4U';

const cacheDir = path.resolve(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirsSync(cacheDir);
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getRandomWallpapers(count = 4, orientation = 'landscape') {
    try {
        const response = await axios.get('https://api.unsplash.com/photos/random', {
            params: {
                count: count,
                orientation: orientation,
                query: 'wallpaper' 
            },
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
        if (response.data.length === 0) {
            throw new Error('Không tìm thấy hình ảnh ngẫu nhiên.');
        }
        return response.data.map(photo => photo.urls.full);
    } catch (error) {
        throw new Error(`Lỗi khi lấy hình nền: ${error.message}`);
    }
}

async function downloadImage(url, outputPath, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await image({ url, dest: outputPath });
            console.log(`Tải ảnh thành công từ ${url}`);
            return true; 
        } catch (error) {
            console.error(`Thử lại tải ảnh từ ${url}, lần thứ ${attempt} gặp lỗi: ${error.message}`);
            if (attempt === retries) {
                console.error(`Không thể tải hình ảnh từ ${url} sau ${retries} lần thử.`);
                return false;
            }
        }
    }
}
module.exports = {
    name: 'wallpaper',
    info: 'Gửi 4 hình nền đẹp cho Desktop hoặc điện thoại.',
    dev: 'HNT',
    usedby: 0,
    category: "Media",
    onPrefix: true, 
    dmUser: false, 
    nickName: ['wallpaper', 'hìnhnền'], 
    usages: 'wallpaper',
    cooldowns: 5, 

    onLaunch: async function ({ api, event }) {
        const { threadID, messageID } = event;

        let notifyMessageID = null;

        try {
            const notifyMessage = await api.sendMessage(`[🔄]➜ Vui lòng đợi hệ thống cung cấp ảnh...`, threadID);
            notifyMessageID = notifyMessage.messageID; 

            const imageUrls = await getRandomWallpapers();
            const outputPaths = imageUrls.map((_, index) => path.resolve(cacheDir, `wallpaper${index + 1}.jpg`));

            let successfulDownloads = 0;

            for (let i = 0; i < imageUrls.length; i++) {
                const success = await downloadImage(imageUrls[i], outputPaths[i]);
                if (success) {
                    successfulDownloads++;
                } else {
                    outputPaths[i] = null; 
                }
                if (i < imageUrls.length - 1) { 
                    await delay(2000); 
                }
            }

            const validOutputPaths = outputPaths.filter(path => path !== null);

            if (validOutputPaths.length === 0) {
                throw new Error('Không thể tải bất kỳ hình ảnh nào.');
            }

            if (notifyMessageID) {
                api.unsendMessage(notifyMessageID);
            }

            const attachments = validOutputPaths.map(filePath => fs.createReadStream(filePath));

            const successMessage = `📱🌟 Hình nền đẹp cho bạn! 🌟📱\n━━━━━━━━━━━━━━━\n[✔️]➜ ${successfulDownloads} hình nền đã được gửi.`;

            api.sendMessage({ body: successMessage, attachment: attachments }, threadID, () => {
                validOutputPaths.forEach(filePath => {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (unlinkError) {
                        console.error(`Không thể xóa tệp ${filePath}: ${unlinkError.message}`);
                    }
                });
            }); 

        } catch (error) {
       
            if (notifyMessageID) {
                api.unsendMessage(notifyMessageID);
            }

            api.sendMessage(`[❗]➜ Đã xảy ra lỗi: ${error.message}. Vui lòng thử lại sau.`, threadID, messageID);
        }
    }
};
