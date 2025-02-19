const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateMessengerId, verifyTransaction } = require('../utils/exchange');

module.exports = {
    name: "claim",
    dev: "HNT",
    onPrefix: true,
    info: "Nhận xu từ giao dịch đổi Nitro",
    usages: ".claim <mã giao dịch>",
    cooldowns: 1,

    onLaunch: async function({ api, event, target }) {
        if (!target[0]) {
            return api.sendMessage("❌ Vui lòng nhập mã giao dịch!\nCú pháp: .claim <mã_giao_dịch>", event.threadID);
        }

        try {
            const result = await verifyTransaction(event.senderID, target[0]);
            if (!result) {
                return api.sendMessage("❌ Lỗi xử lý giao dịch!", event.threadID);
            }
            
            return api.sendMessage(
                result.success ? result.message : `❌ ${result.message}`,
                event.threadID
            );

        } catch(err) {
            console.error('Claim error:', err);
            return api.sendMessage("❌ Lỗi hệ thống!", event.threadID);
        }
    }
};
