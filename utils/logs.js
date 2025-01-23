const fs = require('fs');
const adminConfigPath = "./admin.json";
const usersPath = "./database/users.json";
const threadsPath = "./database/threads.json";
const chalk = require('chalk');
const gradient = require('gradient-string');
const moment = require("moment-timezone");

let io = null;

const initializeSocket = (socketIO) => {
    io = socketIO;
};

const time = moment.tz("Asia/Ho_Chi_Minh").format("LLLL");
let adminConfig = { adminUIDs: [], notilogs: true };
let usersData = {};
let threadsData = {};

const gradientText = (text) => gradient('cyan', 'pink')(text);
const boldText = (text) => chalk.bold(text);

try {
    adminConfig = JSON.parse(fs.readFileSync(adminConfigPath, "utf8"));
    usersData = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    threadsData = JSON.parse(fs.readFileSync(threadsPath, "utf8"));
} catch (err) {
    console.error(err);
}

const loadConfig = () => {
    try {
        const settingsPath = './database/threadSettings.json';
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath));
        }
        return {};
    } catch (error) {
        return {};
    }
};

const notifyAdmins = async (api, threadID, action, senderID) => {
    if (adminConfig.notilogs) {  
        const groupName = await getGroupName(api, threadID);
        const addedOrKickedBy = await getUserName(api, senderID);

        const notificationMessage = `🔔 𝗧𝗵𝗼̂𝗻𝗴 𝗯𝗮́𝗼 𝗗𝘂̛̃ 𝗟𝗶𝗲̣̂𝘂 𝗕𝗼𝘁\n━━━━━━━━━━━━━━━━━━\n📝 Bot đã ${action} khỏi nhóm ${groupName}\n🆔 ID nhóm: ${threadID}\n🕜 Thời gian: ${time}\n━━━━━━━━━━━━━━━━━━`;

        if (io) {
            io.emit('botLog', {
                output: notificationMessage,
                type: 'notification',
                color: '#ff416c'
            });
        }

        if (Array.isArray(adminConfig.adminUIDs) && adminConfig.adminUIDs.length > 0) {
            for (const adminID of adminConfig.adminUIDs) {
                
            }
        } else {
            console.error("ID quản trị viên không được xác định hoặc không phải là một mảng.");
        }
    } else {
        console.log(`${boldText(gradientText(`THÔNG BÁO CỦA QUẢN TRỊ VIÊN: NHẬT KÝ THÔNG BÁO BỊ TẮT`))}`);
    }
};

const sendThreadNotification = async (api, threadID, message, type) => {
    const settings = loadConfig();
    const threadSettings = settings[threadID] || {};
    
    // Check if notification type is enabled
    if (threadSettings[`notify_${type}`] !== false) {
        await api.sendMessage(message, threadID);
    }
};

const logChatRecord = async (api, event) => {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const userName = await getUserName(api, senderID);
    const groupName = await getGroupName(api, threadID);
    const logHeader = gradientText("━━━━━━━━━━[ CHUỖI CSDL NHẬT KÝ BOT ]━━━━━━━━━━");

    if (event.body) {
        const logMessage = [
            logHeader,
            "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
            `┣➤ 🌐 Nhóm: ${groupName}`,
            `┣➤ 🆔 ID nhóm: ${threadID}`,
            `┣➤ 👤 ID Người dùng: ${senderID}`,
            `┣➤ ✉️ Nội dung: ${event.body}`,
            `┣➤ ⏰ Vào lúc: ${time}`,
            "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
        ].join('\n');

        console.log(logMessage);
        
        if (io) {
            io.emit('botLog', { 
                output: logMessage,
                type: 'chat',
                color: '#00f2fe'
            });
        }
    } else if (event.attachments || event.stickers) {
        const logMessage = [
            logHeader,
            "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
            `┣➤ 🌐 Nhóm: ${groupName}`,
            `┣➤ 🆔 ID nhóm: ${threadID}`,
            `┣➤ 👤 ID Người dùng: ${senderID}`,
            `┣➤ 🖼️ Nội dung: ${userName} gửi một nhãn dán 🟢`,
            `┣➤ ⏰ Vào lúc: ${time}`,
            "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
        ].join('\n');

        console.log(logMessage);
        
        if (io) {
            io.emit('commandOutput', { 
                output: logMessage,
                color: '#00f2fe'
            });
        }
    }
};

const handleBotAddition = async (api, threadID, senderID) => {
    const userName = await getUserName(api, senderID);
    const groupName = await getGroupName(api, threadID);
    console.log(`Bot đã được thêm vào nhóm.\ntên nhóm: ${groupName}\nThreadID: ${threadID}\nThêm bởi: ${userName}`);
};

const handleBotRemoval = async (api, threadID, senderID) => {
    const userName = await getUserName(api, senderID);
    const groupName = await getGroupName(api, threadID);
    console.log(`Bot đã bị xóa khỏi nhóm.\ntên nhóm: ${groupName}\nThreadID: ${threadID}\nbị xóa bởi: ${userName}`);
    await removeFromDatabase(threadID, senderID);
};

const removeFromDatabase = (threadID, senderID) => {
    let removed = false;
    if (usersData[senderID]) {
        delete usersData[senderID];
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
        console.log(`[DATABASE] xóa senderID: ${senderID}`);
        removed = true;
    }
    if (threadsData[threadID]) {
        delete threadsData[threadID];
        fs.writeFileSync(threadsPath, JSON.stringify(threadsData, null, 2));
        console.log(`[DATABASE] xóa threadID: ${threadID}`);
        removed = true;
    }
    return removed;
};

const getGroupName = async (api, threadID) => {
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        if (!threadInfo) return `Nhóm ${threadID}`;
        return threadInfo.name || `Nhóm ${threadID}`;
    } catch (error) {
        // Only log if it's not a Facebook blocking error
        if (!error.errorSummary?.includes('Bạn tạm thời bị chặn')) {
            console.error(`Lỗi khi lấy tên nhóm ${threadID}:`, error);
        }
        return `Nhóm ${threadID}`;
    }
};

const getUserName = async (api, userID) => {
    try {
        const userInfo = await api.getUserInfo(userID);
        if (!userInfo || !userInfo[userID]) return `Người dùng ${userID}`;
        return userInfo[userID].name || `Người dùng ${userID}`;
    } catch (error) {
        // Only log if it's not a Facebook blocking error
        if (!error.errorSummary?.includes('Bạn tạm thời bị chặn')) {
            console.error(`Lỗi khi lấy tên người dùng ${userID}:`, error);
        }
        return `Người dùng ${userID}`;
    }
};

module.exports = { 
    logChatRecord, 
    notifyAdmins, 
    handleBotAddition,     
    handleBotRemoval,
    initializeSocket,
    sendThreadNotification
};