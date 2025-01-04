const fs = require("fs");
const gradient = require("gradient-string");
const cron = require('node-cron');
const chalk = require("chalk");
const { exec } = require("child_process");
const { handleListenEvents } = require("./utils/listen");
const loginManager = require('./loginManager');
const fbCredentials = require('./fbCredentials.json');
const stateManager = require('./utils/stateManager');

const config = JSON.parse(fs.readFileSync("./logins/hut-chat-api/config.json", "utf8"));

cron.schedule('0 3 * * *', () => {
    console.log('Exiting the process at 3:00 AM');
    process.exit(1);
}, {
    timezone: "Asia/Ho_Chi_Minh"
});

cron.schedule('0 5 * * *', () => {
    console.log('Exiting the process at 5:00 AM');
    process.exit(1);
}, {
    timezone: "Asia/Ho_Chi_Minh"
});
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
    reload: {}
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

const startBot = async () => {
    require('./dashboard.js');
    
    try {
        // Load encrypted state
        let appState = stateManager.loadState();
        
        if (!appState) {
            console.log(boldText(gradient.retro("No valid state found, starting new login...")));
            console.log(boldText(gradient.retro("Starting new login process...")));
            try {
                console.log("Attempting Facebook login...");
                await loginManager.login(fbCredentials.email, fbCredentials.password);
                console.log("Login successful!");
                
                // Small delay before using the new appstate
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log("Loading with new appstate...");
                appState = JSON.parse(fs.readFileSync(config.APPSTATE_PATH, "utf8"));
                
                // After successful login, encrypt and save the new state
                stateManager.saveState(appState);
            } catch (error) {
                console.error("Login failed:", error.message);
                process.exit(1);
            }
        }

        console.log(boldText(gradient.retro("Logging in with secure state...")));
        
        login({ appState }, (err, api) => {
            if (err) {
                console.error(boldText(gradient.passion(`Login error: ${JSON.stringify(err)}`)));
                // Delete invalid state
                if (fs.existsSync(stateManager.STATE_PATH)) {
                    fs.unlinkSync(stateManager.STATE_PATH);
                }
                process.exit(1);
            }
            console.log(boldText(gradient.retro("SUCCESSFULLY LOGGED IN VIA APPSTATE")));
            console.log(boldText(gradient.retro("Picked Proxy IP: " + proxy)));
            console.log(boldText(gradient.vice("━━━━━━━[ COMMANDS DEPLOYMENT ]━━━━━━━━━━━")));
            const commands = loadCommands();
            console.log(boldText(gradient.morning("━━━━━━━[ EVENTS DEPLOYMENT ]━━━━━━━━━━━")));
            const eventCommands = loadEventCommands();
            
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
                const data = JSON.parse(fs.readFileSync('./database/threadID.json', 'utf8'));
                if (data.threadID) {
                    api.sendMessage('✅ Restarted Thành Công\n━━━━━━━━━━━━━━━━━━\nBot đã Restart Xong.', data.threadID, _0x3bb26a => {
                        if (_0x3bb26a) {
                            console.error(boldText('Failed to send message:', _0x3bb26a));
                        } else {
                            console.log(boldText('Restart message sent successfully.'));
                            fs.unlinkSync('./database/threadID.json');
                            console.log(boldText('threadID.json has been deleted.'));
                        }
                    });
                }
            }
            
            if (fs.existsSync('./database/prefix/threadID.json')) {
          
                const data = JSON.parse(fs.readFileSync('./database/prefix/threadID.json', 'utf8'));
            
                if (data.threadID) {
               
                    api.sendMessage(
                        `✅ Bot đã thay đổi tiền tố hệ thống thành ${adminConfig.prefix}`,
                        data.threadID,
                        (error) => {
                            if (error) {
                               
                                console.log("Lỗi gửi tin nhắn:", error);
                            } else {
                              
                                fs.unlinkSync('./database/prefix/threadID.json');
                                console.log("threadID.json đã bị xóa.");
                            }
                        }
                    );
                }
            }
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
                    '║ • KENJI AKIRA',
                    '╚════════════════════'
                ];
            
                messages.forEach(msg => console.log(boldText(gradient.cristal(msg))));
            
                console.error(boldText(gradient.summer('[ BOT IS LISTENING ]')));
            }
            printBotInfo();

            handleListenEvents(api, commands, eventCommands, threadsDB, usersDB, adminConfig, prefix);
        });
    } catch (error) {
        console.error("Login failed:", error.message);
        process.exit(1);
    }
};

startBot();