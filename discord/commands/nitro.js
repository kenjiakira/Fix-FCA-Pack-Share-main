const { getBalance, updateBalance } = require('../utils/currencies');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const exchangeLogFile = path.join(__dirname, '../../database/exchange_logs.json');
const linksFile = path.join(__dirname, '../../database/discord_links.json');
const NITRO_CHANNEL_ID = '1341744524338135125';
const EXCHANGE_RATE = 10;

const STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    EXPIRED: 'expired'
};

function loadExchangeLogs() {
    try {
        if (!fs.existsSync(exchangeLogFile)) {
            fs.writeFileSync(exchangeLogFile, JSON.stringify({ exchanges: [] }));
        }
        return JSON.parse(fs.readFileSync(exchangeLogFile));
    } catch (error) {
        console.error('Error loading exchange logs:', error);
        return { exchanges: [] };
    }
}

function saveExchangeLog(log) {
    try {
        const logs = loadExchangeLogs();
        if (!logs.exchanges) logs.exchanges = [];
        logs.exchanges.push(log);
        fs.writeFileSync(exchangeLogFile, JSON.stringify(logs, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving exchange log:', error);
        return false;
    }
}

function getLinkedMessengerId(discordId) {
    try {
        const links = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
        const link = links.links.find(l => l.discordId === discordId);
        return link ? link.messengerId : null;
    } catch {
        return null;
    }
}

async function processExchange(message, amount, response) {
  
    if (isNaN(amount) || amount <= 0) {
        await response.edit({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription('❌ Số lượng không hợp lệ!')
            ]
        });
        return;
    }

    const userBalance = getBalance(message.author.id);
    if (userBalance < amount) {
        await response.edit({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`❌ Số dư không đủ! Bạn cần ${amount} Nitro nhưng chỉ có ${userBalance} Nitro`)
            ]
        });
        return;
    }

    const messengerID = getLinkedMessengerId(message.author.id);
    if (!messengerID) {
        const notLinkedEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Tài khoản chưa được liên kết')
            .setDescription([
                'Bạn cần liên kết tài khoản Messenger trước khi đổi Nitro.',
                '',
                '**Cách liên kết:**',
                '1. Tạo ticket Hỗ Trợ',
                '2. Nhấn nút Liên Kết Tài Khoản',
                '3. Làm theo hướng dẫn'
            ].join('\n'));

        const notLinkedMsg = await response.edit({ embeds: [notLinkedEmbed] });
        
        setTimeout(() => {
            notLinkedMsg.delete().catch(() => {});
        }, 30000);
        
        return;
    }

    const xuAmount = amount * EXCHANGE_RATE;
    const transactionId = `EX${Date.now()}${Math.random().toString(36).substr(2, 5)}`;

    try {
       
        updateBalance(message.author.id, -amount);

        const exchangeLog = {
            transactionId,
            timestamp: new Date().toISOString(),
            discordId: message.author.id,
            discordUsername: message.author.tag,
            messengerId: messengerID,
            nitroAmount: amount,
            xuAmount: xuAmount,
            status: STATUS.PENDING,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        if (!saveExchangeLog(exchangeLog)) {
            throw new Error('Failed to save exchange log');
        }

        const publicEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`✅ ${message.author} đã thực hiện giao dịch đổi Nitro thành công!`);

        await message.channel.send({ embeds: [publicEmbed] });

        const dmCopyButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`copy_${transactionId}`)
                    .setLabel('Sao chép mã giao dịch')
                    .setStyle(ButtonStyle.Secondary)
            );

        const dmEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🔄 Chi tiết giao dịch của bạn')
            .setDescription([
                '**Trạng thái:** Đang xử lý',
                '',
                '**Thông tin giao dịch:**',
                `• Số Nitro: ${amount}`,
                `• Số xu: ${xuAmount}`,
                `• ID Messenger: ${messengerID}`,
                '',
                '**Mã giao dịch:**',
                `\`${transactionId}\``,
                '',
                '**Cách nhận xu:**',
                '1. Vào Messenger chat với bot',
                '2. Gõ lệnh: `.claim ' + transactionId + '`',
                '',
                '⚠️ **Lưu ý:**',
                '• Mã giao dịch có hiệu lực trong 24h',
                '• Không chia sẻ mã với người khác'
            ].join('\n'))
            .setTimestamp();

        try {
            await message.author.send({
                embeds: [dmEmbed],
                components: [dmCopyButton]
            });
        } catch (dmError) {
            await message.channel.send({
                content: `${message.author} ❌ Không thể gửi tin nhắn riêng. Vui lòng bật DM để nhận mã giao dịch.`,
                ephemeral: true
            });
        }

        await response.delete().catch(() => {});

    } catch (error) {
        console.error('Exchange error:', error);
        updateBalance(message.author.id, amount); 
        
        await response.edit({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription('❌ Đã xảy ra lỗi trong quá trình xử lý giao dịch!')
            ]
        });
    }
}

async function checkMessengerId(id) {
    if (!/^\d{8,16}$/.test(id)) {
        return {
            valid: false,
            message: "ID Messenger phải là số và có độ dài 8-16 ký tự"
        };
    }

    const currenciesPath = path.join(__dirname, '../../database/currencies.json');
    try {
        const data = JSON.parse(fs.readFileSync(currenciesPath, 'utf8'));
        if (!data.balance || !data.balance.hasOwnProperty(id)) {
            return {
                valid: false,
                message: "ID Messenger không tồn tại trong hệ thống"
            };
        }
        return {
            valid: true,
            message: "OK"
        };
    } catch (err) {
        console.error('Lỗi kiểm tra ID:', err);
        return {
            valid: false,
            message: "Lỗi hệ thống khi kiểm tra ID"
        };
    }
}

async function initNitroChannel(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        await channel.bulkDelete(messages);

        const infoEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🔄 Hệ Thống Đổi Nitro sang Xu')
            .setDescription([
                '**Hướng dẫn đổi Nitro:**',
                '',
                '1️⃣ Gõ lệnh `.nitro` để bắt đầu',
                '2️⃣ Chọn số lượng Nitro muốn đổi bằng nút bên dưới', 
                '3️⃣ Bot sẽ gửi mã qua tin nhắn riêng',
                '4️⃣ Nhận và giữ lại mã giao dịch',
                '5️⃣ Vào Messenger gõ `.claim <mã_giao_dịch>` để nhận xu',
                '',
                '📌 **Lưu ý quan trọng:**',
                '• Tỉ lệ đổi: 1 Nitro = 10 Xu',
                '• Giao dịch hoàn toàn tự động và an toàn',
                '• Mã giao dịch chỉ sử dụng được 1 lần',
                '• Bot sẽ gửi mã giao dịch qua tin nhắn riêng',
                '• Vui lòng bật nhận tin nhắn từ server',
                '',
                '⚠️ **Chú ý:**',
                '• Không chia sẻ mã giao dịch cho người khác', 
                '• Giao dịch không thể hoàn tác',
                '',
                '❓ Cần hỗ trợ? Tag Admin hoặc mở ticket'
            ].join('\n'))
            .setTimestamp()
            .setFooter({ text: 'Bot Auto Exchange • Cập nhật: ' + new Date().toLocaleDateString('vi-VN') });

        await channel.send({ embeds: [infoEmbed] });
        return true;
    } catch (error) {
        console.error('Error initializing Nitro channel:', error);
        return false;
    }
}

module.exports = {
    name: 'nitro',
    description: 'Đổi Nitro sang xu Messenger',
    usage: '.nitro',
    NITRO_CHANNEL_ID: NITRO_CHANNEL_ID,
    async execute(message, args) {
        await message.delete().catch(() => {});

        if (message.channel.id !== NITRO_CHANNEL_ID) {
            const replyEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription('❌ Lệnh này chỉ có thể sử dụng trong kênh Đổi Nitro');
            
            await message.channel.send({ 
                embeds: [replyEmbed], 
                ephemeral: true 
            });
            return;
        }

        const exchangeEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🔄 Đổi Nitro sang Xu')
            .setDescription('Vui lòng chọn số lượng Nitro muốn đổi')
            .addFields([
                { name: 'Tỉ lệ đổi', value: '1 Nitro = 10 Xu', inline: true },
                { name: 'Số dư hiện tại', value: `${getBalance(message.author.id)} Nitro`, inline: true }
            ]);

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('nitro_100')
                    .setLabel('100 Nitro')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('nitro_500')
                    .setLabel('500 Nitro')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('nitro_1000')
                    .setLabel('1000 Nitro')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('nitro_custom')
                    .setLabel('Số khác')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('nitro_cancel')
                    .setLabel('Hủy')
                    .setStyle(ButtonStyle.Danger)
            );

        const response = await message.channel.send({
            embeds: [exchangeEmbed],
            components: [row1, row2],
            ephemeral: true
        });

        const filter = i => i.user.id === message.author.id;
        const collector = response.createMessageComponentCollector({ 
            filter, 
            time: 60000 
        });

        collector.on('collect', async i => {
            if (i.customId === 'nitro_cancel') {
                await response.delete();
                return;
            }

            if (i.customId === 'nitro_custom') {
                await i.reply({
                    content: 'Vui lòng nhập số lượng Nitro muốn đổi:',
                    ephemeral: true
                });

                const messageCollector = i.channel.createMessageCollector({
                    filter: m => m.author.id === message.author.id,
                    time: 30000,
                    max: 1
                });

                messageCollector.on('collect', async m => {
                    const amount = parseInt(m.content);
                    await m.delete();
                    await processExchange(message, amount, response);
                });

                return;
            }

            const amount = parseInt(i.customId.split('_')[1]);
            await processExchange(message, amount, response);
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                await response.delete();
            }
        });
    },
    initNitroChannel,
    checkMessengerId
};
