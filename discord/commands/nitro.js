const { getBalance, updateBalance } = require('../utils/currencies');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const exchangeLogFile = path.join(__dirname, '../../database/exchange_logs.json');
const EXCHANGE_RATE = 100; // 1 Nitro = 100 xu

function loadExchangeLogs() {
    try {
        if (fs.existsSync(exchangeLogFile)) {
            return JSON.parse(fs.readFileSync(exchangeLogFile, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error('Error loading exchange logs:', error);
        return {};
    }
}

function saveExchangeLog(log) {
    try {
        const logs = loadExchangeLogs();
        if (!logs.exchanges) logs.exchanges = [];
        logs.exchanges.push(log);
        fs.writeFileSync(exchangeLogFile, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error saving exchange log:', error);
    }
}

async function checkMessengerId(id) {
    // Kiểm tra format ID
    if (!/^\d{8,16}$/.test(id)) {
        return {
            valid: false,
            message: "ID Messenger phải là số và có độ dài 8-16 ký tự"
        };
    }

    // Kiểm tra ID trong database
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

module.exports = {
    name: 'nitro',
    description: 'Đổi Nitro sang xu Messenger',
    usage: '.nitro <ID_Messenger> <số_lượng>',
    async execute(message, args) {
        if (!args.length) {
            return message.reply('❌ Vui lòng sử dụng đúng cú pháp:\n`.nitro <ID_Messenger> <số_lượng>`\nVí dụ: `.nitro 61573427362389 1000`');
        }

        const messengerID = args[0];
        const amount = parseInt(args[1]);

        if (!messengerID || !amount) {
            return message.reply('❌ Thiếu thông tin! Vui lòng nhập đủ ID Messenger và số lượng Nitro\n`.nitro <ID_Messenger> <số_lượng>`');
        }

        if (isNaN(amount) || amount <= 0) {
            return message.reply('❌ Số lượng Nitro không hợp lệ!');
        }

        // Kiểm tra ID Messenger
        const idCheck = await checkMessengerId(messengerID);
        if (!idCheck.valid) {
            return message.reply(`❌ ${idCheck.message}`);
        }

        const userBalance = getBalance(message.author.id);

        if (userBalance < amount) {
            return message.reply('❌ Số dư Nitro không đủ để thực hiện giao dịch!');
        }

        const xuAmount = amount * EXCHANGE_RATE;
        const transactionId = `EX${Date.now()}${Math.random().toString(36).substr(2, 5)}`;

        try {
            // Update Discord balance
            updateBalance(message.author.id, -amount);

            // Create exchange log
            const exchangeLog = {
                transactionId,
                timestamp: new Date().toISOString(),
                discordId: message.author.id,
                discordUsername: message.author.tag,
                messengerId: messengerID,
                nitroAmount: amount,
                xuAmount: xuAmount,
                status: 'pending'
            };

            saveExchangeLog(exchangeLog);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔄 Yêu cầu đổi tiền')
                .setDescription('Giao dịch đang được xử lý')
                .addFields([
                    { name: '🆔 Mã giao dịch', value: transactionId, inline: false },
                    { name: '💸 Số lượng Nitro', value: amount.toString(), inline: true },
                    { name: '💰 Số xu nhận được', value: xuAmount.toString(), inline: true },
                    { name: '👤 ID Messenger', value: messengerID, inline: false },
                    { name: '⏳ Trạng thái', value: 'Đang xử lý', inline: false }
                ])
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Exchange error:', error);
            message.reply('❌ Đã xảy ra lỗi trong quá trình xử lý giao dịch!');
        }
    }
};
