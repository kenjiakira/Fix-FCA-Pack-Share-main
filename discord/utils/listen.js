const { logDiscordMessage, logBotEvent } = require('./logs');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.json');
const { ALLOWED_CHANNEL } = require('../commands/taixiu');

const handleReactions = {
    '👋': ['hello', 'hi', 'chào', 'bot ơi'],
    '❤️': ['yêu', 'thương', 'love'],
    '😢': ['buồn', 'khóc', 'sad'],
    '😆': ['vui', 'cười', 'haha', 'hihi']
};

const checkBotAdmin = (userId) => {
    return config.adminUIDs.includes(userId);
};

const levenshteinDistance = (str1, str2) => {
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) track[0][i] = i;
    for (let j = 0; j <= str2.length; j++) track[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator
            );
        }
    }
    return track[str2.length][str1.length];
};

// Tìm lệnh gần giống
const findSimilarCommands = (input, commands, threshold = 3) => {
    const similarities = [];
    commands.forEach(cmd => {
        const distance = levenshteinDistance(input, cmd.name);
        if (distance <= threshold) {
            similarities.push({
                command: cmd.name,
                distance: distance
            });
        }
    });
    return similarities.sort((a, b) => a.distance - b.distance);
};

const handleListenEvents = async (client) => {
    client.on('messageCreate', async (message) => {
        try {
            if (message.author.bot) return;

            // Kiểm tra và xóa tin nhắn trong kênh tài xỉu
            if (message.channel.id === ALLOWED_CHANNEL) {
                const content = message.content.toLowerCase();
                // Chỉ cho phép các lệnh: tx, taixiu, data, balance
                const allowedCommands = ['tx', 'taixiu', 'data', 'balance'];
                const isAllowedCommand = allowedCommands.some(cmd => 
                    content === `${config.prefix}${cmd}` || 
                    content.startsWith(`${config.prefix}${cmd} `)
                );

                // Xóa tất cả tin nhắn không phải lệnh cho phép
                if (!isAllowedCommand) {
                    await message.delete().catch(() => {});
                    
                    // Nếu là lệnh không được phép, hiển thị cảnh báo
                    if (content.startsWith(config.prefix)) {
                        const warning = await message.channel.send(
                            `❌ ${message.author}, kênh này chỉ cho phép sử dụng lệnh tài xỉu!`
                        );
                        setTimeout(() => warning.delete().catch(() => {}), 5000);
                    }
                    return;
                }
            }

            await logDiscordMessage(message);

            const content = message.content.toLowerCase();

            if (content === config.prefix) {
                const helpMessage = [
                    `👋 Xin chào ${message.author}!`,
                    '🔍 Để xem danh sách lệnh, hãy sử dụng:',
                    `\`${config.prefix}help <tên lệnh>\` - Xem chi tiết lệnh`,
                ].join('\n');

                message.channel.send(helpMessage);
                return;
            }

            const isCommand = content.startsWith(config.prefix);
            let commandName, args;

            if (isCommand) {
     
                args = content.slice(config.prefix.length).trim().split(/ +/);
                commandName = args.shift().toLowerCase();
            } else {
                args = content.trim().split(/ +/);
                commandName = args.shift().toLowerCase();
            }

            const command = client.commands.get(commandName);

            if (command) {
                if (!command.noPrefix && !isCommand) return;
 
                if (command.botAdminOnly && !checkBotAdmin(message.author.id)) {
                    message.channel.send('❌ Lệnh này chỉ dành cho Admin Bot!');
                    return;
                }

                try {
                    logBotEvent('COMMAND_EXECUTE', `User ${message.author.tag} executing command: ${commandName}`);
                    await command.execute(message, args);
                } catch (error) {
                    logBotEvent('COMMAND_ERROR', `Error executing command: ${error.message}`);
                    message.channel.send('❌ Đã xảy ra lỗi khi thực hiện lệnh!');
                }
                return;
            }

            if (isCommand) {
                const similarCommands = findSimilarCommands(commandName, client.commands);
                if (similarCommands.length > 0) {
                    const suggestions = similarCommands
                        .slice(0, 3)
                        .map(s => `\`${config.prefix}${s.command}\``)
                        .join(', ');
                    
                    message.channel.send([
                        '❓ Không tìm thấy lệnh này!',
                        '💡 Có phải bạn muốn dùng:',
                        suggestions,
                        '',
                        `Gõ \`${config.prefix}help\` để xem danh sách lệnh`
                    ].join('\n'));
                    return;
                }
            }

            for (const [reaction, triggers] of Object.entries(handleReactions)) {
                if (triggers.some(trigger => content.includes(trigger))) {
                    await message.react(reaction);
                }
            }

            if (message.mentions.users.has(client.user.id)) {
                message.channel.send('👋 Bạn đã gọi mình? Gõ `.help` để xem danh sách lệnh nhé!');
            }

        } catch (error) {
            logBotEvent('MESSAGE_ERROR', `Error handling message: ${error.message}`);
        }
    });

    client.on('messageReactionAdd', async (reaction, user) => {
        try {
            if (user.bot) return;
            if (reaction.partial) await reaction.fetch();

            if (reaction.emoji.name === '👋') {
                reaction.message.channel.send(`👋 Chào bạn ${user}!`);
            }
        } catch (error) {
            logBotEvent('REACTION_ERROR', `Error handling reaction: ${error.message}`);
        }
    });

    client.on('guildMemberAdd', async (member) => {
        try {
            const welcomeChannel = member.guild.systemChannel;
            if (welcomeChannel) {
                welcomeChannel.send(`👋 Chào mừng ${member} đã tham gia server!`);
            }
        } catch (error) {
            logBotEvent('WELCOME_ERROR', `Error handling member join: ${error.message}`);
        }
    });
};

module.exports = { handleListenEvents, checkBotAdmin };
