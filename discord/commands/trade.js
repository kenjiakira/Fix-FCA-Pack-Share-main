const tradeUtils = require('../utils/tradeUtils');
const { TRADE_CHANNEL } = require('../config/channels');

module.exports = {
    name: 'trade',
    description: 'Giao dịch chứng khoán và quản lý danh mục đầu tư',
    usage: 'trade <buy/sell/portfolio/info> [symbol] [quantity]',

    onLoad: async function(client) {
        try {
            const channel = await client.channels.fetch(TRADE_CHANNEL);
            if (!channel) return;

            const messages = await channel.messages.fetch({ limit: 100 });
            const oldMessages = messages.filter(m => m.author.id === client.user.id);
            await channel.bulkDelete(oldMessages).catch(console.error);
        } catch (error) {
            console.error('[TRADE] Failed to clean up old messages:', error);
        }
    },

    execute: async function(message, args) {
        try {
            if (message.channel.id !== TRADE_CHANNEL) {
                return;
            }

            try {
                await message.delete();
            } catch (error) {
                console.error('[TRADE] Failed to delete command message:', error);
            }

            let responseMessage = await message.channel.send('🔄 Đang xử lý...');

            if (!args[0]) {
                await responseMessage.edit('❌ Vui lòng nhập lệnh: trade <buy/sell/portfolio/info>');
                return;
            }

            const subcommand = args[0].toLowerCase();

            switch (subcommand) {
                case 'buy': {
                    if (!args[1] || !args[2]) {
                        await responseMessage.edit('❌ Nhập: trade buy <mã> <số lượng>');
                        return;
                    }

                    const symbol = args[1].toUpperCase();
                    const quantity = parseInt(args[2]);
                    
                    if (isNaN(quantity) || quantity <= 0) {
                        await responseMessage.edit('❌ Số lượng không hợp lệ');
                        return;
                    }

                    try {
                        const result = await tradeUtils.tradeSystem.buyStock(message.author.id, symbol, quantity);
                        const embed = tradeUtils.createTradeResultEmbed(result, 'buy');
                        await responseMessage.edit({ content: null, embeds: [embed] });
                    } catch (error) {
                        await responseMessage.edit(`❌ ${error.message}`);
                    }
                    break;
                }

                case 'sell': {
                    if (!args[1] || !args[2]) {
                        await responseMessage.edit('❌ Nhập: trade sell <mã> <số lượng>');
                        return;
                    }

                    const symbol = args[1].toUpperCase();
                    const quantity = parseInt(args[2]);
                    
                    if (isNaN(quantity) || quantity <= 0) {
                        await responseMessage.edit('❌ Số lượng không hợp lệ');
                        return;
                    }

                    try {
                        const result = await tradeUtils.tradeSystem.sellStock(message.author.id, symbol, quantity);
                        const embed = tradeUtils.createTradeResultEmbed(result, 'sell');
                        await responseMessage.edit({ content: null, embeds: [embed] });
                    } catch (error) {
                        await responseMessage.edit(`❌ ${error.message}`);
                    }
                    break;
                }

                case 'portfolio': {
                    const userId = message.author.id;
                    const portfolio = tradeUtils.tradeSystem.getUserPortfolio(userId);

                    if (Object.keys(portfolio.stocks).length === 0) {
                        await responseMessage.edit("❌ Chưa có cổ phiếu");
                        return;
                    }

                    const embed = tradeUtils.createPortfolioEmbed(userId);
                    await responseMessage.edit({ content: null, embeds: [embed] });
                    break;
                }

                case 'info': {
                    if (!args[1]) {
                        await responseMessage.edit('❌ Nhập mã cổ phiếu: trade info <mã>');
                        return;
                    }

                    const symbol = args[1].toUpperCase();
                    const embed = tradeUtils.createStockInfoEmbed(symbol);
                    await responseMessage.edit({ content: null, embeds: [embed] });
                    break;
                }

                default: {
                    await responseMessage.edit('❌ Lệnh không hợp lệ. Sử dụng: trade <buy/sell/portfolio/info>');
                }
            }

            // Delete response message after 30 seconds
            setTimeout(async () => {
                try {
                    if (responseMessage && responseMessage.deletable) {
                        await responseMessage.delete();
                    }
                } catch (error) {
                    console.error('[TRADE] Failed to delete response message:', error);
                }
            }, 30000);

        } catch (error) {
            console.error('[TRADE] Error:', error);
            if (responseMessage) {
                await responseMessage.edit('❌ Đã xảy ra lỗi');
            }
        }
    }
};
