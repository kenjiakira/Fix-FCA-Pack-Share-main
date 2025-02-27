const axios = require('axios');

module.exports = {
    name: "stock",
    dev: "HNT",
    category: "Tiện Ích", 
    usedby: 0,
    info: "Cung cấp thông tin về cổ phiếu.",
    onPrefix: true, 
    usages: `[stock] [period]`, 
    cooldowns: 5, 

    onLaunch: async function ({ event, actions, target }) {
        const { threadID, messageID } = event;

        if (target.length === 0) {
            const suggestions = `📊 Hướng dẫn sử dụng lệnh Stock:
            
1️⃣ Tra cứu cơ bản: .stock [mã CP]
Ví dụ: .stock AAPL

2️⃣ Tra cứu theo thời gian: .stock [mã CP] [khoảng thời gian]
Khoảng thời gian: 1D, 1W, 1M, 3M, 1Y
Ví dụ: .stock AAPL 1M

📈 Một số mã cổ phiếu phổ biến:
• AAPL - Apple Inc.
• MSFT - Microsoft
• GOOGL - Google
• AMZN - Amazon
• TSLA - Tesla
• META - Meta/Facebook
• NVDA - NVIDIA
• NFLX - Netflix`;
            return actions.reply(suggestions);
        }

        const symbol = target[0].toUpperCase();
        const period = target[1]?.toUpperCase() || '1D';
        const alphaVantageKey = 'M7805GIMOSWIQ36J';

        try {
            const [quoteData, overviewData] = await Promise.all([
                axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`),
                axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageKey}`)
            ]);

            const quote = quoteData.data['Global Quote'];
            const profile = overviewData.data;

            if (!quote || !profile) {
                return actions.reply("❌ Không tìm thấy thông tin cổ phiếu. Vui lòng kiểm tra lại mã cổ phiếu.");
            }

            const interval = period === '1D' ? '5min' : 'daily';
            const historicalData = await axios.get(
                `https://www.alphavantage.co/query?function=${period === '1D' ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY'}&symbol=${symbol}&interval=${interval}&apikey=${alphaVantageKey}`
            );

            const timeSeriesKey = period === '1D' ? 'Time Series (5min)' : 'Time Series (Daily)';
            const timeSeries = historicalData.data[timeSeriesKey];
            
            const timestamps = Object.keys(timeSeries).slice(0, 100);
            const prices = timestamps.map(time => parseFloat(timeSeries[time]['4. close']));
            
            const maxPrice = Math.max(...prices);
            const minPrice = Math.min(...prices);
            const padding = (maxPrice - minPrice) * 0.1; 

            const chartUrl = `https://quickchart.io/chart?c={
                type:'line',
                data:{
                    labels:${JSON.stringify(timestamps)},
                    datasets:[{
                        label:'${symbol} Price',
                        data:${JSON.stringify(prices.reverse())},
                        fill:true,
                        borderColor:'rgb(59, 130, 246)',
                        borderWidth:2,
                        pointRadius:0,
                        tension:0.4,
                        backgroundColor:'rgba(59, 130, 246, 0.1)'
                    }]
                },
                options:{
                    responsive:true,
                    plugins:{
                        title:{
                            display:true,
                            text:'${symbol} - ${period} Price Chart',
                            font:{size:16}
                        },
                        legend:{display:false}
                    },
                    scales:{
                        y:{
                            min:${minPrice - padding},
                            max:${maxPrice + padding},
                            ticks:{
                                callback:'function(value){return "$"+value.toFixed(2)}',
                                font:{size:11}
                            },
                            grid:{
                                display:true,
                                color:'rgba(0,0,0,0.1)'
                            }
                        },
                        x:{
                            ticks:{
                                maxRotation:0,
                                autoSkip:true,
                                maxTicksLimit:8,
                                font:{size:11}
                            },
                            grid:{display:false}
                        }
                    },
                    elements:{
                        point:{
                            radius:0,
                            hitRadius:10,
                            hoverRadius:4
                        }
                    },
                    animation:false
                }
            }`.replace(/\s+/g, '');

            const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer' });
            const chartPath = __dirname + `/cache/chart_${symbol}_${Date.now()}.png`;
            require('fs').writeFileSync(chartPath, chartResponse.data);

            const currentPrice = parseFloat(quote['05. price']);
            const previousClose = parseFloat(quote['08. previous close']);
            const priceChange = currentPrice - previousClose;
            const changePercent = (priceChange / previousClose * 100).toFixed(2);
            const changeEmoji = priceChange >= 0 ? '📈' : '📉';

            const message = `🏢 ${profile.Name} (${symbol})

💰 Thông tin giá:
${changeEmoji} Giá hiện tại: $${currentPrice.toFixed(2)}
↕️ Biến động: ${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)} (${changePercent}%)
⭐ Cao nhất: $${parseFloat(quote['03. high']).toFixed(2)}
💫 Thấp nhất: $${parseFloat(quote['04. low']).toFixed(2)}
🔄 Giá mở cửa: $${parseFloat(quote['02. open']).toFixed(2)}

📊 Thông tin công ty:
🏭 Ngành: ${profile.Industry}
🌐 Website: ${profile.AssetType}
💎 Vốn hóa: $${(parseFloat(profile.MarketCapitalization) / 1000000000).toFixed(2)}B
🏳️ Quốc gia: ${profile.Country}

⏰ Cập nhật: ${new Date().toLocaleString()}`;

            await actions.reply({
                body: message,
                attachment: require('fs').createReadStream(chartPath)
            });

            require('fs').unlinkSync(chartPath);
        } catch (error) {
            console.error(error);
            actions.reply("❌ Có lỗi xảy ra khi lấy thông tin cổ phiếu. Vui lòng thử lại sau hoặc kiểm tra mã cổ phiếu.");
        }
    }
};
