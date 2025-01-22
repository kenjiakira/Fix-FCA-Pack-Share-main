const fs = require('fs');
const path = require('path');

module.exports = {
    name: "anti",
    dev: "HNT",
    cooldowns: 5,
    info: "Quản lý các tính năng bảo vệ nhóm",
    usages: "<feature> <on/off>",
    onPrefix: true,

    onLoad: function() {
        const features = [
            'antispam', 'antirole', 'antiout', 'antijoin',
            'antinc', 'antiname', 'antiavt', 'antitag'
        ];

        for (const feature of features) {
            const jsonPath = path.join(__dirname, 'json', `${feature}.json`);
            if (!fs.existsSync(jsonPath)) {
                const defaultData = feature === 'antispam' ? 
                    { threads: {}, spamData: {} } : 
                    feature === 'antitag' ? 
                    { threads: {}, tagData: {} } : 
                    {};
                
                fs.writeFileSync(jsonPath, JSON.stringify(defaultData, null, 4));
            }
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const features = {
            spam: { name: 'antispam', icon: '🛡️', desc: 'chống spam tin nhắn', detail: '15 tin nhắn/5 giây' },
            role: { name: 'antirole', icon: '👑', desc: 'chống đổi quyền QTV', detail: 'chỉ admin bot được phép' },
            out: { name: 'antiout', icon: '🚫', desc: 'chống rời nhóm', detail: 'tự thêm lại khi out' },
            join: { name: 'antijoin', icon: '🚷', desc: 'chống thêm thành viên', detail: 'tự kick thành viên mới' },
            nick: { name: 'antinc', icon: '📝', desc: 'chống đổi biệt danh', detail: 'chỉ QTV được phép' },
            name: { name: 'antiname', icon: '✏️', desc: 'chống đổi tên nhóm', detail: 'chỉ QTV được phép' },
            avt: { name: 'antiavt', icon: '🖼️', desc: 'chống đổi ảnh nhóm', detail: 'chỉ QTV được phép' },
            tag: { name: 'antitag', icon: '🏷️', desc: 'chống tag spam', detail: '3 lần/24h' }
        };

        try {
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            const isAdminBot = adminConfig.adminUIDs.includes(senderID);
            
            let isGroupAdmin = false;
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                if (threadInfo && threadInfo.adminIDs) {
                    isGroupAdmin = threadInfo.adminIDs.some(e => e.id == senderID);
                }
            } catch (threadError) {
                console.error("Thread info fetch error:", threadError);
          
                if (!isAdminBot) {
                    return api.sendMessage("⚠️ Không thể kiểm tra quyền quản trị. Chỉ admin bot mới có thể sử dụng lệnh này!", threadID);
                }
            }
            
            if (!isAdminBot && !isGroupAdmin) {
                return api.sendMessage("⚠️ Chỉ Admin bot hoặc Quản trị viên nhóm mới có thể sử dụng lệnh này!", threadID);
            }

            if (!target[0]) {
                let msg = "╭─────────────────╮\n";
                msg += "     📌 ANTI SYSTEM 📌     \n";
                msg += "╰─────────────────╯\n\n";
                
                for (const [key, value] of Object.entries(features)) {
                    const status = this.getFeatureStatus(value.name, threadID);
                    msg += `${value.icon} ${key.toUpperCase()}: ${value.desc}\n`;
                    msg += `↬ Chi tiết: ${value.detail}\n`;
                    msg += `↬ Trạng thái: ${status ? "ON ✅" : "OFF ❌"}\n`;
                    msg += "──────────────────\n";
                }
                
                msg += "\n💡 Hướng dẫn sử dụng:\n";
                msg += "⌲ anti <key> on/off\n";
                msg += "⌲ Ví dụ: anti spam on\n";
                return api.sendMessage(msg, threadID);
            }

            const feature = target[0].toLowerCase();
            const action = target[1]?.toLowerCase();

            if (!Object.keys(features).includes(feature)) {
                return api.sendMessage("⚠️ Tính năng không hợp lệ!", threadID);
            }

            if (!action || !["on", "off"].includes(action)) {
                return api.sendMessage("⚠️ Vui lòng chọn on hoặc off!", threadID);
            }

            const featureName = features[feature].name;
            const isEnable = action === "on";
            
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                await this.updateFeature(featureName, threadID, isEnable, threadInfo || {});
            } catch (updateError) {
                console.error("Update feature error:", updateError);
                await this.updateFeature(featureName, threadID, isEnable, {});
            }

            return api.sendMessage(
                `${features[feature].icon} ${features[feature].desc}\n` +
                `↬ Trạng thái: ${isEnable ? "ON ✅" : "OFF ❌"}\n` +
                `↬ Chi tiết: ${features[feature].detail}`,
                threadID
            );

        } catch (error) {
            console.error(`Anti Feature Error:`, error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh!", threadID);
        }
    },

    getFeatureStatus: function(feature, threadID) {
        try {
            const jsonPath = path.join(__dirname, 'json', `${feature}.json`);
            const data = JSON.parse(fs.readFileSync(jsonPath));
            
            if (feature === 'antiavt') {
                return data[threadID]?.enable || false;
            }
            
            if (feature === 'antiout' || feature === 'antijoin' || feature === 'antiname') {
                if (feature === 'antiname') {
                    return data[threadID]?.enable || false;
                }
                return data[threadID] || false;
            }
            
            return data.threads?.[threadID] || false;
        } catch {
            return false;
        }
    },

    updateFeature: async function(feature, threadID, isEnable, threadInfo) {
        const jsonPath = path.join(__dirname, 'json', `${feature}.json`);
        let data = {};

        try {
            data = JSON.parse(fs.readFileSync(jsonPath));
        } catch {
            data = feature === 'antispam' ? { threads: {}, spamData: {} } :
                   feature === 'antitag' ? { threads: {}, tagData: {} } : {};
        }

        switch (feature) {
            case 'antiout':
            case 'antijoin':
                data[threadID] = isEnable;
                break;

            case 'antiname':
                data[threadID] = {
                    enable: isEnable,
                    name: threadInfo.threadName,
                    lastUpdate: Date.now()
                };
                break;

            case 'antiavt':
                if (isEnable && threadInfo.imageSrc) {
                    const imagePath = await this.downloadImage(threadInfo.imageSrc, threadID);
                    data[threadID] = {
                        enable: true,
                        imageUrl: threadInfo.imageSrc,
                        localPath: imagePath,
                        lastUpdate: Date.now()
                    };
                } else {
                    data[threadID] = { enable: false };
                }
                break;

            default:
                if (!data.threads) data.threads = {};
                data.threads[threadID] = isEnable;
        }

        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4));
    },

    downloadImage: async function(url, threadID) {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }

        const imagePath = path.join(cacheDir, `thread_${threadID}.jpg`);
        
        try {
            const axios = require('axios');
            const response = await axios.get(url, { responseType: 'stream' });
            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(imagePath));
                writer.on('error', reject);
            });
        } catch (err) {
            console.error('Image download error:', err);
            return null;
        }
    }
};
