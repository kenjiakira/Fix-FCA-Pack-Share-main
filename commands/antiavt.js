const fs = require('fs');
const path = require('path');

module.exports = {
    name: "antiavt",
    dev: "HNT",
    cooldowns: 5,
    usedby: 1,
    info: "Bật/tắt chống đổi ảnh nhóm",
    usages: "on/off",
    onPrefix: true,

    lastApiCall: 0,
    API_COOLDOWN: 2000,

    onLoad: function () {
        const antiimgPath = path.join(__dirname, 'json', 'antiimage.json');
        if (!fs.existsSync(antiimgPath)) {
            fs.writeFileSync(antiimgPath, JSON.stringify({}));
        }
    },

    downloadImage: async function(url, threadID) {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }

        const imagePath = path.join(cacheDir, `thread_${threadID}.jpg`);
        
        try {
            const axios = require('axios');
            const response = await axios.get(url, { responseType: 'stream' });
            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(imagePath));
                writer.on('error', reject);
            });
        } catch (err) {
            console.error('Image download error:', err);
            return null;
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, senderID } = event;
        const antiimgPath = path.join(__dirname, 'json', 'antiimage.json');

        try {
         
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            const isAdminBot = adminConfig.adminUIDs.includes(senderID);
            
            const threadInfo = await api.getThreadInfo(threadID);
            const isGroupAdmin = threadInfo.adminIDs.some(e => e.id == senderID);
            
            if (!isAdminBot && !isGroupAdmin) {
                return api.sendMessage("⚠️ Chỉ Admin bot hoặc Quản trị viên nhóm mới có thể sử dụng lệnh này!", threadID);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            if (!target[0] || !["on", "off"].includes(target[0].toLowerCase())) {
                return api.sendMessage("⚠️ Vui lòng sử dụng on hoặc off!", threadID);
            }

            const isEnable = target[0].toLowerCase() === "on";

            if (isEnable && threadInfo.imageSrc) {
                const imagePath = await this.downloadImage(threadInfo.imageSrc, threadID);
                
                let antiimgData = {};
                if (fs.existsSync(antiimgPath)) {
                    antiimgData = JSON.parse(fs.readFileSync(antiimgPath));
                }

                antiimgData[threadID] = {
                    enable: true,
                    imageUrl: threadInfo.imageSrc,
                    localPath: imagePath,
                    lastUpdate: Date.now()
                };

                fs.writeFileSync(antiimgPath, JSON.stringify(antiimgData, null, 4));
            } else {
                let antiimgData = {};
                if (fs.existsSync(antiimgPath)) {
                    antiimgData = JSON.parse(fs.readFileSync(antiimgPath));
                }
                if (antiimgData[threadID]) {
                    antiimgData[threadID].enable = false;
                    fs.writeFileSync(antiimgPath, JSON.stringify(antiimgData, null, 4));
                }
            }

            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chức năng chống đổi ảnh nhóm!`,
                threadID
            );

        } catch (error) {
            console.error('Antiavt Error:', error);
            return api.sendMessage("❌ Có lỗi xảy ra khi thực hiện lệnh!", threadID);
        }
    }
};
