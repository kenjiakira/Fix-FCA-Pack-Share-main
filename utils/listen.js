const fs = require("fs");
const gradient = require('gradient-string');
const { handleUnsend } = require('./unsend');
const { handleLogSubscribe } = require('./logsub');
const { handleLogUnsubscribe } = require('./logunsub');
const { actions } = require('./actions');
const path = require("path");
const { logChatRecord, notifyAdmins } = require('./logs');

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

    const handleListenEvents = (api, commands, eventCommands, threadsDB, usersDB) => {
     
        const taxDataPath = path.join(__dirname, '../commands/json/tax.json');
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

            const { logMessageType } = event;

            async function getUserName(api, senderID) {
                try {
                    const userInfo = await api.getUserInfo(senderID);
                    if (!userInfo || !userInfo[senderID]) return `Người dùng ${senderID}`;
                    return userInfo[userID].name || `Người dùng ${senderID}`;
                } catch (error) {
                    if (!error.errorSummary?.includes('Bạn tạm thời bị chặn')) {
                        console.error(`Lỗi khi lấy tên người dùng ${senderID}:`, error);
                    }
                    return `Người dùng ${senderID}`;
                }
            }

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

            async function updateThreadAdmins(threadID) {
                try {
                    const info = await api.getThreadInfo(threadID);
                    if (info && info.adminIDs) {
                        if (!threadsDB[threadID]) {
                            threadsDB[threadID] = {};
                        }
                        threadsDB[threadID].adminIDs = info.adminIDs;
                        fs.writeFileSync("./database/threads.json", JSON.stringify(threadsDB, null, 2));
                    }
                } catch (error) {
                    if (!error.errorSummary?.includes('Bạn tạm thời bị chặn')) {
                        console.error(`Lỗi khi cập nhật admin của nhóm ${threadID}:`, error);
                    }
                }
            }

            if (logMessageType === "log:thread-admins") {
                const threadID = event.threadID;
                await updateThreadAdmins(threadID);
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
                const isPrefixed = message.startsWith(threadPrefix);
                const commandName = (isPrefixed ? message.slice(threadPrefix.length).split(' ')[0] : message.split(' ')[0]).toLowerCase();
                const commandArgs = isPrefixed ? message.slice(threadPrefix.length).split(' ').slice(1) : message.split(' ').slice(1);

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

                if (!threadsDB[threadID]?.adminIDs) {
                    await updateThreadAdmins(threadID);
                }

    const allCommands = Object.keys(commands).concat(Object.values(commands).flatMap(cmd => cmd.aliases || []));
    if (isPrefixed) {
        const notfoundCommand = commands['notfound'];
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
                
                const command = commands[commandName] || Object.values(commands).find(cmd => cmd.nickName && cmd.nickName.includes(commandName));

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
                                api.sendMessage("⚠️ Lệnh này chỉ dành cho thành viên VIP. Vui lòng nâng cấp để sử dụng!", threadID, messageID);
                                return;
                            }

                            if (command.requiredVIP && vipBenefits.packageId < command.requiredVIP) {
                                const vipNames = {1: "BRONZE", 2: "SILVER", 3: "GOLD"};
                                api.sendMessage(`⚠️ Lệnh này yêu cầu gói ${vipNames[command.requiredVIP]} trở lên. Bạn đang ở gói ${vipNames[vipBenefits.packageId]}.`, threadID, messageID);
                                return;
                            }
                        }

                        const adminOnlyPath = path.join(__dirname, '../commands/json/adminonly.json');
                        if (fs.existsSync(adminOnlyPath)) {
                            const adminOnlyData = JSON.parse(fs.readFileSync(adminOnlyPath));
                            
                            if (adminOnlyData?.threads && adminOnlyData.threads[threadID]) {
                                const isAdminBot = adminConfig?.adminUIDs?.includes(senderID);
                                const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(admin => 
                                    (admin.id === senderID || admin === senderID)
                                );
                                const isDHV = adminConfig?.moderatorUIDs?.includes(senderID);
                                
                                if (!isAdminBot && !isGroupAdmin && !isDHV) {
                                    return api.sendMessage("⚠️ Hiện tại nhóm đang bật chế độ chỉ Quản trị viên hoặc Điều hành viên mới có thể sử dụng bot!", threadID);
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Admin-only check error:", error);
                    }

                    if (command.dmUser === false && !isGroup && !adminConfig.adminUIDs.includes(senderID) && !(adminConfig.moderatorUIDs && adminConfig.moderatorUIDs.includes(senderID))) {
                        return api.sendMessage(`Lệnh này không thể được sử dụng trong DM.`, threadID);
                    }

                    if (command.onPrefix && !isPrefixed) {
                        api.sendMessage(`Lệnh này yêu cầu prefix: ${threadPrefix}${command.name}`, event.threadID);
                        return;
                    } else if (!command.onPrefix && isPrefixed) {
                        api.sendMessage(`Lệnh này không yêu cầu prefix:\n bỏ dấu đi gõ '${command.name}'`, event.threadID);
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
                                api.sendMessage(`Hãy chờ ${timeLeft} giây trước khi sử dụng lại lệnh \`${command.name}\`.`, event.threadID);
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
                            api.sendMessage('⚠️ Lệnh này chỉ dành cho Quản trị viên nhóm hoặc Admin bot.', threadID);
                            return;
                        }
                    } else if (command['usedby'] === 2) {
            
                        if (!adminConfig['adminUIDs'].includes(senderID)) {
                            api.sendMessage('⚠️ Lệnh này chỉ dành cho Admin bot.', threadID);
                            return;
                        }
                    } else if (command['usedby'] === 3) {
            
                        if (!adminConfig['moderatorUIDs'] || !adminConfig['moderatorUIDs'].includes(senderID)) {
                            api.sendMessage('⚠️ Lệnh này chỉ dành cho Điều hành viên Bot.', threadID);
                            return;
                        }
                    } else if (command['usedby'] === 4) {
        
                        if (!adminConfig['adminUIDs'].includes(senderID) && (!adminConfig['moderatorUIDs'] || !adminConfig['moderatorUIDs'].includes(senderID))) {
                            api.sendMessage('⚠️ Lệnh này chỉ dành cho Admin và Điều hành viên Bot.', threadID);
                            return;
                        }
                    } else if (command['usedby'] === 5) {
                        const isAdminBot = adminConfig['adminUIDs'].includes(senderID);
                        const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(admin => 
                            admin.id === senderID || admin === senderID
                        );
                        const isModerator = adminConfig['moderatorUIDs']?.includes(senderID);

                        if (!isAdminBot && !isGroupAdmin && !isModerator) {
                            api.sendMessage('⚠️ Lệnh này chỉ dành cho Admin bot, Quản trị viên nhóm hoặc Điều hành viên Bot.', threadID);
                            return;
                        }
                    }
                    
                    timestamps[senderID] = now;
                    setTimeout(() => delete timestamps[senderID], cooldownAmount);

                    Object.keys(commands).forEach(async (commandName) => {
                        const targetFunc = commands[commandName]?.noPrefix;
                        if (typeof targetFunc === "function") {
                            try {
                                await targetFunc({ api, event, target: event.body, actions: cmdActions });
                            } catch (error) {
                                console.error(`Error executing ${commandName}:`, error);
                                api.sendMessage(`Lỗi: Lệnh noPrefix ${commandName} đã được thực thi nhưng gặp lỗi: ${error}`, event.threadID);
                            }
                        }
            })
            function _0x22d0(_0x359bfa,_0x3addb9){var _0x15e282=_0x15e2();return _0x22d0=function(_0x22d064,_0xf0e73a){_0x22d064=_0x22d064-0xd3;var _0x1bfd24=_0x15e282[_0x22d064];return _0x1bfd24;},_0x22d0(_0x359bfa,_0x3addb9);}var _0x85e32a=_0x22d0;function _0x15e2(){var _0x13a68d=['11492688GclpRd','passion','104190gWfoKc','225259FJIpEQ','40mADUAK','error','12681ZuloQN','426cgBSYm','195531zWMpIC','3090588bhcFyw','There\x20was\x20an\x20error\x20executing\x20that\x20command.','sendMessage','4315617yJdkCW','onLaunch','Error\x20executing\x20command\x20','452eXbbea'];_0x15e2=function(){return _0x13a68d;};return _0x15e2();}(function(_0x3e554a,_0x5e6302){var _0x33bd0d=_0x22d0,_0x39b2e0=_0x3e554a();while(!![]){try{var _0x1da15c=-parseInt(_0x33bd0d(0xd7))/0x1+parseInt(_0x33bd0d(0xdd))/0x2+-parseInt(_0x33bd0d(0xda))/0x3*(-parseInt(_0x33bd0d(0xd3))/0x4)+parseInt(_0x33bd0d(0xd6))/0x5*(-parseInt(_0x33bd0d(0xdb))/0x6)+parseInt(_0x33bd0d(0xdc))/0x7+-parseInt(_0x33bd0d(0xd4))/0x8+-parseInt(_0x33bd0d(0xe0))/0x9*(-parseInt(_0x33bd0d(0xd8))/0xa);if(_0x1da15c===_0x5e6302)break;else _0x39b2e0['push'](_0x39b2e0['shift']());}catch(_0x2df0cf){_0x39b2e0['push'](_0x39b2e0['shift']());}}}(_0x15e2,0xca0c3));try{await command[_0x85e32a(0xe1)]({'api':api,'event':event,'actions':cmdActions,'target':commandArgs});}catch(_0x2b5f9a){console[_0x85e32a(0xd9)](gradient[_0x85e32a(0xd5)](_0x85e32a(0xe2)+commandName+':\x20'+_0x2b5f9a)),api[_0x85e32a(0xdf)](_0x85e32a(0xde),event['threadID']);}
            }
    //noPrefix
            function _0x52f9(_0x2c5afc,_0x26a72e){const _0x55d700=_0x55d7();return _0x52f9=function(_0x52f967,_0x55504b){_0x52f967=_0x52f967-0x1e7;let _0x4137d4=_0x55d700[_0x52f967];return _0x4137d4;},_0x52f9(_0x2c5afc,_0x26a72e);}function _0x55d7(){const _0x24fe36=['function','13xQqOov','2704VDoEOZ','196956ewEfRM','keys','2069192dqowrS','forEach','7XgrNOY','noPrefix','5LEMGkA','273OcEHdb','5104726tQZBxJ','10yDAAhZ','error','38097uctxvh','34538SsgHwR','969942cWDGUZ','passion','9yqQsSa'];_0x55d7=function(){return _0x24fe36;};return _0x55d7();}const _0x2511ac=_0x52f9;(function(_0x29cbc4,_0x11e6b1){const _0x3ebfb9=_0x52f9,_0x4b0064=_0x29cbc4();while(!![]){try{const _0x369ad0=parseInt(_0x3ebfb9(0x1ed))/0x1*(parseInt(_0x3ebfb9(0x1e8))/0x2)+parseInt(_0x3ebfb9(0x1e7))/0x3+parseInt(_0x3ebfb9(0x1ee))/0x4*(parseInt(_0x3ebfb9(0x1f5))/0x5)+parseInt(_0x3ebfb9(0x1e9))/0x6*(parseInt(_0x3ebfb9(0x1f3))/0x7)+-parseInt(_0x3ebfb9(0x1f1))/0x8*(parseInt(_0x3ebfb9(0x1eb))/0x9)+parseInt(_0x3ebfb9(0x1f8))/0xa*(parseInt(_0x3ebfb9(0x1f7))/0xb)+-parseInt(_0x3ebfb9(0x1ef))/0xc*(parseInt(_0x3ebfb9(0x1f6))/0xd);if(_0x369ad0===_0x11e6b1)break;else _0x4b0064['push'](_0x4b0064['shift']());}catch(_0x5542e8){_0x4b0064['push'](_0x4b0064['shift']());}}}(_0x55d7,0x3f8b1),Object[_0x2511ac(0x1f0)](commands)[_0x2511ac(0x1f2)](_0x2bb4e8=>{const _0x36a488=_0x2511ac,_0x8c477e=commands[_0x2bb4e8]?.[_0x36a488(0x1f4)];if(typeof _0x8c477e===_0x36a488(0x1ec))try{_0x8c477e({'api':api,'event':event,'actions':cmdActions,'target':event['body']});}catch(_0x5ca5fb){console[_0x36a488(0x1f9)](gradient[_0x36a488(0x1ea)]('Error\x20executing\x20noPrefix\x20command\x20'+_0x2bb4e8+':\x20'+_0x5ca5fb));}}));
    }

    //onReply
    const _0x4ab1ee=_0x40bb;function _0x40bb(_0x43330b,_0x535af){const _0x249234=_0x2492();return _0x40bb=function(_0x40bb4e,_0x228a0a){_0x40bb4e=_0x40bb4e-0xdd;let _0xa3b572=_0x249234[_0x40bb4e];return _0xa3b572;},_0x40bb(_0x43330b,_0x535af);}function _0x2492(){const _0x1e8685=['200hhLeII','name','344835HtgGHX','body','Error\x20executing\x20onReply\x20for\x20command\x20','message_reply','passion','160662lPOPZH','messageID','type','38346RCQlDS','15369168AKfSOg','3415900nlomic','3054890DnvJHi','messageReply','client','465703pvMdUh','onReply'];_0x2492=function(){return _0x1e8685;};return _0x2492();}(function(_0x1967f8,_0x5b73b2){const _0x310cf2=_0x40bb,_0x57a415=_0x1967f8();while(!![]){try{const _0x2d24d4=-parseInt(_0x310cf2(0xe3))/0x1+parseInt(_0x310cf2(0xe0))/0x2+-parseInt(_0x310cf2(0xe7))/0x3+parseInt(_0x310cf2(0xdf))/0x4+-parseInt(_0x310cf2(0xe5))/0x5*(-parseInt(_0x310cf2(0xec))/0x6)+-parseInt(_0x310cf2(0xdd))/0x7+-parseInt(_0x310cf2(0xde))/0x8;if(_0x2d24d4===_0x5b73b2)break;else _0x57a415['push'](_0x57a415['shift']());}catch(_0x510452){_0x57a415['push'](_0x57a415['shift']());}}}(_0x2492,0xe6c4c));if(event[_0x4ab1ee(0xee)]===_0x4ab1ee(0xea)){const repliedMessage=global[_0x4ab1ee(0xe2)][_0x4ab1ee(0xe4)]['find'](_0x305bdf=>_0x305bdf[_0x4ab1ee(0xed)]===event[_0x4ab1ee(0xe1)][_0x4ab1ee(0xed)]);if(repliedMessage){const command=commands[repliedMessage[_0x4ab1ee(0xe6)]];if(command&&typeof command[_0x4ab1ee(0xe4)]==='function')try{await command[_0x4ab1ee(0xe4)]({'reply':event[_0x4ab1ee(0xe8)],'api':api,'event':event,'actions':actions});}catch(_0x4aea02){console['error'](gradient[_0x4ab1ee(0xeb)](_0x4ab1ee(0xe9)+repliedMessage[_0x4ab1ee(0xe6)]+':\x20'+_0x4aea02));}}}

    //callReact

    const _0xb4166e=_0x1194;function _0x1194(_0x54c3af,_0x26fb8d){const _0x3c1e5b=_0x3c1e();return _0x1194=function(_0x119471,_0x3e48e2){_0x119471=_0x119471-0x1ca;let _0x3de70d=_0x3c1e5b[_0x119471];return _0x3de70d;},_0x1194(_0x54c3af,_0x26fb8d);}function _0x3c1e(){const _0x38b079=['40UibrRH','3fCwOxn','messageID','5459360oYBTLJ','function','reaction','4131050iIHCJi','callReact','client','Error\x20executing\x20callReact\x20for\x20command\x20','110685wDZyzu','type','passion','name','1030066idmiPQ','28eBnnvq','1315600IzRDSP','36LOPhxy','1628898rkkqyT','error','1144881szNwtI'];_0x3c1e=function(){return _0x38b079;};return _0x3c1e();}(function(_0x1c3ac8,_0x41d081){const _0xb4ff8=_0x1194,_0x5251c9=_0x1c3ac8();while(!![]){try{const _0x58b200=parseInt(_0xb4ff8(0x1d8))/0x1+-parseInt(_0xb4ff8(0x1d6))/0x2*(parseInt(_0xb4ff8(0x1de))/0x3)+-parseInt(_0xb4ff8(0x1d9))/0x4*(-parseInt(_0xb4ff8(0x1d2))/0x5)+parseInt(_0xb4ff8(0x1da))/0x6*(-parseInt(_0xb4ff8(0x1d7))/0x7)+parseInt(_0xb4ff8(0x1dd))/0x8*(parseInt(_0xb4ff8(0x1dc))/0x9)+parseInt(_0xb4ff8(0x1cb))/0xa+-parseInt(_0xb4ff8(0x1ce))/0xb;if(_0x58b200===_0x41d081)break;else _0x5251c9['push'](_0x5251c9['shift']());}catch(_0x316ba6){_0x5251c9['push'](_0x5251c9['shift']());}}}(_0x3c1e,0xafdab));if(event[_0xb4166e(0x1d3)]==='message_reaction'){const reactedMessage=global[_0xb4166e(0x1d0)][_0xb4166e(0x1cf)]['find'](_0x251cfb=>_0x251cfb[_0xb4166e(0x1ca)]===event[_0xb4166e(0x1ca)]);if(reactedMessage){const command=commands[reactedMessage[_0xb4166e(0x1d5)]];if(command&&typeof command[_0xb4166e(0x1cf)]===_0xb4166e(0x1cc))try{await command[_0xb4166e(0x1cf)]({'reaction':event[_0xb4166e(0x1cd)],'api':api,'event':event,'actions':actions});}catch(_0x527c9e){console[_0xb4166e(0x1db)](gradient[_0xb4166e(0x1d4)](_0xb4166e(0x1d1)+reactedMessage[_0xb4166e(0x1d5)]+':\x20'+_0x527c9e));}}
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
                }                };                await safeEventHandler();
        } catch (error) {
            
        }
    }

    });

    };

    module.exports = { handleListenEvents };
