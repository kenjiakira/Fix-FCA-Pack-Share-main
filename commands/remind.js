const moment = require('moment-timezone');
const fs = require('fs');

const remindersFile = './commands/json/reminders.json';

function loadReminders() {
    if (fs.existsSync(remindersFile)) {
        return JSON.parse(fs.readFileSync(remindersFile, 'utf-8'));
    } else {
        return [];
    }
}

function saveReminder(reminder) {
    const reminders = loadReminders();
    reminders.push(reminder);
    fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2), 'utf-8');
}

function removeReminder(reminderTime) {
    const reminders = loadReminders().filter(r => r.time !== reminderTime);
    fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2), 'utf-8');
}

module.exports = {
    name: "remind",
    info: "Tạo nhắc nhở cho các công việc cần làm.",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    usages: "remind <thời gian> <nội dung nhắc nhở>",
    cooldowns: 10,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID, participantIDs } = event;

        if (target.length < 2) {
            return api.sendMessage(
                "Vui lòng cung cấp cả thời gian và nội dung nhắc nhở. Ví dụ: remind 15m 'Take a break'.",
                threadID,
                messageID
            );
        }

        const time = target[0].toLowerCase();
        const reminderMessage = target.slice(1).join(" ");

        function parseTime(time) {
            let ms = 0;
            if (time.includes('m')) ms = parseInt(time) * 60 * 1000;
            else if (time.includes('h')) ms = parseInt(time) * 60 * 60 * 1000;
            else if (time === 'tomorrow') ms = 24 * 60 * 60 * 1000;
            return ms;
        }

        const reminderTime = parseTime(time);
        if (isNaN(reminderTime)) {
            return api.sendMessage(
                "Thời gian không hợp lệ. Vui lòng sử dụng định dạng: 15m, 2h, hoặc tomorrow.",
                threadID,
                messageID
            );
        }

        const remindAt = moment().tz("Asia/Ho_Chi_Minh").add(reminderTime, 'milliseconds');

        const mentions = [{
            id: senderID,
            tag: `@${senderID}`,
            fromIndex: 0
        }];

        saveReminder({
            threadID,
            reminderMessage,
            reminderTime: reminderTime + Date.now(),
            senderID
        });

        setTimeout(() => {
            api.sendMessage(
                { body: `Nhắc nhở: ${reminderMessage}`, mentions },
                threadID,
                messageID
            );
            removeReminder(reminderTime + Date.now());
        }, reminderTime);

        return api.sendMessage(
            `Nhắc nhở "${reminderMessage}" đã được đặt. Bot sẽ nhắc bạn vào lúc ${remindAt.format('HH:mm:ss')} (giờ VN).`,
            threadID,
            messageID
        );
    },

    onRestart: async function() {
        const reminders = loadReminders();

        reminders.forEach(reminder => {
            const timeLeft = reminder.reminderTime - Date.now();
            if (timeLeft > 0) {
                setTimeout(() => {
                    api.sendMessage(
                        { body: `Nhắc nhở: ${reminder.reminderMessage}`, mentions: [{ id: reminder.senderID, tag: `@${reminder.senderID}`, fromIndex: 0 }] },
                        reminder.threadID
                    );
                    removeReminder(reminder.reminderTime);
                }, timeLeft);
            }
        });
    }
};
