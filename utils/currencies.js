const fs = require('fs');
const path = require('path');

global.balance = global.balance || {};
const dataFile = path.join(__dirname, '..', 'database', 'currencies.json');
const quyFilePath  = path.join(__dirname, '..', 'commands', 'json', 'quy.json');
global.userQuests = global.userQuests || {};
const questsFile = path.join(__dirname, '..', 'database', 'quests.json');
const questProgressFile = path.join(__dirname, '..', 'database', 'questProgress.json');

async function loadData() {
    try {
        if (fs.existsSync(dataFile)) {
            const data = JSON.parse(await fs.promises.readFile(dataFile, 'utf8'));
            global.balance = data.balance || {};
        } else {
            global.balance = {};
        }
    } catch (error) {
        console.error("Lỗi khi đọc tệp dữ liệu:", error);
    }
}

async function saveData() {
    try {
        const data = { balance: global.balance };
        await fs.promises.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Lỗi khi ghi tệp dữ liệu:", error);
    }
}

async function loadQuests() {
    try {
        const data = JSON.parse(await fs.promises.readFile(questsFile, 'utf8'));
        return data;
    } catch (error) {
        console.error("Lỗi khi đọc tệp nhiệm vụ:", error);
        return { dailyQuests: {} };
    }
}

async function saveQuestProgress() {
    try {
        await fs.promises.writeFile(questProgressFile, JSON.stringify(global.userQuests, null, 2), 'utf8');
    } catch (error) {
        console.error("Lỗi khi lưu tiến độ nhiệm vụ:", error);
    }
}

async function loadQuestProgress() {
    try {
        if (fs.existsSync(questProgressFile)) {
            const data = JSON.parse(await fs.promises.readFile(questProgressFile, 'utf8'));
            global.userQuests = data;
        }
    } catch (error) {
        console.error("Lỗi khi đọc tiến độ nhiệm vụ:", error);
        global.userQuests = {};
    }
}

function getBalance(userID) {
    return global.balance[userID] || 0;
}

function updateBalance(userID, amount) {
    global.balance[userID] = (global.balance[userID] || 0) + amount;
    saveData();
}

function setBalance(userID, amount) {
    global.balance[userID] = amount;
    saveData();
}
    
function changeBalance(userID, amount) {
    if (typeof global.balance[userID] === "undefined") {
        global.balance[userID] = 0; 
    }
    global.balance[userID] += amount;
}

function allBalances() {
    return global.balance;
}

function loadQuy() {
    if (!fs.existsSync(quyFilePath)) {
        fs.writeFileSync(quyFilePath, JSON.stringify({ quy: 0 }, null, 2), 'utf8');
    }

    try {
        const data = fs.readFileSync(quyFilePath, 'utf8');
        return JSON.parse(data).quy || 0;
    } catch (error) {
        console.error('Error loading Quỹ:', error);
        return 0;
    }
}

function getVNDate() {
    const vietnamTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    return vietnamTime.toDateString();
}

function checkDayReset(userQuests) {
    const todayVN = getVNDate();
    const lastReset = userQuests.lastReset ? new Date(userQuests.lastReset).toDateString() : null;
    
    if (lastReset !== todayVN) {
        userQuests.progress = {};
        userQuests.completed = {};
        userQuests.lastReset = todayVN;
        userQuests.lastRewardClaim = null;
        saveQuestProgress();
        return true;
    }
    return false;
}

function getUserQuests(userID) {
    if (!global.userQuests[userID]) {
        global.userQuests[userID] = {
            progress: {},
            completed: {},
            lastReset: getVNDate(),
            lastRewardClaim: null
        };
        saveQuestProgress();
    } else {
        checkDayReset(global.userQuests[userID]);
    }
    return global.userQuests[userID];
}

function updateQuestProgress(userID, questType, amount = 1) {
    const userQuests = getUserQuests(userID);
    if (!userQuests.progress[questType]) {
        userQuests.progress[questType] = 0;
    }
    
    userQuests.progress[questType] += amount;
    saveQuestProgress();
}

function saveQuy(quy) {
    try {
        const data = { quy };
        fs.writeFileSync(quyFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving Quỹ:', error);
    }
}

function canClaimRewards(userID) {
    const userQuests = getUserQuests(userID);
    const todayVN = getVNDate();
    return !userQuests.lastRewardClaim || userQuests.lastRewardClaim !== todayVN;
}

function setRewardClaimed(userID) {
    const userQuests = getUserQuests(userID);
    userQuests.lastRewardClaim = getVNDate();
    saveQuestProgress();
}

loadData(); 
loadQuestProgress();

module.exports = { getBalance, setBalance, saveData, loadData, updateBalance, changeBalance, allBalances, saveQuy, loadQuy, loadQuests, getUserQuests, updateQuestProgress, canClaimRewards, setRewardClaimed, loadQuestProgress, saveQuestProgress, checkDayReset, getVNDate };
