const fs = require('fs');
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));

module.exports = {
    name: 'prefix',
    ver: '1.0',
    prog: 'Jonell Magallanes, HNT',

    onEvents: async function ({ api, event }) {
        if (event.type === 'message') {
            const message = event.body.toLowerCase().trim();
            const threadID = event.threadID;

            if (message.startsWith(`prefix`) || message.startsWith(`dấu lệnh`) || message.startsWith(`prefix là gì`) || message.startsWith(`dấu lệnh là gì`)) {
                
                const prefixPath = './database/threadPrefix.json';
                let threadPrefix = adminConfig.prefix;
                
                try {
                    if (fs.existsSync(prefixPath)) {
                        const threadPrefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
                        if (threadPrefixes[threadID]) {
                            threadPrefix = threadPrefixes[threadID];
                        }
                    }
                } catch (err) {
                    console.error("Error loading thread prefix:", err);
                }

                const response = `⚡️Prefix của nhóm: ${threadPrefix}\n━━━━━━━━━━━━━━━━━━\n👉 Prefix mặc định: ${adminConfig.prefix}\n⚡️Để xem danh sách lệnh, dùng: ${threadPrefix}help\n📝 Để đổi prefix nhóm, dùng: ${threadPrefix}setprefix`;
                api.sendMessage(response, event.threadID);
            }
        }
    }
};
