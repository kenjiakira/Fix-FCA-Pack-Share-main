const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logBotEvent } = require('../utils/logs');
const messageQueue = require('../utils/messageQueue');
const { TICKET_CHANNEL, TICKET_CATEGORY, SUPPORT_ROLE } = require('../config/channels');

const TICKET_FILE = path.join(__dirname, '../../database/discord/tickets.json');
const VERIFICATIONS_FILE = path.join(__dirname, '../../database/discord_links.json');

let currentPanel = null;

function loadTickets() {
    try {
        if (!fs.existsSync(TICKET_FILE)) {
            fs.writeFileSync(TICKET_FILE, JSON.stringify({ tickets: [] }));
        }
        return JSON.parse(fs.readFileSync(TICKET_FILE));
    } catch (error) {
        logBotEvent('TICKET_ERROR', `Failed to load tickets: ${error.message}`);
        return { tickets: [] };
    }
}

function saveTicket(ticketData) {
    try {
        const tickets = loadTickets();
        tickets.tickets.push(ticketData);
        fs.writeFileSync(TICKET_FILE, JSON.stringify(tickets, null, 2));
        return true;
    } catch (error) {
        logBotEvent('TICKET_ERROR', `Failed to save ticket: ${error.message}`);
        return false;
    }
}

async function cleanOldMessages(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const oldMessages = messages.filter(msg => 
            msg.author.bot && 
            (msg.embeds.length > 0 || msg.components.length > 0)
        );
        
        for (const message of oldMessages.values()) {
            try {
                if (message.deletable) {
                    await message.delete().catch(() => {});
                }
            } catch (error) {
                if (error.code !== 10008) {
                    console.error(`Error deleting message ${message.id}:`, error.message);
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (error) {
        console.error('Error cleaning old messages:', error);
    }
}

async function createTicketChannel(interaction, ticketType) {
    const ticketNumber = Date.now().toString().slice(-4);
    const channelName = `ticket-${ticketType.name.toLowerCase()}-${ticketNumber}`;

    const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: 0,
        parent: TICKET_CATEGORY,
        topic: `Ticket của ${interaction.user.tag} (${interaction.user.id})`,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ],
            },
            {
                id: SUPPORT_ROLE,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ],
            }
        ],
    });

    const ticketEmbed = new EmbedBuilder()
        .setColor(ticketType.color)
        .setTitle(`${ticketType.emoji} ${ticketType.name} Support`)
        .setDescription([
            `Xin chào ${interaction.user},`,
            `Bạn đã tạo ticket ${ticketType.name.toLowerCase()}: ${ticketType.description}`,
            '',
            '**Để được hỗ trợ tốt nhất, vui lòng:**',
            '1. Mô tả vấn đề chi tiết',
            '2. Cung cấp screenshots nếu cần',
            '3. Kiên nhẫn chờ phản hồi',
            '',
            '⚠️ Ticket sẽ tự đóng sau 24h nếu không có hoạt động'
        ].join('\n'))
        .setTimestamp();

    const baseRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Đóng Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
        );

    const rows = [baseRow];
    if (ticketType.buttons) {
        const customRow = new ActionRowBuilder()
            .addComponents(
                ticketType.buttons.map(btn => 
                    new ButtonBuilder()
                        .setCustomId(btn.customId)
                        .setLabel(btn.label)
                        .setStyle(btn.style)
                        .setEmoji(btn.emoji)
                )
            );
        rows.push(customRow);
    }

    const msg = await ticketChannel.send({
        content: `${interaction.user} | <@&${SUPPORT_ROLE}>`,
        embeds: [ticketEmbed],
        components: rows
    });

    // Setup collector for ticket channel buttons
    const collector = msg.createMessageComponentCollector({
        filter: i => i.isButton()
    });

    collector.on('collect', async (i) => {
        try {
            if (!i.member) {
                await i.reply({
                    content: '❌ Không thể xác thực người dùng!',
                    flags: [4096]
                });
                return;
            }

            switch (i.customId) {
                case 'close_ticket':
                    await handleTicketClose(i, ticketChannel);
                    break;
                    
                case 'link_account':
                    await handleLinkAccount(i);
                    break;
                    
                default:
                    if (i.customId.startsWith('copy_')) {
                        await i.reply({
                            content: `\`${i.customId.split('_')[1]}\``,
                            flags: [4096]
                        });
                        return;
                    }
                    
                    await i.reply({
                        content: '❌ Tương tác không hợp lệ!',
                        flags: [4096]
                    });
            }
        } catch (error) {
            console.error('Error handling ticket interaction:', error);
            if (!i.replied && !i.deferred) {
                await i.reply({
                    content: '❌ Có lỗi xảy ra khi xử lý yêu cầu!',
                    flags: [4096]
                }).catch(() => {});
            }
        }
    });

    return {
        channel: ticketChannel,
        message: msg
    };
}

async function handleTicketClose(interaction, channel) {
    try {
        const targetChannel = channel || interaction.channel;
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) &&
            !interaction.member.roles.cache.has(SUPPORT_ROLE) &&
            !targetChannel.topic?.includes(interaction.user.id)) {
            await interaction.reply({
                content: '❌ Bạn không có quyền đóng ticket này!',
                flags: [4096]
            });
            return;
        }

        await interaction.reply({
            content: '✅ Đang đóng ticket...',
            flags: [4096]
        });

        const tickets = loadTickets();
        const ticketIndex = tickets.tickets.findIndex(t => t.channelId === targetChannel.id);
        if (ticketIndex !== -1) {
            tickets.tickets[ticketIndex].status = 'closed';
            tickets.tickets[ticketIndex].closedAt = new Date().toISOString();
            tickets.tickets[ticketIndex].closedBy = interaction.user.id;
            fs.writeFileSync(TICKET_FILE, JSON.stringify(tickets, null, 2));
        }

        await targetChannel.delete();
    } catch (error) {
        console.error('Error closing ticket:', error);
        await interaction.reply({
            content: '❌ Có lỗi xảy ra khi đóng ticket!',
            flags: [4096]
        }).catch(() => {});
    }
}

async function handleLinkAccount(interaction) {
    try {
        const discordId = interaction.user.id;
        
        let links = { links: [] };
        if (fs.existsSync(VERIFICATIONS_FILE)) {
            links = JSON.parse(fs.readFileSync(VERIFICATIONS_FILE));
        }
        
        // Check if Discord ID is already linked
        if (links.links.some(link => link.discordId === discordId)) {
            await interaction.reply({
                content: '❌ Tài khoản Discord này đã được liên kết!',
                flags: [4096]
            });
            return;
        }

        await interaction.reply({
            content: [
                '**🔗 Hướng dẫn liên kết tài khoản:**',
                '',
                '1. Mở Messenger Bot',
                '2. Copy Discord ID của bạn:',
                '```',
                discordId,
                '```',
                '3. Nhắn tin lệnh: `.link ' + discordId + '`',
                '4. Chờ xác nhận từ hệ thống',
                '',
                '⚠️ Mỗi tài khoản chỉ liên kết được 1 lần'
            ].join('\n'),
            flags: [4096]
        });
    } catch (error) {
        console.error('Error handling account link:', error);
        await interaction.reply({
            content: '❌ Có lỗi xảy ra khi liên kết tài khoản!',
            flags: [4096]
        }).catch(() => {});
    }
}

async function createTicketPanel(channel) {
    try {
        await cleanOldMessages(channel);

        const ticketEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎫 Hệ Thống Ticket Support')
            .setDescription([
                '**Cần giúp đỡ? Tạo ticket để được hỗ trợ!**',
                '',
                '⏰ **Thời gian phản hồi:**',
                '```',
                'Thứ 2:   9AM - 21PM',
                'Thứ 3:   9AM - 21PM',
                'Thứ 4:   9AM - 21PM',
                'Thứ 5:   9AM - 22PM',
                'Thứ 6:   9AM - 22PM',
                'Thứ 7:   9AM - 24PM',
                'CN  :    10AM - 20PM',
                '```',
                'Chúng tôi sẽ cố gắng phản hồi sớm nhất có thể để giải quyết vấn đề của bạn.',
                '',
                '⚠️ **Lưu ý quan trọng:**',
                '• Mỗi người chỉ được tạo 1 ticket cùng lúc',
                '• Vui lòng cung cấp đầy đủ thông tin',
                '• Ticket không hoạt động sẽ tự đóng sau 24h'
            ].join('\n'))
            .setFooter({ text: 'Click nút bên dưới để tạo ticket' });

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_bug')
                    .setLabel('Báo Lỗi')
                    .setEmoji('🐛')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket_support')
                    .setLabel('Hỗ Trợ')
                    .setEmoji('💡')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_payment')
                    .setLabel('Giao Dịch')
                    .setEmoji('💰')
                    .setStyle(ButtonStyle.Success)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_other')
                    .setLabel('Khác')
                    .setEmoji('❓')
                    .setStyle(ButtonStyle.Secondary)
            );

        currentPanel = await channel.send({
            embeds: [ticketEmbed],
            components: [row1, row2]
        });

        return true;
    } catch (error) {
        console.error('Error creating ticket panel:', error);
        return false;
    }
}

const ticketTypes = {
    'ticket_bug': {
        name: 'Báo Lỗi',
        emoji: '🐛',
        color: 0xFF0000,
        description: 'Báo cáo lỗi hệ thống hoặc bot'
    },
    'ticket_support': {
        name: 'Hỗ Trợ',
        emoji: '💡',
        color: 0x3498DB,
        description: 'Hỗ trợ sử dụng và liên kết tài khoản',
        buttons: [
            {
                customId: 'link_account',
                label: 'Liên Kết Tài Khoản',
                style: ButtonStyle.Primary,
                emoji: '🔗'
            }
        ]
    },
    'ticket_payment': {
        name: 'Giao Dịch',
        emoji: '💰',
        color: 0x2ECC71,
        description: 'Vấn đề về giao dịch Nitro và xu'
    },
    'ticket_other': {
        name: 'Vấn Đề Khác',
        emoji: '❓',
        color: 0x95A5A6,
        description: 'Các vấn đề khác'
    }
};

module.exports = {
    name: 'ticket',
    description: 'Quản lý ticket support',
    execute: async (message) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Bạn không có quyền sử dụng lệnh này!');
        }
        await createTicketPanel(message.channel);
    },
    createTicketPanel,
    handleInteraction: async (interaction) => {
        try {
            if (!interaction.isButton()) return;

            if (!interaction.member) {
                await interaction.reply({
                    content: '❌ Không thể xác thực người dùng!',
                    flags: [4096]
                });
                return;
            }

            switch (interaction.customId) {
                case 'close_ticket':
                    await handleTicketClose(interaction, interaction.channel);
                    break;
                    
                case 'link_account':
                    await handleLinkAccount(interaction);
                    break;
                    
                case 'ticket_bug':
                case 'ticket_support':
                case 'ticket_payment':
                case 'ticket_other':
                    const existingTicket = interaction.guild.channels.cache
                        .find(channel => 
                            channel.name.startsWith('ticket-') && 
                            channel.topic?.includes(interaction.user.id)
                        );

                    if (existingTicket) {
                        await interaction.reply({
                            content: `❌ Bạn đã có ticket đang mở: ${existingTicket}`,
                            flags: [4096]
                        });
                        return;
                    }

                    const ticketType = ticketTypes[interaction.customId];
                    if (!ticketType) {
                        await interaction.reply({
                            content: '❌ Loại ticket không hợp lệ!',
                            flags: [4096]
                        });
                        return;
                    }

                    const { channel } = await createTicketChannel(interaction, ticketType);
                    await interaction.reply({
                        content: `✅ Ticket của bạn đã được tạo: ${channel}`,
                        flags: [4096]
                    });
                    break;
                    
                default:
                    if (interaction.customId.startsWith('copy_')) {
                        await interaction.reply({
                            content: `\`${interaction.customId.split('_')[1]}\``,
                            flags: [4096]
                        });
                        return;
                    }
                    
                    await interaction.reply({
                        content: '❌ Tương tác không hợp lệ!',
                        flags: [4096]
                    });
            }
        } catch (error) {
            console.error('Error handling ticket interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Có lỗi xảy ra khi xử lý yêu cầu!',
                    flags: [4096]
                }).catch(() => {});
            }
        }
    }
};
