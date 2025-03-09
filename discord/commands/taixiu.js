const { getBalance, updateBalance } = require('../utils/currencies'); 
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const BETTING_TIME = 60000;
const NO_BETTING_WINDOW = 10000; 
const ALLOWED_CHANNEL = '1341367963004960851';
const HISTORY_FILE = path.join(__dirname, '../../database/discord/taixiu_history.json');
const MAX_HISTORY = 14;

let currentSession = null;
let sessionTimer = null;
let resultTimer = null;
let gameHistory = [];
let lastSessionId = 0;

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
            gameHistory = data.history || [];
            lastSessionId = data.lastSessionId || 0;
        }
    } catch (error) {
        console.error('Error loading taixiu history:', error);
        gameHistory = [];
        lastSessionId = 0;
    }
}

// Save game history to file
function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify({
            history: gameHistory,
            lastSessionId
        }, null, 2));
    } catch (error) {
        console.error('Error saving taixiu history:', error);
    }
}

function generateSessionId() {
    lastSessionId++;
    const prefix = 'HNT';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}${lastSessionId.toString().padStart(3, '0')}`;
}

class TaixiuSession {
    constructor() {
        this.id = generateSessionId();
        this.bets = {
            tai: new Map(),
            xiu: new Map()
        };
        this.active = true;
        this.endTime = Date.now() + BETTING_TIME;
        this.message = null;
        this.lastUpdate = 0;
    }

    placeBet(userId, choice, amount) {
        try {
            if (!this.active) return false;
            
            const timeLeft = this.endTime - Date.now();
            if (timeLeft <= NO_BETTING_WINDOW) return false;

            if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return false;
            if (!['tai', 'xiu'].includes(choice)) return false;

            const currentBet = this.bets[choice].get(userId) || 0;
            const newAmount = currentBet + amount;

            if (isNaN(newAmount) || newAmount <= 0) return false;

            this.bets[choice].set(userId, newAmount);
            return true;
        } catch (error) {
            console.error('Error in placeBet:', error);
            return false;
        }
    }

    getTotalBets(choice) {
        return Array.from(this.bets[choice].values()).reduce((a, b) => a + b, 0);
    }

    getBettingPlayers() {
        return new Set([
            ...Array.from(this.bets.tai.keys()),
            ...Array.from(this.bets.xiu.keys())
        ]);
    }

    getBetsList(choice) {
        return Array.from(this.bets[choice].entries())
            .map(([userId, amount]) => `<@${userId}> • ${amount.toLocaleString('vi-VN')}`)
            .join('\n');
    }

    shouldUpdate() {
        const now = Date.now();
        if (now - this.lastUpdate >= 1000) {
            this.lastUpdate = now;
            return true;
        }
        return false;
    }
}

function getHistoryDisplay() {
    return gameHistory
        .slice(-MAX_HISTORY)
        .map(result => result === 'tai' ? '🔴' : '⚪')
        .join('');
}

function createProgressBar(current, total, size = 15) {
    const progress = Math.round((current / total) * size);
    const filled = '█'.repeat(progress);
    const empty = '░'.repeat(size - progress);
    return `[${filled}${empty}]`;
}

async function updateSessionMessage(channel) {
    if (!currentSession?.message || !currentSession.shouldUpdate()) return;

    try {
        const totalPlayers = currentSession.getBettingPlayers().size;
        const timeLeft = Math.max(0, Math.ceil((currentSession.endTime - Date.now()) / 1000));
        const totalTime = BETTING_TIME / 1000;
        const progressBar = createProgressBar(totalTime - timeLeft, totalTime);
        const history = getHistoryDisplay();

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`🎲 Phiên ${currentSession.id}`)
            .setDescription(progressBar)
            .addFields([
                {
                    name: '⏱️ Thời gian còn lại',
                    value: `${timeLeft}s`,
                    inline: true
                },
                {
                    name: '👥 Người tham gia',
                    value: `${totalPlayers}`,
                    inline: true
                },
                {
                    name: '📊 Lịch sử',
                    value: history || 'Chưa có dữ liệu',
                    inline: false
                }
            ])
            .setTimestamp()
            .setFooter({ text: 'Bot Tài Xỉu by HN' });

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bet_tai')
                    .setLabel('🔴 Tài')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('bet_xiu')
                    .setLabel('⚪ Xỉu')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bet_10k')
                    .setLabel('10K')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_50k')
                    .setLabel('50K')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_100k')
                    .setLabel('100K')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_500k')
                    .setLabel('500K')
                    .setStyle(ButtonStyle.Primary)
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bet_1m')
                    .setLabel('1M')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_5m')
                    .setLabel('5M')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_10m')
                    .setLabel('10M')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_allin')
                    .setLabel('ALL IN')
                    .setStyle(ButtonStyle.Danger)
            );

        const components = timeLeft <= NO_BETTING_WINDOW / 1000 ? [] : [row1, row2, row3];

        await currentSession.message.edit({
            embeds: [embed],
            components
        }).catch(error => {
            console.error('Error updating session message:', error);
        });
    } catch (error) {
        console.error('Error in updateSessionMessage:', error);
    }
}

function setupButtonHandlers(message) {
    const collector = message.createMessageComponentCollector({
        filter: i => i.message.id === currentSession?.message?.id,
        time: BETTING_TIME
    });

    const playerChoices = new Map();
    const playerLastBet = new Map();

    collector.on('collect', async (interaction) => {
        try {
            if (!currentSession?.active) {
                return interaction.reply({
                    content: '❌ Phiên đã kết thúc!',
                    ephemeral: true
                });
            }

            const now = Date.now();
            const userId = interaction.user.id;
            const lastBet = playerLastBet.get(userId) || 0;

            // Rate limit check
            if (now - lastBet < 500) {
                return interaction.reply({
                    content: '❌ Vui lòng đợi giây lát rồi đặt tiếp!',
                    ephemeral: true
                });
            }

            const balance = getBalance(userId);
            if (balance <= 0) {
                return interaction.reply({
                    content: '❌ Bạn không có đủ Nitro để tham gia!',
                    ephemeral: true
                });
            }

            if (interaction.customId.startsWith('bet_')) {
                const choice = interaction.customId.slice(4);
                
                if (choice === 'tai' || choice === 'xiu') {
                    playerChoices.set(userId, choice);
                    await interaction.reply({
                        content: `✅ Đã chọn ${choice === 'tai' ? 'TÀI 🔴' : 'XỈU ⚪'}! Vui lòng chọn số tiền cược.`,
                        ephemeral: true
                    });
                    return;
                }

                const playerChoice = playerChoices.get(userId);
                if (!playerChoice) {
                    return interaction.reply({
                        content: '❌ Vui lòng chọn Tài hoặc Xỉu trước!',
                        ephemeral: true
                    });
                }

                let amount;
                switch (choice) {
                    case '10k': amount = 10000; break;
                    case '50k': amount = 50000; break;
                    case '100k': amount = 100000; break;
                    case '500k': amount = 500000; break;
                    case '1m': amount = 1000000; break;
                    case '5m': amount = 5000000; break;
                    case '10m': amount = 10000000; break;
                    case 'allin': amount = Math.max(0, balance); break;
                    default: return;
                }

                if (amount === 0) {
                    return interaction.reply({
                        content: '❌ Không thể đặt cược số tiền bằng 0!',
                        ephemeral: true
                    });
                }

                if (balance < amount) {
                    return interaction.reply({
                        content: '❌ Số dư không đủ!',
                        ephemeral: true
                    });
                }

                playerLastBet.set(userId, now);

                if (currentSession.placeBet(userId, playerChoice, amount)) {
                    await interaction.reply({
                        content: `✅ Đặt cược ${amount.toLocaleString('vi-VN')} Nitro vào ${playerChoice === 'tai' ? 'TÀI 🔴' : 'XỈU ⚪'} thành công!`,
                        ephemeral: true
                    });
                    
                    // Update message after successful bet
                    setTimeout(() => updateSessionMessage(message.channel), 100);
                }
            }
        } catch (error) {
            console.error('Button interaction error:', error);
            await interaction.reply({
                content: '❌ Đã xảy ra lỗi! Vui lòng thử lại.',
                ephemeral: true
            }).catch(() => {});
        }
    });

    collector.on('end', () => {
        playerChoices.clear();
        playerLastBet.clear();
    });
}

async function cleanOldMessages(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const oldMessages = messages.filter(msg => 
            msg.author.bot && 
            (msg.embeds.length > 0 || msg.content.includes('⏳'))
        );
        
        for (const message of oldMessages.values()) {
            try {
                await message.delete().catch(() => {});
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                if (error.code !== 10008) {
                    console.error(`Error deleting message ${message.id}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error in cleanOldMessages:', error);
    }
}

async function startNewSession(channel) {
    if (channel.id !== ALLOWED_CHANNEL) return;

    try {
        await cleanOldMessages(channel);

        if (sessionTimer) clearTimeout(sessionTimer);
        if (resultTimer) clearTimeout(resultTimer);

        if (currentSession?.message) {
            await currentSession.message.delete().catch(() => {});
        }

        const waitMsg = await channel.send('⏳ Chờ phiên mới...');
        
        for(let i = 5; i > 0; i--) {
            await waitMsg.edit(`⏳ Phiên mới bắt đầu sau ${i}s...`).catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        await waitMsg.delete().catch(() => {});

        currentSession = new TaixiuSession();

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`🎲 Phiên ${currentSession.id}`)
            .setDescription(createProgressBar(BETTING_TIME / 1000, BETTING_TIME / 1000))
            .addFields([
                {
                    name: '⏱️ Thời gian còn lại',
                    value: `${BETTING_TIME / 1000}s`,
                    inline: true
                },
                {
                    name: '👥 Người tham gia',
                    value: '0',
                    inline: true
                },
                {
                    name: '📊 Lịch sử',
                    value: getHistoryDisplay() || 'Chưa có dữ liệu',
                    inline: false
                }
            ])
            .setTimestamp()
            .setFooter({ text: 'Bot Tài Xỉu by HN' });

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bet_tai')
                    .setLabel('🔴 Tài')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('bet_xiu')
                    .setLabel('⚪ Xỉu')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bet_10k')
                    .setLabel('10K')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_50k')
                    .setLabel('50K')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_100k')
                    .setLabel('100K')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_500k')
                    .setLabel('500K')
                    .setStyle(ButtonStyle.Primary)
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bet_1m')
                    .setLabel('1M')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_5m')
                    .setLabel('5M')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_10m')
                    .setLabel('10M')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('bet_allin')
                    .setLabel('ALL IN')
                    .setStyle(ButtonStyle.Danger)
            );

        currentSession.message = await channel.send({
            embeds: [embed],
            components: [row1, row2, row3]
        });

        setupButtonHandlers(currentSession.message);

        const updateInterval = setInterval(() => {
            if (!currentSession?.active) {
                clearInterval(updateInterval);
                return;
            }
            updateSessionMessage(channel);
        }, 1000);

        sessionTimer = setTimeout(async () => {
            if (!currentSession?.active) return;
            
            try {
                currentSession.active = false;
                clearInterval(updateInterval);

                const dice1 = Math.floor(Math.random() * 6) + 1;
                const dice2 = Math.floor(Math.random() * 6) + 1;
                const dice3 = Math.floor(Math.random() * 6) + 1;
                const total = dice1 + dice2 + dice3;
                const result = total >= 11 ? 'tai' : 'xiu';

                const losingChoice = result === 'tai' ? 'xiu' : 'tai';
                const winners = currentSession.bets[result].size;
                const losers = currentSession.bets[losingChoice].size;
                let totalWinAmount = 0;
                let totalLossAmount = 0;

                for (const [userId, betAmount] of currentSession.bets[result].entries()) {
                    const winnings = Math.floor(betAmount * 1.95);
                    totalWinAmount += winnings;
                    updateBalance(userId, winnings);
                }

                for (const [userId, betAmount] of currentSession.bets[losingChoice].entries()) {
                    totalLossAmount += betAmount;
                    const currentBalance = getBalance(userId);
                    updateBalance(userId, -Math.min(betAmount, currentBalance));
                }

                gameHistory.push(result);
                if (gameHistory.length > MAX_HISTORY) gameHistory.shift();
                saveHistory();

                const resultEmbed = new EmbedBuilder()
                    .setColor(result === 'tai' ? 0xFF0000 : 0xFFFFFF)
                    .setTitle(`🎲 Kết quả phiên ${currentSession.id}`)
                    .addFields([
                        {
                            name: '🎯 Thông tin phiên',
                            value: [
                                `Xúc xắc: ${dice1} • ${dice2} • ${dice3} = ${total}`,
                                `Kết quả: ${result === 'tai' ? 'TÀI 🔴' : 'XỈU ⚪'}`
                            ].join('\n'),
                            inline: false
                        },
                        {
                            name: '📊 Thống kê',
                            value: [
                                `Người thắng: ${winners}`,
                                `Người thua: ${losers}`,
                                `Tổng thắng: ${totalWinAmount.toLocaleString('vi-VN')} Nitro`,
                                `Tổng thua: ${totalLossAmount.toLocaleString('vi-VN')} Nitro`
                            ].join('\n'),
                            inline: false
                        }
                    ])
                    .setTimestamp()
                    .setFooter({ text: `Bot Tài Xỉu by HN • Phiên ${currentSession.id}` });

                const resultMsg = await channel.send({
                    embeds: [resultEmbed]
                });

                resultTimer = setTimeout(async () => {
                    try {
                        await resultMsg.delete().catch(() => {});
                        await startNewSession(channel);
                    } catch (error) {
                        console.error('Error in result timer:', error);
                        setTimeout(() => startNewSession(channel), 5000);
                    }
                }, 10000);

            } catch (error) {
                console.error('Error in session end:', error);
                setTimeout(() => startNewSession(channel), 5000);
            }
        }, BETTING_TIME);

    } catch (error) {
        console.error('Error starting new session:', error);
        setTimeout(() => startNewSession(channel), 5000);
    }
}

loadHistory();

module.exports = {
    name: 'tx',
    description: 'Tài xỉu game',
    usage: 'tx',
    ALLOWED_CHANNEL,
    startNewSession,
    execute: async function(message, args) {
        if (message.channel.id !== ALLOWED_CHANNEL) {
            return message.reply('❌ Lệnh này chỉ có thể sử dụng trong kênh tài xỉu!');
        }

        await cleanOldMessages(message.channel);
        if (!currentSession) {
            startNewSession(message.channel);
        }
    }
};
