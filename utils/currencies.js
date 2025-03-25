const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

global.balance = global.balance || {};
const dataFile = path.join(__dirname, '..', 'database', 'currencies.json');
const quyFilePath  = path.join(__dirname, '..', 'commands', 'json', 'quy.json');
global.userQuests = global.userQuests || {};
const questsFile = path.join(__dirname, '..', 'database', 'quests.json');
const questProgressFile = path.join(__dirname, '..', 'database', 'json' , 'questProgress.json');
const currenciesPath = path.join(__dirname, '../database/json/currencies.json');

async function loadData() {
    try {
        if (fs.existsSync(dataFile)) {
            const data = JSON.parse(await fs.promises.readFile(dataFile, 'utf8'));
      
            if (data && data.balance && Object.keys(data.balance).length > 0) {
                global.balance = data.balance;
            } else {
                const backupFile = `${dataFile}.backup`;
                if (fs.existsSync(backupFile)) {
                    const backupData = JSON.parse(await fs.promises.readFile(backupFile, 'utf8'));
                    if (backupData && backupData.balance && Object.keys(backupData.balance).length > 0) {
                        global.balance = backupData.balance;
                        await saveData(); 
                    }
                }
            }
        }
        if (!global.balance || Object.keys(global.balance).length === 0) {
            global.balance = {};
        }
    } catch (error) {
        console.error("Lỗi khi đọc tệp dữ liệu:", error);
        global.balance = global.balance || {};
    }
}

async function saveData() {
    try {
        if (fs.existsSync(dataFile)) {
            const backupFile = `${dataFile}.backup`;
            await fs.promises.copyFile(dataFile, backupFile);
        }

        if (Object.keys(global.balance).length === 0 && fs.existsSync(dataFile)) {
            const existingData = JSON.parse(await fs.promises.readFile(dataFile, 'utf8'));
            if (Object.keys(existingData.balance || {}).length > 0) {
                console.error("Preventing save of empty balance when existing data exists");
                global.balance = existingData.balance;
                return;
            }
        }

        const data = { balance: global.balance };
        await fs.promises.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Lỗi khi ghi tệp dữ liệu:", error);
     
        try {
            const backupFile = `${dataFile}.backup`;
            if (fs.existsSync(backupFile)) {
                await fs.promises.copyFile(backupFile, dataFile);
                console.log("Restored from backup file");
            }
        } catch (backupError) {
            console.error("Lỗi khi khôi phục từ backup:", backupError);
        }
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

function readData() {
    try {
        if (fs.existsSync(dataFile)) {
            const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            return data;
        }
        return { balance: {} };
    } catch (error) {
        console.error("Lỗi khi đọc tệp dữ liệu:", error);
        return { balance: {} };
    }
}

function getAllCurrenciesData() {
    try {
        const data = JSON.parse(fs.readFileSync(currenciesPath, 'utf8'));
        return data;
    } catch (error) {
        console.error("Error reading currencies data:", error);
        return {};
    }
}
function getStats() {
    const balances = global.balance;
    const userCount = Object.keys(balances).length;
    
    if (userCount === 0) {
      return {
        totalMoney: 0,
        userCount: 0,
        averageBalance: 0,
        richestUsers: [],
        poorestUsers: [],
        moneyDistribution: { positive: 0, negative: 0, zero: 0 }
      };
    }
    
    const totalMoney = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
    
    const averageBalance = totalMoney / userCount;
    
    const sortedUsers = Object.entries(balances)
      .sort((a, b) => b[1] - a[1]);
    
    const richestUsers = sortedUsers.slice(0, 10);
    const poorestUsers = sortedUsers.filter(user => user[1] >= 0).slice(-5).reverse();
    
    const moneyDistribution = {
      positive: Object.values(balances).filter(b => b > 0).length,
      negative: Object.values(balances).filter(b => b < 0).length,
      zero: Object.values(balances).filter(b => b === 0).length
    };
    
    const commonFund = loadQuy();
    
    return {
      totalMoney,
      userCount,
      averageBalance,
      richestUsers,
      poorestUsers,
      moneyDistribution,
      commonFund
    };
  }
async function executeClojureCalculation(type, data) {
    return new Promise((resolve, reject) => {
        const clojurePath = path.join(__dirname, '../services/clojure/finance.clj');
        const process = spawn('clojure', ['-M', clojurePath, type, JSON.stringify(data)]);
        
        let output = '';
        
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            console.error(`Clojure Error: ${data}`);
        });
        
        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Clojure process exited with code ${code}`));
                return;
            }
            try {
                resolve(JSON.parse(output));
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function calculateAdvancedInterest(principal, days, vipLevel = 0) {
    try {
        const result = await executeClojureCalculation('interest', {
            principal,
            days,
            vipLevel
        });
        return result.interest;
    } catch (err) {
        console.error('Failed to calculate advanced interest:', err);
        return principal * 0.001 * days;
    }
}

loadData(); 
loadQuestProgress();

module.exports = { 
    getBalance, setBalance, saveData, loadData, updateBalance, 
    changeBalance, allBalances, saveQuy, loadQuy, loadQuests, 
    getUserQuests, updateQuestProgress, canClaimRewards, setRewardClaimed, 
    loadQuestProgress, saveQuestProgress, checkDayReset, getVNDate,
    readData, getAllCurrenciesData, calculateAdvancedInterest, executeClojureCalculation, getStats
};
