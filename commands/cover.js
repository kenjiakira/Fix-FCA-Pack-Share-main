const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "cover",
    dev: "HNT",
    category: "Image",
    info: "Tạo ảnh bìa Facebook",
    onPrefix: true,
    usages: "cover [kiểu] [thông tin]",
    cooldowns: 30,

    coverTypes: {
        1: {
            url: 'http://87.106.100.187:6312/canvas/fbcoverv5',
            params: ['name', 'id', 'subname', 'color'],
            example: '.cover 1 HNT | 4 | Bot | blue'
        },
        2: {
            url: 'http://87.106.100.187:6312/canvas/fbcoverv4',
            params: ['name', 'id', 'subname', 'colorname', 'colorsub'],
            example: '.cover 2 HNT | 2 | Bot | blue | red'
        },
        3: {
            url: 'http://87.106.100.187:6312/canvas/fbcoverv3',
            params: ['name', 'gender', 'birthday', 'love', 'location', 'hometown'],
            example: '.cover 3 HNT | Male | 14/05 | Single | HN | HN'
        },
        4: {
            url: 'http://87.106.100.187:6312/canvas/fbcoverv6',
            params: ['name', 'gender', 'birthday', 'love', 'location', 'hometown'],
            example: '.cover 4 HNT | Male | 14/05 | Single | HN | HN'
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        try {
            if (target.length < 1) {
                return api.sendMessage(
                    "『 FACEBOOK COVER 』\n\n" +
                    "📌 Các kiểu cover:\n" +
                    "1. Cover đơn giản (tên, id, phụ đề, màu)\n" +
                    "2. Cover 2 màu (tên, id, phụ đề, màu tên, màu phụ đề)\n" +
                    "3. Cover info 1 (thông tin cá nhân)\n" +
                    "4. Cover info 2 (thông tin + thống kê)\n\n" +
                    "Cách dùng: .cover [số] [thông tin]\n\n" +
                    "Ví dụ:\n" +
                    Object.entries(this.coverTypes)
                        .map(([k, v]) => `${k}. ${v.example}`)
                        .join('\n'),
                    threadID, messageID
                );
            }

            const coverType = parseInt(target[0]);
            if (!this.coverTypes[coverType]) {
                return api.sendMessage("❌ Kiểu cover không hợp lệ!", threadID, messageID);
            }

            const coverConfig = this.coverTypes[coverType];
            const params = {};

            if (target.length > 1) {
                const info = target.slice(1).join(' ').split('|').map(s => s.trim());
                coverConfig.params.forEach((param, index) => {
                    params[param] = info[index] || '';
                });
            }

            // Add default/required params
            if ([3, 4].includes(coverType)) {
                params.uid = senderID;
                params.follower = Math.floor(Math.random() * 999999).toLocaleString();
                
                if (!params.name) {
                    const userInfo = await api.getUserInfo(senderID);
                    params.name = userInfo[senderID]?.name || "Unknown";
                }
            }

            const url = `${coverConfig.url}?${new URLSearchParams(params)}`;

            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            const tempPath = path.join(tempDir, `cover_${senderID}.png`);
            fs.writeFileSync(tempPath, response.data);

            await api.sendMessage({
                body: `🎨 Ảnh bìa kiểu ${coverType} của bạn đây`,
                attachment: fs.createReadStream(tempPath)
            }, threadID, messageID);

            // Cleanup
            fs.unlinkSync(tempPath);

        } catch (error) {
            console.error('Cover generation error:', error);
            return api.sendMessage(
                "❌ Đã xảy ra lỗi! Vui lòng thử lại với cú pháp:\n" +
                ".cover [số] [thông tin]\n" +
                "Ví dụ: " + this.coverTypes[1].example,
                threadID, messageID
            );
        }
    }
};
