const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "giftcode",
    dev: "HNT",
    info: "Nhập giftcode để nhận quà",
    onPrefix: true,
    usages: "giftcode <code>",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        const giftcodesPath = path.join(__dirname, '..', 'database', 'json', 'giftcodes.json');
        const giftcodeData = JSON.parse(fs.readFileSync(giftcodesPath, 'utf8'));

        if (!target[0]) {
            return api.sendMessage(
                "📦 GIFTCODE SYSTEM\n━━━━━━━━━━━━━━━━━━\n\n" +
                "Hướng dẫn sử dụng:\n" +
                "- Sử dụng .giftcode <mã code> để đổi quà\n" +
                "- Mỗi code chỉ có thể sử dụng 1 lần\n" +
                "- Code có thể hết hạn theo thời gian",
                threadID, messageID
            );
        }

        const code = target[0].toUpperCase();
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
        fs.writeFileSync(giftcodesPath, JSON.stringify(giftcodeData, null, 2));

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
};
