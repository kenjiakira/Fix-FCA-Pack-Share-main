const fs = require("fs");
const gradient = require('gradient-string');
const { handleUnsend } = require('./unsend');
const { handleLogSubscribe } = require('./logsub');
const { handleLogUnsubscribe } = require('./logunsub');
const { actions } = require('./actions');
const path = require("path");
const { logChatRecord, notifyAdmins } = require('./logs');
const getThreadParticipantIDs = require('./getParticipantIDs');

async function getUserName(api, senderID) {
    try {
        if (usersDB[senderID] && usersDB[senderID].name && usersDB[senderID].name !== null) {
            return usersDB[senderID].name;
        }

        try {
            const rankDataPath = path.join(__dirname, '../database/cache/rankData.json');
            if (fs.existsSync(rankDataPath)) {
                const rankData = JSON.parse(fs.readFileSync(rankDataPath, 'utf8'));
                if (rankData[senderID] && rankData[senderID].name) {

                    if (!usersDB[senderID]) {
                        usersDB[senderID] = { lastMessage: Date.now() };
                    }
                    usersDB[senderID].name = rankData[senderID].name;
                    return rankData[senderID].name;
                }
            }
        } catch (rankError) {
            console.error("Không thể đọc rankData:", rankError);
        }

        try {
            const nameCachePath = path.join(__dirname, '../database/json/usernames.json');
            if (fs.existsSync(nameCachePath)) {
                const nameCache = JSON.parse(fs.readFileSync(nameCachePath, 'utf8'));
                if (nameCache[senderID] && nameCache[senderID].name) {

                    if (!usersDB[senderID]) {
                        usersDB[senderID] = { lastMessage: Date.now() };
                    }
                    usersDB[senderID].name = nameCache[senderID].name;
                    return nameCache[senderID].name;
                }
            }
        } catch (cacheError) {
            console.error("Không thể đọc nameCache:", cacheError);
        }

        const userInfo = await api.getUserInfo(senderID);
        if (userInfo && userInfo[senderID]) {
            const senderName = userInfo[senderID].name || "User";

            if (!usersDB[senderID]) {
                usersDB[senderID] = { lastMessage: Date.now() };
            }

            if (senderName && senderName !== "User") {
                usersDB[senderID].name = senderName;

                try {
                    const nameCachePath = path.join(__dirname, '../database/json/usernames.json');
                    let nameCache = {};

                    if (fs.existsSync(nameCachePath)) {
                        nameCache = JSON.parse(fs.readFileSync(nameCachePath, 'utf8'));
                    }

                    nameCache[senderID] = {
                        name: senderName,
                        timestamp: Date.now()
                    };

                    fs.writeFileSync(nameCachePath, JSON.stringify(nameCache, null, 2));
                } catch (saveError) {
                    console.error("Không thể cập nhật nameCache:", saveError);
                }

                return senderName;
            }
        }

        return "User";
    } catch (userError) {
        if (!userError.errorSummary || !userError.errorSummary.includes('Bạn tạm thời bị chặn')) {
            console.error('Error getting user info:', userError);
        }
        return "User";
    }
}

const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");
const usersDB = JSON.parse(fs.readFileSync("./database/users.json", "utf8") || "{}");
const cooldowns = {};
global.client = global.client || {
    callReact: [],
    handleReply: [],
    onReply: []
};
global.bot = { usersDB, threadsDB };
global.line = "━━━━━━━━━━━━━━━━━━";

const adminConfigPath = "./admin.json";
let adminConfig = {};
global.cc = adminConfig;

try {
    adminConfig = JSON.parse(fs.readFileSync(adminConfigPath, "utf8"));
} catch (err) {
    console.error(err);
}
const trackUserActivity = async (api, event, threadsDB, usersDB) => {
    try {
        if (event.type === "message" && event.threadID !== event.senderID) {
            const { threadID, senderID, messageID } = event;

            if (!threadsDB[threadID]) {
                threadsDB[threadID] = {
                    members: [],
                    messageCount: {},
                    lastActivity: Date.now()
                };
            }

            if (!threadsDB[threadID].members) {
                threadsDB[threadID].members = [];
            }

            if (!threadsDB[threadID].members.includes(senderID)) {
                threadsDB[threadID].members.push(senderID);
            }

            if (!threadsDB[threadID].messageCount) {
                threadsDB[threadID].messageCount = {};
            }

            threadsDB[threadID].messageCount[senderID] =
                (threadsDB[threadID].messageCount[senderID] || 0) + 1;

            if (!usersDB[senderID]) {
                usersDB[senderID] = {
                    name: null,
                    messageCount: {},
                    threadIDs: [],
                    lastActivity: Date.now()
                };

                const userName = await getUserName(api, senderID);
                if (userName && userName !== "User") {
                    usersDB[senderID].name = userName;
                }
            } else if (usersDB[senderID].name === null) {
                const userName = await getUserName(api, senderID);
                if (userName && userName !== "User") {
                    usersDB[senderID].name = userName;
                }
            }

            if (!usersDB[senderID].threadIDs) {
                usersDB[senderID].threadIDs = [];
            }

            if (!usersDB[senderID].threadIDs.includes(threadID)) {
                usersDB[senderID].threadIDs.push(threadID);
            }

            if (!usersDB[senderID].messageCount) {
                usersDB[senderID].messageCount = {};
            }

            usersDB[senderID].messageCount[threadID] =
                (usersDB[senderID].messageCount[threadID] || 0) + 1;

            usersDB[senderID].lastActivity = Date.now();
        }
    } catch (error) {
        console.error("Error tracking user activity:", error);
    }
};
function cleanupThreadData(threadData) {
    return {
        members: threadData.members || [],
        messageCount: threadData.messageCount || {},
        lastActivity: threadData.lastActivity || Date.now(),
        adminIDs: threadData.adminIDs || [],
        adminLastUpdate: threadData.adminLastUpdate || Date.now()
    };
}
function getThreadPrefix(threadID) {
    const prefixPath = './database/threadPrefix.json';
    try {
        if (fs.existsSync(prefixPath)) {
            const threadPrefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
            return threadPrefixes[threadID] || global.cc.prefix;
        }
    } catch (err) {
        console.error("Error loading thread prefix:", err);
    }
    return global.cc.prefix;
}

const handleListenEvents = (api, database, eventCommands, threadsDB, usersDB) => {

    const taxDataPath = path.join(__dirname, '../database/json/tax.json');
    let taxData = { lastCollection: {} };

    if (fs.existsSync(taxDataPath)) {
        try {
            taxData = JSON.parse(fs.readFileSync(taxDataPath, 'utf8'));
        } catch (error) {
            console.error('Error loading tax data:', error);
        }
    }

    api.setOptions({ listenEvents: true });

    api.listenMqtt(async (err, event) => {
        if (err) return console.error(gradient.passion(err));

        if (event.type === "message" || event.type === "message_reply") {
            try {
                const bannedUsers = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/json/banned.json')));
                if (bannedUsers[event.senderID]) {
                    if (event.body?.startsWith(getThreadPrefix(event.threadID))) {
                        api.sendMessage("⚠️ Bạn đã bị cấm sử dụng bot!", event.threadID, event.messageID);
                    }
                    return;
                }
            } catch (error) {
                console.error("Ban check error:", error);
            }
        }
        if (event.type === "message" || event.type === "message_reply") {
            await trackUserActivity(api, event, threadsDB, usersDB);

            if (!global.saveTimeout) {
                global.saveTimeout = setTimeout(() => {
                    fs.writeFileSync("./database/threads.json", JSON.stringify(threadsDB, null, 2));
                    fs.writeFileSync("./database/users.json", JSON.stringify(usersDB, null, 2));
                    global.saveTimeout = null;
                    console.log("Saved user and thread data");
                }, 60000);
            }
        }

        const { logMessageType } = event;


        async function getThreadInfo(threadID) {
            try {
                const info = await api.getThreadInfo(threadID);
                if (!info) return { adminIDs: [], name: `Nhóm ${threadID}` };
                return {
                    adminIDs: info.adminIDs || [],
                    name: info.name || `Nhóm ${threadID}`
                };
            } catch (error) {
                if (!error.errorSummary?.includes('Bạn tạm thời bị chặn')) {
                    console.error(`Lỗi khi lấy thông tin nhóm ${threadID}:`, error);
                }
                return { adminIDs: [], name: `Nhóm ${threadID}` };
            }
        }

        if (logMessageType === "log:thread-admins") {
            const threadID = event.threadID;
            const isRemoving = event.logMessageData.ADMIN_EVENT === "remove_admin";
            const targetID = event.logMessageData.TARGET_ID;

            try {
                const participants = await getThreadParticipantIDs(api, threadID);

                if (!threadsDB[threadID]) {
                    threadsDB[threadID] = {
                        members: participants,
                        messageCount: {},
                        lastActivity: Date.now(),
                        adminIDs: [],
                        adminLastUpdate: Date.now()
                    };
                }

                if (isRemoving) {
                    if (threadsDB[threadID].adminIDs) {
                        threadsDB[threadID].adminIDs = threadsDB[threadID].adminIDs.filter(admin =>
                            (typeof admin === 'object' ? admin.id : admin) !== targetID
                        );
                    }
                } else {
                    if (!threadsDB[threadID].adminIDs) {
                        threadsDB[threadID].adminIDs = [];
                    }

                    const adminExists = threadsDB[threadID].adminIDs.some(admin =>
                        (typeof admin === 'object' ? admin.id : admin) === targetID
                    );

                    if (!adminExists) {
                        threadsDB[threadID].adminIDs.push({
                            id: targetID
                        });
                    }
                }

                threadsDB[threadID].adminLastUpdate = Date.now();

                threadsDB[threadID].members = participants;

                fs.writeFileSync("./database/threads.json", JSON.stringify(threadsDB, null, 2));
                console.log(`✅ Đã ${isRemoving ? "xóa" : "thêm"} admin ${targetID} cho nhóm ${threadID}`);

                const currentAdmins = threadsDB[threadID].adminIDs.map(admin =>
                    typeof admin === 'object' ? admin.id : admin
                );
                console.log(`📊 Danh sách admin hiện tại:`, currentAdmins);

            } catch (error) {
                console.error(`❌ Lỗi khi cập nhật admin cho nhóm ${threadID}:`, error);
            }

            try {
                const eventCommands = require('../events/thread');
                if (eventCommands && eventCommands.fetchAndUpdateThreadInfo) {
                    await eventCommands.fetchAndUpdateThreadInfo(api, threadID);
                }
            } catch (err) {
                console.error("Không thể gọi hàm fetchAndUpdateThreadInfo từ thread.js:", err);
            }
        }

        if (logMessageType === "log:subscribe") {
            await notifyAdmins(api, event.threadID, "Joined", event.senderID);
            handleLogSubscribe(api, event, adminConfig);
        }

        if (logMessageType === "log:unsubscribe") {
            await notifyAdmins(api, event.threadID, "Kicked", event.senderID);
            await handleLogUnsubscribe(api, event);
        }

        let msgData = {};
        try {
            msgData = JSON.parse(fs.readFileSync('./database/message.json'));
        } catch (err) {
            console.error(err);
        }

        const senderID = event.senderID;
        const threadID = event.threadID;
        const isGroup = threadID !== senderID;

        if (event.type === "message") {
            const messageID = event.messageID;
            msgData[messageID] = { body: event.body, attachments: event.attachments || [] };
            try {
                fs.writeFileSync('./database/message.json', JSON.stringify(msgData, null, 2));
            } catch (err) {
                console.error(err);
            }
            await logChatRecord(api, event, usersDB);
        }

        if (event.type === "message_unsend" && adminConfig.resend === true) {
            await handleUnsend(api, event, msgData, getUserName);
        }

        const cmdActions = actions(api, event);

        if (event.type === 'message' || event.type === 'message_reply') {
            const senderID = event.senderID;
            const threadID = event.threadID;
            const message = event.body.trim();
            const threadPrefix = getThreadPrefix(threadID);
            const isPrefixed = message.trim().startsWith(threadPrefix);
            const commandName = (isPrefixed ?
                message.trim().slice(threadPrefix.length).trim().split(' ')[0] :
                message.split(' ')[0]).toLowerCase();
            const commandArgs = isPrefixed ? message.slice(threadPrefix.length).split(' ').slice(1) : message.split(' ').slice(1);

            const threadsDB = JSON.parse(fs.readFileSync('./database/threads.json', 'utf8'));

            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            if (adminConfig.mtnMode) {
                const isAdmin = adminConfig.adminUIDs?.includes(senderID);
                const isModerator = adminConfig.moderatorUIDs?.includes(senderID);

                if (!isAdmin && !isModerator) {
                    if (message.startsWith(threadPrefix)) {
                        api.sendMessage("⚠️ Bot đang trong chế độ bảo trì! Chỉ Admin và Moderator mới có thể sử dụng.", threadID)
                            .then(data => {
                                setTimeout(() => {
                                    api.unsendMessage(data.messageID);
                                }, 5000);
                            });
                        return;
                    }
                    return;
                }
            }

            if (!usersDB[senderID]) {
                usersDB[senderID] = { lastMessage: Date.now() };
                fs.writeFileSync("./database/users.json", JSON.stringify(usersDB, null, 2));
                console.error(gradient.summer(`[ DATABASE ] PHÁT HIỆN NGƯỜI DÙNG MỚI TRONG ID NGƯỜI GỬI: ${senderID}`));
            }

            if (!threadsDB[threadID]) {
                threadsDB[threadID] = { lastMessage: Date.now() };
                fs.writeFileSync("./database/threads.json", JSON.stringify(threadsDB, null, 2));
                if (isGroup) {
                    console.error(gradient.summer(`[ DATABASE ] ID NHÓM MỚI ĐƯỢC PHÁT HIỆN: ${threadID}`));
                }
            }

            const allCommands = Object.keys(database).concat(Object.values(database).flatMap(cmd => cmd.aliases || []));
            if (isPrefixed) {
                const notfoundCommand = database['notfound'];
                if (notfoundCommand) {
                    if (commandName === '') {
                        return notfoundCommand.handleNotFound({
                            api,
                            event,
                            commandName: '',
                            prefix: threadPrefix,
                            allCommands
                        });
                    }

                    if (!allCommands.includes(commandName)) {
                        return notfoundCommand.handleNotFound({
                            api,
                            event,
                            commandName,
                            prefix: threadPrefix,
                            allCommands
                        });
                    }
                }
            }

            const command = database[commandName] || Object.values(database).find(cmd => cmd.nickName && cmd.nickName.includes(commandName));

            if (command) {
                if (!command.onLaunch) {
                    console.error(`Command ${commandName} does not have an onLaunch function`);
                    return;
                }

                try {
                    if (command.VIP === true) {
                        const { getVIPBenefits } = require('./vipCheck');
                        const vipBenefits = getVIPBenefits(senderID);

                        if (!vipBenefits || vipBenefits.packageId === 0) {
                            api.sendMessage("⚠️ Lệnh này chỉ dành cho thành viên VIP. Vui lòng nâng cấp để sử dụng!", threadID, event.messageID);
                            return;
                        }

                        if (command.requiredVIP && vipBenefits.packageId < command.requiredVIP) {
                            const vipNames = { 1: "BRONZE", 2: "SILVER", 3: "GOLD" };
                            api.sendMessage(`⚠️ Lệnh này yêu cầu gói ${vipNames[command.requiredVIP]} trở lên. Bạn đang ở gói ${vipNames[vipBenefits.packageId]}.`, threadID, event.messageID);
                            return;
                        }
                    }

                    const adminOnlyPath = path.join(__dirname, '../database/json/adminonly.json');
                    if (fs.existsSync(adminOnlyPath)) {
                        const adminOnlyData = JSON.parse(fs.readFileSync(adminOnlyPath));

                        if (adminOnlyData?.threads && adminOnlyData.threads[threadID]) {
                            const isAdminBot = adminConfig?.adminUIDs?.includes(senderID);
                            const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(admin =>
                                (admin.id === senderID || admin === senderID)
                            );
                            const isDHV = adminConfig?.moderatorUIDs?.includes(senderID);

                            if (!isAdminBot && !isGroupAdmin && !isDHV) {
                                return api.sendMessage("⚠️ Hiện tại nhóm đang bật chế độ chỉ Quản trị viên hoặc Điều hành viên mới có thể sử dụng bot!", threadID, event.messageID);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Admin-only check error:", error);
                }

                if (command.dmUser === false && !isGroup && !adminConfig.adminUIDs.includes(senderID) && !(adminConfig.moderatorUIDs && adminConfig.moderatorUIDs.includes(senderID))) {
                    return api.sendMessage(`Lệnh này không thể được sử dụng trong DM.`, threadID, event.messageID);
                }

                if (command.onPrefix && !isPrefixed) {
                    api.sendMessage(`Lệnh này yêu cầu prefix: ${threadPrefix}${command.name}`, event.threadID, event.messageID);
                    return;
                } else if (!command.onPrefix && isPrefixed) {
                    api.sendMessage(`Lệnh này không yêu cầu prefix:\n bỏ dấu đi gõ '${command.name}'`, event.threadID, event.messageID);
                    return;
                }

                if (!cooldowns[commandName]) cooldowns[commandName] = {};
                const now = Date.now();
                const timestamps = cooldowns[commandName];
                const cooldownAmount = (command.cooldowns || 5) * 1000;

                if (!adminConfig['adminUIDs'].includes(senderID) &&
                    !adminConfig['moderatorUIDs']?.includes(senderID)) {
                    if (timestamps[senderID]) {
                        const expirationTime = timestamps[senderID] + cooldownAmount;

                        if (now < expirationTime) {
                            const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                            api.sendMessage(`Hãy chờ ${timeLeft} giây trước khi sử dụng lại lệnh \`${command.name}\`.`, event.threadID, event.messageID);
                            return;
                        }
                    }
                }
                if (command['usedby'] === 1) {
                    const isAdminBot = adminConfig['adminUIDs'].includes(senderID);
                    const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(admin =>
                        admin.id === senderID || admin === senderID
                    );

                    console.log('Permission check:', {
                        senderID,
                        isAdminBot,
                        isGroupAdmin,
                        threadAdmins: threadsDB[threadID]?.adminIDs
                    });

                    if (!isAdminBot && !isGroupAdmin) {
                        api.sendMessage('⚠️ Lệnh này chỉ dành cho Quản trị viên nhóm hoặc Admin bot.', threadID, event.messageID);
                        return;
                    }
                } else if (command['usedby'] === 2) {

                    if (!adminConfig['adminUIDs'].includes(senderID)) {
                        api.sendMessage('⚠️ Lệnh này chỉ dành cho Admin bot.', threadID, event.messageID);
                        return;
                    }
                } else if (command['usedby'] === 3) {

                    if (!adminConfig['moderatorUIDs'] || !adminConfig['moderatorUIDs'].includes(senderID)) {
                        api.sendMessage('⚠️ Lệnh này chỉ dành cho Điều hành viên Bot.', threadID, event.messageID);
                        return;
                    }
                } else if (command['usedby'] === 4) {

                    if (!adminConfig['adminUIDs'].includes(senderID) && (!adminConfig['moderatorUIDs'] || !adminConfig['moderatorUIDs'].includes(senderID))) {
                        api.sendMessage('⚠️ Lệnh này chỉ dành cho Admin và Điều hành viên Bot.', threadID, event.messageID);
                        return;
                    }
                } else if (command['usedby'] === 5) {
                    const isAdminBot = adminConfig['adminUIDs'].includes(senderID);
                    const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(admin =>
                        admin.id === senderID || admin === senderID
                    );
                    const isModerator = adminConfig['moderatorUIDs']?.includes(senderID);

                    if (!isAdminBot && !isGroupAdmin && !isModerator) {
                        api.sendMessage('⚠️ Lệnh này chỉ dành cho Admin bot, Quản trị viên nhóm hoặc Điều hành viên Bot.', threadID, event.messageID);
                        return;
                    }
                }

                timestamps[senderID] = now;
                setTimeout(() => delete timestamps[senderID], cooldownAmount);

                try {
                    await command.onLaunch({ 'api': api, 'event': event, 'actions': cmdActions, 'target': commandArgs });
                } catch (error) {
                    console.error(gradient.passion('Error executing command ' + commandName + ': ' + error));
                    api.sendMessage('There was an error executing that command.', event.threadID);
                }
            }
            //noPrefix
            Object.keys(database).forEach(async (commandName) => {
                const targetFunc = database[commandName]?.noPrefix;
                if (typeof targetFunc === "function") {
                    try {
                        await targetFunc({ 'api': api, 'event': event, 'actions': cmdActions, 'target': event.body });
                    } catch (error) {
                        console.error(gradient.passion('Error executing noPrefix command ' + commandName + ': ' + error));
                    }
                }
            });
        }

        //onReply
        if (event.type === 'message_reply') {
            const repliedMessage = global.client.handleReply.find(msg => msg.messageID === event.messageReply.messageID);
            if (repliedMessage) {
                const command = database[repliedMessage.name];
                if (command && typeof command.onReply === 'function') {
                    try {
                        await command.onReply({ 'reply': event.messageReply, 'api': api, 'event': event, 'actions': actions });
                    } catch (error) {
                        console.error(gradient.passion('Error executing onReply for command ' + repliedMessage.name + ': ' + error));
                    }
                }
            }
        }

        //callReact
        if (event.type === 'message_reaction') {
            const reactedMessage = global.client.callReact.find(msg => msg.messageID === event.messageID);
            if (reactedMessage) {
                const command = database[reactedMessage.name];
                if (command && typeof command.callReact === 'function') {
                    try {
                        await command.callReact({ 'reaction': event.reaction, 'api': api, 'event': event, 'actions': actions });
                    } catch (error) {
                        console.error(gradient.passion('Error executing callReact for command ' + reactedMessage.name + ': ' + error));
                    }
                }
            }
            if (event.type === 'message_reaction') {
                // Handle role reactions
                try {
                    const rolesFile = path.join(__dirname, '../database/json/roles.json');
                    const roles = JSON.parse(fs.readFileSync(rolesFile));

                    const reactedMessage = global.client.callReact.find(
                        msg => msg.messageID === event.messageID
                    );

                    if (reactedMessage) {
                        if (reactedMessage.type === "role") {
                            const { threadID, emoji } = reactedMessage;
                            const threadRoles = roles[threadID] || {};
                            const role = threadRoles[emoji];

                            if (role && emoji === event.reaction) {
                                const userName = await getUserName(api, event.userID);
                                const newNickname = `${role.prefix}${userName}`;

                                await api.changeNickname(newNickname, threadID, event.userID);
                                return;
                            }
                        }

                        // Handle regular command reactions
                        const command = database[reactedMessage.name];
                        if (command && typeof command.callReact === 'function') {
                            try {
                                await command.callReact({
                                    'reaction': event.reaction,
                                    'api': api,
                                    'event': event,
                                    'actions': actions
                                });
                            } catch (error) {
                                console.error(gradient.passion('Error executing callReact for command ' + reactedMessage.name + ': ' + error));
                            }
                        }
                    }
                } catch (error) {
                    console.error("Reaction handler error:", error);
                }
            }
        }

        //onEvents
        for (const eventName in eventCommands) {
            const eventCommand = eventCommands[eventName];
            try {
                const safeEventHandler = async () => {
                    try {
                        await eventCommand.onEvents({
                            api,
                            event,
                            actions: {},
                            thread: {
                                adminIDs: [],
                                ...((await getThreadInfo(event.threadID)) || {})
                            }
                        });
                    } catch (innerError) {

                        if (!innerError?.toString().includes('Cannot read properties of null') &&
                            !innerError?.errorSummary?.includes('Bạn tạm thời bị chặn')) {
                            console.error(gradient.passion(`Lỗi lệnh sự kiện ${eventName}:`, innerError));
                        }
                    }
                }; await safeEventHandler();
            } catch (error) {

            }
        }

    });

};

module.exports = { handleListenEvents };