const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const imgurClientId = '34dc774b8c0ddae';
const customizationPath = path.join(__dirname, '../database/json/rankCustomization.json');

function loadCustomization() {
    if (!fs.existsSync(customizationPath)) {
        fs.writeFileSync(customizationPath, JSON.stringify({
            backgrounds: {},
            frames: {},
            avatars: {}
        }, null, 2));
    }
    return JSON.parse(fs.readFileSync(customizationPath));
}

function saveCustomization(data) {
    fs.writeFileSync(customizationPath, JSON.stringify(data, null, 2));
}

async function uploadToImgur(filePath) {
    try {
        const form = new FormData();
        form.append('image', fs.createReadStream(filePath));

        const response = await axios.post('https://api.imgur.com/3/image', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Client-ID ${imgurClientId}`
            }
        });

        return response.data.data.link;
    } catch (error) {
        console.error('Imgur upload error:', error);
        throw error;
    }
}

module.exports = {
    name: 'rankset',
    info: 'Tùy chỉnh thẻ xếp hạng của bạn',
    dev: 'HNT',
    usedby: 0,
    onPrefix: true,
    dmUser: true,
    usages: 'Reply ảnh hoặc gửi link với từ khóa: background/frame/avatar hoặc reset để xóa tùy chỉnh',
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, messageReply } = event;
        const keyword = target[0]?.toLowerCase();
        const imageUrl = target[1];

        if (keyword === 'reset') {
            const customization = loadCustomization();
            let changed = false;

            if (customization.backgrounds[event.senderID]) {
                delete customization.backgrounds[event.senderID];
                changed = true;
            }
            if (customization.frames[event.senderID]) {
                delete customization.frames[event.senderID];
                changed = true;
            }
            if (customization.avatars[event.senderID]) {
                delete customization.avatars[event.senderID];
                changed = true;
            }

            if (changed) {
                saveCustomization(customization);
                return api.sendMessage('✅ Đã xóa tất cả tùy chỉnh thẻ rank của bạn.', threadID, messageID);
            } else {
                return api.sendMessage('❌ Bạn chưa có tùy chỉnh nào để xóa.', threadID, messageID);
            }
        }

        if (keyword && (keyword === 'background' || keyword === 'frame' || keyword === 'avatar') && imageUrl) {
            if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i)) {
                return api.sendMessage('❌ Link ảnh không hợp lệ!', threadID, messageID);
            }

            try {
                const imgResponse = await axios.get(imageUrl, { responseType: 'stream' });
                const tempPath = path.join(__dirname, 'cache', `temp_${Date.now()}.jpg`);
                const writer = fs.createWriteStream(tempPath);
                
                imgResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const imgurUrl = await uploadToImgur(tempPath);

                const customization = loadCustomization();
                const typeKey = keyword === 'background' ? 'backgrounds' : 
                                keyword === 'frame' ? 'frames' : 'avatars';
                customization[typeKey][event.senderID] = imgurUrl;
                saveCustomization(customization);

                fs.unlinkSync(tempPath);

                return api.sendMessage(
                    `✅ Đã cập nhật ${keyword} của bạn thành công!\n` +
                    '👉 Dùng lệnh rank để xem kết quả.',
                    threadID, messageID
                );

            } catch (error) {
                console.error('Error processing image URL:', error);
                return api.sendMessage('❌ Không thể tải ảnh từ link. Vui lòng thử link khác.', threadID, messageID);
            }
        }

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage(
                '📝 Hướng dẫn sử dụng setrank:\n\n' +
                '1. Reply ảnh với từ khóa:\n' +
                '   - background: Đặt hình nền\n' +
                '   - frame: Đặt khung viền\n' +
                '   - avatar: Đặt avatar tùy chỉnh\n\n' +
                '2. Hoặc dùng link ảnh:\n' +
                '   - setrank background [link]\n' +
                '   - setrank frame [link]\n' +
                '   - setrank avatar [link]\n\n' +
                '3. Xóa tùy chỉnh:\n' +
                '   - setrank reset\n\n' +
                '👉 Sau khi cài đặt, dùng lệnh rank để xem kết quả!',
                threadID, messageID
            );
        }

        if (!keyword || (keyword !== 'background' && keyword !== 'frame' && keyword !== 'avatar')) {
            return api.sendMessage(
                '❌ Vui lòng chọn loại tùy chỉnh:\n' +
                '- background: Đặt hình nền\n' +
                '- frame: Đặt khung viền\n' +
                '- avatar: Đặt avatar tùy chỉnh',
                threadID, messageID
            );
        }

        const attachment = messageReply.attachments.find(att => att.type === 'photo');
        if (!attachment) {
            return api.sendMessage('❌ Vui lòng reply một ảnh để cài đặt.', threadID, messageID);
        }

        try {
            const tempPath = path.join(__dirname, 'cache', `temp_${Date.now()}.jpg`);
            const imgResponse = await axios({
                url: attachment.url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(tempPath);
            imgResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const imgurUrl = await uploadToImgur(tempPath);

            const customization = loadCustomization();
            const typeKey = keyword === 'background' ? 'backgrounds' : 
                            keyword === 'frame' ? 'frames' : 'avatars';
            customization[typeKey][event.senderID] = imgurUrl;
            saveCustomization(customization);

            fs.unlinkSync(tempPath);

            return api.sendMessage(
                `✅ Đã cập nhật ${keyword} của bạn thành công!\n` +
                '👉 Dùng lệnh rank để xem kết quả.',
                threadID, messageID
            );

        } catch (error) {
            console.error('Error processing image:', error);
            return api.sendMessage('❌ Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại sau.', threadID, messageID);
        }
    }
};
