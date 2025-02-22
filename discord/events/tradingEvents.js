const { EmbedBuilder } = require('discord.js');
const tradingSync = require('../utils/tradingSync');
const TradeSystem = require('../../trade/TradeSystem');
const tradeSystem = new TradeSystem();

module.exports = {
    name: 'tradingEvents',
    
    async handleTradeUpdate(client, data) {
        try {
            const { type, userId, platform, details } = data;
            
            // Get linked Discord ID if update is from Messenger
            const discordId = platform === 'messenger' 
                ? tradingSync.getLinkedAccount(userId, 'messenger')
                : userId;

            if (!discordId) return;

            const user = await client.users.fetch(discordId);
            if (!user) return;

            switch (type) {
                case 'TRADE_EXECUTED': {
                    const embed = new EmbedBuilder()
                        .setTitle('Trade Executed')
                        .setColor('#00ff00')
                        .setTimestamp()
                        .addFields(
                            { name: 'Symbol', value: details.symbol, inline: true },
                            { name: 'Type', value: details.type, inline: true },
                            { name: 'Quantity', value: details.quantity.toString(), inline: true },
                            { name: 'Price', value: `${tradeSystem.formatNumber(details.price)} Xu`, inline: true },
                            { name: 'Total', value: `${tradeSystem.formatNumber(details.total)} Xu`, inline: true }
                        );

                    await user.send({ embeds: [embed] });
                    break;
                }

                case 'MARGIN_CALL': {
                    const embed = new EmbedBuilder()
                        .setTitle('⚠️ Margin Call Warning')
                        .setColor('#ff0000')
                        .setDescription('Your margin position requires immediate attention!')
                        .addFields(
                            { name: 'Symbol', value: details.symbol, inline: true },
                            { name: 'Current Ratio', value: `${details.currentRatio}%`, inline: true },
                            { name: 'Required Action', value: details.requiredAction, inline: false },
                            { name: 'Deadline', value: new Date(details.deadline).toLocaleString(), inline: false }
                        )
                        .setTimestamp();

                    await user.send({ embeds: [embed] });
                    break;
                }

                case 'ORDER_FILLED': {
                    const embed = new EmbedBuilder()
                        .setTitle('Order Filled')
                        .setColor('#0099ff')
                        .addFields(
                            { name: 'Order ID', value: details.orderId, inline: true },
                            { name: 'Symbol', value: details.symbol, inline: true },
                            { name: 'Type', value: details.orderType, inline: true },
                            { name: 'Quantity', value: details.quantity.toString(), inline: true },
                            { name: 'Price', value: `${tradeSystem.formatNumber(details.price)} Xu`, inline: true },
                            { name: 'Total', value: `${tradeSystem.formatNumber(details.total)} Xu`, inline: true }
                        )
                        .setTimestamp();

                    await user.send({ embeds: [embed] });
                    break;
                }

                case 'PORTFOLIO_UPDATE': {
                    const embed = new EmbedBuilder()
                        .setTitle('Portfolio Update')
                        .setColor('#0099ff')
                        .addFields(
                            { name: 'Total Value', value: `${tradeSystem.formatNumber(details.totalValue)} Xu`, inline: true },
                            { name: 'Day Change', value: `${details.dayChange > 0 ? '+' : ''}${details.dayChange}%`, inline: true }
                        );

                    if (details.significantMoves.length > 0) {
                        const movesText = details.significantMoves
                            .map(move => `${move.symbol}: ${move.change > 0 ? '+' : ''}${move.change}%`)
                            .join('\n');
                        embed.addFields({ name: 'Significant Moves', value: movesText, inline: false });
                    }

                    embed.setTimestamp();
                    await user.send({ embeds: [embed] });
                    break;
                }

                case 'MARKET_ALERT': {
                    const embed = new EmbedBuilder()
                        .setTitle('Market Alert')
                        .setColor('#ffa500')
                        .setDescription(details.message)
                        .addFields(
                            { name: 'Type', value: details.alertType, inline: true },
                            { name: 'Symbol', value: details.symbol || 'Market-wide', inline: true }
                        )
                        .setTimestamp();

                    await user.send({ embeds: [embed] });
                    break;
                }
            }

            // Log the event
            tradingSync.logTransaction({
                discordId: discordId,
                messengerId: platform === 'messenger' ? userId : tradingSync.getLinkedAccount(discordId),
                type: type,
                ...details,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('Error handling trade update:', error);
        }
    },

    async handleMarketUpdate(client, data) {
        try {
            const { type, details } = data;

            // Get all trading channels
            const tradingChannels = client.channels.cache.filter(
                channel => channel.name.includes('trading') && channel.isText()
            );

            switch (type) {
                case 'MARKET_OPEN': {
                    const embed = new EmbedBuilder()
                        .setTitle('🟢 Market Open')
                        .setColor('#00ff00')
                        .setDescription('The trading day has begun!')
                        .addFields(
                            { name: 'Trading Hours', value: '9:00 - 19:00', inline: true },
                            { name: 'Market Status', value: '🟢 Active', inline: true }
                        )
                        .setTimestamp();

                    for (const channel of tradingChannels.values()) {
                        await channel.send({ embeds: [embed] });
                    }
                    break;
                }

                case 'MARKET_CLOSE': {
                    const embed = new EmbedBuilder()
                        .setTitle('🔴 Market Close')
                        .setColor('#ff0000')
                        .setDescription('Trading day has ended')
                        .addFields(
                            { name: 'Summary', value: details.summary, inline: false },
                            { name: 'Volume', value: tradeSystem.formatNumber(details.volume), inline: true },
                            { name: 'Value', value: `${tradeSystem.formatNumber(details.value)} Xu`, inline: true }
                        )
                        .setTimestamp();

                    for (const channel of tradingChannels.values()) {
                        await channel.send({ embeds: [embed] });
                    }
                    break;
                }

                case 'MARKET_SUMMARY': {
                    const embed = new EmbedBuilder()
                        .setTitle('📊 Market Summary')
                        .setColor('#0099ff')
                        .addFields(
                            { name: 'Top Gainers', value: details.topGainers.map(stock => 
                                `${stock.symbol}: +${stock.change}%`).join('\n') || 'None', inline: true },
                            { name: 'Top Losers', value: details.topLosers.map(stock => 
                                `${stock.symbol}: ${stock.change}%`).join('\n') || 'None', inline: true }
                        )
                        .setTimestamp();

                    for (const channel of tradingChannels.values()) {
                        await channel.send({ embeds: [embed] });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error handling market update:', error);
        }
    }
};
