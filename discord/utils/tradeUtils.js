const { EmbedBuilder } = require('discord.js');
const TradeSystem = require('../../trade/TradeSystem');
const tradeSystem = new TradeSystem();

const MARKET_HOURS = { open: 9, close: 19 };
const NITRO_TO_XU_RATE = 100; // 1 Nitro = 100 Xu

function convertXuToNitro(xu) {
    return Math.floor(xu / NITRO_TO_XU_RATE);
}

function convertNitroToXu(nitro) {
    return nitro * NITRO_TO_XU_RATE;
}

function formatNitro(xu) {
    return `${tradeSystem.formatNumber(convertXuToNitro(xu))} Nitro`;
}

function createMarketOverviewEmbed() {
    const overview = tradeSystem.getMarketOverview();
    const analysis = tradeSystem.getMarketAnalysis();
    const isMarketOpen = tradeSystem.isMarketOpen();

    const embed = new EmbedBuilder()
        .setTitle('📊 Market Overview')
        .setColor(isMarketOpen ? '#00ff00' : '#ff0000')
        .setDescription(`Market Status: ${isMarketOpen ? '🟢 Open' : '🔴 Closed'}\nTrading Hours: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00`)
        .addFields(
            { name: 'Exchange Rate', value: `1 Nitro = 100 Xu`, inline: true },
            { name: 'Volume', value: tradeSystem.formatNumber(analysis.totalVolume), inline: true },
            { name: 'Value', value: formatNitro(analysis.totalValue), inline: true },
            { name: 'Trend', value: analysis.marketSentiment, inline: true }
        );

    // Top Gainers
    let gainersText = '';
    analysis.topGainers.forEach(({symbol, change}) => {
        const stock = overview.stocks[symbol];
        gainersText += `${symbol}: +${change.toFixed(2)}% (${formatNitro(stock.price)})\n`;
    });
    embed.addFields({ name: '🔺 Top Gainers', value: gainersText || 'None', inline: false });

    // Top Losers
    let losersText = '';
    analysis.topLosers.forEach(({symbol, change}) => {
        const stock = overview.stocks[symbol];
        losersText += `${symbol}: ${change.toFixed(2)}% (${formatNitro(stock.price)})\n`;
    });
    embed.addFields({ name: '🔻 Top Losers', value: losersText || 'None', inline: false });

    // All Stocks
    let stocksText = '';
    Object.entries(overview.stocks).forEach(([symbol, data]) => {
        const changeIcon = data.change > 0 ? "🔺" : data.change < 0 ? "🔻" : "➖";
        stocksText += `${symbol}: ${tradeSystem.formatStockPrice(data.priceUSD)} (${formatNitro(data.price)}) ${changeIcon}${Math.abs(data.changePercent).toFixed(2)}%\n`;
    });
    embed.addFields({ name: '💎 All Stocks', value: stocksText || 'None', inline: false });

    return embed;
}

function createTradeResultEmbed(result, type = 'buy') {
    const embed = new EmbedBuilder()
        .setTitle('✅ Trade Successful')
        .setColor('#00ff00')
        .addFields(
            { name: 'Stock', value: result.symbol, inline: true },
            { name: 'Quantity', value: result.quantity.toString(), inline: true },
            { name: 'Price', value: formatNitro(result.price), inline: true },
            { name: 'Total', value: formatNitro(result.total), inline: true },
            { name: 'Fees', value: formatNitro(result.transactionFee), inline: true },
            { name: 'Tax', value: formatNitro(result.tax), inline: true }
        );

    if (type === 'buy') {
        embed.addFields({ name: 'Final Total', value: formatNitro(result.totalWithFees), inline: false });
    } else {
        embed.addFields({ name: 'Final Value', value: formatNitro(result.finalValue), inline: false });
    }

    return embed;
}

function createPortfolioEmbed(userId) {
    const portfolio = tradeSystem.getUserPortfolio(userId);
    let totalValue = 0;

    const embed = new EmbedBuilder()
        .setTitle('📈 Portfolio')
        .setColor('#0099ff');

    Object.entries(portfolio.stocks).forEach(([symbol, data]) => {
        const stock = tradeSystem.getStockPrice(symbol);
        const currentValue = Math.floor(stock.price * data.quantity);
        const profitLoss = Math.floor(currentValue - (Math.floor(data.averagePrice) * data.quantity));
        totalValue += currentValue;

        embed.addFields({
            name: `${symbol} - ${stock.name}`,
            value: `Quantity: ${data.quantity}\n` +
                  `Avg Price: ${formatNitro(data.averagePrice)}\n` +
                  `Current Price: ${formatNitro(stock.price)}\n` +
                  `Value: ${formatNitro(currentValue)}\n` +
                  `P/L: ${formatNitro(profitLoss)}`,
            inline: false
        });
    });

    embed.addFields({ 
        name: 'Total Portfolio Value', 
        value: formatNitro(totalValue), 
        inline: false 
    });

    return embed;
}

function createStockInfoEmbed(symbol) {
    const stock = tradeSystem.getStockPrice(symbol);
    const overview = tradeSystem.getMarketOverview();

    const embed = new EmbedBuilder()
        .setTitle(`${symbol} - ${stock.name}`)
        .setColor('#0099ff')
        .addFields(
            { name: 'Price', value: `${tradeSystem.formatStockPrice(stock.priceUSD)} (${formatNitro(stock.price)})`, inline: true },
            { name: 'Change', value: `${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%`, inline: true },
            { name: 'Volume', value: stock.volume.toLocaleString('vi-VN'), inline: true }
        );

    // Market Depth
    let asksText = stock.depth.asks.map(level => 
        `${level.price}$ (${formatNitro(level.price * overview.xuRate)}) - ${level.volume.toLocaleString('vi-VN')} shares`
    ).join('\n');
    let bidsText = stock.depth.bids.map(level => 
        `${level.price}$ (${formatNitro(level.price * overview.xuRate)}) - ${level.volume.toLocaleString('vi-VN')} shares`
    ).join('\n');

    embed.addFields(
        { name: '🔴 Sell Orders', value: asksText || 'None', inline: false },
        { name: '🟢 Buy Orders', value: bidsText || 'None', inline: false }
    );

    return embed;
}

module.exports = {
    tradeSystem,
    createMarketOverviewEmbed,
    createTradeResultEmbed,
    createPortfolioEmbed,
    createStockInfoEmbed,
    convertXuToNitro,
    convertNitroToXu
};
