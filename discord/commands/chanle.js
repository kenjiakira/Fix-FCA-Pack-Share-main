const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getBalance, addBalance } = require('../utils/currencies');
const { GAME_CHANNELS } = require('../config/channels');

const GAME_TIME = 30000; 
const MIN_BET = 1000;
const UPDATE_INTERVAL = 1000; 
const RESULT_DISPLAY_TIME = 10000; 
const NEW_GAME_DELAY = 3000; 

const PATTERNS = {
    LE: [
        [3, 1],
        [3, 1], 
    ],
    CHAN: [
        [4, 0], 
        [4, 0], 
        [2, 2], 
    ]
};

let currentSession = null;
let gameInterval = null;
let lastResultMessage = null;

async function cleanOldMessages(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const oldMessages = messages.filter(msg => 
            msg.author.bot && 
            (msg.embeds.length > 0 || msg.content.includes('⏳'))
        );
        
        for (const message of oldMessages.values()) {
            try {
                if (message.deletable) {
                    await message.delete();
                }
            } catch (error) {
         
                if (error.code !== 10008) {
                    console.error(`Error deleting message ${message.id}:`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('Error in cleanOldMessages:', error.message);
    }
}

module.exports = {
    name: 'chanle',
    description: 'Chơi game Chẵn Lẻ',
    usage: 'chanle',
    cooldown: 5,

    ALLOWED_CHANNEL: GAME_CHANNELS.CHANLE,

    isActive: function() {
        return currentSession?.active && 
               currentSession?.message && 
               currentSession.endTime > Date.now() &&
               currentSession.restartAttempts < 3;
    },

    handleBet: async function(interaction) {
        if (!currentSession?.active) {
            await interaction.reply({
                content: '❌ Phiên đã kết thúc!',
                ephemeral: true
            });
            return;
        }

        const timeLeft = currentSession.endTime - Date.now();
        if (timeLeft <= 3000) {
            await interaction.reply({
                content: '❌ Đã hết thời gian đặt cược!',
                ephemeral: true
            });
            return;
        }

        try {
            const userBalance = getBalance(interaction.user.id);
            const betAmount = 100;

            if (userBalance < betAmount) {
                await interaction.reply({
                    content: `❌ Bạn không đủ tiền! Cần tối thiểu ${betAmount.toLocaleString('vi-VN')} Nitro`,
                    ephemeral: true
                });
                return;
            }

            const choice = interaction.customId === 'bet_chan' ? 'chan' : 'le';
            const userBets = currentSession.bets.get(interaction.user.id) || { chan: 0, le: 0 };

         
            const success = await addBalance(interaction.user.id, -betAmount);
            if (!success) {
                await interaction.reply({
                    content: '❌ Lỗi xử lý giao dịch, vui lòng thử lại!',
                    ephemeral: true
                });
                return;
            }

            userBets[choice] += betAmount;
            currentSession.bets.set(interaction.user.id, userBets);
            currentSession.totalBets[choice] += betAmount;

            await interaction.reply({
                content: `✅ Đặt cược ${betAmount.toLocaleString('vi-VN')} Nitro vào ${choice === 'chan' ? 'CHẴN 🔵' : 'LẺ 🔴'}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Bet error:', error);
            await interaction.reply({
                content: '❌ Lỗi đặt cược, vui lòng thử lại!',
                ephemeral: true
            });
        }
    },

    startNewSession: async function(channel) {
        try {
            // Kiểm tra xem session hiện tại có đang hoạt động không
            if (currentSession?.active && currentSession?.message) {
                try {
                    // Verify if current message still exists
                    await channel.messages.fetch(currentSession.message.id);
                    console.log('[CHANLE] Session already running');
                    return; // Don't start new session if current one is active
                } catch (error) {
                    // Only proceed if message is actually gone
                    if (error.code === 10008) {
                        console.log('[CHANLE] Previous message not found, cleaning up');
                    } else {
                        return; // For other errors, maintain current session
                    }
                }
            }

            // Cleanup previous session
            if (currentSession) {
                clearInterval(currentSession.updateInterval);
                currentSession.updateInterval = null;
                if (currentSession.message) {
                    await currentSession.message.delete().catch(() => {});
                }
                currentSession.message = null;
            }

            // Initialize new session
            currentSession = {
                bets: new Map(),
                totalBets: { chan: 0, le: 0 },
                endTime: Date.now() + GAME_TIME,
                active: true,
                updateInterval: null,
                message: null,
                lastUpdate: Date.now(),
                restartAttempts: 0 // Track restart attempts
            };

            try {
                const embed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('🎲 CHẴN LẺ')
                    .setDescription(this.getGameStatus())
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('bet_chan')
                            .setLabel('CHẴN')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🔵'),
                        new ButtonBuilder()
                            .setCustomId('bet_le') 
                            .setLabel('LẺ')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🔴')
                    );

                currentSession.message = await channel.send({
                    embeds: [embed],
                    components: [row]
                });

                // Modify update interval with better error handling
                currentSession.updateInterval = setInterval(async () => {
                    try {
                        if (!currentSession?.active) {
                            clearInterval(currentSession.updateInterval);
                            return;
                        }

                        // Throttle updates
                        if (Date.now() - currentSession.lastUpdate < 900) return;

                        // Check if message exists before updating
                        try {
                            await channel.messages.fetch(currentSession.message.id);
                            
                            const embed = new EmbedBuilder()
                                .setColor(0x2B2D31)
                                .setTitle('🎲 CHẴN LẺ')
                                .setDescription(this.getGameStatus())
                                .setTimestamp();

                            await currentSession.message.edit({ 
                                embeds: [embed],
                                components: [row]
                            });

                            currentSession.lastUpdate = Date.now();
                            currentSession.restartAttempts = 0; // Reset attempts on successful update

                        } catch (error) {
                            if (error.code === 10008) {
                                currentSession.restartAttempts++;
                                console.log(`[CHANLE] Message not found, attempt ${currentSession.restartAttempts}`);
                                
                                // Only restart if multiple attempts fail
                                if (currentSession.restartAttempts >= 3) {
                                    clearInterval(currentSession.updateInterval);
                                    this.startNewSession(channel);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('[CHANLE] Update error:', error);
                    }
                }, UPDATE_INTERVAL);

                const collector = currentSession.message.createMessageComponentCollector({
                    time: GAME_TIME
                });

                collector.on('collect', async (interaction) => {
                    try {
                        await this.handleBet(interaction);
                    } catch (error) {
                        console.error('[CHANLE] Bet collection error:', error);
                    }
                });

                collector.on('end', () => {
                    if (currentSession?.active) {
                        this.endGame(channel);
                    }
                });

            } catch (error) {
                console.error('[CHANLE] Session creation error:', error);
                currentSession = null;
                setTimeout(() => this.startNewSession(channel), 5000);
            }

        } catch (error) {
            console.error('[CHANLE] Critical error:', error);
            // Don't auto-restart on critical errors
            currentSession = null;
        }
    },

    getGameStatus: function() {
        const timeLeft = Math.max(0, Math.ceil((currentSession.endTime - Date.now()) / 1000));
        return [
            `⏱️ Thời gian: ${timeLeft}s`,
            '',
            '📊 Tổng cược:',
            `🔵 CHẴN: ${currentSession.totalBets.chan.toLocaleString('vi-VN')} Nitro`,
            `🔴 LẺ: ${currentSession.totalBets.le.toLocaleString('vi-VN')} Nitro`,
            '',
            '💸 Click nút để đặt cược 10,000 Nitro'
        ].join('\n');
    },

    endGame: async function(channel) {
        try {
            if (!currentSession?.active) return;

            clearInterval(currentSession.updateInterval);
            currentSession.updateInterval = null;
            currentSession.active = false;

            const pattern = this.generatePattern();
            const result = pattern.isEven ? 'chan' : 'le';

            const winners = [];
            const losers = [];
            let totalWinAmount = 0;

            for (const [userId, bets] of currentSession.bets) {
                const userWinAmount = bets[result] * 1.95; 
                if (userWinAmount > 0) {
                    addBalance(userId, Math.floor(userWinAmount));
                    winners.push(`<@${userId}> +${Math.floor(userWinAmount).toLocaleString('vi-VN')}`);
                    totalWinAmount += Math.floor(userWinAmount);
                }
                if (bets[result === 'chan' ? 'le' : 'chan'] > 0) {
                    losers.push(`<@${userId}> -${bets[result === 'chan' ? 'le' : 'chan'].toLocaleString('vi-VN')}`);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(result === 'chan' ? 0x3498DB : 0xE74C3C)
                .setTitle(`🎲 Kết quả: ${result === 'chan' ? 'CHẴN 🔵' : 'LẺ 🔴'}`)
                .setDescription([
                    `🎲 Kết quả: ${pattern.display}`,
                    '',
                    winners.length > 0 ? `🎉 Thắng:\n${winners.join('\n')}` : '❌ Không có người thắng',
                    '',
                    losers.length > 0 ? `💔 Thua:\n${losers.join('\n')}` : '❌ Không có người thua',
                    '',
                    `💰 Tổng thắng: ${totalWinAmount.toLocaleString('vi-VN')} Nitro`
                ].join('\n'))
                .setTimestamp();

            if (lastResultMessage?.deletable) {
                try {
                    await lastResultMessage.delete();
                } catch (error) {
                    if (error.code !== 10008) { 
                        console.log('[CHANLE] Error deleting result message:', error.message);
                    }
                }
            }

            lastResultMessage = await channel.send({ embeds: [embed] });

            setTimeout(async () => {
                try {
                    if (currentSession?.message) {
                        await currentSession.message.delete().catch(() => {});
                    }
                    if (lastResultMessage) {
                        await lastResultMessage.delete().catch(() => {});
                    }
                } catch (error) {
                    console.log('[CHANLE] Cleanup error:', error);
                }
                
                setTimeout(() => this.startNewSession(channel), 1000);
            }, RESULT_DISPLAY_TIME);

        } catch (error) {
            console.error('[CHANLE] Error in endGame:', error);
            setTimeout(() => this.startNewSession(channel), 5000);
        }
    },

    generatePattern: function() {
        const isEven = Math.random() < 0.5;
        const patterns = PATTERNS[isEven ? 'CHAN' : 'LE'];
        const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        let display = '';
        const [red, white] = selectedPattern;
        
        display = '🔴'.repeat(red) + '⚪'.repeat(white);
        
        return {
            isEven,
            display,
            pattern: selectedPattern
        };
    },

    execute: async function(message) {
        if (message.channel.id !== this.ALLOWED_CHANNEL) {
            return message.reply('❌ Lệnh này chỉ có thể sử dụng trong kênh chẵn lẻ!');
        }

        await cleanOldMessages(message.channel);
        if (!currentSession) {
            await this.startNewSession(message.channel);
        } else {
            await message.reply({
                content: '🎲 Phiên đang diễn ra...',
                ephemeral: true
            });
        }
    }
};
