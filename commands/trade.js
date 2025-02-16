const TradeSystem = require('../trade/TradeSystem');
const tradeSystem = new TradeSystem();

module.exports = {
    name: "trade",
    dev: "HNT",
    info: "Giao dịch chứng khoán",
    onPrefix: true,
    usages: ".trade [check/buy/sell/portfolio/info] [mã CP] [số lượng]",
    cooldowns: 5,
    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        try {
            if (!target[0]) {
                return api.sendMessage(
                    "💎 CHỨNG KHOÁN AKI 💎\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "Lệnh:\n" +
                    "1. .trade check - Xem thị trường\n" +
                    "2. .trade buy [mã] [số lượng] - Mua\n" +
                    "3. .trade sell [mã] [số lượng] - Bán\n" +
                    "4. .trade portfolio - Xem danh mục\n" +
                    "5. .trade info [mã] - Thông tin CP",
                    threadID, messageID
                );
            }

            const command = target[0].toLowerCase();
            const isMarketOpen = tradeSystem.isMarketOpen();
            const MARKET_HOURS = { open: 9, close: 19 };

            switch (command) {
                case "check": {
                    const overview = tradeSystem.getMarketOverview();
                    
                    let message = "📊 BẢNG GIÁ CHỨNG KHOÁN 📊\n";
                    message += "━━━━━━━━━━━━━━━━━━\n";
                    message += `🕒 Trạng thái: ${isMarketOpen ? '🟢 Đang giao dịch' : '🔴 Đã đóng cửa'}\n`;
                    message += `⏰ Giờ giao dịch: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00\n`;
                    message += `💱 Tỉ giá: 1$ = ${overview.xuRate.toLocaleString('vi-VN')} Xu\n\n`;
                    message += "💎 CỔ PHIẾU:\n";
                
                    Object.entries(overview.stocks).forEach(([symbol, data]) => {
                        const changeIcon = data.change > 0 ? "🔺" : data.change < 0 ? "🔻" : "➖";
                        message += `${symbol}: ${tradeSystem.formatStockPrice(data.priceUSD)} (${tradeSystem.formatNumber(data.price)} Xu) ${changeIcon}${Math.abs(data.changePercent).toFixed(2)}%\n`;
                    });
                
                    return api.sendMessage(message, threadID, messageID);
                }

                case "buy": {
                    const symbol = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]);

                    if (!symbol || !quantity || quantity <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu và số lượng hợp lệ!", threadID, messageID);
                    }

                    try {
                        const result = await tradeSystem.buyStock(senderID, symbol, quantity);
                        return api.sendMessage(
                            "✅ GIAO DỊCH THÀNH CÔNG\n" +
                            `🏢 Mã CP: ${result.symbol}\n` +
                            `🔢 Số lượng: ${result.quantity}\n` +
                            `💰 Giá: ${tradeSystem.formatNumber(result.price)} Xu\n` +
                            `💵 Tổng: ${tradeSystem.formatNumber(result.total)} Xu\n` +
                            `📋 Phí GD: ${tradeSystem.formatNumber(result.transactionFee)} Xu\n` +
                            `🏷️ Thuế: ${tradeSystem.formatNumber(result.tax)} Xu\n` +
                            `💶 Tổng cộng: ${tradeSystem.formatNumber(result.totalWithFees)} Xu`,
                            threadID, messageID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
                }

                case "sell": {
                    const symbol = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]);

                    if (!symbol || !quantity || quantity <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu và số lượng hợp lệ!", threadID, messageID);
                    }

                    try {
                        const result = await tradeSystem.sellStock(senderID, symbol, quantity);
                        return api.sendMessage(
                            "✅ GIAO DỊCH THÀNH CÔNG\n" +
                            `🏢 Mã CP: ${result.symbol}\n` +
                            `🔢 Số lượng: ${result.quantity}\n` +
                            `💰 Giá: ${tradeSystem.formatNumber(result.price)} Xu\n` +
                            `💵 Tổng: ${tradeSystem.formatNumber(result.total)} Xu\n` +
                            `📋 Phí GD: ${tradeSystem.formatNumber(result.transactionFee)} Xu\n` +
                            `🏷️ Thuế: ${tradeSystem.formatNumber(result.tax)} Xu\n` +
                            `💶 Thực nhận: ${tradeSystem.formatNumber(result.finalValue)} Xu`,
                            threadID, messageID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
                }

                case "portfolio": {
                    const portfolio = tradeSystem.getUserPortfolio(senderID);
                    let totalValue = 0;
                    let message = "📈 DANH MỤC ĐẦU TƯ 📈\n━━━━━━━━━━━━━━━━━━\n\n";

                    if (Object.keys(portfolio.stocks).length === 0) {
                        return api.sendMessage("Bạn chưa có cổ phiếu nào!", threadID, messageID);
                    }

                    Object.entries(portfolio.stocks).forEach(([symbol, data]) => {
                        const stock = tradeSystem.getStockPrice(symbol);
                        const currentValue = Math.floor(stock.price * data.quantity);
                        const profitLoss = Math.floor(currentValue - (Math.floor(data.averagePrice) * data.quantity));
                        totalValue += currentValue;

                        message += `🏢 ${symbol} - ${stock.name}\n`;
                        message += `🔢 Số lượng: ${data.quantity}\n`;
                        message += `💰 Giá TB: ${tradeSystem.formatNumber(data.averagePrice)}\n`;
                        message += `📊 Giá HT: ${tradeSystem.formatNumber(stock.price)}\n`;
                        message += `💵 Giá trị: ${tradeSystem.formatNumber(currentValue)}\n`;
                        message += `${profitLoss >= 0 ? '📈' : '📉'} Lãi/Lỗ: ${tradeSystem.formatNumber(profitLoss)}\n\n`;
                    });

                    message += `💎 Tổng giá trị: ${tradeSystem.formatNumber(totalValue)}`;
                    return api.sendMessage(message, threadID, messageID);
                }

                case "info": {
                    const symbol = target[1]?.toUpperCase();
                    
                    if (!symbol) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu hợp lệ!", threadID, messageID);
                    }

                    try {
                        const stock = tradeSystem.getStockPrice(symbol);
                        const overview = tradeSystem.getMarketOverview();

                        const message = 
                            `🏢 ${symbol} - ${stock.name}\n` +
                            `━━━━━━━━━━━━━━━━━━\n\n` +
                            `💰 Giá: ${tradeSystem.formatStockPrice(stock.priceUSD)} (${tradeSystem.formatNumber(stock.price)} Xu)\n` +
                            `📊 Thay đổi: ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%\n` +
                            `📈 Volume: ${stock.volume.toLocaleString('vi-VN')}\n\n` +
                            `📊 ĐỘ SÂU THỊ TRƯỜNG:\n` +
                            `🔴 Bán:\n${stock.depth.asks.map(level => 
                                `   ${level.price}$ (${(level.price * overview.xuRate).toLocaleString('vi-VN')} Xu) - ${level.volume.toLocaleString('vi-VN')} CP`
                            ).join('\n')}\n` +
                            `🟢 Mua:\n${stock.depth.bids.map(level => 
                                `   ${level.price}$ (${(level.price * overview.xuRate).toLocaleString('vi-VN')} Xu) - ${level.volume.toLocaleString('vi-VN')} CP`
                            ).join('\n')}\n\n` +
                            `⏰ Cập nhật: ${new Date().toLocaleString()}`;

                        return api.sendMessage(message, threadID, messageID);
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
                }
            }
        } catch (error) {
            return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};
