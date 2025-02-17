const TradeSystem = require('../trade/TradeSystem');
const tradeSystem = new TradeSystem();

module.exports = {
    name: "trade",
    dev: "HNT",
    info: "Giao dịch chứng khoán",
    onPrefix: true,
    usages: ".trade [check/buy/sell/portfolio/info/margin/order/analysis/guide] [mã CP] [số lượng] [tùy chọn]",
    cooldowns: 5,
    usedby: 0,
    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        try {
            if (!target[0]) {
                return api.sendMessage(
                    "💎 CHỨNG KHOÁN AKI 💎\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "Lệnh:\n" +
                    "1. .trade check - Xem thị trường\n" +
                    "2. .trade buy [mã] [số lượng] - Mua thị trường\n" +
                    "3. .trade sell [mã] [số lượng] - Bán thị trường\n" +
                    "4. .trade portfolio - Xem danh mục\n" +
                    "5. .trade info [mã] - Thông tin CP\n" +
                    "6. .trade order [mã] [số lượng] [limit/stop] [giá] [buy/sell] - Đặt lệnh\n" +
                    "7. .trade margin [mã] [số lượng] [đòn bẩy] [open/close] - Giao dịch margin\n" +
                    "8. .trade analysis [mã] - Phân tích kỹ thuật\n" +
                    "9. .trade guide - Xem hướng dẫn chi tiết\n" +
                    "10. .trade risk - Xem cảnh báo rủi ro",
                    threadID, messageID
                );
            }

            const command = target[0].toLowerCase();
            const isMarketOpen = tradeSystem.isMarketOpen();
            const MARKET_HOURS = { open: 9, close: 19 };

            switch (command) {
                case "guide": {
                    const fs = require('fs');
                    const path = require('path');
                    const guidePath = path.join(__dirname, '../trade/guide.txt');
                    
                    try {
                        const guide = fs.readFileSync(guidePath, 'utf8');
                        return api.sendMessage(guide, threadID, messageID);
                    } catch (error) {
                        return api.sendMessage("❌ Không thể đọc file hướng dẫn!", threadID, messageID);
                    }
                }

                case "analysis": {
                    const symbol = target[1]?.toUpperCase();
                    if (!symbol) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu!", threadID, messageID);
                    }

                    try {
                        const stock = tradeSystem.getStockPrice(symbol);
                        const rsi = tradeSystem.calculateRSI(symbol);
                        const macd = tradeSystem.calculateMACD(symbol);
                        
                        let message = `📊 PHÂN TÍCH KỸ THUẬT ${symbol}\n`;
                        message += "━━━━━━━━━━━━━━━━━━\n\n";
                        message += `🏢 ${stock.name}\n`;
                        message += `💰 Giá: ${tradeSystem.formatStockPrice(stock.priceUSD)} (${tradeSystem.formatNumber(stock.price)} Xu)\n`;
                        message += `📈 RSI (14): ${rsi ? rsi.toFixed(2) : 'N/A'}\n`;
                        
                        if (macd) {
                            message += `📉 MACD: ${macd.macd.toFixed(2)}\n`;
                            message += `📊 Signal: ${macd.signal.toFixed(2)}\n`;
                        }

                        return api.sendMessage(message, threadID, messageID);
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
                }

                case "order": {
                    const symbol = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]);
                    const orderType = target[3]?.toLowerCase();
                    const price = parseFloat(target[4]);
                    const side = target[5]?.toLowerCase();

                    if (!symbol || !quantity || !orderType || !price || !side) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập đầy đủ thông tin!\n" +
                            "Cú pháp: .trade order [mã] [số lượng] [limit/stop] [giá] [buy/sell]",
                            threadID, messageID
                        );
                    }

                    try {
                        const orderId = await tradeSystem.placeOrder(senderID, symbol, quantity, orderType, {
                            limitPrice: orderType === 'limit' ? price : undefined,
                            stopPrice: orderType === 'stop' ? price : undefined,
                            isBuy: side === 'buy'
                        });

                        return api.sendMessage(
                            "✅ ĐẶT LỆNH THÀNH CÔNG\n" +
                            `🔢 Mã lệnh: ${orderId}\n` +
                            `🏢 Mã CP: ${symbol}\n` +
                            `📊 Loại: ${orderType.toUpperCase()}\n` +
                            `${side === 'buy' ? '🟢' : '🔴'} ${side === 'buy' ? 'MUA' : 'BÁN'}\n` +
                            `🔢 Số lượng: ${quantity}\n` +
                            `💰 Giá: ${tradeSystem.formatNumber(price)} Xu`,
                            threadID, messageID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
                }

                case "margin": {
                    const symbol = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]);
                    const leverage = parseInt(target[3]);
                    const action = target[4]?.toLowerCase();

                    if (!symbol || !quantity || !leverage || !action) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập đầy đủ thông tin!\n" +
                            "Cú pháp: .trade margin [mã] [số lượng] [đòn bẩy] [open/close]",
                            threadID, messageID
                        );
                    }

                    try {
                        if (action === 'open') {
                            const positionId = await tradeSystem.openMarginPosition(senderID, symbol, quantity, leverage);
                            return api.sendMessage(
                                "✅ MỞ VỊ THẾ MARGIN THÀNH CÔNG\n" +
                                `🔢 Mã vị thế: ${positionId}\n` +
                                `🏢 Mã CP: ${symbol}\n` +
                                `🔢 Số lượng: ${quantity}\n` +
                                `📊 Đòn bẩy: ${leverage}x`,
                                threadID, messageID
                            );
                        } else if (action === 'close') {
                            const result = await tradeSystem.closeMarginPosition(senderID, symbol);
                            return api.sendMessage(
                                "✅ ĐÓNG VỊ THẾ MARGIN THÀNH CÔNG\n" +
                                `🏢 Mã CP: ${symbol}\n` +
                                `💰 Lãi/Lỗ: ${tradeSystem.formatNumber(result.pnl)} Xu\n` +
                                `📋 Phí margin: ${tradeSystem.formatNumber(result.marginFee)} Xu\n` +
                                `💵 Thực nhận: ${tradeSystem.formatNumber(result.finalPnl)} Xu`,
                                threadID, messageID
                            );
                        }
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
                }

                case "check": {
                    const overview = tradeSystem.getMarketOverview();
                    const analysis = tradeSystem.getMarketAnalysis();
                    
                    let message = "📊 BẢNG GIÁ CHỨNG KHOÁN 📊\n";
                    message += "━━━━━━━━━━━━━━━━━━\n";
                    message += `🕒 Trạng thái: ${isMarketOpen ? '🟢 Đang giao dịch' : '🔴 Đã đóng cửa'}\n`;
                    message += `⏰ Giờ giao dịch: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00\n`;
                    message += `💱 Tỉ giá: 1$ = ${overview.xuRate.toLocaleString('vi-VN')} Xu\n`;
                    
                    const marketVolatility = tradeSystem.calculateMarketVolatility();
                    if (marketVolatility > 2) {
                        message += `⚠️ Cảnh báo: Biến động thị trường cao (${marketVolatility.toFixed(1)}%)\n`;
                    }
                    message += "\n";
                    
                    message += "📈 TỔNG QUAN THỊ TRƯỜNG:\n";
                    message += `📊 Khối lượng: ${tradeSystem.formatNumber(analysis.totalVolume)} CP\n`;
                    message += `💰 Giá trị: ${tradeSystem.formatNumber(analysis.totalValue)} Xu\n`;
                    message += `🎯 Xu hướng: ${analysis.marketSentiment}\n\n`;
                    
                    message += "🔺 TOP TĂNG GIÁ:\n";
                    analysis.topGainers.forEach(({symbol, change}) => {
                        const stock = overview.stocks[symbol];
                        message += `${symbol}: +${change.toFixed(2)}% (${tradeSystem.formatNumber(stock.price)} Xu)\n`;
                    });
                    
                    message += "\n🔻 TOP GIẢM GIÁ:\n";
                    analysis.topLosers.forEach(({symbol, change}) => {
                        const stock = overview.stocks[symbol];
                        message += `${symbol}: ${change.toFixed(2)}% (${tradeSystem.formatNumber(stock.price)} Xu)\n`;
                    });
                    
                    message += "\n💎 TOÀN BỘ CỔ PHIẾU:\n";
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

                case "risk": {
                    const portfolio = tradeSystem.getUserPortfolio(senderID);
                    const marginPositions = Object.entries(tradeSystem.marginPositions)
                        .filter(([_, pos]) => pos.userId === senderID);
                    const marketAnalysis = tradeSystem.getMarketAnalysis();
                    
                    let message = "⚠️ CẢNH BÁO RỦI RO ⚠️\n";
                    message += "━━━━━━━━━━━━━━━━━━\n\n";
                    
                    // Market Risk
                    const marketVolatility = tradeSystem.calculateMarketVolatility();
                    message += "📊 THỊ TRƯỜNG:\n";
                    message += `Độ biến động: ${marketVolatility.toFixed(1)}%\n`;
                    message += `Xu hướng: ${marketAnalysis.marketSentiment}\n\n`;
                    
                    // Margin Positions
                    if (marginPositions.length > 0) {
                        message += "📈 VỊ THẾ MARGIN:\n";
                        marginPositions.forEach(([id, pos]) => {
                            const stock = tradeSystem.getStockPrice(pos.symbol);
                            const currentValue = stock.price * pos.quantity;
                            const equity = pos.margin + (currentValue - (pos.entryPrice * pos.quantity));
                            const equityRatio = equity / (currentValue * pos.leverage);
                            
                            message += `${pos.symbol}: ${pos.leverage}x (${(equityRatio * 100).toFixed(1)}% equity)\n`;
                            if (pos.marginCallIssued) {
                                message += `⚠️ MARGIN CALL - Hạn chót: ${new Date(pos.marginCallDeadline).toLocaleString()}\n`;
                            }
                        });
                    }
                    
                    return api.sendMessage(message, threadID, messageID);
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
