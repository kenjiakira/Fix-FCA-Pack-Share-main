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

        const replyInfo = global.client.onReply.find(r => r.messageID === event.messageReply.messageID);
        if (!replyInfo) return;

        if (adminConfig.adminUIDs.includes(senderID)) {
            let replyMsg = `━━━ 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ━━━\n\n`;
            replyMsg += `📝 Mã phản hồi: ${replyInfo.feedbackCode}\n`;
            replyMsg += `💌 𝗣𝗵𝗮̉𝗻 𝗵𝗼̂̀𝗶 𝘁𝘂̛̛̀ 𝗔𝗱𝗺𝗶𝗻:\n${body}\n\n`;
            replyMsg += `↪️ 𝗧𝗿𝗮̉ 𝗹𝗼̛̀𝗶 𝘁𝗶𝗻 𝗻𝗵𝗮̆́𝗻: ${replyInfo.content}\n`;
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
                adminID: senderID,
                content: body,
                feedbackCode: replyInfo.feedbackCode
            });
        } 
        else {
            let feedbackMsg = `━━━ 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ━━━\n\n`;
            feedbackMsg += `📝 Mã phản hồi: ${replyInfo.feedbackCode}\n`;
            feedbackMsg += `👤 𝗧𝘂̛̛̀ 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗱𝘂̀𝗻𝗴: ${senderID}\n`;
            feedbackMsg += `💬 𝗡𝗼̣̂𝗶 𝗱𝘂𝗻𝗴: ${body}\n\n`;
            feedbackMsg += `↪️ 𝗧𝗿𝗮̉ 𝗹𝗼̛̀𝗶 𝘁𝗶𝗻 𝗻𝗵𝗮̆́𝗻: ${replyInfo.content}\n`;
            feedbackMsg += `⏰ 𝗧𝗶𝗺𝗲: ${time}\n`;
            feedbackMsg += `━━━━━━━━━━━━━━━━━━`;

            const msg = await api.sendMessage({
                body: feedbackMsg,
                attachment: attachments
            }, replyInfo.adminID);

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
                adminID: replyInfo.adminID,
                content: body,
                feedbackCode: replyInfo.feedbackCode
            });
        }
    },

    onLaunch: async function ({ event, api, target }) {
        try {
            const { threadID, messageID, senderID, attachments } = event;
            const feedback = target.join(" ");
            const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
            const feedbackCode = `#${this.dev}${Date.now().toString(36)}`;

            if (!feedback && attachments.length === 0) {
                return api.sendMessage("⚠️ Vui lòng nhập nội dung hoặc gửi file đính kèm!", threadID, messageID);
            }

            const adminIDs = adminConfig.adminUIDs;
            if (!adminIDs || adminIDs.length === 0) {
                return api.sendMessage("⚠️ Không tìm thấy admin!", threadID, messageID);
            }

            let feedbackMsg = `━━━ 𝗡𝗘𝗪 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ━━━\n\n`;
            feedbackMsg += `📝 Mã phản hồi: ${feedbackCode}\n`;
            feedbackMsg += `👤 𝗧𝘂̛̛̀ 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗱𝘂̀𝗻𝗴: ${senderID}\n`;
            feedbackMsg += `💬 𝗡𝗼̣̂𝗶 𝗱𝘂𝗻𝗴: ${feedback}\n`;
            feedbackMsg += `⏰ 𝗧𝗶𝗺𝗲: ${time}\n`;
            feedbackMsg += `━━━━━━━━━━━━━━━━━━`;

            let sentSuccessfully = false;
            let successfulAdminID;
            let lastError;

            for (const adminID of adminIDs) {
                try {
                    const msg = await api.sendMessage({
                        body: feedbackMsg,
                        attachment: attachments
                    }, adminID);

                    sentSuccessfully = true;
                    successfulAdminID = adminID;
                    
                    global.client.onReply.push({
                        name: this.name,
                        messageID: msg.messageID,
                        userID: senderID,
                        threadID: threadID,
                        type: "admin",
                        adminID: adminID,
                        content: feedback,
                        feedbackCode: feedbackCode
                    });

                    break;
                } catch (err) {
                    lastError = err;
                    console.log(`Failed to send to admin ${adminID}:`, err);
                    continue; 
                }
            }

            if (!sentSuccessfully) {
               
                const feedbackGroupID = adminConfig.feedbackGroupID; 
                
                if (feedbackGroupID) {
                    try {
                        const msg = await api.sendMessage({
                            body: `[ADMIN FEEDBACK]\n${feedbackMsg}`,
                            attachment: attachments
                        }, feedbackGroupID);

                        sentSuccessfully = true;
                        
                        global.client.onReply.push({
                            name: this.name,
                            messageID: msg.messageID,
                            userID: senderID,
                            threadID: threadID,
                            type: "admin",
                            adminID: adminIDs[0],
                            content: feedback,
                            feedbackCode: feedbackCode,
                            isGroupFeedback: true
                        });
                    } catch (err) {
                        console.error("Failed to send to feedback group:", err);
                        lastError = err;
                    }
                }
            }

            if (sentSuccessfully) {
                await api.sendMessage(
                    `✅ Phản hồi của bạn đã được gửi thành công!\n` +
                    `📝 Mã phản hồi: ${feedbackCode}\n` +
                    `⏰ Time: ${time}\n` +
                    `💌 Reply tin nhắn này để tiếp tục phản hồi.`, 
                    threadID, 
                    messageID
                );
            } else {
                throw new Error("Không thể gửi phản hồi đến bất kỳ admin nào");
            }
            
        } catch (error) {
            console.error("Feedback Error:", error);
            
            let errorMsg = "❌ Đã xảy ra lỗi khi gửi phản hồi:\n\n";
            
            if (error.error === 1545116) {
                errorMsg += "- Không thể gửi trực tiếp đến admin do hạn chế của Facebook.\n";
                errorMsg += "- Vui lòng liên hệ admin qua các phương thức khác:\n";
                errorMsg += "1. Tham gia nhóm support: [link group]\n";
                errorMsg += "2. Liên hệ qua Facebook: [fb.com/admin]\n";
                errorMsg += "3. Gửi email tới: [email]";
            } else {
                errorMsg += `- Lỗi: ${error.message}\n`;
                errorMsg += "- Vui lòng thử lại sau hoặc liên hệ admin qua phương thức khác.";
            }

            api.sendMessage(errorMsg, event.threadID, event.messageID);
        }
    }
};
