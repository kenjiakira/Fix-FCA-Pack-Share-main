const { createReadStream, writeFileSync, unlinkSync } = require('fs-extra');
const axios = require('axios');
const url = require('url');  

module.exports = {
    name: "cap",
    dev: "Mirai Team",
    onPrefix: true,
    category: "Tiện Ích",
    nickName: ["screenshot"],
    usedby: 0,
    info: "Screenshot một trang web nào đó",
    usages: ".cap <url>",
    cooldowns: 0,

    onLaunch: async function({ event, api, target }) {
        const { threadID, messageID } = event;
        
        if (!target || !target[0]) {
            return api.sendMessage(
                "📸 Hướng dẫn sử dụng:\n\n" +
                "Cú pháp: .cap <url>\n" +
                "Ví dụ: .cap https://google.com\n\n" +
                "⚠️ Lưu ý: URL phải bắt đầu bằng http:// hoặc https://", 
                threadID, 
                messageID
            );
        }

        const urlToCapture = target[0];

        try {
            const parsedUrl = url.parse(urlToCapture);
            if (!parsedUrl.protocol || !parsedUrl.host) {
                return api.sendMessage(
                    "❌ URL không hợp lệ!\n" +
                    "URL phải có định dạng: http://example.com hoặc https://example.com", 
                    threadID, 
                    messageID
                );
            }

            const path = __dirname + `/cache/${event.threadID}-${event.senderID}s.png`;
            
            const response = await axios({
                method: 'GET',
                url: `https://image.thum.io/get/width/1920/crop/400/fullpage/noanimate/${urlToCapture}`,
                responseType: 'arraybuffer'
            });

            writeFileSync(path, Buffer.from(response.data, 'binary'));

            await api.sendMessage(
                {
                    body: "🖼️ Ảnh chụp màn hình của trang web:",
                    attachment: createReadStream(path)
                }, 
                threadID, 
                () => unlinkSync(path)
            );

        } catch (error) {
            console.error("Screenshot error:", error);
            return api.sendMessage(
                "❌ Không thể chụp ảnh trang web này.\n" +
                "Vui lòng kiểm tra lại URL hoặc thử lại sau.", 
                threadID, 
                messageID
            );
        }
    }
};