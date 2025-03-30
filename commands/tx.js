const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { getBalance, updateBalance, loadQuy, saveQuy, updateQuestProgress, readData } = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');
const getName = require('../utils/getName');

const HISTORY_FILE = path.join(__dirname, './json/tx_history.json');

const gameHistory = {
    results: {},  
    sessions: new Map()
};

function loadHistory() {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            const dir = path.dirname(HISTORY_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(HISTORY_FILE, JSON.stringify({ results: {} }));
            return {};
        }
        const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
        return data.results || {};
    } catch (error) {
        console.error('Error loading TX history:', error);
        return {};
    }
}

function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify({ results: gameHistory.results }));
    } catch (error) {
        console.error('Error saving TX history:', error);
    }
}

function generateSessionId() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `#HNT${random}`;
}

function updateHistory(threadID, result) {
    if (!gameHistory.results[threadID]) {
        gameHistory.results[threadID] = [];
    }
    const emoji = result === "tài" ? "⚫" : "⚪";
    gameHistory.results[threadID].push(emoji);
    
    if (gameHistory.results[threadID].length > 9) {
        gameHistory.results[threadID].shift(); 
    }
    saveHistory();
}

function formatHistory(threadID) {
    if (!gameHistory.results[threadID] || gameHistory.results[threadID].length === 0) {
        return "Chưa có lịch sử";
    }
    
    return gameHistory.results[threadID].join(" ");
}

function getHistoryString(threadID) {
    return formatHistory(threadID);
}

gameHistory.results = loadHistory();

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
}

module.exports = {
    name: "tx",
    dev: "HNT",
    category: "Games",
    info: "Chơi mini-game Tài Xỉu.",
    onPrefix: true,
    usages: "tx",
    cooldowns: 0,
    hide: true,
    
    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID } = event;
            
            // Thông báo chuyển đổi lệnh
            const message = "⚠️ THÔNG BÁO ⚠️\n\n" +
                "Lệnh TX đã được chuyển đến lệnh CASINO\n" +
                "Vui lòng sử dụng: .casino tài/xỉu [số tiền]\n\n" + 
                "Ví dụ:\n" +
                "• .casino tài 1000\n" +
                "• .casino xỉu allin\n\n" +
                "⚡ Tất cả các game (tài xỉu, chẵn lẻ, coinflip) đã được tích hợp vào lệnh casino";
                
            return api.sendMessage(message, threadID, messageID);
        } catch (error) {
            console.error('Error:', error);
            return api.sendMessage("Có lỗi xảy ra.", event.threadID, event.messageID);
        }
    }
};
