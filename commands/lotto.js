const axios = require('axios');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');

const HISTORY_FILE = path.join(__dirname, '../database/json/quicklotto_history.json');
const SETTINGS_FILE = path.join(__dirname, '../database/json/lotto_settings.json');
const TICKETS_FILE = path.join(__dirname, '../database/json/lotto_tickets.json');

const SCHEDULE_INTERVAL = '*/10 * * * *';
const SPECIAL_PRIZE_RATIO = 95; 
const DE3_PRIZE_RATIO = 999; 
const LO_PRIZE_RATIO = 3.67;
const MIN_BET_LO = 27000;

let nextDrawTime = null;
let lastResults = [];
let ticketData = { tickets: {} };

function loadSettings() {
    try {
        const jsonDir = path.join(__dirname, '../database/json');
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir, { recursive: true });
        }
        
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE));
        }
        const defaultSettings = { enabledThreads: [] };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
    } catch (err) {
        console.error('Error loading lotto settings:', err);
        return { enabledThreads: [] };
    }
}
function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (err) {
        console.error('Error saving lotto settings:', err);
    }
}

function generateResults() {
    return {
        special: Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
        first: Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
        second: [
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0')
        ],
        third: [
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0')
        ],
        fourth: [
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0')
        ],
        fifth: [
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0')
        ],
        sixth: [
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0')
        ],
        seventh: [
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
            Math.floor(Math.random() * 100000).toString().padStart(5, '0')
        ]
    };
}

function saveHistory(results) {
    const drawData = {
        results: results,
        drawTime: Date.now(),
        nextDrawTime: nextDrawTime.getTime()
    };

    lastResults.unshift(drawData);
    if (lastResults.length > 10) lastResults.pop();

    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify({
            history: lastResults,
            lastUpdate: Date.now(),
            nextScheduledDraw: nextDrawTime.getTime()
        }, null, 2));
    } catch (err) {
        console.error('Error saving lottery history:', err);
    }
}
function loadHistory() {
    try {
        const jsonDir = path.join(__dirname, '../database/json');
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir, { recursive: true });
        }
        
        if (fs.existsSync(HISTORY_FILE)) {
            const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
            lastResults = data.history || [];

            if (data.nextScheduledDraw) {
                const savedNextDraw = new Date(data.nextScheduledDraw);
                if (savedNextDraw > new Date()) {
                    nextDrawTime = savedNextDraw;
                } else {
                    nextDrawTime = new Date();
                    nextDrawTime.setMinutes(Math.ceil(nextDrawTime.getMinutes() / 10) * 10, 0, 0);
                }
            }
        } else {
            lastResults = [];
            nextDrawTime = new Date();
            nextDrawTime.setMinutes(Math.ceil(nextDrawTime.getMinutes() / 10) * 10, 0, 0);
            
            saveHistory(generateResults());
            console.log("Created new lottery history file");
        }
    } catch (err) {
        console.error('Error loading lottery history:', err);
       
        lastResults = [];
        nextDrawTime = new Date();
        nextDrawTime.setMinutes(Math.ceil(nextDrawTime.getMinutes() / 10) * 10, 0, 0);
    }
}
function loadTickets() {
    try {
        if (fs.existsSync(TICKETS_FILE)) {
            return JSON.parse(fs.readFileSync(TICKETS_FILE));
        }
        return { tickets: {} };
    } catch (err) {
        console.error('Error loading lotto tickets:', err);
        return { tickets: {} };
    }
}

function saveTickets() {
    try {
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketData, null, 2));
    } catch (err) {
        console.error('Error saving lotto tickets:', err);
    }
}

function buyTicket(userId, threadId, number, amount, betType) {
    const drawId = nextDrawTime.getTime().toString();

    if (!ticketData.tickets[drawId]) {
        ticketData.tickets[drawId] = [];
    }

    ticketData.tickets[drawId].push({
        userId,
        threadId,
        number,
        amount,
        betType,
        purchaseTime: Date.now()
    });

    saveTickets();
}

function getUserTickets(userId, drawId) {
    if (!ticketData || !ticketData.tickets || !drawId || !ticketData.tickets[drawId]) {
        return [];
    }

    return ticketData.tickets[drawId].filter(ticket => ticket.userId === userId);
}

function getPotentialWinnings(betType, amount, number) {
    let message = "";

    switch (betType) {
        case 'de2':
            message += `💵 Giải ĐB (${number}): ${(amount * SPECIAL_PRIZE_RATIO).toLocaleString('vi-VN')}$ (x${SPECIAL_PRIZE_RATIO})\n`;
            break;
        case 'de3':
            message += `💵 Giải ĐB (${number}): ${(amount * DE3_PRIZE_RATIO).toLocaleString('vi-VN')}$ (x${DE3_PRIZE_RATIO})\n`;
            break;
        case 'de5':
            message += `💵 Giải ĐB (${number}): ${(amount * 10000).toLocaleString('vi-VN')}$ (x10000)\n`;
            break;
        case 'lo':
            message += `💵 Lô (${number}): ${(amount * LO_PRIZE_RATIO).toLocaleString('vi-VN')}$ (x${LO_PRIZE_RATIO})\n`;
        
            const hitCount = number === '00' ? 8 : 9; 
            message += `📊 Xác suất trúng: ~${hitCount}/100 (có ${hitCount} cặp số trong bảng kết quả)\n`;
            break;
    }

    return message;
}
function getAllTickets(drawId) {
    return ticketData.tickets[drawId] || [];
}

function clearOldTickets() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    Object.keys(ticketData.tickets).forEach(drawId => {
        if (parseInt(drawId) < oneDayAgo) {
            delete ticketData.tickets[drawId];
        }
    });

    saveTickets();
}

function checkWinners(results, drawId, api) {
    if (!ticketData.tickets[drawId]) return [];

    const winners = [];
    const specialLast2 = results.special.slice(-2); // Get last 2 digits of special prize
    const loNumbers = [
        results.first.slice(-2),
        ...results.second.map(num => num.slice(-2)),
        ...results.third.map(num => num.slice(-2)),
        ...results.fourth.map(num => num.slice(-2)),
        ...results.fifth.map(num => num.slice(-2)),
        ...results.sixth.map(num => num.slice(-2)),
        ...results.seventh.map(num => num.slice(-2))
    ];

    ticketData.tickets[drawId].forEach(ticket => {
        let winAmount = 0;
        switch (ticket.betType) {
            case 'de2':
                if (ticket.number === specialLast2) winAmount = ticket.amount * SPECIAL_PRIZE_RATIO;
                break;
            case 'de3':
                if (ticket.number === results.special.slice(-3)) winAmount = ticket.amount * DE3_PRIZE_RATIO;
                break;
            case 'de5':
                if (ticket.number === results.special) winAmount = ticket.amount * 10000;
                break;
            case 'lo':
                if (loNumbers.includes(ticket.number)) winAmount = ticket.amount * LO_PRIZE_RATIO;
                break;
        }
        if (winAmount > 0) {
            winners.push({
                ...ticket,
                winAmount,
                betAmount: ticket.amount
            });

            // Update user's balance
            updateBalance(ticket.userId, winAmount);
        }
    });

    return winners;
}

module.exports = {
    name: "lotto",
    info: "Chơi xổ số nhanh Quick Lotto",
    dev: "HNT",
    category: "Games",
    usedby: 0,
    onPrefix: true,
    cooldowns: 5,
    usages: `=== HƯỚNG DẪN SỬ DỤNG QUICK LOTTO ===
1. Xem kết quả và thông tin:
   .lotto → Xem kết quả mới nhất

2. Mua vé số:
   .lotto buy [loại] [số] [tiền]
   
   có 4 loại cược:
    • Đề 2 số: .lotto buy de2 [số 2 chữ số] [tiền]
    • Đề 3 càng: .lotto buy de3 [số 3 chữ số] [tiền]
    • Đề 5 số: .lotto buy de5 [số 5 chữ số] [tiền]
    • Lô: .lotto buy lo [số 2 chữ số] [tiền]

   ĐÁNH ĐỀ
   VD: .lotto buy de2 68 1000 → Mua số 68 với 1000$
   • đối với đề 2 số nhận x95 tiền cược
   • đối với đề 3 số nhận x999 tiền cược
   • đối với đề 5 số nhận x10,000 tiền cược

   ĐÁNH LÔ
    VD: .lotto buy lo 68 1000 → Mua số 68 với 1000$
   • Tiền cược tối thiểu 1000$
   • Tỉ lệ trúng lô: 3.67x
   • Xác suất trúng: ~8/100 (có 8 cặp số trong bảng kết quả)

3. Quản lý vé số: 
   .lotto tickets → Xem vé đã mua
   .lotto history → Xem 3 kỳ gần nhất

4. Cài đặt thông báo:
   .lotto notify → Bật/tắt thông báo
   
💡 Mỗi kỳ quay cách nhau 10 phút`,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;

        try {
            if (!ticketData || !ticketData.tickets) {
                ticketData = loadTickets();
            }

            const settings = loadSettings();
            const isEnabled = settings.enabledThreads.includes(threadID);

            // Đảm bảo nextDrawTime được khởi tạo đúng
            const now = Date.now();
            if (!nextDrawTime || nextDrawTime.getTime() <= now) {
                nextDrawTime = new Date();
                // Đặt thời gian quay số tới phút chia hết cho 10 tiếp theo
                nextDrawTime.setMinutes(Math.ceil(nextDrawTime.getMinutes() / 10) * 10, 0, 0);
            }

            // Tính thời gian còn lại với đảm bảo luôn dương
            const timeUntilNext = nextDrawTime.getTime() - now;
            const minutesLeft = Math.max(0, Math.floor(timeUntilNext / 60000));
            const secondsLeft = Math.max(0, Math.floor((timeUntilNext % 60000) / 1000));

            const currentDrawId = nextDrawTime ? nextDrawTime.getTime().toString() : null;
            const userTickets = currentDrawId ? getUserTickets(senderID, currentDrawId) : [];

            const command = target[0]?.toLowerCase() || "default";

            switch (command) {
                case "notify":
                    if (isEnabled) {
                        settings.enabledThreads = settings.enabledThreads.filter(id => id !== threadID);
                        saveSettings(settings);
                        return api.sendMessage(
                            "🔕 Đã TẮT thông báo kết quả xổ số cho nhóm này!",
                            threadID,
                            messageID
                        );
                    } else {
                        settings.enabledThreads.push(threadID);
                        saveSettings(settings);
                        return api.sendMessage(
                            "🔔 Đã BẬT thông báo kết quả xổ số cho nhóm này!",
                            threadID,
                            messageID
                        );
                    }
                    break;

                case "history":
                    if (lastResults.length === 0) {
                        return api.sendMessage("❌ Chưa có kết quả xổ số nào!", threadID, messageID);
                    }

                    const historyCount = Math.min(3, lastResults.length);
                    let historyMessage = "📜 LỊCH SỬ XỔ SỐ GẦN ĐÂY 📜\n";
                    historyMessage += "━━━━━━━━━━━━━━━━━━\n\n";

                    for (let i = 0; i < historyCount; i++) {
                        const draw = lastResults[i];
                        const drawDate = new Date(draw.drawTime);
                        historyMessage += `🔸 Kỳ ${i + 1} - ${drawDate.toLocaleString('vi-VN')}\n`;
                        historyMessage += `🏆 Giải ĐB: ${draw.results.special}\n`;
                        historyMessage += `🥇 Giải Nhất: ${draw.results.first}\n`;
                        historyMessage += `🥈 Giải Nhì: ${draw.results.second.join(', ')}\n`;
                        historyMessage += `🥉 Giải Ba: ${draw.results.third.join(', ')}\n\n`;
                    }

                    return api.sendMessage(historyMessage, threadID, messageID);
                    break;

                case "buy":
                    const betType = target[1]?.toLowerCase();
                    const number = target[2];
                    const amount = parseInt(target[3]);
                    const minAmount = betType === "lo" ? MIN_BET_LO : 1000;
                    const numberPattern = betType === "de5" ? /^\d{5}$/ : betType === "de3" ? /^\d{3}$/ : /^\d{2}$/;

                    if (!number || !numberPattern.test(number)) {
                        return api.sendMessage(`❌ Số không hợp lệ! Vui lòng nhập đúng định dạng cho loại cược ${betType}.`, threadID, messageID);
                    }

                    if (!amount || isNaN(amount) || amount < minAmount) {
                        return api.sendMessage(`❌ Số tiền cược phải từ ${minAmount.toLocaleString('vi-VN')}$ trở lên!`, threadID, messageID);
                    }

                    const balance = await getBalance(senderID);
                    if (balance < amount) {
                        return api.sendMessage(`❌ Số dư không đủ! Bạn chỉ có ${balance.toLocaleString('vi-VN')}$`, threadID, messageID);
                    }

                    const buyTimeUntilNext = nextDrawTime ? nextDrawTime - Date.now() : 0;
                    const buyMinutesLeft = Math.ceil(buyTimeUntilNext / 60000);
                    const buySecondsLeft = Math.ceil(buyTimeUntilNext / 1000) % 60;

                    await updateBalance(senderID, -amount);

                    buyTicket(senderID, threadID, number, amount, betType);

                    const nextDrawId = nextDrawTime.getTime().toString();
                    const userTicketsForBuy = getUserTickets(senderID, nextDrawId);
                    let ticketList = "";

                    if (userTicketsForBuy.length > 0) {
                        ticketList = "\n\n🎫 Vé số đã mua:\n";
                        userTicketsForBuy.forEach((ticket, index) => {
                            ticketList += `${index + 1}. Số ${ticket.number}: ${ticket.amount.toLocaleString('vi-VN')}$\n`;
                        });
                    }

                    return api.sendMessage(
                        `🎫 MUA VÉ ${betType.toUpperCase()} THÀNH CÔNG 🎫\n` +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `🔢 Số: ${number}\n` +
                        `💰 Cược: ${amount.toLocaleString('vi-VN')}$\n` +
                        `⏰ Kỳ quay: ${nextDrawTime.toLocaleString('vi-VN')}\n\n` +
                        `🏆 NẾU TRÚNG BẠN SẼ NHẬN ĐƯỢC:\n` +
                        getPotentialWinnings(betType, amount, number) +
                        ticketList,
                        threadID, messageID
                    );
                    break;

                case "ticket":
                case "tickets":
                    // Check user's current tickets
                    const currentTickets = getUserTickets(senderID, currentDrawId);

                    if (currentTickets.length === 0) {
                        return api.sendMessage("❌ Bạn chưa mua vé số nào cho kỳ quay sắp tới!", threadID, messageID);
                    }

                    let ticketMessage = "🎫 VÉ SỐ ĐÃ MUA 🎫\n";
                    ticketMessage += "━━━━━━━━━━━━━━━━━━\n\n";

                    let totalBet = 0;
                    currentTickets.forEach((ticket, index) => {
                        ticketMessage += `${index + 1}. Số ${ticket.number}: ${ticket.amount.toLocaleString('vi-VN')}$\n`;
                        totalBet += ticket.amount;
                    });

                    ticketMessage += `\n💰 Tổng cược: ${totalBet.toLocaleString('vi-VN')}$\n`;
                    ticketMessage += `💵 Thưởng tối đa: ${(totalBet * SPECIAL_PRIZE_RATIO).toLocaleString('vi-VN')}$\n`;

                    const timeLeft = nextDrawTime - Date.now();
                    const minsLeft = Math.floor(timeLeft / 60000);
                    const secsLeft = Math.floor((timeLeft % 60000) / 1000);

                    ticketMessage += `⏰ Kỳ quay sau: ${minsLeft}m ${secsLeft}s\n`;
                    ticketMessage += `📆 Thời gian: ${nextDrawTime.toLocaleString('vi-VN')}`;

                    return api.sendMessage(ticketMessage, threadID, messageID);
                    break;

                default:

                    let message = "🎰 XỔ SỐ MIỀN BẮC 🎰\n━━━━━━━━━━━━━━━━━━\n\n";

                    if (lastResults.length > 0 && lastResults[0] && lastResults[0].results) {
                        const latest = lastResults[0].results;
                        const latestTime = new Date(lastResults[0].drawTime);

                        message += "🎯 KẾT QUẢ GẦN NHẤT:\n\n";
                        message += `⏰ Thời gian: ${latestTime.toLocaleString('vi-VN')}\n`;
                        message += `🏆 Giải ĐB: ${latest.special}\n`;
                        message += `🥇 Giải Nhất: ${latest.first}\n`;
                        message += `🥈 Giải Nhì: ${latest.second.join(', ')}\n`;
                        message += `🥉 Giải Ba: ${latest.third.join(', ')}\n`;
                        message += `4️⃣ Giải Tư: ${latest.fourth.join(', ')}\n`;
                        message += `5️⃣ Giải Năm: ${latest.fifth.join(', ')}\n`;
                        message += `6️⃣ Giải Sáu: ${latest.sixth.join(', ')}\n`;
                        message += `7️⃣ Giải Bảy: ${latest.seventh.join(', ')}\n\n`;
                        message += `${isEnabled ? '🔔' : '🔕'} Thông báo: ${isEnabled ? 'Bật' : 'Tắt'}`;
                        message += "\n💡 .lotto notify để bật/tắt thông báo";
                        message += "\n💡 .lotto history để xem lịch sử";
                        message += "\n💡 .lotto buy [số 2 chữ số] [tiền cược] để mua vé";
                    } else {
                        message += "❌ Chưa có kết quả xổ số nào!\n";
                        message += `${isEnabled ? '🔔' : '🔕'} Thông báo: ${isEnabled ? 'Bật' : 'Tắt'}\n`;
                        message += "💡 .lotto notify để bật/tắt thông báo\n";
                        message += "💡 .lotto buy [số 2 chữ số] [tiền cược] để mua vé\n";
                    }

                    message += `\n⏰ Kỳ quay kế tiếp sau: ${minutesLeft}m ${secondsLeft}s\n`;
                    message += "\n💡 Mỗi kỳ quay sau 10 phút";
                    if (userTickets.length > 0) {
                        message += "\n\n🎫 VÉ SỐ ĐÃ MUA:\n";
                        const maxDisplay = Math.min(3, userTickets.length);
                        for (let i = 0; i < maxDisplay; i++) {
                            message += `• Số ${userTickets[i].number}: ${userTickets[i].amount.toLocaleString('vi-VN')}$\n`;
                        }

                        if (userTickets.length > maxDisplay) {
                            message += `• ... và ${userTickets.length - maxDisplay} vé khác\n`;
                        }

                        message += "💡 .lotto tickets để xem tất cả các vé";
                    }

                    message += "\n\n💎 CÁC LOẠI CƯỢC:\n" +
                        "• Đề 2 số: .lotto buy de2 XX YYYY$\n" +
                        "• Đề 3 càng: .lotto buy de3 XXX YYYY$\n" +
                        "• Đề 5 số: .lotto buy de5 XXXXX YYYY$\n" +
                        "• Lô: .lotto buy lo XX YYYY$\n";

                    await api.sendMessage(message, threadID, messageID);
                    break;
            }

        } catch (error) {
            console.error('QuickLotto Error:', error);
            await api.sendMessage(
                "❌ Đã có lỗi xảy ra khi lấy kết quả xổ số!",
                threadID,
                messageID
            );
        }
    },

    onLoad: function({ api }) {
        loadHistory();
        
        const loadedTickets = loadTickets();
        if (loadedTickets) {
            ticketData = loadedTickets;
        } else {
            ticketData = { tickets: {} };
        }
    
        const now = Date.now();
        if (!nextDrawTime || nextDrawTime.getTime() <= now) {
            nextDrawTime = new Date();
            nextDrawTime.setMinutes(Math.ceil(nextDrawTime.getMinutes() / 10) * 10, 0, 0);
        }

        schedule.scheduleJob(SCHEDULE_INTERVAL, async function () {
            try {
                const results = generateResults();
                saveHistory(results);

                const currentDrawId = nextDrawTime.getTime().toString();

                nextDrawTime = new Date();
                nextDrawTime.setMinutes(nextDrawTime.getMinutes() + 10, 0, 0);

                const winners = checkWinners(results, currentDrawId, api);

                const settings = loadSettings();
                const threads = await api.getThreadList(100, null, ['INBOX']);
                const drawTime = new Date();

                let message = "🎰 KẾT QUẢ QUICK LOTTO 🎰\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `⏰ Thời gian: ${drawTime.toLocaleString('vi-VN')}\n` +
                    `🏆 Giải ĐB: ${results.special}\n` +
                    `🥇 Giải Nhất: ${results.first}\n` +
                    `🥈 Giải Nhì: ${results.second.join(', ')}\n` +
                    `🥉 Giải Ba: ${results.third.join(', ')}\n` +
                    `4️⃣ Giải Tư: ${results.fourth.join(', ')}\n` +
                    `5️⃣ Giải Năm: ${results.fifth.join(', ')}\n` +
                    `6️⃣ Giải Sáu: ${results.sixth.join(', ')}\n` +
                    `7️⃣ Giải Bảy: ${results.seventh.join(', ')}\n\n` +
                    "⏰ Kỳ quay kế tiếp sau 10 phút";

                for (const thread of threads) {
                    if (thread.isGroup && settings.enabledThreads.includes(thread.threadID)) {
                        await api.sendMessage(message, thread.threadID);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                for (const winner of winners) {
                    const winMessage =
                        "🎉 CHÚC MỪNG TRÚNG XỔ SỐ! 🎉\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `🎯 Số trúng: ${winner.number}\n` +
                        `💰 Tiền cược: ${winner.betAmount.toLocaleString('vi-VN')}$\n` +
                        `💵 Tiền thắng: ${winner.winAmount.toLocaleString('vi-VN')}$\n` +
                        `🏆 Tỉ lệ thắng: ${SPECIAL_PRIZE_RATIO}x\n\n` +
                        "💡 Tiền thưởng đã được cộng vào tài khoản!";

                    await api.sendMessage(winMessage, winner.threadId);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                clearOldTickets();

            } catch (error) {
                console.error('QuickLotto Schedule Error:', error);
            }
        });
    }
};
