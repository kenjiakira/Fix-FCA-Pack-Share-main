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

module.exports = {
    name: 'chanle',
    description: 'Chơi game Chẵn Lẻ',
    usage: 'chanle',
    cooldown: 5,

    ALLOWED_CHANNEL: GAME_CHANNELS.CHANLE,

    startNewSession: async function(channel) {
        try {   
            if (currentSession?.message) {
                try {
                    if (currentSession.message.deletable) {
                        await currentSession.message.delete();
                    }
                } catch (error) {
                    if (error.code !== 10008) {
                        console.log('[CHANLE] Could not delete old message:', error.message);
                    }
                }
            }

            if (currentSession?.updateInterval) {
                clearInterval(currentSession.updateInterval);
            }

            const waitMsg = await channel.send('⏳ Chờ phiên mới...');
            
            for(let i = 5; i > 0; i--) {
                if (waitMsg.deletable) {
                    await waitMsg.edit(`⏳ Phiên mới bắt đầu sau ${i}s...`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (waitMsg.deletable) {
                await waitMsg.delete().catch(() => {});
            }

            currentSession = {
                bets: new Map(),
                totalBets: { chan: 0, le: 0 },
                endTime: Date.now() + GAME_TIME,
                active: true
            };

            const chanButton = new ButtonBuilder()
                .setCustomId('bet_chan')
                .setLabel('CHẴN')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔵');

            const leButton = new ButtonBuilder()
                .setCustomId('bet_le')
                .setLabel('LẺ')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔴');

            const row = new ActionRowBuilder().addComponents(chanButton, leButton);

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🎲 CHẴN LẺ')
                .setDescription(this.getGameStatus())
                .setTimestamp();

            currentSession.message = await channel.send({
                embeds: [embed],
                components: [row]
            });

            currentSession.updateInterval = setInterval(() => {
                const embed = EmbedBuilder.from(currentSession.message.embeds[0])
                    .setDescription(this.getGameStatus());
                currentSession.message.edit({ embeds: [embed] }).catch(console.error);
            }, UPDATE_INTERVAL);

            const collector = currentSession.message.createMessageComponentCollector({
                time: GAME_TIME
            });

            collector.on('collect', async (interaction) => {
                if (!currentSession?.active) {
                    await interaction.reply({
                        content: '❌ Phiên đã kết thúc!',
                        ephemeral: true
                    });
                    return;
                }

                const userBalance = getBalance(interaction.user.id);
                const betAmount = 10000; 

                if (userBalance < betAmount) {
                    await interaction.reply({
                        content: `❌ Bạn không đủ tiền! Cần tối thiểu ${betAmount.toLocaleString('vi-VN')} Nitro`,
                        ephemeral: true
                    });
                    return;
                }

                const choice = interaction.customId === 'bet_chan' ? 'chan' : 'le';
                const userBets = currentSession.bets.get(interaction.user.id) || { chan: 0, le: 0 };

                addBalance(interaction.user.id, -betAmount);
                userBets[choice] += betAmount;
                currentSession.bets.set(interaction.user.id, userBets);
                currentSession.totalBets[choice] += betAmount;

                
                await interaction.reply({
                    content: `✅ Đặt cược ${betAmount.toLocaleString('vi-VN')} Nitro vào ${choice === 'chan' ? 'CHẴN 🔵' : 'LẺ 🔴'}`,
                    ephemeral: true
                });
            });

            collector.on('end', () => {
                if (currentSession.updateInterval) {
                    clearInterval(currentSession.updateInterval);
                }
                this.endGame(channel);
            });
        } catch (error) {
            console.error('[CHANLE] Error starting new session:', error);
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
        if (!currentSession?.active) return;

        // Clear update interval
        if (currentSession.updateInterval) {
            clearInterval(currentSession.updateInterval);
            currentSession.updateInterval = null;
        }

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
                if (lastResultMessage?.deletable) {
                    await lastResultMessage.delete();
                }
            } catch (error) {
                if (error.code !== 10008) {
                    console.log('[CHANLE] Error deleting result message:', error.message);
                }
            }

            setTimeout(() => {
                if (currentSession?.message?.deletable) {
                    currentSession.message.delete().catch(() => {});
                }
                this.startNewSession(channel);
            }, NEW_GAME_DELAY);
        }, RESULT_DISPLAY_TIME);
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
