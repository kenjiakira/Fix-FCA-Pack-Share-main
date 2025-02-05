const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const { createGiftcode, loadGiftcodes, sendGiftcodeAnnouncement } = require('../utils/autoGiftcode');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "giftcode",
    dev: "HNT",
    info: "Hệ thống giftcode",
    onPrefix: true,
    usages: "[redeem/create/list] [code]",
    cooldowns: 5,
    isAdmin: false,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const cmd = target[0]?.toLowerCase();

        const isAdmin = global.cc.adminBot.includes(senderID);

        if (!cmd || !['redeem', 'create', 'list'].includes(cmd)) {
            return api.sendMessage(
                "📦 GIFTCODE SYSTEM\n━━━━━━━━━━━━━━━━━━\n\n" +
                "1. Đổi code:\n→ .giftcode redeem <code>\n\n" +
                (isAdmin ? 
                "2. Tạo code (Admin):\n→ .giftcode create <số xu> <mô tả>\n\n" +
                "3. Xem danh sách code (Admin):\n→ .giftcode list\n\n" : "") +
                "💡 Giftcode tự động được tạo lúc 12h trưa mỗi ngày",
                threadID, messageID
            );
        }

        if ((cmd === 'create' || cmd === 'list') && !isAdmin) {
            return api.sendMessage("❌ Chỉ admin mới có thể sử dụng lệnh này!", threadID, messageID);
        }

        switch (cmd) {
            case 'redeem': {
                const code = target[1]?.toUpperCase();
                if (!code) {
                    return api.sendMessage("❌ Vui lòng nhập mã code!", threadID, messageID);
                }

                const giftcodeData = loadGiftcodes();
                const giftcode = giftcodeData.codes[code];

                if (!giftcode) {
                    return api.sendMessage("❌ Code không tồn tại hoặc đã hết hạn!", threadID, messageID);
                }

                if (giftcode.usedBy.includes(senderID)) {
                    return api.sendMessage("❌ Bạn đã sử dụng code này rồi!", threadID, messageID);
                }

                const expiryDate = new Date(giftcode.expiry);
                if (expiryDate < new Date()) {
                    return api.sendMessage("❌ Code đã hết hạn sử dụng!", threadID, messageID);
                }

                giftcode.usedBy.push(senderID);
                fs.writeFileSync(path.join(__dirname, '../database/json/giftcodes.json'), 
                    JSON.stringify(giftcodeData, null, 2));

                updateBalance(senderID, giftcode.reward);

                return api.sendMessage(
                    "🎉 Đổi code thành công!\n\n" +
                    `📝 Mã code: ${code}\n` +
                    `💝 Quà tặng: ${formatNumber(giftcode.reward)} Xu\n` +
                    `📜 Mô tả: ${giftcode.description}\n\n` +
                    `💰 Số dư hiện tại: ${formatNumber(getBalance(senderID))} Xu`,
                    threadID, messageID
                );
            }

            case 'create': {
                const reward = parseInt(target[1]);
                const description = target.slice(2).join(" ");

                if (!reward || !description) {
                    return api.sendMessage("❌ Vui lòng nhập đúng cú pháp:\n.giftcode create <số xu> <mô tả>", threadID, messageID);
                }

                const code = createGiftcode(reward, description);
                await sendGiftcodeAnnouncement(api, code, reward);
                
                return api.sendMessage(
                    "✅ Tạo giftcode thành công!\n\n" +
                    `📝 Code: ${code}\n` +
                    `💝 Xu: ${formatNumber(reward)}\n` +
                    `📜 Mô tả: ${description}\n` +
                    "⏰ Thời hạn: 24 giờ\n" +
                    "📢 Đã thông báo tới tất cả các nhóm",
                    threadID, messageID
                );
            }

            case 'list': {
                const giftcodeData = loadGiftcodes();
                const codes = Object.entries(giftcodeData.codes);

                if (codes.length === 0) {
                    return api.sendMessage("❌ Hiện không có giftcode nào!", threadID, messageID);
                }

                let message = "📋 DANH SÁCH GIFTCODE\n━━━━━━━━━━━━━━━━━━\n\n";
                codes.forEach(([code, data]) => {
                    message += `📝 Code: ${code}\n`;
                    message += `💝 Xu: ${formatNumber(data.reward)}\n`;
                    message += `📜 Mô tả: ${data.description}\n`;
                    message += `⏰ Hết hạn: ${new Date(data.expiry).toLocaleString('vi-VN')}\n`;
                    message += `👥 Đã dùng: ${data.usedBy.length}\n\n`;
                });

                return api.sendMessage(message, threadID, messageID);
            }
        }
    }
};