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

const notifyAdmins = async (api, threadID, action, senderID) => {
    if (adminConfig.notilogs) {  
        const threadInfo = await api.getThreadInfo(threadID);
        const groupName = threadInfo.threadName || "Group Chat";
        const actionUser = senderID === api.getCurrentUserID() 
            ? adminConfig.botName 
            : threadInfo.participants?.find(p => p.userFbId === senderID)?.fullName || "Thành viên";

        const notificationMessage = [
            `🔔 𝗧𝗵𝗼̂𝗻𝗴 𝗯𝗮́𝗼 𝗗𝘂̛̃ 𝗟𝗶𝗲̣̂𝘂 𝗕𝗼𝘁`,
            `━━━━━━━━━━━━━━━━━━`,
            `📝 Bot đã ${action} khỏi nhóm ${groupName}`,
            `🆔 ID nhóm: ${threadID}`,
            `👥 Số thành viên: ${threadInfo.participantIDs.length}`,
            `👤 Thực hiện bởi: ${actionUser}`,
            `🪪 ID người thực hiện: ${senderID}`,
            `🕜 Thời gian: ${time}`,
            `━━━━━━━━━━━━━━━━━━`
        ].join('\n');

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

const logChatRecord = async (api, event) => {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const threadInfo = await api.getThreadInfo(threadID);
    const userName = event.senderID === api.getCurrentUserID() 
        ? adminConfig.botName 
        : event.author || "Thành viên";
    const groupName = threadInfo.threadName || "Group Chat";
    const logHeader = gradientText("━━━━━━━━━━[ CHUỖI CSDL NHẬT KÝ BOT ]━━━━━━━━━━");

    if (event.body) {
        const logMessage = [
            logHeader,
            "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
            `┣➤ 🌐 Nhóm: ${groupName}`,
            `┣➤ 🆔 ID nhóm: ${threadID}`,
            `┣➤ 👤 Người gửi: ${userName}`,
            `┣➤ 🪪 ID Người dùng: ${senderID}`,
            `┣➤ 👥 Số thành viên: ${threadInfo.participantIDs.length}`,
            `┣➤ ✉️ Nội dung: ${event.body}`,
            `┣➤ 📝 Độ dài tin nhắn: ${event.body.length} ký tự`,
            `┣➤ ⏰ Vào lúc: ${time}`,
            `┣➤ 📊 Loại tin nhắn: ${event.type}`,
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
        const attachmentType = event.attachments ? event.attachments[0]?.type : 'sticker';
        const logMessage = [
            logHeader,
            "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
            `┣➤ 🌐 Nhóm: ${groupName}`,
            `┣➤ 🆔 ID nhóm: ${threadID}`,
            `┣➤ 👤 Người gửi: ${userName}`,
            `┣➤ 🪪 ID Người dùng: ${senderID}`,
            `┣➤ 👥 Số thành viên: ${threadInfo.participantIDs.length}`,
            `┣➤ 📎 Loại tệp: ${attachmentType}`,
            `┣➤ 🖼️ Nội dung: ${userName} đã gửi ${event.attachments ? event.attachments.length : 1} tệp đính kèm`,
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
    const threadInfo = await api.getThreadInfo(threadID);
    const userName = senderID === api.getCurrentUserID() 
        ? adminConfig.botName 
        : threadInfo.participants?.find(p => p.userFbId === senderID)?.fullName || "Thành viên";
    const groupName = threadInfo.threadName || "Group Chat";
    
    const logMessage = [
        `━━━━━━[ BOT ĐƯỢC THÊM VÀO NHÓM ]━━━━━━`,
        `👥 Tên nhóm: ${groupName}`,
        `🆔 ThreadID: ${threadID}`,
        `👤 Thêm bởi: ${userName}`,
        `🪪 ID người thêm: ${senderID}`,
        `👥 Số thành viên: ${threadInfo.participantIDs.length}`,
        `⏰ Thời gian: ${time}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');
    
    console.log(logMessage);
};

const handleBotRemoval = async (api, threadID, senderID) => {
    const threadInfo = await api.getThreadInfo(threadID);
    const userName = senderID === api.getCurrentUserID() 
        ? adminConfig.botName 
        : threadInfo.participants?.find(p => p.userFbId === senderID)?.fullName || "Thành viên";
    const groupName = threadInfo.threadName || "Group Chat";
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

module.exports = { 
    logChatRecord, 
    notifyAdmins, 
    handleBotAddition, 
    handleBotRemoval,
    initializeSocket  
};
