const axios = require('axios');
const fs = require('fs');
const path = require('path');

class StockChart {
    static async generate(data, options) {
        const {
            symbol,
            name,
            timestamps,
            prices,
            outputDir
        } = data;

        // Reverse arrays to show oldest data on left
        const reversedTimestamps = [...timestamps].reverse();
        const reversedPrices = [...prices].reverse();

        const maxPrice = Math.max(...reversedPrices);
        const minPrice = Math.min(...reversedPrices);
        const padding = (maxPrice - minPrice) * 0.1;

        const chartUrl = `https://quickchart.io/chart?c={
            type:'line',
            data:{
                labels:${JSON.stringify(reversedTimestamps)},
                datasets:[{
                    label:'${symbol}',
                    data:${JSON.stringify(reversedPrices)},
                    fill:true,
                    borderColor:'rgb(56, 178, 172)',
                    borderWidth:3,
                    pointRadius:2,
                    pointBackgroundColor:'rgb(56, 178, 172)',
                    pointBorderColor:'white',
                    pointBorderWidth:2,
                    pointHoverRadius:6,
                    tension:0.4,
                    backgroundColor:'rgba(56, 178, 172, 0.1)',
                    segment:{
                        borderColor:ctx => {
                            if (!ctx.p0.parsed) return;
                            return ctx.p0.parsed.y > ctx.p1.parsed.y ? 
                                'rgb(239, 68, 68)' : 
                                'rgb(34, 197, 94)'
                        }
                    }
                }]
            },
            options:{
                responsive:true,
                indexAxis:'x',
                plugins:{
                    title:{
                        display:true,
                        text:'${symbol} - ${name}',
                        font:{
                            size:20,
                            weight:'bold'
                        },
                        padding:20
                    },
                    legend:{
                        display:false
                    },
                    tooltip:{
                        backgroundColor:'rgba(0, 0, 0, 0.8)',
                        titleFont:{
                            size:14,
                            weight:'bold'
                        },
                        bodyFont:{
                            size:13
                        },
                        padding:12,
                        displayColors:false
                    }
                },
                scales:{
                    y:{
                        min:${minPrice - padding},
                        max:${maxPrice + padding},
                        grid:{
                            color:'rgba(0, 0, 0, 0.05)',
                            drawBorder:false
                        },
                        ticks:{
                            callback:'function(value){return value.toLocaleString("vi-VN")+" Xu"}',
                            font:{
                                size:12,
                                weight:'bold'
                            },
                            padding:10
                        }
                    },
                    x:{
                        position:'bottom',
                        reverse:false,
                        grid:{
                            display:false
                        },
                        ticks:{
                            maxRotation:45,
                            maxTicksLimit:8,
                            font:{
                                size:12,
                                weight:'bold'
                            },
                            padding:8
                        }
                    }
                },
                layout:{
                    padding:{
                        left:15,
                        right:15,
                        top:15,
                        bottom:15
                    }
                },
                elements:{
                    point:{
                        hitRadius:8,
                        hoverBorderWidth:3
                    }
                }
            }
        }`.replace(/\s+/g, '');

        const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer' });
        const chartPath = path.join(outputDir, `trade_chart_${symbol}_${Date.now()}.png`);
        
        if (!fs.existsSync(path.dirname(chartPath))) {
            fs.mkdirSync(path.dirname(chartPath), { recursive: true });
        }
        
        fs.writeFileSync(chartPath, chartResponse.data);
        return chartPath;
    }
}

module.exports = StockChart;
