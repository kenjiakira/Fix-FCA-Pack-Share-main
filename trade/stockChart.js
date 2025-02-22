const axios = require('axios');
const fs = require('fs');
const path = require('path');

class StockChart {
    static async generate(data, options = {}) {
        const {
            symbol,
            name,
            timestamps,
            prices,
            outputDir
        } = data;

        // Calculate price changes for color coding
        const priceChanges = prices.map((price, i) => {
            if (i === 0) return 0;
            return price - prices[i - 1];
        });

        // Calculate moving averages
        const ma20 = this.calculateMA(prices, 20);
        const ma50 = this.calculateMA(prices, 50);

        // Calculate min/max for better scaling
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const padding = (maxPrice - minPrice) * 0.1;

        // Format timestamps for better display
        const formattedTimestamps = timestamps.map(ts => {
            const date = new Date(ts);
            return `${date.getDate()}/${date.getMonth() + 1}\n${date.getHours()}:${date.getMinutes()}`;
        });

        const chartConfig = {
            type: 'line',
            data: {
                labels: formattedTimestamps,
                datasets: [
                    {
                        label: symbol,
                        data: prices,
                        fill: true,
                        borderColor: 'rgb(56, 178, 172)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: priceChanges.map(change => 
                            change > 0 ? 'rgb(34, 197, 94)' : 
                            change < 0 ? 'rgb(239, 68, 68)' : 
                            'rgb(56, 178, 172)'
                        ),
                        pointBorderColor: 'white',
                        pointBorderWidth: 2,
                        pointHoverRadius: 6,
                        tension: 0.4,
                        backgroundColor: 'rgba(56, 178, 172, 0.1)'
                    },
                    {
                        label: 'MA20',
                        data: ma20,
                        borderColor: 'rgba(234, 179, 8, 0.8)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'MA50',
                        data: ma50,
                        borderColor: 'rgba(168, 85, 247, 0.8)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                indexAxis: 'x',
                plugins: {
                    title: {
                        display: true,
                        text: `${symbol} - ${name}`,
                        font: {
                            size: 20,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                const price = context.raw;
                                const change = context.dataIndex > 0 ? 
                                    price - context.dataset.data[context.dataIndex - 1] : 
                                    0;
                                const changePercent = context.dataIndex > 0 ? 
                                    (change / context.dataset.data[context.dataIndex - 1] * 100).toFixed(2) : 
                                    0;
                                return [
                                    `Giá: ${price.toLocaleString('vi-VN')} Xu`,
                                    `Thay đổi: ${change >= 0 ? '+' : ''}${change.toLocaleString('vi-VN')} Xu (${changePercent}%)`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: minPrice - padding,
                        max: maxPrice + padding,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('vi-VN') + ' Xu';
                            },
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 10
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            maxTicksLimit: 8,
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 8
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 15,
                        right: 15,
                        top: 15,
                        bottom: 15
                    }
                }
            }
        };

        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
        const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer' });
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const chartPath = path.join(outputDir, `trade_chart_${symbol}_${Date.now()}.png`);
        fs.writeFileSync(chartPath, chartResponse.data);
        
        return chartPath;
    }

    static calculateMA(prices, period) {
        const ma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                ma.push(null);
                continue;
            }
            
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += prices[i - j];
            }
            ma.push(sum / period);
        }
        return ma;
    }
}

module.exports = StockChart;
