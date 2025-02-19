const { getData, setData } = require('../utils/currencies');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

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

const DICE_IMAGES = {
    1: 'https://imgur.com/q4APzUj.png',
    2: 'https://imgur.com/G7ehIO9.png',
    3: 'https://imgur.com/kD8Dh7Q.png',
    4: 'https://imgur.com/XM9skoz.png',
    5: 'https://imgur.com/QCujL6x.png',
    6: 'https://imgur.com/IyM5Yc4.png'
};

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
    }

    placeBet(userId, choice, amount) {
        if (!this.active) {
            console.log('Session not active');
            return false;
        }
        
        const timeLeft = this.endTime - Date.now();

        if (timeLeft <= NO_BETTING_WINDOW) {
            console.log(`Cannot bet - too close to end: ${timeLeft}ms left`);
            return false;
        }
        
        const currentBet = this.bets[choice].get(userId) || 0;
        this.bets[choice].set(userId, currentBet + amount);
        return true;
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
    if (!currentSession?.message) return;

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

    try {
        await currentSession.message.edit({ 
            embeds: [embed],
            components: timeLeft <= NO_BETTING_WINDOW / 1000 ? [] : [row1, row2, row3]
        });
    } catch (error) {
        console.error('Error updating session message:', error);
    }
}

// Add button interaction handler
function setupButtonHandlers(message) {
    const collector = message.channel.createMessageComponentCollector({
        filter: i => i.message.id === currentSession?.message?.id
    });

    const playerChoices = new Map(); // Store player choices throughout the session

    collector.on('collect', async (interaction) => {
        try {
            if (!currentSession?.active) {
                return interaction.reply({
                    content: '❌ Phiên đã kết thúc!',
                    ephemeral: true
                });
            }

            const userId = interaction.user.id;
            const balance = Math.max(0, getBalance(userId)); // Ensure balance is not negative

            if (balance <= 0) {
                return interaction.reply({
                    content: '❌ Bạn không có đủ Nitro để tham gia! Hãy nhận thưởng daily hoặc nạp thêm.',
                    ephemeral: true
                });
            }

            if (interaction.customId.startsWith('bet_')) {
                const choice = interaction.customId.slice(4);
                
                if (choice === 'tai' || choice === 'xiu') {
                    // Store choice for the entire session
                    playerChoices.set(userId, choice);
                    return interaction.reply({
                        content: `✅ Đã chọn ${choice === 'tai' ? 'TÀI 🔴' : 'XỈU ⚪'}! Vui lòng chọn số tiền cược.`,
                        ephemeral: true
                    });
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

                if (currentSession.placeBet(userId, playerChoice, amount)) {
                    return interaction.reply({
                        content: `✅ Đặt cược ${amount.toLocaleString('vi-VN')} Nitro vào ${playerChoice === 'tai' ? 'TÀI 🔴' : 'XỈU ⚪'} thành công!\nBạn có thể tiếp tục đặt cược số tiền khác.`,
                        ephemeral: true
                    });
                }
            }

        } catch (error) {
            console.error('Button interaction error:', error);
            interaction.reply({
                content: '❌ Đã xảy ra lỗi!',
                ephemeral: true
            });
        }
    });

    // Clear player choices when session ends
    collector.on('end', () => {
        playerChoices.clear();
    });
}

async function startNewSession(channel) {
    if (channel.id !== ALLOWED_CHANNEL) return;

    // Clear any existing timers
    if (sessionTimer) clearTimeout(sessionTimer);
    if (resultTimer) clearTimeout(resultTimer);

    // Delete old session message
    if (currentSession?.message) {
        try {
            await currentSession.message.delete();
        } catch (error) {
            console.error('Error deleting old session message:', error);
        }
    }
    
    // Send waiting message
    const waitMsg = await channel.send('⏳ Chờ phiên mới...');
    
    // Add countdown for waiting period
    for(let i = 10; i > 0; i--) {
        await waitMsg.edit(`⏳ Phiên mới bắt đầu sau ${i}s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await waitMsg.delete().catch(() => {});

    // Create new session with proper timing
    currentSession = new TaixiuSession();
    currentSession.endTime = Date.now() + BETTING_TIME;
    currentSession.active = true;

    // Create initial progress bar
    const initialProgressBar = createProgressBar(BETTING_TIME / 1000, BETTING_TIME / 1000);

    try {
        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`🎲 Phiên ${currentSession.id}`)
            .setDescription(initialProgressBar)
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
                },
                {
                    name: '📝 Hướng dẫn',
                    value: '`.tx <tài/xỉu> <số tiền>`',
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
            components: [row1, row2, row3] // Add initial buttons
        });

        setupButtonHandlers(currentSession.message);

        // Update more frequently for smoother countdown
        const updateInterval = setInterval(() => {
            if (!currentSession?.active) {
                clearInterval(updateInterval);
                return;
            }
            updateSessionMessage(channel);
        }, 1000);

        // Set timer for session end
        sessionTimer = setTimeout(async () => {
            if (!currentSession?.active) return; // Check if session is still valid
            try {
                currentSession.active = false;
                clearInterval(updateInterval);
                
                const dice1 = Math.floor(Math.random() * 6) + 1;
                const dice2 = Math.floor(Math.random() * 6) + 1;
                const dice3 = Math.floor(Math.random() * 6) + 1;
                const total = dice1 + dice2 + dice3;
                const result = total >= 11 ? 'tai' : 'xiu';
                
                const diceImageBuffer = await createDiceImage(dice1, dice2, dice3);
                const attachment = new AttachmentBuilder(diceImageBuffer, { name: 'dice.png' });

                const losingChoice = result === 'tai' ? 'xiu' : 'tai';

                const winners = currentSession.bets[result].size;
                const losers = currentSession.bets[losingChoice].size;
                let totalWinAmount = 0;
                let totalLossAmount = 0;

                for (const [userId, betAmount] of currentSession.bets[result].entries()) {
                    const winnings = Math.floor(betAmount * 1.95); 
                    totalWinAmount += winnings;
                    addBalance(userId, winnings);
                }
                
                for (const [userId, betAmount] of currentSession.bets[losingChoice].entries()) {
                    totalLossAmount += betAmount;
                    const currentBalance = getBalance(userId);
                    if (currentBalance < betAmount) {
                        addBalance(userId, -currentBalance);
                    } else {
                        addBalance(userId, -betAmount);
                    }
                }

                gameHistory.push(result);
                if (gameHistory.length > MAX_HISTORY) gameHistory.shift();
                saveHistory();
                
                const resultEmbed = new EmbedBuilder()
                    .setColor(result === 'tai' ? 0xFF0000 : 0xFFFFFF)
                    .setTitle(`🎲 Kết quả phiên ${currentSession.id}`)
                    .setImage('attachment://dice.png')
                    .addFields([
                        {
                            name: '🎯 Thông tin phiên',
                            value: [
                                `Xúc xắc: ${dice1} + ${dice2} + ${dice3} = ${total}`,
                                `Kết quả: ${result === 'tai' ? 'TÀI 🔴' : 'XỈU ⚪'}`
                            ].join('\n'),
                            inline: false
                        },
                        {
                            name: '📊 Thống kê',
                            value: [
                                `Người thắng: ${winners} người`,
                                `Người thua: ${losers} người`,
                                `Tổng thắng: ${totalWinAmount.toLocaleString('vi-VN')} Nitro`,
                                `Tổng thua: ${totalLossAmount.toLocaleString('vi-VN')} Nitro`
                            ].join('\n'),
                            inline: false
                        }
                    ])
                    .setTimestamp()
                    .setFooter({ text: `Bot Tài Xỉu by HN • Phiên ${currentSession.id}` });

                const resultMsg = await channel.send({ 
                    embeds: [resultEmbed],
                    files: [attachment]
                });

                setTimeout(() => {
                    resultMsg.delete().catch(() => {});
                    startNewSession(channel);
                }, 10000);

            } catch (error) {
                console.error('Error in session end:', error);
            
                setTimeout(() => startNewSession(channel), 10000);
            }
        }, BETTING_TIME);

    } catch (error) {
        console.error('Error starting new session:', error);
        currentSession = null; 
        setTimeout(() => startNewSession(channel), 5000);
    }
}

async function createDiceImage(dice1, dice2, dice3) {
    const canvas = createCanvas(384, 128); // Chiều rộng đủ cho 3 xúc xắc
    const ctx = canvas.getContext('2d');

    // Load các ảnh xúc xắc
    const dice1Img = await loadImage(DICE_IMAGES[dice1]);
    const dice2Img = await loadImage(DICE_IMAGES[dice2]);
    const dice3Img = await loadImage(DICE_IMAGES[dice3]);

    // Vẽ 3 xúc xắc cạnh nhau
    ctx.drawImage(dice1Img, 0, 0, 128, 128);
    ctx.drawImage(dice2Img, 128, 0, 128, 128);
    ctx.drawImage(dice3Img, 256, 0, 128, 128);

    return canvas.toBuffer();
}

function getBalance(userId) {
    return getData(userId) || 0;
}

function addBalance(userId, amount) {
    const currentBalance = getBalance(userId);
    setData(userId, currentBalance + amount);
    return currentBalance + amount;
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

        if (!currentSession) {
            startNewSession(message.channel);
        }
    }
};
