const fs = require('fs');
const path = require('path');
const { validateMessengerId, verifyTransaction } = require('../utils/exchange');
const { getDiscordClient } = require('../utils/discord');

module.exports = {
    name: "claim",
    dev: "HNT",
    info: "Nhận xu từ giao dịch đổi Nitro",
    usedby: 0,
    onPrefix: true,
    usages: ".claim <mã giao dịch>",
    cooldowns: 1,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        
        if (!target[0]) {
            return api.sendMessage(
                "=== HƯỚNG DẪN CLAIM XU ===\n" +
                "\n1. Vào Discord server:" +
                "\nhttps://discord.gg/UBtdSYzn" +
                "\n2. Vào kênh #đổi-nitro" +
                "\n3. Gõ lệnh .nitro" +
                "\n4. Chọn số lượng Nitro bằng nút" +
                "\n5. Nhập ID Messenger của bạn" +
                "\n6. Kiểm tra tin nhắn riêng để lấy mã" +
                "\n7. Quay lại đây gõ .claim <mã>" +
                "\n\n❗ Lưu ý quan trọng:" +
                "\n• Mã giao dịch được gửi qua DM Discord" +
                "\n• Mỗi mã chỉ sử dụng được 1 lần" +
                "\n\n⚠️ Bảo mật:" +
                "\n• Không chia sẻ mã giao dịch" +
                "\n• Kiểm tra kỹ thông tin trước khi claim",
                threadID
            );
        }

        try {
            const result = await verifyTransaction(senderID, target[0]);
            
            if (result.success) {
                try {
                    const client = getDiscordClient();
                    if (client) {
                        const exchangeLogFile = path.join(__dirname, '../database/exchange_logs.json');
                        const logs = JSON.parse(fs.readFileSync(exchangeLogFile, 'utf8'));
                        const transaction = logs.exchanges.find(ex => ex.transactionId === target[0]);

                        if (transaction?.discordId) {
                            const user = await client.users.fetch(transaction.discordId);
                            const dm = await user.createDM();
                            const messages = await dm.messages.fetch({ limit: 10 });
                            const txMsg = messages.find(m => m.embeds?.[0]?.footer?.text === `TransactionID: ${target[0]}`);

                            if (txMsg?.embeds?.[0]) {
                                const embed = txMsg.embeds[0].toJSON();
                                embed.color = 0x00FF00;
                                embed.description = '✅ Giao dịch đã hoàn tất';
                                
                                const statusIndex = embed.fields.findIndex(f => f.name === '⏳ Trạng thái');
                                if (statusIndex !== -1) {
                                    embed.fields[statusIndex].value = '✅ Đã claim thành công';
                                }

                                await txMsg.edit({ embeds: [embed] });
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error updating Discord message:', err);
                }
            }

            return api.sendMessage(
                result.success ? result.message : `❌ ${result.message}`,
                threadID
            );

        } catch(err) {
            console.error('Claim error:', err);
            return api.sendMessage("❌ Lỗi hệ thống!", threadID);
        }
    }
};
