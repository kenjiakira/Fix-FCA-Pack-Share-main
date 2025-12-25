const axios = require('axios');
const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler } = require('chart.js');
const { CRYPTO } = require('../utils/api');

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler);

module.exports = {
    name: 'crypto',
    info: 'Xem giá tiền điện tử',
    dev: 'Hoàng Ngọc Từ',
    onPrefix: true,
    category: "Tiện Ích",
    usedby: 0,
    dmUser: false,
    nickName: ['crypto', 'bitcoin', 'coin'],
    usages: 'crypto [symbol] [timeframe]\n\nHướng dẫn sử dụng:\n' +
        '1. Gõ lệnh `crypto` để xem giá các đồng tiền điện tử phổ biến và biểu đồ.\n' +
        '2. Gõ `crypto [symbol]` để xem thông tin chi tiết về một đồng tiền cụ thể (ví dụ: crypto btc).\n' +
        '3. Gõ `crypto [symbol] [timeframe]` để xem biểu đồ theo khung thời gian (1d, 7d, 30d).\n' +
        '4. Thông tin được cập nhật theo thời gian thực.',
    cooldowns: 10,

    CRYPTO_LIST: [
        { id: 'bitcoin', symbol: 'BTC', icon: '📌' },
        { id: 'ethereum', symbol: 'ETH', icon: '💎' },
        { id: 'binancecoin', symbol: 'BNB', icon: '🌟' },
        { id: 'solana', symbol: 'SOL', icon: '☀️' },
        { id: 'cardano', symbol: 'ADA', icon: '🔷' },
        { id: 'dogecoin', symbol: 'DOGE', icon: '🐶' },
        { id: 'polkadot', symbol: 'DOT', icon: '⭕' },
        { id: 'ripple', symbol: 'XRP', icon: '💫' },
        { id: 'avalanche-2', symbol: 'AVAX', icon: '❄️' },
        { id: 'chainlink', symbol: 'LINK', icon: '⛓️' },
        { id: 'polygon', symbol: 'MATIC', icon: '🔮' },
        { id: 'uniswap', symbol: 'UNI', icon: '🦄' }
    ],

    TIMEFRAMES: {
        '1d': { days: '1', label: '24 giờ' },
        '7d': { days: '7', label: '7 ngày' },
        '30d': { days: '30', label: '30 ngày' }
    },

    formatCurrency: (number) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            maximumFractionDigits: 0 
        }).format(number);
    },

    formatNumber: (number) => {
        if (number >= 1e9) {
            return (number / 1e9).toFixed(2) + 'B';
        } else if (number >= 1e6) {
            return (number / 1e6).toFixed(2) + 'M';
        } else if (number >= 1e3) {
            return (number / 1e3).toFixed(2) + 'K';
        }
        return number.toFixed(2);
    },

    formatPercentage: (value) => {
        if (value === undefined || value === null) {
            return 'N/A';  
        }
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    },

    calculateMA: function(data, period) {
        const result = [];
        for (let i = 0; i < period - 1; i++) {
            result.push(null);
        }

        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    },

    generateChart: async function (chartData, timeRange, cryptoSymbol, cryptoName) {
        const width = 1500; 
        const height = 900;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Enhanced background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#1a237e');
        bgGradient.addColorStop(0.5, '#000051');
        bgGradient.addColorStop(1, '#000028');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Enhanced grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }

        const priceStart = chartData[0][1];
        const priceEnd = chartData[chartData.length - 1][1];
        const priceChange = ((priceEnd - priceStart) / priceStart) * 100;

        const primaryColor = priceChange >= 0 ? 
            'rgba(0, 255, 127, 0.9)' : 'rgba(255, 69, 0, 0.9)';
        const secondaryColor = priceChange >= 0 ? 
            'rgba(0, 255, 127, 0.05)' : 'rgba(255, 69, 0, 0.05)';

        const gradientLine = ctx.createLinearGradient(0, 0, 0, height);
        gradientLine.addColorStop(0, primaryColor);
        gradientLine.addColorStop(1, secondaryColor);

        const labels = chartData.map(dataPoint => {
            const date = new Date(dataPoint[0]);
            if (timeRange === '1') {
                return date.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                });
            } else {
                return date.toLocaleDateString('vi-VN', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit'
                });
            }
        });

        const data = chartData.map(dataPoint => dataPoint[1]);

        const ma20 = this.calculateMA(data, 20);
        const ma50 = this.calculateMA(data, 50);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `Giá ${cryptoSymbol}`,
                        data: data,
                        borderColor: primaryColor,
                        borderWidth: 2.5,
                        fill: true,
                        backgroundColor: gradientLine,
                        pointRadius: 0,
                        pointHoverRadius: 10,
                        pointBackgroundColor: '#ffffff',
                        pointHoverBackgroundColor: primaryColor,
                        pointBorderColor: primaryColor,
                        pointHoverBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        tension: 0.35,
                        order: 1
                    },
                    {
                        label: 'MA20',
                        data: ma20,
                        borderColor: 'rgba(255, 215, 0, 0.8)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.35,
                        order: 2
                    },
                    {
                        label: 'MA50',
                        data: ma50,
                        borderColor: 'rgba(147, 112, 219, 0.8)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.35,
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                layout: {
                    padding: {
                        top: 50,
                        right: 50,
                        bottom: 40,
                        left: 50
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 16,
                                family: "'Arial', sans-serif",
                                weight: '600'
                            },
                            padding: 25,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    title: {
                        display: true,
                        text: [
                            `${cryptoSymbol.toUpperCase()} - ${timeRange} Ngày`,
                            `Thay đổi: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`
                        ],
                        color: '#ffffff',
                        font: {
                            size: 24,
                            family: "'Arial', sans-serif",
                            weight: '700'
                        },
                        padding: {
                            top: 25,
                            bottom: 35
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: primaryColor,
                        borderWidth: 1,
                        padding: 18,
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 14
                        },
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === `Giá ${cryptoSymbol}`) {
                                    return `Giá: $${context.parsed.y.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}`;
                                }
                                return `${context.dataset.label}: $${context.parsed.y.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)',
                            drawBorder: false,
                            tickLength: 10
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 13,
                                family: "'Arial', sans-serif",
                                weight: '500'
                            },
                            maxRotation: 45,
                            minRotation: 45,
                            padding: 10
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)',
                            drawBorder: false,
                            drawTicks: false
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 14,
                                family: "'Arial', sans-serif",
                                weight: '500'
                            },
                            padding: 10,
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                hover: {
                    mode: 'index',
                    intersect: false
                }
            }
        });

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Created by ' + this.dev, width - 60, height - 25);

        const buffer = canvas.toBuffer('image/png', { quality: 1, progressive: true });
        const path = '../database/cache/crypto_chart.png';
        await fs.writeFile(path, buffer);
        return path;
    },

    onLaunch: async function ({ api, event, target }) {
        try {
            let cryptoName = target[0]?.toLowerCase() || 'bitcoin';
            let timeframe = target[1]?.toLowerCase() || '1d';

            // Handle symbol input (e.g., 'btc' instead of 'bitcoin')
            const crypto = this.CRYPTO_LIST.find(c => 
                c.symbol.toLowerCase() === cryptoName || 
                c.id.toLowerCase() === cryptoName
            );

            if (!crypto) {
                const availableSymbols = this.CRYPTO_LIST.map(c => c.symbol).join(', ');
                await api.sendMessage(
                    `Không tìm thấy thông tin về loại "${cryptoName}".\n` +
                    `Các mã có sẵn: ${availableSymbols}`, 
                    event.threadID
                );
                return;
            }

            // Validate timeframe
            if (!this.TIMEFRAMES[timeframe]) {
                const availableTimeframes = Object.keys(this.TIMEFRAMES).join(', ');
                await api.sendMessage(
                    `Khung thời gian "${timeframe}" không hợp lệ.\n` +
                    `Các khung thời gian có sẵn: ${availableTimeframes}`,
                    event.threadID
                );
                return;
            }

            // Fetch detailed crypto data
            const detailResponse = await axios.get(`${CRYPTO.COINGECKO_BASE_URL}/coins/${crypto.id}`, {
                params: {
                    localization: false,
                    tickers: false,
                    community_data: false,
                    developer_data: false,
                    sparkline: false
                }
            });

            // Fetch prices for all cryptos
            const pricesResponse = await axios.get(`${CRYPTO.COINGECKO_BASE_URL}/simple/price`, {
                params: {
                    ids: this.CRYPTO_LIST.map(c => c.id).join(','),
                    vs_currencies: 'usd',
                    include_24h_change: true,
                    include_24h_vol: true,
                    include_market_cap: true
                }
            });

            // Get VND exchange rate
            const exchangeRateResponse = await axios.get(`${CRYPTO.EXCHANGE_RATE_BASE_URL}/latest.json?app_id=${CRYPTO.EXCHANGE_RATE_API_KEY}`);
            const exchangeRateVND = exchangeRateResponse.data.rates.VND || 0;

            if (exchangeRateVND === 0) {
                throw new Error('Không thể lấy tỉ giá VND');
            }

            const cryptoData = pricesResponse.data[crypto.id];
            const priceUSD = cryptoData?.usd || 0;
            const priceVND = priceUSD * exchangeRateVND;
            const change24h = cryptoData?.usd_24h_change || 0;
            const marketCap = cryptoData?.usd_market_cap || 0;
            const volume24h = cryptoData?.usd_24h_vol || 0;

            let message = `${crypto.icon} ${crypto.symbol.toUpperCase()} - ${detailResponse.data.name}\n`;
            message += `━━━━━━━━━━━━━━━━━━\n\n`;
            message += `💵 Giá USD: $${priceUSD.toLocaleString()}\n`;
            message += `💰 Giá VND: ${this.formatCurrency(priceVND)}\n`;
            message += `📊 Thay đổi 24h: ${this.formatPercentage(change24h)}\n`;
            message += `📈 Vốn hóa: $${this.formatNumber(marketCap)}\n`;
            message += `💹 Khối lượng 24h: $${this.formatNumber(volume24h)}\n\n`;

            // Fetch chart data
            const { days, label } = this.TIMEFRAMES[timeframe];
            const chartResponse = await axios.get(`${CRYPTO.COINGECKO_BASE_URL}/coins/${crypto.id}/market_chart`, {
                params: { 
                    vs_currency: 'usd', 
                    days: days
                }
            });

            const chartPath = await this.generateChart(
                chartResponse.data.prices, 
                days,
                crypto.symbol,
                detailResponse.data.name
            );

            await api.sendMessage({
                body: message + `Biểu đồ giá ${crypto.symbol.toUpperCase()} ${label} qua`,
                attachment: fs.createReadStream(chartPath)
            }, event.threadID);

        } catch (error) {
            console.error('Crypto Error:', error);
            let errorMessage = 'Đã xảy ra lỗi khi cập nhật thông tin tiền điện tử.';
            
            if (error.response) {
                if (error.response.status === 429) {
                    errorMessage = 'Đã vượt quá giới hạn yêu cầu API. Vui lòng thử lại sau ít phút.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Không tìm thấy thông tin về đồng tiền này.';
                }
            }
            
            await api.sendMessage(errorMessage, event.threadID);
        }
    }
};
