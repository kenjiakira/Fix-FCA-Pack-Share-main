const axios = require('axios');
const LottoManager = require('../utils/lottoManager');

module.exports = {
    name: "xsmb",
    info: "Xem kết quả xổ số miền Bắc và đánh lô đề",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    cooldowns: 5,
    usages: `.xsmb: Xem kết quả (sau 18:30)
.xsmb help: Xem hướng dẫn chơi
.xsmb de [số] [tiền]: Đánh đề (2 số cuối ĐB, x70)
.xsmb lo [số] 27000: Đánh lô (2 số cuối, thắng 99k/nháy)  
.xsmb 3-cang [số] [tiền]: Đánh 3 càng (3 số cuối ĐB, x960)`,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        
        if (target[0] === "stats") {
            // Add statistics command
            const data = await LottoManager.loadData();
            const stats = data.statistics[senderID] || {
                totalBet: 0,
                totalWin: 0,
                totalLoss: 0
            };
            
            return api.sendMessage(
                `📊 Thống kê cá cược của bạn:\n\n` +
                `💰 Tổng tiền đã cược: ${stats.totalBet.toLocaleString('vi-VN')} Xu\n` + // Thêm "Xu"
                `✨ Tổng tiền thắng: ${stats.totalWin.toLocaleString('vi-VN')} Xu\n` +
                `📉 Tổng tiền thua: ${stats.totalLoss.toLocaleString('vi-VN')} Xu\n` +
                `📈 Lãi/Lỗ: ${(stats.totalWin - stats.totalLoss).toLocaleString('vi-VN')} Xu`,
                threadID,
                messageID
            );
        }

        if (target[0] === "help") {
            return api.sendMessage(
                "📌 Luật chơi XSMB:\n\n" +
                "🎯 Đề (de): Cược 2 số cuối giải ĐB\n" +
                "- Thắng x70 tiền cược\n" +
                "- Ví dụ: Cược 10k trúng 700k\n\n" +
                "🎯 Lô (lo): Cược 27k cho 2 số cuối\n" + 
                "- Thắng 99k/lần về\n" +
                "- Ví dụ: Cược 27k số về 3 nháy = 297k\n\n" +
                "🎯 3 càng: Cược 3 số cuối giải ĐB\n" +
                "- Thắng x960 tiền cược\n" +
                "- Ví dụ: 10k trúng 9.6tr\n\n" +
                "📝 Cách đặt cược:\n" +
                ".xsmb [de/lo/3-cang] [số] [tiền]",
                threadID,
                messageID
            );
        }

        if (target.length === 0) {
            const loadingMsg = await api.sendMessage("⏳ Đang lấy kết quả xổ số...", threadID);
            
            try {
                const response = await axios.get('https://api-xsmb-today.onrender.com/api/v1');
                const data = response.data;

                if (!data || !data.results) {
                    throw new Error('Không thể lấy dữ liệu xổ số');
                }

                const results = data.results;
                const time = data.time;

                let message = `🎲 KẾT QUẢ XSMB NGÀY ${time}\n`;
                message += "━━━━━━━━━━━━━━━━━━\n\n";

                message += `🏆 Giải ĐB: ${results['ĐB'].join(', ')}\n\n`;

                message += `🥇 Giải Nhất: ${results.G1.join(', ')}\n\n`;

                message += `🥈 Giải Nhì: ${results.G2.join(', ')}\n\n`;

                message += `🥉 Giải Ba: ${results.G3.join(', ')}\n\n`;

                message += `💫 Giải Tư: ${results.G4.join(', ')}\n\n`;
                message += `💫 Giải Năm: ${results.G5.join(', ')}\n\n`;
                message += `💫 Giải Sáu: ${results.G6.join(', ')}\n\n`;
                message += `💫 Giải Bảy: ${results.G7.join(', ')}\n\n`;

                message += "━━━━━━━━━━━━━━━━━━\n";
                message += "💡 Chúc bạn may mắn!";

                await api.sendMessage(message, threadID, messageID);
                api.unsendMessage(loadingMsg.messageID);

            } catch (error) {
                console.error('XSMB Error:', error);
                await api.sendMessage(
                    "❌ Đã có lỗi xảy ra khi lấy kết quả xổ số. Vui lòng thử lại sau!", 
                    threadID, 
                    messageID
                );
            }
            return;
        }

        if (target.length === 3) {
            const [type, numbers, amount] = target;

            const betAmount = type === 'lo' ? LottoManager.getBetAmount(type) : parseInt(amount);

            if (!await LottoManager.checkDailyLimit(senderID, betAmount)) {
                return api.sendMessage(
                    "❌ Bạn đã đạt giới hạn cược trong ngày (1,000,000 Xu/ngày)!",
                    threadID,
                    messageID
                );
            }

            if (!LottoManager.isValidBetTime()) {
                return api.sendMessage(
                    "❌ Chỉ được đặt cược trước 18:33 hàng ngày!", 
                    threadID, 
                    messageID
                );
            }
            
            if (!LottoManager.validateBet(type, numbers)) {
                return api.sendMessage(
                    "❌ Định dạng cược không hợp lệ!\nSử dụng: de/lo/3-cang [số] [tiền]", 
                    threadID, 
                    messageID
                );
            }

            if (type !== 'lo' && (isNaN(betAmount) || betAmount < LottoManager.BET_AMOUNTS[type])) {
                return api.sendMessage(
                    `❌ Số tiền cược tối thiểu là ${LottoManager.BET_AMOUNTS[type].toLocaleString('vi-VN')} Xu!`, 
                    threadID, 
                    messageID
                );
            }

            const userBalance = global.balance[senderID] || 0;
            if (userBalance < betAmount) {
                return api.sendMessage("❌ Số dư không đủ để đặt cược!", threadID, messageID);
            }

            try {
                await LottoManager.recordBet(senderID, type, numbers, betAmount);
                const loadingMsg = await api.sendMessage("⏳ Đang lấy kết quả xổ số...", threadID);
                
                const response = await axios.get('https://api-xsmb-today.onrender.com/api/v1');
                const data = response.data;

                if (!data || !data.results) {
                    throw new Error('Không thể lấy dữ liệu xổ số');
                }

                const results = data.results;
                const time = data.time;

                const winAmount = LottoManager.calculateWinnings(type, numbers, betAmount, data.results);
                
                global.balance[senderID] -= betAmount;
                if (winAmount > 0) {
                    global.balance[senderID] += winAmount;
                }
                
                await require('../utils/currencies').saveData();
                await LottoManager.recordResult(senderID, betAmount, winAmount);

                const resultMessage = `🎲 Kết quả cược:\n` +
                    `Loại cược: ${type.toUpperCase()}\n` +
                    `Số đặt: ${numbers}\n` +
                    `Tiền cược: ${betAmount.toLocaleString('vi-VN')} Xu\n` +
                    `Kết quả: ${winAmount > 0 ? 'THẮNG! 🎉' : 'THUA! 😢'}\n` +
                    `Tiền thắng: ${winAmount.toLocaleString('vi-VN')} Xu\n` +
                    `Số dư mới: ${global.balance[senderID].toLocaleString('vi-VN')} Xu`;

                let message = `🎲 KẾT QUẢ XSMB NGÀY ${time}\n`;
                message += "━━━━━━━━━━━━━━━━━━\n\n";

                message += `🏆 Giải ĐB: ${results['ĐB'].join(', ')}\n\n`;

                message += `🥇 Giải Nhất: ${results.G1.join(', ')}\n\n`;

                message += `🥈 Giải Nhì: ${results.G2.join(', ')}\n\n`;

                message += `🥉 Giải Ba: ${results.G3.join(', ')}\n\n`;

                message += `💫 Giải Tư: ${results.G4.join(', ')}\n\n`;
                message += `💫 Giải Năm: ${results.G5.join(', ')}\n\n`;
                message += `💫 Giải Sáu: ${results.G6.join(', ')}\n\n`;
                message += `💫 Giải Bảy: ${results.G7.join(', ')}\n\n`;

                message += "━━━━━━━━━━━━━━━━━━\n";
                message += "💫Gõ xsmb help để xem cách chơi!";
                message += "💡 Chúc bạn may mắn!";
                message += "\n\n" + resultMessage;

                await api.sendMessage(message, threadID, messageID);
                api.unsendMessage(loadingMsg.messageID);

            } catch (error) {
                console.error('XSMB Error:', error);
                await api.sendMessage(
                    "❌ Đã có lỗi xảy ra khi lấy kết quả xổ số. Vui lòng thử lại sau!", 
                    threadID, 
                    messageID
                );
            }
        } else {
            const loadingMsg = await api.sendMessage("⏳ Đang lấy kết quả xổ số...", threadID);
            
            try {
                const response = await axios.get('https://api-xsmb-today.onrender.com/api/v1');
                const data = response.data;

                if (!data || !data.results) {
                    throw new Error('Không thể lấy dữ liệu xổ số');
                }

                const results = data.results;
                const time = data.time;

                let message = `🎲 KẾT QUẢ XSMB NGÀY ${time}\n`;
                message += "━━━━━━━━━━━━━━━━━━\n\n";

                message += `🏆 Giải ĐB: ${results['ĐB'].join(', ')}\n\n`;

                message += `🥇 Giải Nhất: ${results.G1.join(', ')}\n\n`;

                message += `🥈 Giải Nhì: ${results.G2.join(', ')}\n\n`;

                message += `🥉 Giải Ba: ${results.G3.join(', ')}\n\n`;

                message += `💫 Giải Tư: ${results.G4.join(', ')}\n\n`;
                message += `💫 Giải Năm: ${results.G5.join(', ')}\n\n`;
                message += `💫 Giải Sáu: ${results.G6.join(', ')}\n\n`;
                message += `💫 Giải Bảy: ${results.G7.join(', ')}\n\n`;

                message += "━━━━━━━━━━━━━━━━━━\n";
                message += "💡 Chúc bạn may mắn!";

                await api.sendMessage(message, threadID, messageID);
                api.unsendMessage(loadingMsg.messageID);

            } catch (error) {
                console.error('XSMB Error:', error);
                await api.sendMessage(
                    "❌ Đã có lỗi xảy ra khi lấy kết quả xổ số. Vui lòng thử lại sau!", 
                    threadID, 
                    messageID
                );
            }
        }
    }
};
