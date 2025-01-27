const axios = require('axios');

module.exports = {
    name: "onepiece",
    dev: "HNT",
    info: "Xem thông tin về One Piece",
    usages: "onepiece [character/random]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🏴‍☠️ One Piece Info\n\n" +
                "1. Xem thông tin nhân vật:\n" +
                "→ onepiece character [tên]\n" +
                "VD: onepiece character luffy\n\n" +
                "2. Xem thông tin random:\n" +
                "→ onepiece random\n\n" +
                "3. Tìm kiếm nhân vật:\n" +
                "→ onepiece search [từ khóa]\n" +
                "VD: onepiece search admiral",
                threadID, messageID
            );
        }

        const command = target[0].toLowerCase();
        const query = target.slice(1).join(" ");
        let loadingMsg;

        try {
            loadingMsg = await api.sendMessage("⏳ Đang tải thông tin...", threadID);

            switch (command) {
                case "character": {
                    if (!query) throw new Error("Vui lòng nhập tên nhân vật!");
                    const response = await axios.get(`https://api.api-onepiece.com/v2/characters/en/search/?name=${encodeURIComponent(query)}`);
                    
                    if (!response.data || response.data.length === 0) {
                        throw new Error("Không tìm thấy nhân vật!");
                    }

                    const character = response.data[0];
                    let message = `🏴‍☠️ Thông tin nhân vật:\n\n`;
                    message += `Tên: ${character.name}\n`;
                    message += `Chức vụ: ${character.job || 'Không rõ'}\n`;
                    message += `Chiều cao: ${character.size || 'Không rõ'}\n`;
                    message += `Sinh nhật: ${character.birthday || 'Không rõ'}\n`;
                    message += `Tuổi: ${character.age || 'Không rõ'}\n`;
                    message += `Tiền truy nã: ${character.bounty || 'Không có'}\n`;
                    message += `Trạng thái: ${character.status || 'Không rõ'}\n\n`;

                    if (character.crew) {
                        message += `⛵ Băng hải tặc:\n`;
                        message += `→ Tên: ${character.crew.name}\n`;
                        message += `→ Số thành viên: ${character.crew.number || 'Không rõ'}\n`;
                    }

                    if (character.fruit) {
                        message += `\n🍎 Trái ác quỷ:\n`;
                        message += `→ Tên: ${character.fruit.name}\n`;
                        message += `→ Loại: ${character.fruit.type}\n`;
                        message += `→ Mô tả: ${character.fruit.description || 'Không rõ'}\n`;
                    }

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "random": {
                    const response = await axios.get('https://api.api-onepiece.com/v2/characters/en');
                    const characters = response.data;
                    const randomChar = characters[Math.floor(Math.random() * characters.length)];

                    let message = `🎲 Random One Piece Character:\n\n`;
                    message += `Tên: ${randomChar.name}\n`;
                    message += `Chức vụ: ${randomChar.job || 'Không rõ'}\n`;
                    message += `Chiều cao: ${randomChar.size || 'Không rõ'}\n`;
                    message += `Tiền truy nã: ${randomChar.bounty || 'Không có'}\n`;
                    
                    if (randomChar.crew) {
                        message += `\n⛵ Băng hải tặc: ${randomChar.crew.name}\n`;
                    }
                    
                    if (randomChar.fruit) {
                        message += `🍎 Trái ác quỷ: ${randomChar.fruit.name}\n`;
                    }

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "search": {
                    if (!query) throw new Error("Vui lòng nhập từ khóa tìm kiếm!");
                    const response = await axios.get(`https://api.api-onepiece.com/v2/characters/en/search/?job=${encodeURIComponent(query)}`);
                    
                    if (!response.data || response.data.length === 0) {
                        throw new Error("Không tìm thấy kết quả!");
                    }

                    let message = `🔍 Kết quả tìm kiếm (${response.data.length}):\n\n`;
                    response.data.slice(0, 10).forEach((char, index) => {
                        message += `${index + 1}. ${char.name}\n`;
                        message += `→ Chức vụ: ${char.job || 'Không rõ'}\n`;
                        message += `→ Tiền truy nã: ${char.bounty || 'Không có'}\n\n`;
                    });

                    if (response.data.length > 10) {
                        message += `\n...và ${response.data.length - 10} kết quả khác`;
                    }

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                default:
                    throw new Error("Lệnh không hợp lệ! Gõ 'onepiece' để xem hướng dẫn.");
            }

            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);

        } catch (error) {
            console.error('One Piece Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}`,
                threadID, messageID
            );
        }
    }
};
