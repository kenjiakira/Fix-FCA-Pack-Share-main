const fs = require('fs');
const path = require('path');

const vipDataPath = path.join(__dirname, './json/vip.json');

function loadVipData() {
    try {
        if (!fs.existsSync(vipDataPath)) {
            const defaultData = { users: {} };
            fs.writeFileSync(vipDataPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(vipDataPath, 'utf8'));
    } catch (error) {
        console.error('Error loading VIP data:', error);
        return { users: {} };
    }
}

function saveVipData(data) {
    try {
        fs.writeFileSync(vipDataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving VIP data:', error);
    }
}

const { updateBalance } = require('../utils/currencies');

const VIP_REWARDS = {
    1: {
        name: "VIP BRONZE"
    },
    2: {
        name: "VIP SILVER" 
    },
    3: {
        name: "VIP GOLD"
    }
};

module.exports = {
    name: "setvip",
    dev: "HNT",
    info: "Quản lý người dùng VIP",
    onPrefix: true,
    usages: [
        "setvip set [@tag/reply/ID] [1/2/3] - Set VIP cho người dùng",
        "setvip check [@tag/reply/ID] - Kiểm tra VIP của người dùng",
        "setvip remove [@tag/reply/ID] - Xóa VIP của người dùng"
    ].join('\n'),
    cooldowns: 0,
    usedby: 2,
    hide: true,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, mentions, messageReply } = event;
        
        if (!target[0]) {
            return api.sendMessage(this.usages, threadID, messageID);
        }

        let userID;
        const action = target[0].toLowerCase();

        if (Object.keys(mentions).length > 0) {
            userID = Object.keys(mentions)[0];
        } else if (messageReply) {
            userID = messageReply.senderID;
        } else if (target[1]) {
            userID = target[1];
        }

        if (!userID) {
            return api.sendMessage("❌ Vui lòng tag người dùng, reply tin nhắn hoặc nhập ID!", threadID, messageID);
        }

        const vipData = loadVipData();
        if (!vipData.users) vipData.users = {};

        switch (action) {
            case "set": {
                const packageId = parseInt(target[target.length - 1]);
                if (![1, 2, 3].includes(packageId)) {
                    return api.sendMessage("❌ Gói VIP không hợp lệ! (1: Bronze, 2: Silver, 3: Gold)", threadID, messageID);
                }

                const vipPackage = VIP_REWARDS[packageId];
          
                const duration = packageId === 3 ? 37 : 30; 
                
                vipData.users[userID] = {
                    packageId: packageId,
                    name: vipPackage.name,
                    expireTime: Date.now() + (duration * 24 * 60 * 60 * 1000),
                    benefits: getBenefits(packageId)
                };

                try {
                    saveVipData(vipData);

                    const durationText = packageId === 3 ? "37 ngày (30+7 bonus)" : "30 ngày";
                    return api.sendMessage(
                        `✅ Đã set ${vipPackage.name} cho ID: ${userID}\n` +
                        `⏳ Thời hạn: ${durationText}\n` +
                        `📅 Hết hạn: ${new Date(vipData.users[userID].expireTime).toLocaleString('vi-VN')}`,
                        threadID, messageID
                    );
                } catch (error) {
                    console.error("Error setting VIP:", error);
                    return api.sendMessage(
                        `❌ Có lỗi xảy ra khi set VIP!`,
                        threadID, messageID
                    );
                }
            }

            case "check": {
                const userData = vipData.users[userID];
                if (!userData) {
                    return api.sendMessage("❌ Người dùng không có gói VIP nào!", threadID, messageID);
                }

                const timeLeft = userData.expireTime - Date.now();
                const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));

                return api.sendMessage(
                    `👑 Thông tin VIP của ID: ${userID}\n` +
                    `📋 Gói: ${userData.name}\n` +
                    `⏳ Còn lại: ${daysLeft} ngày\n` +
                    `📅 Hết hạn: ${new Date(userData.expireTime).toLocaleString('vi-VN')}`,
                    threadID, messageID
                );
            }

            case "remove": {
                if (!vipData.users[userID]) {
                    return api.sendMessage("❌ Người dùng không có gói VIP nào!", threadID, messageID);
                }

                delete vipData.users[userID];
                saveVipData(vipData);

                return api.sendMessage(`✅ Đã xóa VIP của ID: ${userID}`, threadID, messageID);
            }

            default:
                return api.sendMessage("❌ Lệnh không hợp lệ!\n" + this.usages, threadID, messageID);
        }
    }
};

function getBenefits(packageId) {
    const packageNames = {
        3: "VIP GOLD ⭐⭐⭐",
        2: "VIP SILVER ⭐⭐",
        1: "VIP BRONZE ⭐"
    };

    switch (packageId) {
        case 3: // GOLD
            return {
                workBonus: 40,
                cooldownReduction: 30,
                dailyBonus: true,
                fishingCooldown: 120000, 
                fishExpMultiplier: 4, 
                packageId: 3,
                name: packageNames[3],
                rareBonus: 0.3,
                trashReduction: 0.6
            };
        case 2: // SILVER
            return {
                workBonus: 20,
                cooldownReduction: 20,
                dailyBonus: true,
                fishingCooldown: 240000, 
                fishExpMultiplier: 3, 
                packageId: 2,
                name: packageNames[2],
                rareBonus: 0.2,
                trashReduction: 0.4
            };
        case 1: // BRONZE
            return {
                workBonus: 10,
                cooldownReduction: 10,
                dailyBonus: true,
                fishingCooldown: 300000,
                fishExpMultiplier: 2, 
                packageId: 1,
                name: packageNames[1],
                rareBonus: 0.1,
                trashReduction: 0.2
            };
        default:z
            return {
                workBonus: 0,
                cooldownReduction: 0,
                dailyBonus: false,
                fishingCooldown: 360000,
                fishExpMultiplier: 1,
                packageId: 0,
                name: "No VIP",
                rareBonus: 0,
                trashReduction: 0
            };
    }
}
