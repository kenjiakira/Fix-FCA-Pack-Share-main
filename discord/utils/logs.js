const chalk = require('chalk');
const gradient = require('gradient-string');
const moment = require("moment-timezone");
const config = require('../../config/config.json');

let io = null;

const initializeSocket = (socketIO) => {
    io = socketIO;
};

const time = () => moment.tz("Asia/Ho_Chi_Minh").format("LLLL");
const gradientText = (text) => gradient('cyan', 'pink')(text);
const boldText = (text) => chalk.bold(text);

const logDiscordMessage = async (message) => {
    try {
        const isAdmin = message.member?.permissions.has('Administrator');
        const isBotAdmin = config.adminUIDs.includes(message.author.id);
        
        const logHeader = gradientText("━━━━━━━━━━[ DISCORD BOT LOGS ]━━━━━━━━━━");
        
        const logMessage = [
            logHeader,
            "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
            `┣➤ 🌐 Server: ${message.guild.name}`,
            `┣➤ 📝 Channel: #${message.channel.name}`,
            `┣➤ 👤 User: ${message.author.tag}${isAdmin ? ' (Server Admin)' : ''}${isBotAdmin ? ' (Bot Admin)' : ''}`,
            `┣➤ 🆔 UserID: ${message.author.id}`,
            `┣➤ ✉️ Content: ${message.content}`,
            `┣➤ ⏰ Time: ${time()}`,
            "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
        ].join('\n');

        console.log(logMessage);
        
        if (io) {
            io.emit('botLog', {
                output: logMessage,
                type: 'discord_message',  // Changed from 'discord' to 'discord_message'
                color: '#7289DA' 
            });
        }

        if (message.attachments.size > 0) {
            const attachmentLog = [
                gradientText("━━━━━━━━━━[ DISCORD ATTACHMENTS ]━━━━━━━━━━"),
                ...message.attachments.map(attachment => 
                    `📎 ${attachment.name || 'Attachment'}: ${attachment.url}`
                )
            ].join('\n');

            console.log(attachmentLog);
            
            if (io) {
                io.emit('botLog', {
                    output: attachmentLog,
                    type: 'discord_attachment',
                    color: '#7289DA'
                });
            }
        }

    } catch (error) {
        console.error('[DISCORD] Log error:', error);
    }
};

const logBotEvent = (eventType, details) => {
    try {
        const logHeader = gradientText("━━━━━━━━━━[ DISCORD BOT EVENT ]━━━━━━━━━━");
        
        const logMessage = [
            logHeader,
            "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
            `┣➤ 🔔 Event: ${eventType}`,
            `┣➤ 📝 Details: ${details}`,
            `┣➤ ⏰ Time: ${time()}`,
            "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
        ].join('\n');

        console.log(logMessage);
        
        if (io) {
            io.emit('botLog', {
                output: logMessage,
                type: 'discord_event',
                color: '#7289DA'
            });
        }

    } catch (error) {
        console.error('[DISCORD] Event log error:', error);
    }
};

module.exports = {
    initializeSocket,
    logDiscordMessage,
    logBotEvent
};
