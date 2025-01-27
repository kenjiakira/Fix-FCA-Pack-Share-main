const axios = require('axios');

module.exports = {
    name: "genshin",
    dev: "HNT",
    info: "Xem thông tin về Genshin Impact",
    usages: "genshin [character/search/voices]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "⚔️ Genshin Impact Info\n\n" +
                "1. Xem thông tin nhân vật:\n" +
                "→ genshin character [tên]\n" +
                "VD: genshin character amber\n\n" +
                "2. Tìm kiếm nhân vật:\n" +
                "→ genshin search [option] [từ khóa]\n" +
                "Options: name, region, vision, rarity, weapon\n" +
                "VD: genshin search vision pyro\n\n" +
                "3. Xem thoại của nhân vật:\n" +
                "→ genshin voices [ID]\n" +
                "VD: genshin voices 1\n\n" +
                "4. Xem random nhân vật:\n" +
                "→ genshin random",
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
                    const response = await axios.get(`https://gsi.fly.dev/characters/search?name=${encodeURIComponent(query)}`);
                    
                    if (!response.data?.results || response.data.results.length === 0) {
                        throw new Error("Không tìm thấy nhân vật!");
                    }

                    const character = response.data.results[0];
                    let message = `⚔️ Thông tin nhân vật:\n\n`;
                    message += `Tên: ${character.name}\n`;
                    message += `Độ hiếm: ${character.rarity.replace('_star', '⭐')}\n`;
                    message += `Vũ khí: ${character.weapon}\n`;
                    message += `Vision: ${character.vision}\n`;
                    message += `Wiki: ${character.wiki_url}\n`;

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "search": {
                    if (!target[1] || !target[2]) throw new Error("Vui lòng nhập đúng cú pháp!\ngenshin search [option] [từ khóa]");
                    
                    const option = target[1].toLowerCase();
                    const searchQuery = target.slice(2).join(" ");
                    const validOptions = ['name', 'region', 'vision', 'rarity', 'weapon'];
                    
                    if (!validOptions.includes(option)) {
                        throw new Error(`Option không hợp lệ! Các option có thể dùng: ${validOptions.join(', ')}`);
                    }

                    const response = await axios.get(`https://gsi.fly.dev/characters/search?${option}=${encodeURIComponent(searchQuery)}`);
                    
                    if (!response.data?.results || response.data.results.length === 0) {
                        throw new Error("Không tìm thấy kết quả!");
                    }

                    let message = `🔍 Kết quả tìm kiếm (${response.data.results.length}):\n\n`;
                    response.data.results.forEach((char, index) => {
                        message += `${index + 1}. ${char.name}\n`;
                        message += `→ Vision: ${char.vision}\n`;
                        message += `→ Weapon: ${char.weapon}\n`;
                        message += `→ Rarity: ${char.rarity.replace('_star', '⭐')}\n\n`;
                    });

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "voices": {
                    if (!query) throw new Error("Vui lòng nhập ID nhân vật!");
                    const response = await axios.get(`https://gsi.fly.dev/characters/${query}/voices`);
                    
                    if (!response.data?.results || response.data.results.length === 0) {
                        throw new Error("Không tìm thấy thoại của nhân vật này!");
                    }

                    let message = `🎭 Thoại của nhân vật ${response.data.results[0].spoken_by.name}:\n\n`;
                    response.data.results.slice(0, 10).forEach((voice, index) => {
                        message += `${index + 1}. ${voice.title}\n`;
                        if (voice.requirement) message += `→ Yêu cầu: ${voice.requirement}\n`;
                        message += `→ Nội dung: ${voice.details[0]}\n\n`;
                    });

                    message += `\nHiển thị 10/${response.data.results.length} thoại`;
                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "random": {
                    const response = await axios.get('https://gsi.fly.dev/characters');
                    const characters = response.data.results;
                    const randomChar = characters[Math.floor(Math.random() * characters.length)];

                    let message = `🎲 Random Genshin Character:\n\n`;
                    message += `Tên: ${randomChar.name}\n`;
                    message += `Độ hiếm: ${randomChar.rarity.replace('_star', '⭐')}\n`;
                    message += `Vũ khí: ${randomChar.weapon}\n`;
                    message += `Vision: ${randomChar.vision}\n`;
                    message += `Wiki: ${randomChar.wiki_url}\n`;

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                default:
                    throw new Error("Lệnh không hợp lệ! Gõ 'genshin' để xem hướng dẫn.");
            }

            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);

        } catch (error) {
            console.error('Genshin Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message || 'Không thể kết nối với API'}`,
                threadID, messageID
            );
        }
    }
};
