const fs = require('fs');
const path = require('path');
const axios = require('axios');

const shortcutDataPath = path.join(__dirname, '../commands/json/shortcuts.json');
let shortcuts = {};

const loadShortcuts = () => {
    try {
        const data = fs.readFileSync(shortcutDataPath, 'utf8');
        shortcuts = JSON.parse(data);
    } catch (error) {
        console.error('Error loading shortcuts:', error);
        shortcuts = {};
    }
};

module.exports = {
    name: "shortcutEvent",
    version: "1.0",
    author: "HNT",
    
    onStart: function() {
        loadShortcuts();
        setInterval(loadShortcuts, 5000);
    },

    onEvents: async function({ api, event }) {
        const { threadID, messageID, body } = event;
        if (!body || event.type !== "message") return;

        loadShortcuts();

        const keyword = body.toLowerCase().replace(/\s+/g, ' ').trim();
        const shortcut = shortcuts[threadID]?.[keyword];

        if (shortcut) {
            if (shortcut.type === 'image') {
                try {
                    const response = await axios.get(shortcut.response, { responseType: 'stream' });
                    api.sendMessage(
                        {
                            attachment: response.data
                        },
                        threadID, messageID
                    );
                } catch (error) {
                    api.sendMessage("❌ Không thể tải hình ảnh. Link có thể đã hết hạn.", threadID, messageID);
                }
            } else {
                api.sendMessage(shortcut.response, threadID, messageID);
            }
        }
    }
};
