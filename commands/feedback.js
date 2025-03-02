const fs = require('fs');
const moment = require('moment-timezone');
const path = require('path');

const adminConfig = JSON.parse(fs.readFileSync('admin.json', 'utf8'));
const FEEDBACK_LOG_DIR = './commands/json/feedback';
const FEEDBACK_STATUS = {
    PENDING: 'pending',
    REPLIED: 'replied',
    RESOLVED: 'resolved'
};

if (!fs.existsSync(FEEDBACK_LOG_DIR)) {
    fs.mkdirSync(FEEDBACK_LOG_DIR, { recursive: true });
}

module.exports = {
    name: "feedback",
    usedby: 0,
    dmUser: false,
    dev: "HNT",
    category: "Khác",
    nickName: ["feedback", "fb", "report"],
    info: "Gửi phản hồi đến admin",
    usages: "feedback [nội dung]\n" +
            "Ví dụ: feedback Bot bị lỗi command crypto\n" +
            "Reply tin nhắn feedback để tiếp tục phản hồi",
    onPrefix: true,
    cooldowns: 60,

    userFeedbackCount: new Map(),
    
    MAX_FEEDBACK_PER_HOUR: 3,
    
    logFeedback: function(feedbackData) {
        const logFile = path.join(FEEDBACK_LOG_DIR, `feedback_${moment().format('YYYY-MM')}.json`);
        let logs = [];
        
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        logs.push({
            ...feedbackData,
            timestamp: moment().unix()
        });
        
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    },

    checkRateLimit: function(userID) {
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);
        
        if (!this.userFeedbackCount.has(userID)) {
            this.userFeedbackCount.set(userID, []);
        }
        
        const userFeedbacks = this.userFeedbackCount.get(userID);
        const recentFeedbacks = userFeedbacks.filter(time => time > hourAgo);
        
        this.userFeedbackCount.set(userID, recentFeedbacks);
        
        return recentFeedbacks.length >= this.MAX_FEEDBACK_PER_HOUR;
    },

    formatMessage: function(type, data) {
        const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
        let message = '';

        switch (type) {
            case 'new':
                message = `━━━ 𝗡𝗘𝗪 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ━━━\n\n` +
                         `📝 Mã phản hồi: ${data.feedbackCode}\n` +
                         `👤 𝗧𝘂̛̛̀ 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗱𝘂̀𝗻𝗴: ${data.userID}\n` +
                         `💬 𝗡𝗼̣̂𝗶 𝗱𝘂𝗻𝗴: ${data.content}\n` +
                         `📎 File đính kèm: ${data.hasAttachment ? 'Có' : 'Không'}\n` +
                         `⏰ 𝗧𝗶𝗺𝗲: ${time}\n` +
                         `━━━━━━━━━━━━━━━━━━`;
                break;
            case 'reply':
                message = `━━━ 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ━━━\n\n` +
                         `📝 Mã phản hồi: ${data.feedbackCode}\n` +
                         `${data.isAdmin ? '💌 𝗣𝗵𝗮̉𝗻 𝗵𝗼̂̀𝗶 𝘁𝘂̛̛̀ 𝗔𝗱𝗺𝗶𝗻' : '👤 𝗧𝘂̛̛̀ 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗱𝘂̀𝗻𝗴'}: ${data.content}\n` +
                         `📎 File đính kèm: ${data.hasAttachment ? 'Có' : 'Không'}\n` +
                         `↪️ 𝗧𝗿𝗮̉ 𝗹𝗼̛̀𝗶 𝘁𝗶𝗻 𝗻𝗵𝗮̆́𝗻: ${data.replyTo}\n` +
                         `⏰ 𝗧𝗶𝗺𝗲: ${time}\n` +
                         `━━━━━━━━━━━━━━━━━━`;
                break;
            case 'success':
                message = `✅ Phản hồi của bạn đã được gửi thành công!\n` +
                         `📝 Mã phản hồi: ${data.feedbackCode}\n` +
                         `⏰ Time: ${time}\n` +
                         `💌 Reply tin nhắn này để tiếp tục phản hồi.`;
                break;
        }

        return message;
    },

    onReply: async function({ event, api }) {
        const { threadID, messageID, body, senderID, attachments } = event;
        
        if (!body && attachments.length === 0) return;

        const replyInfo = global.client.onReply.find(r => r.messageID === event.messageReply.messageID);
        if (!replyInfo) return;

        try {
            const isAdmin = adminConfig.adminUIDs.includes(senderID);
            const hasAttachments = attachments.length > 0;

            const replyData = {
                feedbackCode: replyInfo.feedbackCode,
                content: body,
                hasAttachment: hasAttachments,
                replyTo: replyInfo.content,
                isAdmin: isAdmin
            };

            const message = this.formatMessage('reply', replyData);

            if (isAdmin) {
                const msg = await api.sendMessage({
                    body: message,
                    attachment: attachments
                }, replyInfo.threadID);

                this.logFeedback({
                    ...replyData,
                    status: FEEDBACK_STATUS.REPLIED,
                    adminID: senderID
                });

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
            } else {
                if (this.checkRateLimit(senderID)) {
                    return api.sendMessage(
                        "⚠️ Bạn đã gửi quá nhiều phản hồi. Vui lòng thử lại sau 1 giờ.",
                        threadID,
                        messageID
                    );
                }

                const msg = await api.sendMessage({
                    body: message,
                    attachment: attachments
                }, replyInfo.adminID);

                this.userFeedbackCount.get(senderID).push(Date.now());

                api.sendMessage(
                    "✅ Đã gửi phản hồi của bạn đến admin!\n⏰ Time: " + 
                    moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY"),
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
        } catch (error) {
            console.error("Feedback Reply Error:", error);
            api.sendMessage(
                "❌ Đã xảy ra lỗi khi gửi phản hồi. Vui lòng thử lại sau.",
                threadID,
                messageID
            );
        }
    },

    onLaunch: async function ({ event, api, target }) {
        try {
            const { threadID, messageID, senderID, attachments } = event;
            const feedback = target.join(" ");
            const feedbackCode = `#${this.dev}${Date.now().toString(36)}`;

            if (!feedback && attachments.length === 0) {
                return api.sendMessage(
                    "⚠️ Vui lòng nhập nội dung hoặc gửi file đính kèm!",
                    threadID,
                    messageID
                );
            }

            if (this.checkRateLimit(senderID)) {
                return api.sendMessage(
                    "⚠️ Bạn đã gửi quá nhiều phản hồi. Vui lòng thử lại sau 1 giờ.",
                    threadID,
                    messageID
                );
            }

            const adminIDs = adminConfig.adminUIDs;
            if (!adminIDs || adminIDs.length === 0) {
                return api.sendMessage(
                    "⚠️ Không tìm thấy admin!",
                    threadID,
                    messageID
                );
            }

            const feedbackData = {
                feedbackCode,
                userID: senderID,
                content: feedback,
                hasAttachment: attachments.length > 0
            };

            const message = this.formatMessage('new', feedbackData);

            let sentSuccessfully = false;
            let successfulAdminID;

            for (const adminID of adminIDs) {
                try {
                    const msg = await api.sendMessage({
                        body: message,
                        attachment: attachments
                    }, adminID);

                    sentSuccessfully = true;
                    successfulAdminID = adminID;
                    
                    this.logFeedback({
                        ...feedbackData,
                        adminID,
                        status: FEEDBACK_STATUS.PENDING
                    });

                    if (!this.userFeedbackCount.has(senderID)) {
                        this.userFeedbackCount.set(senderID, []);
                    }
                    this.userFeedbackCount.get(senderID).push(Date.now());

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
                    console.log(`Failed to send to admin ${adminID}:`, err);
                    continue;
                }
            }

            if (!sentSuccessfully) {
                const feedbackGroupID = adminConfig.feedbackGroupID;
                
                if (feedbackGroupID) {
                    try {
                        const groupMessage = `[ADMIN FEEDBACK]\n${message}`;
                        const msg = await api.sendMessage({
                            body: groupMessage,
                            attachment: attachments
                        }, feedbackGroupID);

                        sentSuccessfully = true;
                        
                        this.logFeedback({
                            ...feedbackData,
                            groupID: feedbackGroupID,
                            status: FEEDBACK_STATUS.PENDING
                        });

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
                    }
                }
            
            }

            if (sentSuccessfully) {
                const successMessage = this.formatMessage('success', { feedbackCode });
                await api.sendMessage(successMessage, threadID, messageID);
            } else {
                throw new Error("Không thể gửi phản hồi đến bất kỳ admin nào");
            }
            
        } catch (error) {
            console.error("Feedback Error:", error);
            
            let errorMsg = "❌ Đã xảy ra lỗi khi gửi phản hồi:\n\n";
            
            if (error.error === 1545116) {
                errorMsg += "- Không thể gửi trực tiếp đến admin do hạn chế của Facebook.\n";
                errorMsg += "- Vui lòng liên hệ admin qua các phương thức khác:\n";
                errorMsg += "1. Liên hệ qua Facebook: [https://www.facebook.com/61573427362389]\n";
            } else {
                errorMsg += `- Lỗi: ${error.message}\n`;
                errorMsg += "- Vui lòng thử lại sau hoặc liên hệ admin qua phương thức khác.";
            }

            api.sendMessage(errorMsg, event.threadID, event.messageID);
        }
    }
};
