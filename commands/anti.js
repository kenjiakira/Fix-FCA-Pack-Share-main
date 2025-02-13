const fs = require('fs');
const path = require('path');

module.exports = {
    name: "anti",
    dev: "HNT",
    usedby: 1,
    cooldowns: 5,
    info: "Quản lý các tính năng bảo vệ nhóm",
    usages: [
        "/anti spam on - Bật tính năng chống spam",
        "/anti spam off - Tắt tính năng chống spam",
        "/anti role on - Bật tính năng chống đổi quyền QTV",
        "/anti role off - Tắt tính năng chống đổi quyền QTV",
        "/anti out on - Bật tính năng chống rời nhóm",
        "/anti out off - Tắt tính năng chống rời nhóm",
        "/anti join on - Bật tính năng chống thêm thành viên",
        "/anti join off - Tắt tính năng chống thêm thành viên"
    ],
    onPrefix: true,

    features: {
        spam: { 
            name: 'antispam', 
            icon: '🛡️', 
            desc: 'chống spam tin nhắn', 
            detail: '15 tin nhắn/5 giây',
            defaultData: { threads: {}, spamData: {} }
        },
        role: { 
            name: 'antirole', 
            icon: '👑', 
            desc: 'chống đổi quyền QTV', 
            detail: 'chỉ admin bot được phép' 
        },
        out: { 
            name: 'antiout', 
            icon: '🚫', 
            desc: 'chống rời nhóm', 
            detail: 'tự thêm lại khi out' 
        },
        join: { 
            name: 'antijoin', 
            icon: '🚷', 
            desc: 'chống thêm thành viên', 
            detail: 'tự kick thành viên mới' 
        },
        nick: { 
            name: 'antinc', 
            icon: '📝', 
            desc: 'chống đổi biệt danh', 
            detail: 'chỉ QTV được phép' 
        },
        name: { 
            name: 'antiname', 
            icon: '✏️', 
            desc: 'chống đổi tên nhóm', 
            detail: 'chỉ QTV được phép' 
        },
        avt: { 
            name: 'antiavt', 
            icon: '🖼️', 
            desc: 'chống đổi ảnh nhóm', 
            detail: 'chỉ QTV được phép' 
        },
        tag: { 
            name: 'antitag', 
            icon: '🏷️', 
            desc: 'chống tag spam', 
            detail: '3 lần/24h',
            defaultData: { threads: {}, tagData: {} }
        }
    },

    onLoad: function() {
        const antiDir = path.join(__dirname, './json/anti');
        if (!fs.existsSync(antiDir)) {
            fs.mkdirSync(antiDir, { recursive: true });
        }

        Object.values(this.features).forEach(feature => {
            const jsonPath = path.join(antiDir, `${feature.name}.json`);
            if (!fs.existsSync(jsonPath)) {
                fs.writeFileSync(
                    jsonPath, 
                    JSON.stringify(feature.defaultData || {}, null, 4)
                );
            }
        });
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        
        try {
            const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8")) || {};
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            
            const isAdminBot = adminConfig.adminUIDs.includes(senderID);
            const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(admin => 
                admin.id === senderID || admin === senderID
            );

            if (!isAdminBot && !isGroupAdmin) {
                return api.sendMessage("⚠️ Chỉ Admin bot hoặc Quản trị viên nhóm mới có thể sử dụng lệnh này!", threadID);
            }

            if (!target[0]) {
                let msg = "╭─────────────────╮\n";
                msg += "     📌 ANTI SYSTEM 📌     \n";
                msg += "╰─────────────────╯\n\n";
                
                Object.entries(this.features).forEach(([key, value]) => {
                    const status = this.getFeatureStatus(value.name, threadID);
                    msg += `${value.icon} ${key.toUpperCase()}: ${value.desc}\n`;
                    msg += `↬ Chi tiết: ${value.detail}\n`;
                    msg += `↬ Trạng thái: ${status ? "ON ✅" : "OFF ❌"}\n`;
                    msg += "──────────────────\n";
                });
                
                msg += "\n💡 Hướng dẫn sử dụng:\n";
                msg += "⌲ anti <tính năng> on/off\n";
                msg += "⌲ Ví dụ: anti spam on\n";
                return api.sendMessage(msg, threadID);
            }

            const feature = target[0].toLowerCase();
            const action = target[1]?.toLowerCase();

            if (feature === 'all' || feature.includes(' ')) {
                const featureList = feature === 'all' ? 
                    Object.keys(this.features) : 
                    feature.split(' ').filter(f => this.features[f]);

                if (!action || !["on", "off"].includes(action)) {
                    return api.sendMessage("⚠️ Vui lòng sử dụng: anti all on/off hoặc anti spam avt on/off", threadID);
                }

                const isEnable = action === "on";
                let updatedFeatures = [];

                for (const feat of featureList) {
                    const featureConfig = this.features[feat];
                    try {
                        const threadInfo = await api.getThreadInfo(threadID);
                        await this.updateFeature(featureConfig.name, threadID, isEnable, threadInfo || {});
                        updatedFeatures.push(featureConfig.desc);
                    } catch (error) {
                        console.error(`Anti ${feat} update error:`, error);
                        await this.updateFeature(featureConfig.name, threadID, isEnable, {});
                    }
                }

                return api.sendMessage(
                    `✅ Đã ${isEnable ? 'bật' : 'tắt'} các tính năng bảo vệ:\n${updatedFeatures.map(desc => `• ${desc}`).join('\n')}`,
                    threadID
                );
            }

            if (!this.features[feature]) {
                return api.sendMessage("⚠️ Tính năng không hợp lệ!", threadID);
            }

            if (!action || !["on", "off"].includes(action)) {
                return api.sendMessage("⚠️ Vui lòng chọn on hoặc off!", threadID);
            }

            const featureConfig = this.features[feature];
            const isEnable = action === "on";
            
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                await this.updateFeature(featureConfig.name, threadID, isEnable, threadInfo || {});
            } catch (error) {
                console.error(`Anti ${feature} update error:`, error);
                await this.updateFeature(featureConfig.name, threadID, isEnable, {});
            }

            return api.sendMessage(
                `${featureConfig.icon} ${featureConfig.desc}\n` +
                `↬ Trạng thái: ${isEnable ? "ON ✅" : "OFF ❌"}\n` +
                `↬ Chi tiết: ${featureConfig.detail}`,
                threadID
            );

        } catch (error) {
            console.error(`Anti command error:`, error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh!", threadID);
        }
    },

    getFeatureStatus: function(feature, threadID) {
        try {
            const jsonPath = path.join(__dirname, 'json', 'anti', `${feature}.json`);
            const data = JSON.parse(fs.readFileSync(jsonPath));
                    lastUpdate: Date.now()
            
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
        const jsonPath = path.join(__dirname, 'json', 'anti', `${feature}.json`);
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
                    data[threadID] = {                        enable: true,
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