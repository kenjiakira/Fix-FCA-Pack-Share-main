const { Client, GatewayIntentBits } = require('discord.js');
const { DISCORD } = require('../config/api');
const fs = require('fs');
const path = require('path');

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

module.exports = {
    name: "discord",
    dev: "HNT",
    category: "Admin Commands",
    info: "Tương tác với Discord Server",
    usages: "discord [info/chat/send/invite]", 
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!isInitialized) {
            try {
                await client.login(DISCORD.TOKEN);
                guild = await client.guilds.fetch(DISCORD.SERVER_ID);
                isInitialized = true;
            } catch (error) {
                console.error('Discord connection error:', error);
                return api.sendMessage("❌ Không thể kết nối với Discord Server.", threadID, messageID);
            }
        }

        if (!target[0]) {
            const textChannels = guild.channels.cache
                .filter(c => c.type === 0)
                .map(c => `→ #${c.name}`)
                .join('\n');

            return api.sendMessage(
                "🎮 Discord Commands\n\n" +
                "1. Xem thông tin server:\n" +
                "→ discord info\n\n" +
                "2. Kênh chat:\n" +
                `${textChannels}\n\n` +
                "Cách dùng: discord chat [tên kênh] [số tin]\n" +
                "VD: discord chat general 5\n\n" +
                "3. Gửi tin nhắn:\n" +
                "→ discord send [tên kênh] [nội dung]\n" +
                "VD: discord send general Hello!\n\n" +
                "4. Tạo link mời:\n" +
                "→ discord invite [thời hạn (giờ)]",
                threadID, messageID
            );
        }

        const command = target[0].toLowerCase();
        let loadingMsg;

        try {
            switch (command) {
                case "info": {
                    loadingMsg = await api.sendMessage("⏳ Đang tải thông tin server...", threadID);
                    
                    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
                    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;

                    await api.sendMessage(
                        `🎮 Server: ${guild.name}\n\n` +
                        `👥 Thành viên: ${guild.memberCount}\n` +
                        `💬 Kênh chat: ${textChannels}\n` +
                        `🎤 Kênh voice: ${voiceChannels}`,
                        threadID, () => {
                            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                        }, messageID
                    );
                    break;
                }

                case "chat": {
                    const channelName = target[1];
                    if (!channelName) throw new Error("Vui lòng nhập tên kênh!");
                    
                    const channel = guild.channels.cache.find(c => 
                        c.type === 0 && c.name.toLowerCase().includes(channelName.toLowerCase())
                    );
                    if (!channel) throw new Error("Không tìm thấy kênh này!");

                    const limit = parseInt(target[2]) || 5;
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

                case "invite": {
                    loadingMsg = await api.sendMessage("⏳ Đang tạo link mời...", threadID);
                    
                    const hours = parseInt(target[1]) || 24;
                    const maxAge = hours * 3600; 
                    const inviteChannel = guild.systemChannel || guild.channels.cache.find(c => c.type === 0);
                    
                    if (!inviteChannel) throw new Error("Không tìm thấy kênh phù hợp để tạo link mời!");
                    
                    const invite = await inviteChannel.createInvite({
                        maxAge: maxAge,
                        maxUses: 0,
                        unique: true,
                        reason: `Created by ${event.senderID} from Messenger`
                    });

                    await api.sendMessage(
                        `🎮 Link mời Discord Server\n\n` +
                        `→ Thời hạn: ${hours} giờ\n` +
                        `→ Link: ${invite.url}`,
                        threadID, () => {
                            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                        }, messageID
                    );
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
