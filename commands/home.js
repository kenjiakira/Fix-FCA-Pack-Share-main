const HomeSystem = require('../family/HomeSystem');
const FamilySystem = require('../family/FamilySystem');
const { HOME_PRICES, HOME_UPGRADES } = require('../config/familyConfig');
const { getBalance } = require('../utils/currencies');
const axios = require('axios');

const homeImages = {
    'h1': 'https://imgur.com/QQSDzLV.png', // Nhà trọ
    'h2': 'https://imgur.com/a/a59HsVH.png', // Căn hộ cho thuê
    'h3': 'https://imgur.com/pvhsfzH.png', // Nhà cấp 4
    'h4': 'https://imgur.com/DucqpmM.png', // Nhà phố
    'h5': 'https://imgur.com/9UIy8OI.png', // Biệt thự
    'h6': 'https://imgur.com/URZlIJd.png'  // Khu compound
};

function formatNumber(number) {
    if (number === undefined || number === null) return "0";
    const roundedNumber = Math.floor(number);
    return roundedNumber.toLocaleString('vi-VN');
}

const homeSystem = new HomeSystem();
const familySystem = new FamilySystem();

module.exports = {
    name: "home",
    dev: "HNT",
    usedby: 0,
    info: "Quản lý nhà ở cho Family",
    onPrefix: true,
    usages: ".home [buy/sell/info/repair/upgrade]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const command = target[0]?.toLowerCase();

        try {
            let home = homeSystem.getHome(senderID);
            if (!home) {
                home = familySystem.getSharedHome(senderID);
            }

            if (!command) {
                return api.sendMessage(
                    "🏠 QUẢN LÝ NHÀ Ở 🏠\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "1. buy [mã] - Mua/thuê nhà\n" +
                    "2. sell - Bán nhà\n" +
                    "3. info - Xem thông tin nhà\n" +
                    "4. list - Xem danh sách nhà\n" +
                    "5. repair - Bảo trì nhà\n" +
                    "6. upgrade [mã] - Nâng cấp nhà\n\n" +
                    "💡 Dùng .home không kèm tham số để xem menu này",
                    threadID
                );
            }

            switch (command) {
                case "list":
                case "buy": {
                    const type = target[1]?.toLowerCase();
                    if (!type || !HOME_PRICES[type]) {
                        let message = "🏠 DANH SÁCH NHÀ Ở 🏠\n━━━━━━━━━━━━━━━━━━\n\n";
                        message += "📋 NHÀ CHO THUÊ:\n";
                        message += `• h1 - Nhà trọ: ${formatNumber(HOME_PRICES.h1.xu)} Xu/tuần\n`;
                        message += `• h2 - Căn hộ: ${formatNumber(HOME_PRICES.h2.xu)} Xu/tuần\n\n`;
                        
                        message += "🏘️ NHÀ MUA:\n";
                        message += `• h3 - Nhà cấp 4: ${formatNumber(HOME_PRICES.h3.xu)} Xu\n`;
                        message += `• h4 - Nhà phố: ${formatNumber(HOME_PRICES.h4.xu)} Xu\n`;
                        message += `• h5 - Biệt thự: ${formatNumber(HOME_PRICES.h5.xu)} Xu\n`;
                        message += `• h6 - Khu compound: ${formatNumber(HOME_PRICES.h6.xu)} Xu\n\n`;
                        
                        message += "💡 Dùng: .home buy h1-h6 để mua/thuê nhà\n";
                        message += "💵 Số dư: " + formatNumber(await getBalance(senderID)) + " Xu";

                        try {
                            const attachments = [];
                            for (const key of Object.keys(homeImages)) {
                                const response = await axios.get(homeImages[key], {
                                    responseType: 'stream'
                                });
                                attachments.push(response.data);
                            }
                            
                            return api.sendMessage({
                                body: message,
                                attachment: attachments
                            }, threadID);
                        } catch (err) {
                            console.error('Error sending images:', err);
                            return api.sendMessage(message, threadID);
                        }
                    }

                    try {
                        const home = await homeSystem.buyHome(senderID, type);
                 
                        const homeConfig = HOME_PRICES[type];
                        const message = `🏠 ${homeConfig.isRental ? 'THUÊ' : 'MUA'} NHÀ THÀNH CÔNG!\n\n` + 
                            `Loại: ${home.name}\n` +
                            `Giá: ${formatNumber(homeConfig.xu)} Xu\n` +
                            `Tình trạng: ${home.condition}%\n` +
                            (homeConfig.isRental ? `Thời hạn: ${homeConfig.rentPeriod} ngày\n` : '') +
                            `💵 Số dư: ${formatNumber(await getBalance(senderID))} Xu`;

                        try {
                            const response = await axios.get(homeImages[type], {
                                responseType: 'stream'
                            });
                            return api.sendMessage({
                                body: message,
                                attachment: response.data
                            }, threadID);
                        } catch (imgErr) {
                            console.error('Error sending home image:', imgErr);
                            return api.sendMessage(message, threadID);
                        }
                    } catch (err) {
                        return api.sendMessage(`❌ ${err.message}`, threadID);
                    }
                }

                case "sell": {
                    try {
                        const sellPrice = await homeSystem.sellHome(senderID);
                        return api.sendMessage(
                            "🏠 BÁN NHÀ THÀNH CÔNG!\n" +
                            `💰 Số tiền nhận được: ${formatNumber(sellPrice)} Xu\n` +
                            `💵 Số dư: ${formatNumber(await getBalance(senderID))} Xu`,
                            threadID
                        );
                    } catch (err) {
                        return api.sendMessage(`❌ ${err.message}`, threadID);
                    }
                }

                case "upgrade": {
                    const type = target[1]?.toLowerCase();
                    if (!type || !HOME_UPGRADES[type]) {
                        let message = "🏗️ NÂNG CẤP NHÀ 🏗️\n━━━━━━━━━━━━━━━━━━\n\n";
                        Object.entries(HOME_UPGRADES).forEach(([key, upgrade]) => {
                            message += `${key.toUpperCase()}\n`;
                            message += `• ${upgrade.name}\n`;
                            message += `• ${upgrade.description}\n`;
                            message += `• Giá: ${formatNumber(upgrade.cost)} Xu\n`;
                            message += "• Hiệu quả:\n";
                            Object.entries(upgrade.effects).forEach(([stat, value]) => {
                                if (stat === 'happiness') {
                                    message += `  - Hạnh phúc: +${value}\n`;
                                } else if (stat === 'security') {
                                    message += `  - An ninh: +${value}\n`;
                                } else if (stat === 'comfort') {
                                    message += `  - Tiện nghi: +${value}\n`;
                                } else if (stat === 'environment') {
                                    message += `  - Môi trường: +${value}\n`;
                                } else if (stat === 'luxury') {
                                    message += `  - Đẳng cấp: +${value}\n`;
                                }
                            });
                            message += "\n";
                        });
                        message += "💡 Dùng: .home upgrade [mã] để nâng cấp\n";
                        message += "💵 Số dư: " + formatNumber(await getBalance(senderID)) + " Xu";

                        return api.sendMessage(message, threadID);
                    }

                    try {
                        const result = await homeSystem.upgradeHome(senderID, type);
                        const message = `🏗️ NÂNG CẤP THÀNH CÔNG!\n\n` +
                            `Gói nâng cấp: ${result.name}\n` +
                            `Chi phí: ${formatNumber(result.cost)} Xu\n\n` +
                            `Hiệu quả:\n` +
                            Object.entries(result.effects)
                                .map(([stat, value]) => {
                                    if (stat === 'happiness') return `• Hạnh phúc: +${value}`;
                                    if (stat === 'security') return `• An ninh: +${value}`;
                                    if (stat === 'comfort') return `• Tiện nghi: +${value}`;
                                    if (stat === 'environment') return `• Môi trường: +${value}`;
                                    if (stat === 'luxury') return `• Đẳng cấp: +${value}`;
                                    return null;
                                })
                                .filter(x => x)
                                .join('\n') + 
                            `\n\n💵 Số dư: ${formatNumber(await getBalance(senderID))} Xu`;

                        return api.sendMessage(message, threadID);
                    } catch (err) {
                        return api.sendMessage(`❌ ${err.message}`, threadID);
                    }
                }

                case "info": {
                    const home = homeSystem.getHome(senderID);
                    if (!home) {
                        return api.sendMessage("❌ Bạn chưa có nhà!", threadID);
                    }

                    const homeConfig = HOME_PRICES[home.type];
                    const stats = homeSystem.getHomeStats(home);
                    
                    let message = "🏠 THÔNG TIN NHÀ Ở\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `Loại nhà: ${home.name}\n` +
                        `Giá trị: ${formatNumber(homeConfig.xu)} Xu\n` +
                        `Chủ hộ: ${homeSystem.getOwnerName(senderID)}\n` +
                        `Tình trạng: ${home.condition}%\n` +
                        `Ngày ${homeConfig.isRental ? 'thuê' : 'mua'}: ${new Date(home.purchaseDate).toLocaleDateString()}\n` +
                        (homeConfig.isRental ? `Ngày hết hạn: ${new Date(home.rentEndDate).toLocaleDateString()}\n` : '') +
                        `Lần bảo trì cuối: ${new Date(home.lastMaintenance).toLocaleDateString()}\n\n`;

                    if (stats) {
                        message += "📊 THÔNG SỐ:\n";
                        message += `• An ninh: ${stats.security}%\n`;
                        message += `• Tiện nghi: ${stats.comfort}%\n`;
                        message += `• Môi trường: ${stats.environment}%\n`;
                        message += `• Đẳng cấp: ${stats.luxury}%\n\n`;
                    }

                    if (home.upgrades && home.upgrades.length > 0) {
                        message += "🔧 NÂNG CẤP ĐÃ LẮP ĐẶT:\n";
                        home.upgrades.forEach(upgradeType => {
                            const upgrade = HOME_UPGRADES[upgradeType];
                            if (upgrade) {
                                message += `• ${upgrade.name}\n`;
                            }
                        });
                    }

                    try {
                        const attachments = [];
                        
                        const homeResponse = await axios.get(homeImages[home.type], {
                            responseType: 'stream'
                        });
                        attachments.push(homeResponse.data);

                        return api.sendMessage({
                            body: message,
                            attachment: attachments
                        }, threadID);
                    } catch (err) {
                        console.error('Error sending home image:', err);
                        return api.sendMessage(message, threadID);
                    }
                }

                case "repair": {
                    try {
                        const cost = await homeSystem.maintainHome(senderID);
                        return api.sendMessage(
                            "🔧 BẢO TRÌ NHÀ THÀNH CÔNG!\n" +
                            `💰 Chi phí: ${formatNumber(cost)} Xu\n` +
                            "✨ Nhà đã được phục hồi 100% độ bền\n" +
                            `💵 Số dư: ${formatNumber(await getBalance(senderID))} Xu`,
                            threadID
                        );
                    } catch (err) {
                        return api.sendMessage(`❌ ${err.message}`, threadID);
                    }
                }

                default: {
                    return api.sendMessage("❌ Lệnh không hợp lệ!", threadID);
                }
            }

        } catch (err) {
            console.error(err);
            return api.sendMessage("❌ Đã có lỗi xảy ra!", threadID);
        }
    }
};