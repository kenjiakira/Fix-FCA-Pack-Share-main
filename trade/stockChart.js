const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler } = require('chart.js');

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler);

class StockChart {
    static async generate(data, options = {}) {
        const {
            symbol,
            name,
            timestamps,
            prices,
            outputDir,
            theme = 'dark'
        } = data;

        // Format timestamps
        const formattedTimestamps = timestamps.map(ts => {
            const date = new Date(ts);
            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        });

        // Calculate indicators
        const priceChanges = this.calculatePriceChanges(prices);
        const ma20 = this.calculateMA(prices, 20);
        const ma50 = this.calculateMA(prices, 50);

        // Setup canvas
        const width = 1500;
        const height = 900;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Create background
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#1a237e');
        bgGradient.addColorStop(0.5, '#000051');
        bgGradient.addColorStop(1, '#000028');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Add grid
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

        // Calculate price changes for colors
        const priceStart = prices[0];
        const priceEnd = prices[prices.length - 1];
        const priceChange = ((priceEnd - priceStart) / priceStart) * 100;

        const primaryColor = priceChange >= 0 ? 
            'rgba(0, 255, 127, 0.9)' : 'rgba(255, 69, 0, 0.9)';
        const secondaryColor = priceChange >= 0 ? 
            'rgba(0, 255, 127, 0.05)' : 'rgba(255, 69, 0, 0.05)';

        // Create gradient for line
        const gradientLine = ctx.createLinearGradient(0, 0, 0, height);
        gradientLine.addColorStop(0, primaryColor);
        gradientLine.addColorStop(1, secondaryColor);

        // Create chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedTimestamps,
                datasets: [
                    {
                        label: `Giá ${symbol}`,
                        data: prices,
                        borderColor: primaryColor,
                        borderWidth: 2.5,
                        fill: true,
                        backgroundColor: gradientLine,
                        pointRadius: 0,
                        pointHoverRadius: 10,
                        tension: 0.35
                    },
                    {
                        label: 'MA20',
                        data: ma20,
                        borderColor: 'rgba(255, 215, 0, 0.8)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.35
                    },
                    {
                        label: 'MA50',
                        data: ma50,
                        borderColor: 'rgba(147, 112, 219, 0.8)', 
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.35
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
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
                            padding: 25
                        }
                    },
                    title: {
                        display: true,
                        text: [
                            `${symbol} - ${name}`,
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
                        callbacks: {
                            label: function(context) {
                                return `Giá: ${context.parsed.y.toLocaleString('vi-VN')} Xu`;  
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 13
                            },
                            maxRotation: 45
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)', 
                            drawBorder: false
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 14
                            },
                            callback: function(value) {
                                return value.toLocaleString('vi-VN') + ' Xu';
                            }
                        }
                    }
                }
            }
        });

        // Add watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Created by HNT', width - 60, height - 25);

        // Save chart
        const buffer = canvas.toBuffer('image/png');
        const chartPath = path.join(outputDir, `trade_chart_${symbol}_${Date.now()}.png`);
        await fs.writeFile(chartPath, buffer);

        return chartPath;
    }

    static calculatePriceChanges(prices) {
        return prices.map((price, i) => {
            if (i === 0) return 0;
            return price - prices[i - 1];
        });
    }

    static calculateMA(prices, period) {
        return prices.map((_, i) => {
            if (i < period - 1) return null;
            const slice = prices.slice(i - period + 1, i + 1);
            return slice.reduce((sum, p) => sum + p, 0) / period;
        });
    }

    static calculateRSI(prices, period = 14) {
        const changes = prices.slice(1).map((price, i) => price - prices[i]);
        const gains = changes.map(c => c > 0 ? c : 0);
        const losses = changes.map(c => c < 0 ? -c : 0);
        
        const avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
        const avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
        
        let rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    static formatNumber(number) {
        if (number >= 1e6) return `${(number / 1e6).toFixed(2)}M`;
        if (number >= 1e3) return `${(number / 1e3).toFixed(2)}K`;
        return number.toString();
    }
}

module.exports = StockChart;
    