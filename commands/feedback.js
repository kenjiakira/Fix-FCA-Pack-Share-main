const fs = require('fs');
const moment = require('moment-timezone');
const adminConfig = JSON.parse(fs.readFileSync('admin.json', 'utf8'));

module.exports = {
    name: "feedback",
    usedby: 0,
    dmUser: false,
    dev: "HNT",
    nickName: ["feedback", "fb"],
    info: "Gửi phản hồi đến admin",
    onPrefix: true,
    cooldowns: 3,

    onReply: async function({ event, api }) {
        const { threadID, messageID, body, senderID, attachments } = event;
        const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
        
        if (!body && attachments.length === 0) return;

        if (adminConfig.adminUIDs.includes(event.senderID)) {
            const replyInfo = global.client.onReply.find(r => r.messageID === event.messageReply.messageID);
            if (!replyInfo) return;

            let replyMsg = `━━━ 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ━━━\n\n`;
            replyMsg += `💌 𝗣𝗵𝗮̉𝗻 𝗵𝗼̂̀𝗶 𝘁𝘂̛̀ 𝗔𝗱𝗺𝗶𝗻:\n${body}\n`;
            replyMsg += `⏰ 𝗧𝗶𝗺𝗲: ${time}\n`;
            replyMsg += `━━━━━━━━━━━━━━━━━━`;

            const msg = await api.sendMessage({
                body: replyMsg,
                attachment: attachments
            }, replyInfo.threadID);

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                userID: replyInfo.userID,
                threadID: replyInfo.threadID,
                type: "user",
                adminID: senderID
            });
        } 
        else {
            const replyInfo = global.client.onReply.find(r => r.messageID === event.messageReply.messageID);
            if (!replyInfo || replyInfo.type !== "user") return;

            const adminID = replyInfo.adminID;
            if (!adminID) return api.sendMessage("⚠️ Không tìm thấy admin!", threadID, messageID);

            let feedbackMsg = `━━━ 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ━━━\n\n`;
            feedbackMsg += `👤 𝗧𝘂̛̀ 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗱𝘂̀𝗻𝗴: ${senderID}\n`;
            feedbackMsg += `💬 𝗡𝗼̣̂𝗶 𝗱𝘂𝗻𝗴: ${body}\n`;
            feedbackMsg += `⏰ 𝗧𝗶𝗺𝗲: ${time}\n`;
            feedbackMsg += `━━━━━━━━━━━━━━━━━━`;

            const msg = await api.sendMessage({
                body: feedbackMsg,
                attachment: attachments
            }, adminID);

            api.sendMessage(
                "✅ Đã gửi phản hồi của bạn đến admin!\n⏰ Time: " + time,
                threadID,
                messageID
            );

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                userID: senderID,
                threadID: threadID,
                type: "admin",
                adminID: adminID
            });
        }
    },

    onLaunch: async function ({ event, api, target }) {
        const { threadID, messageID, senderID, attachments } = event;
        const feedback = target.join(" ");
        const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

        if (!feedback && attachments.length === 0) {
            return api.sendMessage("⚠️ Vui lòng nhập nội dung hoặc gửi file đính kèm!", threadID, messageID);
        }

        const adminID = adminConfig.adminUIDs[0];
        if (!adminID) return api.sendMessage("⚠️ Không tìm thấy admin!", threadID, messageID);

        let feedbackMsg = `━━━ 𝗡𝗘𝗪 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ━━━\n\n`;
        feedbackMsg += `👤 𝗧𝘂̛̀ 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗱𝘂̀𝗻𝗴: ${senderID}\n`;
        feedbackMsg += `💬 𝗡𝗼̣̂𝗶 𝗱𝘂𝗻𝗴: ${feedback}\n`;
        feedbackMsg += `⏰ 𝗧𝗶𝗺𝗲: ${time}\n`;
        feedbackMsg += `━━━━━━━━━━━━━━━━━━`;

        const msg = await api.sendMessage({
            body: feedbackMsg,
            attachment: attachments
        }, adminID);

        api.sendMessage(
            "Phản hồi của bạn đã được gửi đến admin. Vui lòng đợi phản hồi!", 
            threadID, 
            messageID
        );

        global.client.onReply.push({
            name: this.name,
            messageID: msg.messageID,
            userID: senderID,
            threadID: threadID, 
            type: "admin",
            adminID: adminID
        });
    }
};
