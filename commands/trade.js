const TradeSystem = require("../trade/TradeSystem");
const StockChart = require("../trade/stockChart");
const path = require("path");
const fs = require("fs");

const tradeSystem = new TradeSystem();
const CHART_DIR = path.join(__dirname, "../cache/charts");
if (!fs.existsSync(CHART_DIR)) {
  fs.mkdirSync(CHART_DIR, { recursive: true });
}

module.exports = {
  name: "trade",
  dev: "HNT",
  category: "Tài Chính",
  info: "Giao dịch chứng khoán",
  onPrefix: true,
  usages:
    ".trade [check/buy/sell/portfolio/info/order/analysis/guide/news/limits] [mã CP] [số lượng] [tùy chọn]",
  cooldowns: 5,
  usedby: 0,
  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;

    try {
      if (!target[0]) {
        return api.sendMessage(
          "💎 CHỨNG KHOÁN AKI 💎\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "Lệnh:\n" +
            "1. .trade check - Xem thị trường\n" +
            "2. .trade buy [mã] [số lượng] - Mua cổ phiếu\n" +
            "3. .trade sell [mã] [số lượng] - Bán cổ phiếu\n" +
            "4. .trade portfolio - Xem danh mục\n" +
            "5. .trade info [mã] - Thông tin CP\n" +
            "6. .trade order [mã] [số lượng] [limit/stop] [giá] [buy/sell] - Đặt lệnh\n" +
            "7. .trade analysis [mã] - Phân tích kỹ thuật\n" +
            "8. .trade news - Xem tin tức thị trường\n" +
            "9. .trade limits - Xem giới hạn giao dịch\n" +
            "10. .trade risk - Xem cảnh báo rủi ro\n" +
            "11. .trade guide - Xem hướng dẫn chi tiết" +
            "12. .trade top - Xem bảng xếp hạng nhà đầu tư",
          threadID,
          messageID
        );
      }

      const command = target[0].toLowerCase();
      const isMarketOpen = tradeSystem.isMarketOpen();
      const MARKET_HOURS = { open: 9, close: 18 };

      switch (command) {
        case "gift": {
          const adminConfig = JSON.parse(fs.readFileSync("./admin.json"));
          if (!adminConfig.adminUIDs.includes(senderID)) {
            return api.sendMessage(
              "❌ Chỉ ADMIN mới được sử dụng lệnh này!",
              threadID,
              messageID
            );
          }

          try {
            const allPortfolios = tradeSystem.getAllPortfolios();
            const eligibleUsers = [];

            for (const [userId, portfolio] of Object.entries(allPortfolios)) {
              if (!portfolio.transactions) continue;

              const buyCount = portfolio.transactions.filter(
                (t) => t.type === "buy"
              ).length;
              const sellCount = portfolio.transactions.filter(
                (t) => t.type === "sell"
              ).length;

              if (buyCount >= 2 && sellCount >= 2) {
                eligibleUsers.push(userId);
              }
            }

            const selectedUsers = eligibleUsers
              .sort(() => Math.random() - 0.5)
              .slice(0, 100);

            if (selectedUsers.length === 0) {
              return api.sendMessage(
                "❌ Không có người chơi nào đủ điều kiện!",
                threadID,
                messageID
              );
            }

            const overview = tradeSystem.getMarketOverview();
            const symbols = Object.keys(overview.stocks);
            const randomSymbol =
              symbols[Math.floor(Math.random() * symbols.length)];

            let successCount = 0;
            for (const userId of selectedUsers) {
              try {
                await tradeSystem.giftStock(userId, randomSymbol, 1000);
                successCount++;
              } catch (error) {
                console.error(`Error gifting to ${userId}:`, error);
              }
            }

            return api.sendMessage(
              "🎁 TẶNG CP THÀNH CÔNG\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                `🏢 Mã CP: ${randomSymbol}\n` +
                `🔢 Số lượng: 1000 CP/người\n` +
                `👥 Số người nhận: ${successCount}\n` +
                `ℹ️ Điều kiện: Tối thiểu 2 lần mua và 2 lần bán`,
              threadID,
              messageID
            );
          } catch (error) {
            return api.sendMessage(
              `❌ Lỗi: ${error.message}`,
              threadID,
              messageID
            );
          }
        }

        case "guide": {
          const fs = require("fs");
          const path = require("path");
          const guidePath = path.join(__dirname, "../trade/guide.txt");

          try {
            const guide = fs.readFileSync(guidePath, "utf8");
            return api.sendMessage(guide, threadID, messageID);
          } catch (error) {
            return api.sendMessage(
              "❌ Không thể đọc file hướng dẫn!",
              threadID,
              messageID
            );
          }
        }

        case "analysis": {
          const symbol = target[1]?.toUpperCase();
          if (!symbol) {
            return api.sendMessage(
              "❌ Vui lòng nhập mã cổ phiếu!",
              threadID,
              messageID
            );
          }

          try {
            const stock = tradeSystem.getStockPrice(symbol);
            const rsi = tradeSystem.calculateRSI(symbol);
            const macd = tradeSystem.calculateMACD(symbol);

            let message = `📊 PHÂN TÍCH KỸ THUẬT ${symbol}\n`;
            message += "━━━━━━━━━━━━━━━━━━\n\n";
            message += `🏢 ${stock.name}\n`;
            message += `💰 Giá: ${tradeSystem.formatStockPrice(
              stock.priceUSD
            )} (${tradeSystem.formatNumber(stock.price)} Xu)\n`;
            message += `📈 RSI (14): ${rsi ? rsi.toFixed(2) : "N/A"}\n`;

            if (macd) {
              message += `📉 MACD: ${macd.macd.toFixed(2)}\n`;
              message += `📊 Signal: ${macd.signal.toFixed(2)}\n`;
            }

            return api.sendMessage(message, threadID, messageID);
          } catch (error) {
            return api.sendMessage(
              `❌ Lỗi: ${error.message}`,
              threadID,
              messageID
            );
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
              threadID,
              messageID
            );
          }

          try {
            const orderId = await tradeSystem.placeOrder(
              senderID,
              symbol,
              quantity,
              orderType,
              {
                limitPrice: orderType === "limit" ? price : undefined,
                stopPrice: orderType === "stop" ? price : undefined,
                isBuy: side === "buy",
              }
            );

            return api.sendMessage(
              "✅ ĐẶT LỆNH THÀNH CÔNG\n" +
                `🔢 Mã lệnh: ${orderId}\n` +
                `🏢 Mã CP: ${symbol}\n` +
                `📊 Loại: ${orderType.toUpperCase()}\n` +
                `${side === "buy" ? "🟢" : "🔴"} ${
                  side === "buy" ? "MUA" : "BÁN"
                }\n` +
                `🔢 Số lượng: ${quantity}\n` +
                `💰 Giá: ${tradeSystem.formatNumber(price)} Xu`,
              threadID,
              messageID
            );
          } catch (error) {
            return api.sendMessage(
              `❌ Lỗi: ${error.message}`,
              threadID,
              messageID
            );
          }
        }

        case "news": {
          const activeNews = tradeSystem.activeNews || [];

          if (activeNews.length === 0) {
            return api.sendMessage(
              "📰 Hiện tại không có tin tức quan trọng nào",
              threadID,
              messageID
            );
          }

          let message = "📰 TIN TỨC THỊ TRƯỜNG 📰\n";
          message += "━━━━━━━━━━━━━━━━━━\n\n";

          activeNews.forEach((news) => {
            const impact =
              news.impact > 0
                ? `+${(news.impact * 100).toFixed(1)}%`
                : `${(news.impact * 100).toFixed(1)}%`;
            const impactIcon = news.impact > 0 ? "🔺" : "🔻";

            message += `${impactIcon} ${news.description}\n`;
            message += `📊 Tác động: ${impact}\n`;

            if (news.symbols.length <= 5) {
              message += `🏢 Ảnh hưởng: ${news.symbols.join(", ")}\n`;
            } else {
              message += `🏢 Ảnh hưởng: ${news.symbols.length} mã cổ phiếu\n`;
            }

            message += `⏰ Thời gian: ${new Date(
              news.timestamp
            ).toLocaleTimeString()}\n\n`;
          });

          return api.sendMessage(message, threadID, messageID);
        }

        case "limits": {
          const userId = senderID;
          const dailyLimit =
            tradeSystem.tradingHistory[userId]?.trades[
              new Date().toDateString()
            ] || 0;
          const TRADING_LIMITS = {
            dailyTradeLimit: 20,
            tradeCooldown: 60,
            maxVolumePercent: 0.25,
          };

          const remainingCooldown = Math.ceil(
            tradeSystem.getRemainingCooldown(userId) / 1000
          );

          const portfolio = tradeSystem.getUserPortfolio(userId);
          const portfolioValue = tradeSystem.calculatePortfolioValue(portfolio);
          const maxTradeValue = Math.floor(
            portfolioValue * TRADING_LIMITS.maxVolumePercent
          );

          let message = "⚖️ GIỚI HẠN GIAO DỊCH ⚖️\n";
          message += "━━━━━━━━━━━━━━━━━━\n\n";
          message += `🔄 Giao dịch hôm nay: ${dailyLimit}/${TRADING_LIMITS.dailyTradeLimit}\n`;
          message += `⏲️ Thời gian chờ: ${
            remainingCooldown > 0 ? remainingCooldown + " giây" : "Sẵn sàng"
          }\n\n`;

          message += "📊 KHỐI LƯỢNG TỐI ĐA:\n";
          message += `- Tỉ lệ: ${
            TRADING_LIMITS.maxVolumePercent * 100
          }% giá trị danh mục\n`;

          if (portfolioValue > 0) {
            message += `- Giá trị danh mục: ${tradeSystem.formatNumber(
              portfolioValue
            )} Xu\n`;
            message += `- Giới hạn giao dịch: ${tradeSystem.formatNumber(
              maxTradeValue
            )} Xu/lệnh\n`;
          } else {
            message += "- Không áp dụng với giao dịch đầu tiên\n";
          }

          message += "\n📝 GIẢI THÍCH:\n";
          message +=
            "- Giới hạn này ngăn giao dịch quá lớn gây biến động giá\n";
          message += "- Bảo vệ người chơi khỏi rủi ro phí slippage cao\n";
          message += "- Hạn chế thao túng thị trường\n\n";

          message += "ℹ️ VÍ DỤ:\n";
          message += "- Nếu danh mục có giá trị 1,000,000 Xu\n";
          message += "- Giao dịch tối đa: 250,000 Xu/lệnh\n";
          message += "- Có thể chia nhỏ lệnh lớn thành nhiều lệnh nhỏ hơn";

          return api.sendMessage(message, threadID, messageID);
        }

        case "top":
        case "leaderboard": {
          try {
            const allPortfolios = tradeSystem.getAllPortfolios();
            const investors = [];

            for (const [userId, portfolio] of Object.entries(allPortfolios)) {
              const portfolioValue =
                tradeSystem.calculatePortfolioValue(portfolio);
              if (portfolioValue > 0) {
                investors.push({
                  userId,
                  value: portfolioValue,
                  stockCount: Object.keys(portfolio.stocks || {}).length,
                });
              }
            }

            if (investors.length === 0) {
              return api.sendMessage(
                "❌ Chưa có nhà đầu tư nào trên hệ thống!",
                threadID,
                messageID
              );
            }

            investors.sort((a, b) => b.value - a.value);

            let message = "🏆 BẢNG XẾP HẠNG NHÀ ĐẦU TƯ 🏆\n";
            message += "━━━━━━━━━━━━━━━━━━\n\n";

            const topCount = Math.min(10, investors.length);
            for (let i = 0; i < topCount; i++) {
              const investor = investors[i];
              let userInfo;

              try {
                const userName = (await api.getUserInfo(investor.userId))[
                  investor.userId
                ].name;
                userInfo = userName;
              } catch {
                userInfo = investor.userId;
              }

              let medal = "";
              if (i === 0) medal = "🥇";
              else if (i === 1) medal = "🥈";
              else if (i === 2) medal = "🥉";
              else medal = `${i + 1}.`;

              message += `${medal} ${userInfo}\n`;
              message += `💰 Tài sản: ${tradeSystem.formatNumber(
                investor.value
              )} Xu\n`;
              message += `📊 Số CP: ${investor.stockCount} loại\n\n`;
            }

            return api.sendMessage(message, threadID, messageID);
          } catch (error) {
            return api.sendMessage(
              `❌ Lỗi: ${error.message}`,
              threadID,
              messageID
            );
          }
        }
        case "check": {
          const overview = tradeSystem.getMarketOverview();
          const analysis = tradeSystem.getMarketAnalysis();
          const marketSentiment = tradeSystem.getMarketSentiment();

          let message = "📊 BẢNG GIÁ CHỨNG KHOÁN 📊\n";
          message += "━━━━━━━━━━━━━━━━━━\n";
          message += `🕒 Trạng thái: ${
            isMarketOpen ? "🟢 Đang giao dịch" : "🔴 Đã đóng cửa"
          }\n`;
          message += `⏰ Giờ giao dịch: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00\n`;
          message += `💱 Tỉ giá: 1$ = ${overview.xuRate.toLocaleString(
            "vi-VN"
          )} Xu\n`;

          message += "\n";

          message += "📈 TỔNG QUAN THỊ TRƯỜNG:\n";
          message += `📊 Khối lượng: ${tradeSystem.formatNumber(
            analysis.totalVolume
          )} CP\n`;
          message += `💰 Giá trị: ${tradeSystem.formatNumber(
            analysis.totalValue
          )} Xu\n`;
          message += `🎯 Xu hướng: ${marketSentiment}\n`;
          message += `📰 Tin tức: ${tradeSystem.activeNews.length} tin tức đang hoạt động\n\n`;

          message += "🔺 TOP TĂNG GIÁ:\n";
          analysis.topGainers.forEach(({ symbol, change }) => {
            const stock = overview.stocks[symbol];
            message += `${symbol}: +${change.toFixed(
              2
            )}% (${tradeSystem.formatNumber(stock.price)} Xu)\n`;
          });

          message += "\n🔻 TOP GIẢM GIÁ:\n";
          analysis.topLosers.forEach(({ symbol, change }) => {
            const stock = overview.stocks[symbol];
            message += `${symbol}: ${change.toFixed(
              2
            )}% (${tradeSystem.formatNumber(stock.price)} Xu)\n`;
          });

          message += "\n💎 TOÀN BỘ CỔ PHIẾU:\n";
          Object.entries(overview.stocks).forEach(([symbol, data]) => {
            const changeIcon =
              data.change > 0 ? "🔺" : data.change < 0 ? "🔻" : "➖";
            message += `${symbol}: ${tradeSystem.formatStockPrice(
              data.priceUSD
            )} (${tradeSystem.formatNumber(
              data.price
            )} Xu) ${changeIcon}${Math.abs(data.changePercent).toFixed(2)}%\n`;
          });

          return api.sendMessage(message, threadID, messageID);
        }

        case "buy": {
          const symbol = target[1]?.toUpperCase();
          const quantity = parseInt(target[2]);

          if (!symbol || !quantity || quantity <= 0) {
            return api.sendMessage(
              "❌ Vui lòng nhập mã cổ phiếu và số lượng hợp lệ!",
              threadID,
              messageID
            );
          }

          try {
            const result = await tradeSystem.buyStock(
              senderID,
              symbol,
              quantity
            );
            const message =
              "✅ GIAO DỊCH THÀNH CÔNG\n" +
              `🏢 Mã CP: ${result.symbol}\n` +
              `🔢 Số lượng: ${result.quantity}\n` +
              `💰 Giá cơ sở: ${tradeSystem.formatNumber(
                result.basePrice
              )} Xu\n` +
              `📊 Giá khớp: ${tradeSystem.formatNumber(result.price)} Xu\n` +
              `🔀 Slippage: ${result.slippage.toFixed(2)}%\n` +
              `💵 Tổng: ${tradeSystem.formatNumber(result.total)} Xu\n` +
              `📋 Phí GD: ${tradeSystem.formatNumber(
                result.transactionFee
              )} Xu\n` +
              `🏷️ Thuế: ${tradeSystem.formatNumber(result.tax)} Xu\n` +
              `💶 Tổng cộng: ${tradeSystem.formatNumber(
                result.totalWithFees
              )} Xu`;

            return api.sendMessage(message, threadID, messageID);
          } catch (error) {
            return api.sendMessage(
              `❌ Lỗi: ${error.message}`,
              threadID,
              messageID
            );
          }
        }

        case "sell": {
          const symbol = target[1]?.toUpperCase();
          const quantity = parseInt(target[2]);

          if (!symbol || !quantity || quantity <= 0) {
            return api.sendMessage(
              "❌ Vui lòng nhập mã cổ phiếu và số lượng hợp lệ!",
              threadID,
              messageID
            );
          }

          try {
            const result = await tradeSystem.sellStock(
              senderID,
              symbol,
              quantity
            );

            return api.sendMessage(
              "✅ GIAO DỊCH THÀNH CÔNG\n" +
                `🏢 Mã CP: ${result.symbol}\n` +
                `🔢 Số lượng: ${result.quantity}\n` +
                `💰 Giá cơ sở: ${tradeSystem.formatNumber(
                  result.basePrice
                )} Xu\n` +
                `📊 Giá khớp: ${tradeSystem.formatNumber(result.price)} Xu\n` +
                `🔀 Slippage: ${result.slippage.toFixed(2)}%\n` +
                `💵 Tổng: ${tradeSystem.formatNumber(result.total)} Xu\n` +
                `📋 Phí GD: ${tradeSystem.formatNumber(
                  result.transactionFee
                )} Xu\n` +
                `🏷️ Thuế: ${tradeSystem.formatNumber(result.tax)} Xu\n` +
                `💶 Thực nhận: ${tradeSystem.formatNumber(
                  result.finalValue
                )} Xu`,
              threadID,
              messageID
            );
          } catch (error) {
            return api.sendMessage(
              `❌ Lỗi: ${error.message}`,
              threadID,
              messageID
            );
          }
        }

        case "risk": {
          const portfolio = tradeSystem.getUserPortfolio(senderID);
          const marketAnalysis = tradeSystem.getMarketAnalysis();

          let message = "⚠️ CẢNH BÁO RỦI RO ⚠️\n";
          message += "━━━━━━━━━━━━━━━━━━\n\n";

          const marketVolatility = tradeSystem.calculateMarketVolatility();
          const marketSentiment = tradeSystem.getMarketSentiment();

          message += "📊 THỊ TRƯỜNG:\n";
          message += `Độ biến động: ${marketVolatility.toFixed(1)}%\n`;
          message += `Xu hướng: ${marketSentiment}\n`;
          message += `Tin tức đang hoạt động: ${tradeSystem.activeNews.length} tin\n\n`;

          message += "📝 LƯU Ý GIAO DỊCH:\n";
          message += "- Phí giao dịch: 1.0% (0.5% phụ phí cho giao dịch lớn)\n";
          message += "- Thuế: 0.5% trên giá trị giao dịch\n";
          message += "- Slippage tăng theo khối lượng giao dịch\n";
          message += "- Có 5% xác suất lệnh không khớp\n";

          return api.sendMessage(message, threadID, messageID);
        }

        case "wallet":
        case "portfolio": {
          const portfolio = tradeSystem.getUserPortfolio(senderID);
          let totalValue = 0;
          let message = "📈 DANH MỤC ĐẦU TƯ 📈\n━━━━━━━━━━━━━━━━━━\n\n";

          if (Object.keys(portfolio.stocks).length === 0) {
            return api.sendMessage(
              "Bạn chưa có cổ phiếu nào!",
              threadID,
              messageID
            );
          }

          Object.entries(portfolio.stocks).forEach(([symbol, data]) => {
            const stock = tradeSystem.getStockPrice(symbol);
            const currentValue = Math.floor(stock.price * data.quantity);
            const profitLoss = Math.floor(
              currentValue - Math.floor(data.averagePrice) * data.quantity
            );
            totalValue += currentValue;

            message += `🏢 ${symbol} - ${stock.name}\n`;
            message += `🔢 Số lượng: ${data.quantity}\n`;
            message += `💰 Giá TB: ${tradeSystem.formatNumber(
              data.averagePrice
            )}\n`;
            message += `📊 Giá HT: ${tradeSystem.formatNumber(stock.price)}\n`;
            message += `💵 Giá trị: ${tradeSystem.formatNumber(
              currentValue
            )}\n`;
            message += `${
              profitLoss >= 0 ? "📈" : "📉"
            } Lãi/Lỗ: ${tradeSystem.formatNumber(profitLoss)}\n\n`;
          });

          message += `💎 Tổng giá trị: ${tradeSystem.formatNumber(totalValue)}`;
          return api.sendMessage(message, threadID, messageID);
        }

        case "info": {
          const symbol = target[1]?.toUpperCase();

          if (!symbol) {
            return api.sendMessage(
              "❌ Vui lòng nhập mã cổ phiếu hợp lệ!",
              threadID,
              messageID
            );
          }

          try {
            const stock = tradeSystem.getStockPrice(symbol);
            const overview = tradeSystem.getMarketOverview();

            // Generate chart
            const chartData = {
              symbol,
              name: stock.name,
              timestamps: stock.history.map((h) => h.timestamp),
              prices: stock.history.map((h) => h.price),
              outputDir: CHART_DIR,
            };

            const chartPath = await StockChart.generate(chartData);

            // Calculate bid-ask spread
            const bidPrice = stock.bidPrice || stock.price * 0.998;
            const askPrice = stock.askPrice || stock.price * 1.002;
            const spreadAmount = askPrice - bidPrice;
            const spreadPercent = ((spreadAmount / askPrice) * 100).toFixed(2);

            const message =
              `🏢 ${symbol} - ${stock.name}\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `💰 Giá: ${tradeSystem.formatStockPrice(
                stock.priceUSD
              )} (${tradeSystem.formatNumber(stock.price)} Xu)\n` +
              `📊 Thay đổi: ${
                stock.change > 0 ? "+" : ""
              }${stock.change.toFixed(2)}%\n` +
              `📈 Volume: ${stock.volume.toLocaleString("vi-VN")}\n\n` +
              `💹 BID-ASK SPREAD:\n` +
              `🔴 Giá Bán (ASK): ${tradeSystem.formatNumber(askPrice)} Xu\n` +
              `🟢 Giá Mua (BID): ${tradeSystem.formatNumber(bidPrice)} Xu\n` +
              `📏 Chênh lệch: ${tradeSystem.formatNumber(
                spreadAmount
              )} Xu (${spreadPercent}%)\n\n` +
              `📊 ĐỘ SÂU THỊ TRƯỜNG:\n` +
              `🔴 Bán:\n${stock.depth.asks
                .map(
                  (level) =>
                    `   ${level.price}$ (${(
                      level.price * overview.xuRate
                    ).toLocaleString(
                      "vi-VN"
                    )} Xu) - ${level.volume.toLocaleString("vi-VN")} CP`
                )
                .join("\n")}\n` +
              `🟢 Mua:\n${stock.depth.bids
                .map(
                  (level) =>
                    `   ${level.price}$ (${(
                      level.price * overview.xuRate
                    ).toLocaleString(
                      "vi-VN"
                    )} Xu) - ${level.volume.toLocaleString("vi-VN")} CP`
                )
                .join("\n")}\n\n` +
              `⏰ Cập nhật: ${new Date().toLocaleString()}`;

            return api.sendMessage(
              {
                body: message,
                attachment: fs.createReadStream(chartPath),
              },
              threadID,
              (err) => {
                if (err)
                  return api.sendMessage(
                    `❌ Lỗi: ${err.message}`,
                    threadID,
                    messageID
                  );

                fs.unlinkSync(chartPath);
              }
            );
          } catch (error) {
            return api.sendMessage(
              `❌ Lỗi: ${error.message}`,
              threadID,
              messageID
            );
          }
        }
      }
    } catch (error) {
      return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
    }
  },
};
