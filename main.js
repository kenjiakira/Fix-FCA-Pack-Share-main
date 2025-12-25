
require('./utils/patchFS');

const fs = require("fs");
const gradient = require("gradient-string");
const cron = require('node-cron');
const chalk = require("chalk");
const { exec } = require("child_process");
const { handleListenEvents } = require("./utils/listen");
const portfinder = require('portfinder');
const path = require('path');
// const { initDatabase } = require('./utils/initDatabase');

const { safeReadJSONSync, logSummary } = require('./utils/ensureFiles');

const config = JSON.parse(fs.readFileSync("./logins/hut-chat-api/config.json", "utf8"));

const proxyList = fs.readFileSync("./utils/prox.txt", "utf-8").split("\n").filter(Boolean);
const fonts = require('./utils/fonts');
function getRandomProxy() {
    const randomIndex = Math.floor(Math.random() * proxyList.length);
    return proxyList[randomIndex];
}
proxy = getRandomProxy();
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));
const login = require(`./logins/${adminConfig.FCA}/index.js`);
const prefix = adminConfig.prefix;
const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");
const usersDB = JSON.parse(fs.readFileSync("./database/users.json", "utf8") || "{}");
const boldText = (text) => chalk.bold(text);
global.fonts = fonts;
const loadCommand = (commandName) => {
    try {
        delete require.cache[require.resolve(`./commands/${commandName}.js`)];
        const command = require(`./commands/${commandName}.js`);
        if (command.name && typeof command.name === 'string') {
            global.cc.module.commands[command.name] = command;
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Failed to load command ${commandName}:`, error);
        return false;
    }
};

global.cc = {
    admin: "admin.json",
    adminBot: adminConfig.adminUIDs,
    modBot: adminConfig.moderatorUIDs,
    prefix: adminConfig.prefix,
    developer: adminConfig.ownerName,
    botName: adminConfig.botName,
    ownerLink: adminConfig.facebookLink,
    resend: adminConfig.resend,
    proxy: proxy,
    module: {
        commands: {}
    },
    cooldowns: {},
    getCurrentPrefix: () => global.cc.prefix,
    reload: {},
    loadCommand: loadCommand,
    reloadCommand: loadCommand
};

global.cc.reloadCommand = function (commandName) {
    try {
        delete require.cache[require.resolve(`./commands/${commandName}.js`)];
        const reloadedCommand = require(`./commands/${commandName}.js`);
        global.cc.module.commands[commandName] = reloadedCommand;
        console.log(boldText(gradient.cristal(`[ ${commandName} ] Command reloaded successfully.`)));
        return true;
    } catch (error) {
        console.error(boldText(gradient.cristal(`❌ Failed to reload command [ ${commandName} ]: ${error.message}`)));
        return false;
    }
};

global.cc.reload = new Proxy(global.cc.reload, {
    get: function (target, commandName) {
        return global.cc.reloadCommand(commandName);
    }
});

const loadCommands = () => {
    const commands = {};
    fs.readdirSync("./commands").sort().forEach(file => {
        if (file.endsWith(".js")) {
            try {
                const command = require(`./commands/${file}`);
                commands[command.name] = command;
                console.log(boldText(gradient.cristal(`[ ${command.name} ] Successfully Deployed Command`)));
            } catch (error) {
                if (error.code === "MODULE_NOT_FOUND") {
                    const missingModule = error.message.split("'")[1];
                    console.log(boldText(gradient.vice(`[ ${file} ] Missing module: ${missingModule}. Installing...`)));
                    exec(`npm install ${missingModule}`, (err) => {
                        if (!err) {
                            console.log(boldText(gradient.atlas(`Module ${missingModule} installed successfully.`)));
                            const command = require(`./commands/${file}`);
                            commands[command.name] = command;
                            console.log(boldText(gradient.cristal(`[ ${command.name} ] Successfully Deployed Command`)));
                        }
                    });
                }
            }
        }
    });
    global.cc.module.commands = commands;
    return commands;
};

const loadEventCommands = () => {
    const eventCommands = {};
    fs.readdirSync("./events").sort().forEach(file => {
        if (file.endsWith(".js")) {
            try {
                const eventCommand = require(`./events/${file}`);
                eventCommands[eventCommand.name] = eventCommand;
                console.log(boldText(gradient.pastel(`[ ${eventCommand.name} ] Successfully Deployed Event Command`)));
            } catch (error) {
                if (error.code === "MODULE_NOT_FOUND") {
                    const missingModule = error.message.split("'")[1];
                    console.log(boldText(gradient.instagram(`[ ${file} ] Missing module: ${missingModule}. Installing...`)));
                    exec(`npm install ${missingModule}`, (err) => {
                        if (!err) {
                            console.log(boldText(gradient.atlas(`Module ${missingModule} installed successfully.`)));
                            const eventCommand = require(`./events/${file}`);
                            eventCommands[eventCommand.name] = eventCommand;
                            console.log(boldText(gradient.cristal(`[ ${eventCommand.name} ] Successfully Deployed Event Command`)));
                        }
                    });
                }
            }
        }
    });
    return eventCommands;
};

const reloadModules = () => {
    console.clear();
    console.log(boldText(gradient.retro("Reloading bot...")));
    const commands = loadCommands();
    const eventCommands = loadEventCommands();
    console.log(boldText(gradient.passion("[ BOT MODULES RELOADED ]")));
};

(async () => {
    try {
        
        const startBot = async () => {
            try {
                const { checkAppStateBeforeLogin } = require('./utils/appstateSync');
                const syncURL = process.env.APPSTATE_SYNC_URL;
                if (syncURL && syncURL.trim()) {
                    console.log(boldText(gradient.cristal('🔍 Đang kiểm tra và cập nhật Appstate trước khi khởi động bot...')));
                    const apiKey = process.env.APPSTATE_SYNC_API_KEY || null;
                    const updated = await checkAppStateBeforeLogin(syncURL.trim(), apiKey);
                    if (updated) {
                        console.log(boldText(gradient.retro('✅ Appstate đã được cập nhật, bot sẽ restart...')));
                        return;
                    }
                    console.log(boldText(gradient.cristal('✅ Appstate đã được kiểm tra, tiếp tục khởi động bot...')));
                }
            } catch (error) {
                console.error(boldText(gradient.passion('❌ Lỗi kiểm tra appstate trước khi login:')), error.message);
                console.log(boldText(gradient.passion('⚠️ Bot sẽ tiếp tục với appstate hiện tại...')));
            }
            try {
                currentPort = await portfinder.getPortPromise({
                    port: 3001,
                    stopPort: 4000,
                    host: '0.0.0.0'
                });
            } catch (err) {
                console.error(boldText(gradient.passion("No available ports found!")));
                process.exit(1);
            }
        
            console.log(boldText(gradient.retro(`Starting bot on port ${currentPort}...`)));
        
            console.log(boldText(gradient.retro("Logging via AppState...")));
        
            const { scheduleAutoGiftcode } = require('./utils/autoGiftcode');
        
            const loginOptions = {
                appState: JSON.parse(fs.readFileSync(config.APPSTATE_PATH, "utf8")),
                logLevel: "silent",
                forceLogin: true,
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                autoMarkDelivery: false,
                autoMarkRead: false
            };

            login(loginOptions, async function(err, api) {
                if (err) {
                    console.error(boldText(gradient.passion("FCA LOGIN ERROR:")));
                    if (typeof err === 'object') {
                        if (err.error === 'login-approval') {
                            console.error(boldText(gradient.passion("Error: Login approval required. Please check your Facebook account.")));
                        } else if (err.error === 'Wrong username/password.') {
                            console.error(boldText(gradient.passion("Error: Invalid credentials in appstate.")));
                        } else {
                            console.error(boldText(gradient.passion(`Login error details: ${JSON.stringify(err)}`)));
                        }
                    } else {
                        console.error(boldText(gradient.passion(`Login error: ${err}`)));
                    }

                    if (err.error === 'login-approval' || err.error === 'Wrong username/password.') {
                        console.log(boldText(gradient.cristal("\nTrying to refresh login session...")));
                        try {
                            // Wait 5 seconds before retry
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            return startBot();
                        } catch (retryErr) {
                            console.error(boldText(gradient.passion("Failed to refresh session:")), retryErr);
                            process.exit(1);
                        }
                    }
                    return;
                }
        
                try {
                    scheduleAutoGiftcode(api);
                    console.log('📦 Auto Giftcode system initialized!');
                    
                    const quicklotto = require('./commands/lotto.js');
                    if (quicklotto.onLoad) {
                        quicklotto.onLoad({ api });
                        console.log('🎰 QuickLotto system initialized!');
                    }
                    
                    const autoping = require('./commands/autoping.js');
                    if (autoping.onLoad) {
                        autoping.onLoad({ api });
                        console.log('🏓 AutoPing system initialized!');
                    }
                } catch (error) {
                    console.error('Failed to initialize systems:', error);
                }
        
                console.log(boldText(gradient.retro("SUCCESSFULLY LOGGED IN VIA APPSTATE")));
                console.log(boldText(gradient.retro("Picked Proxy IP: " + proxy)));
                
                try {
                    const { startAppStateSync } = require('./utils/appstateSync');
                    const syncURL = process.env.APPSTATE_SYNC_URL;
                    if (syncURL && syncURL.trim()) {
                        // Mặc định 15 phút để tiết kiệm request (thay vì 5 phút)
                        const interval = parseInt(process.env.APPSTATE_SYNC_INTERVAL) || 15;
                        const apiKey = process.env.APPSTATE_SYNC_API_KEY || null;
                        // Cho phép tắt đồng bộ định kỳ (chỉ kiểm tra khi restart)
                        const enablePeriodic = process.env.APPSTATE_SYNC_ENABLE_PERIODIC !== 'false';
                        startAppStateSync(syncURL.trim(), interval, apiKey, enablePeriodic);
                    }
                } catch (error) {
                    console.error(boldText(gradient.passion('❌ Lỗi khởi động đồng bộ appstate:')), error.message);
                }
                
                console.log(boldText(gradient.vice("━━━━━━━[ COMMANDS DEPLOYMENT ]━━━━━━━━━━━")));
                const commands = loadCommands();
                console.log(boldText(gradient.morning("━━━━━━━[ EVENTS DEPLOYMENT ]━━━━━━━━━━━")));
                const eventCommands = loadEventCommands();
                try {
                    const { startWatcher } = require('./utils/watchCommands');
                    const watcherInstance = startWatcher();
                    if (watcherInstance) {
                        global.autoReloadWatcher = watcherInstance;
                    }
                } catch (error) {
                    console.error(boldText(gradient.passion('⚠️  Không thể khởi động auto-reload watcher:')), error.message);
                }
                
                const adminConfig = {
                    botName: 'Aki Bot',
                    prefix: '.',
                    botUID: '100092325757607',
                    ownerName: 'Akira',
                    vice: 'Akira'
                };
                
                console.log(boldText(gradient.cristal('█▄▀ █▀ █▄ █ █ █    ▄▀█ █▄▀ █ █▀▄ ▄▀█\n█▀█ █▄ █ ▀█ █ █    █▀█ █▀█ █ █▀▄ █▀█')));
                
                console.log(boldText(gradient.cristal('BOT NAME: ' + adminConfig.botName)));
                console.log(boldText(gradient.cristal('PREFIX: ' + adminConfig.prefix)));
                console.log(boldText(gradient.cristal('ADMINBOT: ' + adminConfig.botUID)));
                console.log(boldText(gradient.cristal('OWNER: ' + adminConfig.ownerName + '\n╰───────────⟡')));
                
                if (fs.existsSync('./database/threadID.json')) {
                    try {
                        const data = JSON.parse(fs.readFileSync('./database/threadID.json', 'utf8'));
                        if (data.threadID) {
                            const sendMessage = () => new Promise((resolve, reject) => {
                                api.sendMessage(
                                    '✅ Restarted Thành Công\n━━━━━━━━━━━━━━━━━━\nBot đã Restart Xong.', 
                                    data.threadID,
                                    (error, info) => {
                                        if (error) reject(error);
                                        else resolve(info);
                                    }
                                );
                            });

                            await sendMessage()
                                .then(() => {
                                    console.log(boldText(gradient.atlas('✓ Restart message sent successfully.')));
                                    try {
                                        fs.unlinkSync('./database/threadID.json');
                                        console.log(boldText(gradient.atlas('✓ threadID.json has been deleted.')));
                                    } catch (err) {
                                        console.error(boldText(gradient.passion('Error deleting threadID.json:', err)));
                                    }
                                })
                                .catch(error => {
                                    console.error(boldText(gradient.passion(`Failed to send restart message: ${typeof error === 'object' ? JSON.stringify(error) : error}`)));
                                    if (error?.error === 'Not logged in.' || error?.error === 'Not logged in') {
                                        console.error(boldText(gradient.passion('Bot is not properly logged in. Please check your credentials.')));
                                    } else if (error?.error === 'Thread does not exist.') {
                                        console.error(boldText(gradient.passion('Thread ID no longer exists or bot was removed from thread.')));
                                    }
                                });
                        }
                    } catch (error) {
                        console.error(boldText(gradient.passion('Error processing threadID.json:', error)));
                    }
                }

                if (fs.existsSync('./database/prefix/threadID.json')) {
                    try {
                        const data = JSON.parse(fs.readFileSync('./database/prefix/threadID.json', 'utf8'));
                        if (data.threadID) {
                            const sendMessage = () => new Promise((resolve, reject) => {
                                api.sendMessage(
                                    `✅ Bot đã thay đổi tiền tố hệ thống thành ${adminConfig.prefix}`,
                                    data.threadID,
                                    (error, info) => {
                                        if (error) reject(error);
                                        else resolve(info);
                                    }
                                );
                            });

                            await sendMessage()
                                .then(() => {
                                    try {
                                        fs.unlinkSync('./database/prefix/threadID.json');
                                        console.log(boldText(gradient.atlas('✓ Prefix update message sent and threadID.json deleted.')));
                                    } catch (err) {
                                        console.error(boldText(gradient.passion('Error deleting prefix threadID.json:', err)));
                                    }
                                })
                                .catch(error => {
                                    console.error(boldText(gradient.passion(`Failed to send prefix update message: ${typeof error === 'object' ? JSON.stringify(error) : error}`)));
                                    if (error?.error === 'Not logged in.' || error?.error === 'Not logged in') {
                                        console.error(boldText(gradient.passion('Bot is not properly logged in. Please check your credentials.')));
                                    } else if (error?.error === 'Thread does not exist.') {
                                        console.error(boldText(gradient.passion('Thread ID no longer exists or bot was removed from thread.')));
                                    }
                                });
                        }
                    } catch (error) {
                        console.error(boldText(gradient.passion('Error processing prefix threadID.json:', error)));
                    }
                }
                
                logSummary();
                
                console.log(boldText(gradient.passion("━━━━[ READY INITIALIZING DATABASE ]━━━━━━━")));
                console.log(boldText(gradient.cristal(`╔════════════════════`)));
                console.log(boldText(gradient.cristal(`║ DATABASE SYSTEM STATS`)));
                console.log(boldText(gradient.cristal(`║ Số Nhóm: ${Object.keys(threadsDB).length}`)));
                console.log(boldText(gradient.cristal(`║ Tổng Người Dùng: ${Object.keys(usersDB).length} `)));
                console.log(boldText(gradient.cristal(`╚════════════════════`)));
                console.log(boldText(gradient.cristal("BOT Made By CC PROJECTS And Kaguya And Kenji Akira")))
        
                
                function printBotInfo() {
                    const messages = [
                        '╔════════════════════',
                        '║ => DEDICATED: CHATBOT COMMUNITY AND YOU',
                        '║ • ARJHIL DUCAYANAN',
                        '║ • JR BUSACO',
                        '║ • JONELL MAGALLANES',
                        '║ • JAY MAR',
                        '║ • KENJI AKIRA',                '╚════════════════════'
                    ];
                
                    messages.forEach(msg => console.log(boldText(gradient.cristal(msg))));
                
                    console.error(boldText(gradient.summer('[ BOT IS LISTENING ]')));
                }
                printBotInfo();
        
                handleListenEvents(api, commands, eventCommands, threadsDB, usersDB, adminConfig, prefix);
            });
        };
        
        process.on('exit', () => {
            // Cleanup if needed
        });
        
        process.on('SIGINT', () => {
            console.log(boldText(gradient.cristal("\nGracefully shutting down...")));
            if (global.autoReloadWatcher && global.autoReloadWatcher.stop) {
                global.autoReloadWatcher.stop();
            }
            process.exit(0);
        });
        
        process.on('uncaughtException', (err) => {
            if (err?.error === 3252001 || 
                err?.errorSummary?.includes('Bạn tạm thời bị chặn') ||
                (err?.error && err?.blockedAction)) {
                return; 
            }
        
            if (err.code === 'ENOENT' && err.path && err.path.endsWith('.json')) {
                try {
                    const { ensureFile } = require('./utils/ensureFiles');
                    ensureFile(err.path, {});
                    console.log(boldText(gradient.teen(`✅ Đã tự động tạo file: ${err.path}`)));
                    return;
                } catch (createError) {
                    console.error(boldText(gradient.passion(`❌ Không thể tạo file ${err.path}:`)), createError);
                }
            }
        
            if (err.code === 'ENOTFOUND' && 
                err.syscall === 'getaddrinfo' && 
                err.hostname === 'www.facebook.com') {
                console.log(boldText(gradient.cristal("Facebook connection lost")));
            } else {
                console.error('Uncaught Exception:', 
                    err?.message || err?.errorSummary || 'Unknown error');
            }
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            if (reason?.error === 3252001 || 
                reason?.errorSummary?.includes('Bạn tạm thời bị chặn') ||
                (reason?.error && reason?.blockedAction)) {
                return; 
            }
        
            if (reason && reason.code === 'ENOENT' && reason.path && reason.path.endsWith('.json')) {
                try {
                    const { ensureFile } = require('./utils/ensureFiles');
                    ensureFile(reason.path, {});
                    console.log(boldText(gradient.teen(`✅ Đã tự động tạo file: ${reason.path}`)));
                    return;
                } catch (createError) {
                    console.error(boldText(gradient.passion(`❌ Không thể tạo file ${reason.path}:`)), createError);
                }
            }
        
            if (reason && reason.code === 'ENOTFOUND' && 
                reason.syscall === 'getaddrinfo' && 
                reason.hostname === 'www.facebook.com') {
                console.log(boldText(gradient.cristal("Facebook connection lost")));
            } else {
                console.error('Unhandled Rejection:', 
                    reason?.message || reason?.errorSummary || 'Unknown error');
            }
        });
        
        startBot().catch(async (err) => {
            console.error(boldText(gradient.passion("Failed to start bot:")), err);
            process.exit(1);
        });
    } catch (error) {
        console.error('Bot startup error:', error);
    }
})();