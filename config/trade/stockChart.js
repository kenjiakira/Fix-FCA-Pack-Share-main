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

        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const padding = (maxPrice - minPrice) * 0.1;

        const chartUrl = `https://quickchart.io/chart?c={
            type:'line',
            data:{
                labels:${JSON.stringify(timestamps)},
                datasets:[{
                    label:'${symbol} Price',
                    data:${JSON.stringify(prices)},
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
                        text:'${symbol} - ${name}',
                        font:{size:16}
                    },
                    legend:{display:false}
                },
                scales:{
                    y:{
                        min:${minPrice - padding},
                        max:${maxPrice + padding},
                        ticks:{
                            callback:'function(value){return value.toLocaleString("vi-VN")+" Xu"}',
                            font:{size:11}
                        }
                    },
                    x:{
                        ticks:{
                            maxRotation:45,
                            maxTicksLimit:8,
                            font:{size:11}
                        }
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
