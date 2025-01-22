const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { DISCORD } = require('../config/api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

let isInitialized = false;
let guild = null;
let channelsInfo = null;

module.exports = {
    name: "discord",
    dev: "HNT",
    info: "Tương tác với Discord Server",
    usages: "discord [info/chat/send/voice]",
    cooldowns: 5,
    usedby: 2,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const cacheDir = path.join(__dirname, 'cache');

        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        if (!isInitialized) {
            try {
                await client.login(DISCORD.TOKEN);
                guild = await client.guilds.fetch(DISCORD.SERVER_ID);
                isInitialized = true;
                console.log('Discord bot connected to server:', guild.name);
            } catch (error) {
                console.error('Discord connection error:', error);
                return api.sendMessage("❌ Không thể kết nối với Discord Server.", threadID, messageID);
            }
        }

        if (guild && !channelsInfo) {
            channelsInfo = {
                text: guild.channels.cache.filter(c => c.type === 0)
                    .map(c => ({ name: c.name, id: c.id })),
                voice: guild.channels.cache.filter(c => c.type === 2)
                    .map(c => ({ name: c.name, id: c.id })),
                announcement: guild.channels.cache.filter(c => c.type === 5)
                    .map(c => ({ name: c.name, id: c.id }))
            };
        }

        if (!target[0]) {
            const channels = {
                text: channelsInfo.text.map(c => `→ #${c.name}`).join('\n'),
                voice: channelsInfo.voice.map(c => `→ 🎤 ${c.name}`).join('\n'),
                announcement: channelsInfo.announcement.map(c => `→ 📢 ${c.name}`).join('\n')
            };

            return api.sendMessage(
                "🎮 Discord Server Guide\n\n" +
                "1. Xem thông tin server:\n" +
                "→ discord info\n\n" +
                "2. Kênh chat:\n" +
                `${channels.text}\n\n` +
                "Cách dùng: discord chat [tên kênh] [số tin]\n" +
                "VD: discord chat general 5\n\n" +
                "3. Kênh voice:\n" +
                `${channels.voice}\n\n` +
                "Cách dùng: discord voice [tên kênh]\n" +
                "VD: discord voice General\n\n" +
                "4. Kênh thông báo:\n" +
                `${channels.announcement}\n\n` +
                "5. Gửi tin nhắn:\n" +
                "→ discord send [tên kênh] [nội dung]\n" +
                "VD: discord send general Hello!\n\n" +
                "6. Lệnh khác:\n" +
                "→ discord stats - Xem thống kê\n" +
                "→ discord roles - Xem danh sách role\n" +
                "→ discord emojis - Xem emoji server",
                threadID, messageID
            );
        }

        const command = target[0].toLowerCase();
        let loadingMsg;

        try {
            switch (command) {
                case "info": {
                    loadingMsg = await api.sendMessage("⏳ Đang tải thông tin server...", threadID);
                
                    const iconAttachment = [];
                    if (guild.iconURL()) {
                        const iconPath = path.join(cacheDir, `discord_icon_${Date.now()}.png`);
                        const response = await axios({
                            url: guild.iconURL({ format: 'png', size: 1024 }),
                            responseType: 'arraybuffer'
                        });
                        fs.writeFileSync(iconPath, Buffer.from(response.data));
                        iconAttachment.push(fs.createReadStream(iconPath));
                    }

                    const channels = {
                        text: guild.channels.cache.filter(c => c.type === 0),
                        voice: guild.channels.cache.filter(c => c.type === 2),
                        announcement: guild.channels.cache.filter(c => c.type === 5)
                    };

                    let channelsList = "\n📝 Danh sách kênh:\n";
                    
                    if (channels.text.size > 0) {
                        channelsList += "\n💭 Text Channels:\n";
                        channels.text.forEach(c => channelsList += `→ #${c.name}\n`);
                    }
                    
                    if (channels.voice.size > 0) {
                        channelsList += "\n🎤 Voice Channels:\n";
                        channels.voice.forEach(c => {
                            const memberCount = c.members.size;
                            channelsList += `→ ${c.name} ${memberCount > 0 ? `(${memberCount} người)` : ''}\n`;
                        });
                    }

                    if (channels.announcement.size > 0) {
                        channelsList += "\n📢 Announcement Channels:\n";
                        channels.announcement.forEach(c => channelsList += `→ ${c.name}\n`);
                    }

                    await api.sendMessage({
                        body: `🎮 Server: ${guild.name}\n\n` +
                              `👑 Chủ sở hữu: ${(await guild.fetchOwner()).user.tag}\n` +
                              `👥 Thành viên: ${guild.memberCount}\n` +
                              `💬 Tổng số kênh: ${guild.channels.cache.size}\n` +
                              `✨ Boost level: ${guild.premiumTier}\n` +
                              `${channelsList}\n\n` +
                              `💡 Để xem chi tiết hơn, dùng:\n` +
                              `→ discord chat [tên kênh]\n` +
                              `→ discord voice [tên kênh]`,
                        attachment: iconAttachment
                    }, threadID, () => {
                        if (iconAttachment.length > 0) fs.unlinkSync(iconAttachment[0].path);
                        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                    }, messageID);
                    break;
                }

                case "chat": {
                    const channelName = target[1];
                    if (!channelName) throw new Error("Vui lòng nhập tên kênh!");
                    
                    const channel = guild.channels.cache.find(c => 
                        c.type === 0 && c.name.toLowerCase().includes(channelName.toLowerCase())
                    );
                    if (!channel) throw new Error("Không tìm thấy kênh này!");

                    const limit = parseInt(target[2]) || 10;
                    loadingMsg = await api.sendMessage("⏳ Đang tải tin nhắn...", threadID);
                    
                    const messages = await channel.messages.fetch({ limit });
                    let response = `💬 #${channel.name}\n\n`;
                    messages.reverse().forEach(msg => {
                        response += `${msg.author.tag}:\n${msg.content || '[Media/Embed]'}\n\n`;
                    });

                    await api.sendMessage(response, threadID, () => {
                        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                    }, messageID);
                    break;
                }

                case "send": {
                    const channelName = target[1];
                    if (!channelName) throw new Error("Vui lòng nhập tên kênh!");
                    
                    const content = target.slice(2).join(" ");
                    if (!content) throw new Error("Vui lòng nhập nội dung tin nhắn!");

                    const channel = guild.channels.cache.find(c => 
                        c.type === 0 && c.name.toLowerCase().includes(channelName.toLowerCase())
                    );
                    if (!channel) throw new Error("Không tìm thấy kênh này!");

                    loadingMsg = await api.sendMessage("⏳ Đang gửi tin nhắn...", threadID);
                    await channel.send(`[Messenger] ${event.senderID}: ${content}`);

                    await api.sendMessage("✅ Đã gửi tin nhắn!", threadID, () => {
                        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                    }, messageID);
                    break;
                }

                case "voice": {
                    const channelName = target[1];
                    if (!channelName) throw new Error("Vui lòng nhập tên kênh voice!");

                    const channel = guild.channels.cache.find(c => 
                        c.type === 2 && c.name.toLowerCase().includes(channelName.toLowerCase())
                    );
                    if (!channel) throw new Error("Không tìm thấy kênh voice này!");

                    loadingMsg = await api.sendMessage("⏳ Đang kiểm tra voice...", threadID);

                    const members = channel.members.map(m => ({
                        name: m.user.tag,
                        status: m.voice.mute ? '🔇' : m.voice.deaf ? '🔈' : '🔊'
                    }));

                    await api.sendMessage(
                        `🎤 Voice: ${channel.name}\n` +
                        `👥 Số người: ${members.length}/${channel.userLimit || '∞'}\n\n` +
                        members.map(m => `${m.status} ${m.name}`).join('\n'),
                        threadID, () => {
                            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                        }, messageID
                    );
                    break;
                }

                case "stats": {
                    loadingMsg = await api.sendMessage("⏳ Đang tải thống kê...", threadID);
                    
                    const stats = {
                        members: await guild.members.fetch(),
                        channels: guild.channels.cache,
                        roles: guild.roles.cache.size,
                        emojis: guild.emojis.cache.size
                    };

                    await api.sendMessage(
                        `📊 Thống kê ${guild.name}\n\n` +
                        `👤 Thành viên: ${stats.members.size}\n` +
                        `🤖 Bots: ${stats.members.filter(m => m.user.bot).size}\n` +
                        `💭 Kênh chat: ${stats.channels.filter(c => c.type === 0).size}\n` +
                        `🎤 Kênh voice: ${stats.channels.filter(c => c.type === 2).size}\n` +
                        `👑 Roles: ${stats.roles}\n` +
                        `😀 Emojis: ${stats.emojis}`,
                        threadID, () => {
                            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                        }, messageID
                    );
                    break;
                }

                case "channels": {
                    loadingMsg = await api.sendMessage("⏳ Đang tải thông tin kênh...", threadID);

                    const textChannels = channelsInfo.text;
                    const voiceChannels = channelsInfo.voice;
                    const annChannels = channelsInfo.announcement;

                    let response = "📊 Danh sách kênh:\n\n";
                    
                    if (textChannels.length > 0) {
                        response += "💬 Kênh chat:\n";
                        textChannels.forEach(c => {
                            response += `→ #${c.name}\n`;
                            response += `   ID: ${c.id}\n`;
                        });
                        response += "\n";
                    }

                    if (voiceChannels.length > 0) {
                        response += "🎤 Kênh voice:\n";
                        voiceChannels.forEach(c => {
                            const channel = guild.channels.cache.get(c.id);
                            const memberCount = channel.members.size;
                            response += `→ ${c.name}\n`;
                            response += `   ID: ${c.id}\n`;
                            response += `   Đang có: ${memberCount} người\n`;
                        });
                        response += "\n";
                    }

                    if (annChannels.length > 0) {
                        response += "📢 Kênh thông báo:\n";
                        annChannels.forEach(c => {
                            response += `→ ${c.name}\n`;
                            response += `   ID: ${c.id}\n`;
                        });
                    }

                    await api.sendMessage(response, threadID, () => {
                        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                    }, messageID);
                    break;
                }

                case "roles": {
                    loadingMsg = await api.sendMessage("⏳ Đang tải thông tin role...", threadID);

                    const roles = guild.roles.cache
                        .sort((a, b) => b.position - a.position)
                        .map(role => ({
                            name: role.name,
                            members: role.members.size,
                            color: role.hexColor
                        }));

                    let response = "👑 Danh sách role:\n\n";
                    roles.forEach(role => {
                        if (role.name !== "@everyone") {
                            response += `→ ${role.name}\n`;
                            response += `   Thành viên: ${role.members}\n`;
                            response += `   Màu: ${role.color}\n\n`;
                        }
                    });

                    await api.sendMessage(response, threadID, () => {
                        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                    }, messageID);
                    break;
                }

                case "emojis": {
                    loadingMsg = await api.sendMessage("⏳ Đang tải emoji...", threadID);

                    const emojis = guild.emojis.cache;
                    let response = `😀 Danh sách emoji (${emojis.size}):\n\n`;

                    emojis.forEach(emoji => {
                        response += `→ :${emoji.name}: ${emoji.animated ? '[GIF]' : '[IMG]'}\n`;
                        response += `   ID: ${emoji.id}\n\n`;
                    });

                    await api.sendMessage(response, threadID, () => {
                        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                    }, messageID);
                    break;
                }

                case "invite": {
                    loadingMsg = await api.sendMessage("⏳ Đang tạo link mời...", threadID);
 
                    const defaultChannel = guild.channels.cache.find(
                        channel => channel.name === 'general' || channel.name === 'chung'
                    ) || guild.channels.cache.find(
                        channel => channel.type === 0 
                    );

                    if (!defaultChannel) {
                        throw new Error("Không tìm thấy kênh phù hợp để tạo link mời!");
                    }

                    const invite = await defaultChannel.createInvite({
                        maxAge: 86400, 
                        maxUses: 10,
                        unique: true,
                        reason: `Created by ${event.senderID} from Messenger`
                    });

                    await api.sendMessage({
                        body: `🎮 Link mời vào server ${guild.name}:\n\n` +
                              `🔗 https://discord.gg/${invite.code}\n\n` +
                              `⏰ Thời hạn: 24 giờ\n` +
                              `👥 Số lượt dùng: 10 lượt\n` +
                              `📝 Kênh: #${defaultChannel.name}`,
                        attachment: null
                    }, threadID, () => {
                        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                    }, messageID);
                    break;
                }

                case "ping": {
                    if (!target[1]) throw new Error("Vui lòng nhập tên kênh!");
                    
                    const channelName = target[1];
                    const content = target.slice(2).join(" ") || "Ping @everyone!";

                    const channel = guild.channels.cache.find(c => 
                        c.type === 0 && c.name.toLowerCase().includes(channelName.toLowerCase())
                    );
                    if (!channel) throw new Error("Không tìm thấy kênh này!");

                    loadingMsg = await api.sendMessage("⏳ Đang ping everyone...", threadID);

                    await channel.send({
                        content: `[Messenger] ${event.senderID}: ${content}`,
                        allowedMentions: { 
                            parse: ['everyone'] 
                        }
                    });

                    await api.sendMessage("✅ Đã ping everyone!", threadID, () => {
                        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                    }, messageID);
                    break;
                }

                default:
                    throw new Error("Lệnh không hợp lệ! Gõ 'discord' để xem hướng dẫn.");
            }
        } catch (error) {
            console.error('Discord command error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};
