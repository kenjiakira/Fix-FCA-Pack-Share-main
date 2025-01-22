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
        try {
            const { threadID } = event;
            const command = target[0]?.toLowerCase();
            
            let config;
            try {
                config = loadRankConfig();
            } catch (configError) {
                console.error("Error loading rank config:", configError);
                return api.sendMessage("❌ Không thể tải cấu hình rankup.", threadID);
            }
            
            if (!command) {
                const status = config.disabledThreads.includes(threadID) ? 'TẮT' : 'BẬT';
                return api.sendMessage(
                    `Thông báo rankup đang ${status} trong nhóm này\nSử dụng: rankup [on/off]`, 
                    threadID
                );
            }

            if (!['on', 'off'].includes(command)) {
                return api.sendMessage('Sử dụng: rankup [on/off]', threadID);
            }

            try {
                if (command === 'off') {
                    if (!config.disabledThreads.includes(threadID)) {
                        config.disabledThreads.push(threadID);
                    }
                } else {
                    config.disabledThreads = config.disabledThreads.filter(id => id !== threadID);
                }
                
                fs.writeFileSync(rankConfigPath, JSON.stringify(config, null, 2));
                return api.sendMessage(
                    `Đã ${command === 'off' ? 'tắt' : 'bật'} thông báo rankup trong nhóm này`,
                    threadID
                );
            } catch (saveError) {
                console.error("Error saving rank config:", saveError);
                return api.sendMessage("❌ Không thể lưu cấu hình rankup.", threadID);
            }
        } catch (error) {
            console.error("Rankup command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi. Vui lòng thử lại sau.", event.threadID);
        }
    }
};
