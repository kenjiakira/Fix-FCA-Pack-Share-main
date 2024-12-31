const fs = require('fs');
const path = require('path');

const rankConfigPath = path.join(__dirname, '../database/json/rankConfig.json');

function loadRankConfig() {
    if (!fs.existsSync(rankConfigPath)) {
        fs.writeFileSync(rankConfigPath, JSON.stringify({ disabledThreads: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(rankConfigPath));
}

module.exports = {
    name: "rankup",
    nickName: ["rupconfig", "rankup"],
    info: "Bật/tắt thông báo rankup trong nhóm",
    usage: "[on/off]",
    dev: "HNT",
    usedby: 0,
    cooldown: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const command = target[0]?.toLowerCase();
        
        if (!command) {
            const config = loadRankConfig();
            const status = config.disabledThreads.includes(event.threadID) ? 'TẮT' : 'BẬT';
            return api.sendMessage(`Thông báo rankup đang ${status} trong nhóm này\nSử dụng: rankup [on/off]`, event.threadID);
        }

        if (!['on', 'off'].includes(command)) {
            return api.sendMessage('Sử dụng: rankup [on/off]', event.threadID);
        }

        const config = loadRankConfig();
        
        if (command === 'off') {
            if (!config.disabledThreads.includes(event.threadID)) {
                config.disabledThreads.push(event.threadID);
            }
            fs.writeFileSync(rankConfigPath, JSON.stringify(config, null, 2));
            api.sendMessage('Đã tắt thông báo rankup trong nhóm này', event.threadID);
        } else {
            config.disabledThreads = config.disabledThreads.filter(id => id !== event.threadID);
            fs.writeFileSync(rankConfigPath, JSON.stringify(config, null, 2));
            api.sendMessage('Đã bật thông báo rankup trong nhóm này', event.threadID);
        }
    }
};
