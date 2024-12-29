const axios = require('axios');

module.exports = {
    name: "check",
    usedby: 0,
    info: "Lấy thông tin từ URL.",
    onPrefix: true,
    dev: "Jonell Magallanes",
    cooldowns: 3,
    dmUser: false,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage("Vui lòng cung cấp một URL để kiểm tra.", threadID, messageID);
        }

        const url = target[0];
        const checking = await api.sendMessage("Đang kiểm tra.....", event.threadID, event.messageID);
        try {
            const response = await axios.get(`https://joncll.serv00.net/checker.php?url=${url}`);
            const data = response.data;

            const statusCode = data.status_code;
            const headers = data.headers;
            const ipAddress = data.ip_address;

            let emoji;
            if (statusCode === "200") {
                emoji = "🟢"; 
            } else if (statusCode.startsWith("4") || statusCode.startsWith("5")) {
                emoji = "🔴"; 
            } else {
                emoji = "🟠"; 
            }

            const message = `
                ${emoji} Mã trạng thái: ${statusCode}
                🌐 Địa chỉ IP: ${ipAddress}
                📭 Tiêu đề:
                ${Object.entries(headers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
            `;

            api.editMessage(message, checking.messageID, threadID, messageID);
        } catch (error) {
            console.error(error);
            api.sendMessage(error.message, threadID, messageID);
        }
    }
};
