const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const adminConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "admin.json"), "utf8")
);

const PENDING_REQUESTS_FILE = path.join(__dirname, "json", "pending_notifications.json");

const jsonDir = path.join(__dirname, "json");
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
}

module.exports = {
  name: "noti",
  usedby: 0,
  onPrefix: true,
  category: "Admin Commands",
  dev: "HNT",
  info: "Gửi thông báo",
  usages: [
    "noti [nội dung] - Gửi thông báo ngay lập tức (Admin)",
    "noti INFO/WARN/ERROR [nội dung] - Gửi thông báo với mức độ",
    "noti list - Xem danh sách yêu cầu thông báo từ Support (Admin)",
    "noti list [STT] - Phê duyệt và gửi thông báo từ Support (Admin)",
    "noti reject [STT] - Từ chối yêu cầu thông báo từ Support (Admin)"
  ],
  cooldowns: 30,
  
  loadPendingRequests: function() {
    try {
      if (fs.existsSync(PENDING_REQUESTS_FILE)) {
        const data = fs.readFileSync(PENDING_REQUESTS_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error("Error loading pending requests:", err);
    }
    return [];
  },
  
  savePendingRequests: function(requests) {
    try {
      fs.writeFileSync(PENDING_REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
    } catch (err) {
      console.error("Error saving pending requests:", err);
    }
  },

  isSupport: function (uid) {
    return adminConfig.supportUIDs?.includes(uid) || false;
  },

  isAdmin: function (uid) {
    return adminConfig.adminUIDs?.includes(uid) || false;
  },

  onReply: async function ({ event, api }) {
    const { threadID, messageID, body, senderID, attachments } = event;
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    if (!body && attachments.length === 0) return;

    const replyInfo = global.client.onReply.find(
      (r) => r.messageID === event.messageReply.messageID
    );
    if (!replyInfo) return;

    if (replyInfo.type === "admin") {
      const adminID = replyInfo.adminID;

      let replyMsg = `📝 Phản hồi từ người dùng\n`;
      replyMsg += `━━━━━━━━━━━━━━━━━━\n`;
      replyMsg += `👤 Người gửi: ${senderID}\n`;
      replyMsg += `💬 Nội dung: ${body}\n`;
      replyMsg += `↩️ Phản hồi cho: ${replyInfo.content}\n`;
      replyMsg += `⏰ Thời gian: ${time}\n`;
      replyMsg += `━━━━━━━━━━━━━━━━━━`;

      const msg = await api.sendMessage(
        {
          body: replyMsg,
          attachment: attachments,
        },
        adminID
      );

      global.client.onReply.push({
        name: this.name,
        messageID: msg.messageID,
        content: body,
        threadID: threadID,
        type: "user",
        adminID: adminID,
        userID: senderID,
      });

      api.sendMessage(
        "✅ Đã gửi phản hồi của bạn đến admin",
        threadID,
        messageID
      );
    } else if (replyInfo.type === "user") {
      let replyMsg = `📊 Phản hồi từ Admin\n`;
      replyMsg += `━━━━━━━━━━━━━━━━━━\n`;
      replyMsg += `💬 Nội dung: ${body}\n`;
      replyMsg += `↩️ Trả lời cho: ${replyInfo.content}\n`;
      replyMsg += `⏰ Thời gian: ${time}\n`;
      replyMsg += `━━━━━━━━━━━━━━━━━━`;

      const msg = await api.sendMessage(
        {
          body: replyMsg,
          attachment: attachments,
        },
        replyInfo.threadID
      );

      global.client.onReply.push({
        name: this.name,
        messageID: msg.messageID,
        content: body,
        threadID: replyInfo.threadID,
        type: "admin",
        adminID: senderID,
        userID: replyInfo.userID,
      });
    }
  },

  getUserName: async function (api, uid) {
    try {
      const userInfo = await api.getUserInfo(uid);
      return userInfo[uid]?.name || uid;
    } catch (err) {
      return uid;
    }
  },
  
  sendNotificationFromRequest: async function(api, request, senderID, threadID) {
    const level = request.level;
    const content = request.content;
    const supportId = request.supportId;
    const supportName = request.supportName;
    
    const notiCode = `${level}-${Date.now().toString(36)}`;

    const levelEmoji = {
      INFO: "📢",
      WARN: "⚠️",
      ERROR: "🚨",
    };

    const levelColors = {
      INFO: "🔵",
      WARN: "🟡",
      ERROR: "🔴",
    };

    let attachments = [];
    const tmpFolderPath = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpFolderPath)) {
      fs.mkdirSync(tmpFolderPath);
    }

    if (request.attachments && request.attachments.length > 0) {
      try {
        for (const att of request.attachments) {
          const url = att.url;
          const filename = `${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}.${att.type === "photo" ? "jpg" : "mp4"}`;
          const filepath = path.join(tmpFolderPath, filename);

          const response = await axios({
            method: "GET",
            url: url,
            responseType: "stream",
          });

          await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          attachments.push(fs.createReadStream(filepath));
        }
      } catch (error) {
        console.error("Error downloading attachments:", error);
        api.sendMessage(
          "❌ Có lỗi xảy ra khi xử lý file đính kèm!",
          threadID
        );
        return false;
      }
    }

    const approverName = await this.getUserName(api, senderID);

    let messageObject = {
      body:
        `${levelEmoji[level]} THÔNG BÁO HỆ THỐNG ${levelEmoji[level]}\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `${levelColors[level]} Mức độ: ${level}\n` +
        `📝 Mã thông báo: ${notiCode}\n` +
        `${content ? `\n💬 Nội dung:\n${content}\n` : ""}` +
        `\n👤 Người gửi: ${supportName} (Support Team)\n` +
        `👑 Đã được phê duyệt bởi: ${approverName}\n` +
        `⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💌 Reply tin nhắn này để phản hồi với admin`,
      attachment: attachments,
    };

    try {
      let threads = await api.getThreadList(100, null, ["INBOX"]);
      let threadIDs = threads
        .filter((thread) => thread.isGroup)
        .map((thread) => thread.threadID);

      let successCount = 0;
      let failedThreads = [];

      const chunkSize = 10;
      const threadChunks = [];
      for (let i = 0; i < threadIDs.length; i += chunkSize) {
        threadChunks.push(threadIDs.slice(i, i + chunkSize));
      }

      for (const chunk of threadChunks) {
        for (const id of chunk) {
          let retries = 0;
          const maxRetries = 3;

          while (retries < maxRetries) {
            try {
              const msg = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error("Send message timeout"));
                }, 30000);

                api.sendMessage(messageObject, id, (err, messageInfo) => {
                  clearTimeout(timeout);
                  if (err) reject(err);
                  else resolve(messageInfo);
                });
              });

              global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                content: content || "Thông báo không có nội dung",
                threadID: id,
                type: "admin",
                adminID: supportId,
                notiCode: notiCode,
                level: level,
              });

              successCount++;
              await new Promise((resolve) => setTimeout(resolve, 5000));
              break;
            } catch (err) {
              console.error(
                `Lỗi khi gửi đến nhóm ${id}, lần thử ${retries + 1}:`,
                err.message
              );
              retries++;

              if (retries === maxRetries) {
                failedThreads.push(id);
              }

              await new Promise((resolve) => setTimeout(resolve, 10000));
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }

      attachments.forEach((attachment) => {
        try {
          if (attachment.path) {
            fs.unlinkSync(attachment.path);
          }
        } catch (err) {
          console.error("Error cleaning up file:", err);
        }
      });

      const reportMessage =
        `📊 BÁO CÁO GỬI THÔNG BÁO\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${levelColors[level]} Mức độ: ${level}\n` +
        `📝 Mã thông báo: ${notiCode}\n` +
        `✅ Đã gửi thành công: ${successCount}/${threadIDs.length} nhóm\n` +
        `❌ Gửi thất bại: ${failedThreads.length} nhóm\n` +
        `📎 Số file đính kèm: ${request.attachments ? request.attachments.length : 0}\n` +
        `⏱️ Thời gian hoàn thành: ${new Date().toLocaleString("vi-VN")}\n\n` +
        (failedThreads.length > 0
          ? `Các nhóm gửi thất bại:\n${failedThreads.join("\n")}`
          : "");

      api.sendMessage(reportMessage, threadID);
      
      api.sendMessage(
        `✅ Thông báo của bạn đã được Admin phê duyệt và gửi thành công\n` +
        `📝 Mã thông báo: ${notiCode}\n` +
        `📊 Đã gửi đến ${successCount} nhóm\n` +
        `👑 Được phê duyệt bởi: ${approverName}`,
        supportId
      );
      
      return true;
    } catch (error) {
      console.error("[ERROR]", error);
      api.sendMessage(
        `❌ Lỗi: ${error.message}\nMã thông báo: ${notiCode}`,
        threadID
      );
      return false;
    }
  },

  onLaunch: async function ({ api, event, target }) {
    const { threadID, senderID, messageID } = event;

    const isAdmin = this.isAdmin(senderID);
    const isSupport = this.isSupport(senderID);

    if (!isAdmin && !isSupport) {
      return api.sendMessage(
        "❌ Bạn không có quyền sử dụng lệnh này!",
        threadID,
        messageID
      );
    }
    
    if (target[0]?.toLowerCase() === "list" && isAdmin) {
      const pendingRequests = this.loadPendingRequests();
      
      if (!target[1]) {
        if (pendingRequests.length === 0) {
          return api.sendMessage(
            "📋 Không có yêu cầu thông báo nào đang chờ phê duyệt.",
            threadID,
            messageID
          );
        }
        
        let message = `📋 DANH SÁCH YÊU CẦU THÔNG BÁO (${pendingRequests.length})\n`;
        message += `━━━━━━━━━━━━━━━━━━\n\n`;
        
        pendingRequests.forEach((request, index) => {
          const levelEmoji = {
            INFO: "📢",
            WARN: "⚠️",
            ERROR: "🚨"
          }[request.level] || "ℹ️";
          
          message += `${index + 1}. ${levelEmoji} ${request.level}: ${request.content.substring(0, 40)}${request.content.length > 40 ? "..." : ""}\n`;
          message += `👤 Người gửi: ${request.supportName}\n`;
          message += `⏰ Thời gian: ${moment(request.timestamp).format("HH:mm DD/MM/YYYY")}\n`;
          message += `📎 File: ${request.attachments ? request.attachments.length : 0}\n`;
          message += `💡 Duyệt: noti list ${index + 1}\n`;
          message += `❌ Từ chối: noti reject ${index + 1}\n`;
          message += `━━━━━━━━━━━━━━━━━━\n\n`;
        });
        
        return api.sendMessage(message, threadID, messageID);
      }
      
      const index = parseInt(target[1]) - 1;
      if (isNaN(index) || index < 0 || index >= pendingRequests.length) {
        return api.sendMessage(
          "❌ Số thứ tự không hợp lệ! Vui lòng kiểm tra lại danh sách.",
          threadID,
          messageID
        );
      }
      
      const request = pendingRequests[index];
      
      await api.sendMessage(
        `⏳ Đang xử lý yêu cầu thông báo #${index + 1}...`,
        threadID,
        messageID
      );
      
      const success = await this.sendNotificationFromRequest(api, request, senderID, threadID);
      
      if (success) {
        pendingRequests.splice(index, 1);
        this.savePendingRequests(pendingRequests);
      }
      
      return;
    }
    
    if (target[0]?.toLowerCase() === "reject" && isAdmin) {
      const pendingRequests = this.loadPendingRequests();
      
      if (pendingRequests.length === 0) {
        return api.sendMessage(
          "📋 Không có yêu cầu thông báo nào đang chờ phê duyệt.",
          threadID,
          messageID
        );
      }
      
      const index = parseInt(target[1]) - 1;
      if (isNaN(index) || index < 0 || index >= pendingRequests.length) {
        return api.sendMessage(
          "❌ Số thứ tự không hợp lệ! Vui lòng kiểm tra lại danh sách.",
          threadID,
          messageID
        );
      }
      
      const request = pendingRequests[index];
      const approverName = await this.getUserName(api, senderID);
      
      api.sendMessage(
        `❌ Yêu cầu gửi thông báo đã bị từ chối\n` + 
        `👤 Được từ chối bởi: ${approverName}\n` +
        `⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}`,
        request.supportId
      );
      
      pendingRequests.splice(index, 1);
      this.savePendingRequests(pendingRequests);
      
      return api.sendMessage(
        `✅ Đã từ chối yêu cầu thông báo #${index + 1}`,
        threadID,
        messageID
      );
    }

    if (isSupport && !isAdmin) {
      try {
        const validLevels = ["INFO", "WARN"];
        let level = "INFO";
        let content = target.join(" ");

        if (target[0] && validLevels.includes(target[0].toUpperCase())) {
          level = target[0].toUpperCase();
          content = target.slice(1).join(" ");
        }

        if (!validLevels.includes(level)) {
          return api.sendMessage(
            "❌ Support Team chỉ có thể gửi thông báo mức INFO hoặc WARN!",
            threadID,
            messageID
          );
        }

        if (
          !content &&
          (!event.messageReply ||
            !event.messageReply.attachments ||
            event.messageReply.attachments.length === 0)
        ) {
          return api.sendMessage(
            "⚠️ Vui lòng nhập nội dung hoặc reply một tin nhắn có ảnh/video để thông báo!",
            threadID,
            messageID
          );
        }

        const requestId = `NOTI_${Date.now().toString(36)}`;
        const supportName = await this.getUserName(api, senderID);
        
        const request = {
          requestId,
          supportId: senderID,
          supportName: supportName,
          level,
          content,
          attachments: event.messageReply?.attachments || [],
          timestamp: Date.now(),
        };
        
        const pendingRequests = this.loadPendingRequests();
        pendingRequests.push(request);
        this.savePendingRequests(pendingRequests);
        
        return api.sendMessage(
          `✅ Đã gửi yêu cầu thông báo vào danh sách chờ duyệt\n` +
          `📝 Mã yêu cầu: ${requestId}\n` +
          `⚠️ Mức độ: ${level}\n` +
          `⏳ Admin sẽ xem xét và phê duyệt sớm nhất!`,
          threadID,
          messageID
        );
      } catch (error) {
        console.error(`Error in noti request process:`, error);
        return api.sendMessage(
          `❌ Lỗi khi xử lý yêu cầu thông báo\n` +
          `- Vui lòng thử lại sau\n` +
          `- Nếu lỗi tiếp tục, hãy liên hệ admin qua Messenger`,
          threadID,
          messageID
        );
      }
    }
    
    const validLevels = ["INFO", "WARN", "ERROR"];
    let level = "INFO";
    let content = target.join(" ");

    if (validLevels.includes(target[0]?.toUpperCase())) {
      level = target[0].toUpperCase();
      content = target.slice(1).join(" ");
    }

    const notiCode = `${level}-${Date.now().toString(36)}`;

    const levelEmoji = {
      INFO: "📢",
      WARN: "⚠️",
      ERROR: "🚨",
    };

    const levelColors = {
      INFO: "🔵",
      WARN: "🟡",
      ERROR: "🔴",
    };

    let attachments = [];

    const tmpFolderPath = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpFolderPath)) {
      fs.mkdirSync(tmpFolderPath);
    }

    if (event.messageReply && event.messageReply.attachments) {
      try {
        for (const att of event.messageReply.attachments) {
          const url = att.url;
          const filename = `${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}.${att.type === "photo" ? "jpg" : "mp4"}`;
          const filepath = path.join(tmpFolderPath, filename);

          const response = await axios({
            method: "GET",
            url: url,
            responseType: "stream",
          });

          await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          attachments.push(fs.createReadStream(filepath));
        }
      } catch (error) {
        console.error("Error downloading attachments:", error);
        return api.sendMessage(
          "❌ Có lỗi xảy ra khi xử lý file đính kèm!",
          event.threadID
        );
      }
    }
    
    if (!content && attachments.length === 0) {
      return api.sendMessage(
        "⚠️ Vui lòng nhập nội dung hoặc reply một tin nhắn có ảnh/video để thông báo!",
        event.threadID
      );
    }

    let senderName = "Admin";
    try {
      let senderInfo = await api.getUserInfo(event.senderID);
      if (senderInfo && senderInfo[event.senderID]) {
        senderName = senderInfo[event.senderID].name;
      }
    } catch (error) {
      console.log(`Failed to get sender name: ${error}`);
    }

    let messageObject = {
      body:
        `${levelEmoji[level]} THÔNG BÁO HỆ THỐNG ${levelEmoji[level]}\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `${levelColors[level]} Mức độ: ${level}\n` +
        `📝 Mã thông báo: ${notiCode}\n` +
        `${content ? `\n💬 Nội dung:\n${content}\n` : ""}` +
        `\n👤 Người gửi: ${senderName}\n` +
        `⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💌 Reply tin nhắn này để phản hồi với admin`,
      attachment: attachments,
    };

    try {
      let threads = await api.getThreadList(100, null, ["INBOX"]);
      let threadIDs = threads
        .filter((thread) => thread.isGroup)
        .map((thread) => thread.threadID);

      let successCount = 0;
      let failedThreads = [];

      const chunkSize = 10;
      const threadChunks = [];
      for (let i = 0; i < threadIDs.length; i += chunkSize) {
        threadChunks.push(threadIDs.slice(i, i + chunkSize));
      }

      for (const chunk of threadChunks) {
        for (const id of chunk) {
          let retries = 0;
          const maxRetries = 3;

          while (retries < maxRetries) {
            try {
              const msg = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error("Send message timeout"));
                }, 30000);

                api.sendMessage(messageObject, id, (err, messageInfo) => {
                  clearTimeout(timeout);
                  if (err) reject(err);
                  else resolve(messageInfo);
                });
              });

              global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                content: content || "Thông báo không có nội dung",
                threadID: id,
                type: "admin",
                adminID: event.senderID,
                notiCode: notiCode,
                level: level,
              });

              successCount++;

              await new Promise((resolve) => setTimeout(resolve, 5000));
              break;
            } catch (err) {
              console.error(
                `Lỗi khi gửi đến nhóm ${id}, lần thử ${retries + 1}:`,
                err.message
              );
              retries++;

              if (retries === maxRetries) {
                failedThreads.push(id);
              }

              await new Promise((resolve) => setTimeout(resolve, 10000));
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 15000));
      }

      attachments.forEach((attachment) => {
        try {
          if (attachment.path) {
            fs.unlinkSync(attachment.path);
          }
        } catch (err) {
          console.error("Error cleaning up file:", err);
        }
      });

      api.sendMessage(
        `📊 BÁO CÁO GỬI THÔNG BÁO\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `${levelColors[level]} Mức độ: ${level}\n` +
          `📝 Mã thông báo: ${notiCode}\n` +
          `✅ Đã gửi thành công: ${successCount}/${threadIDs.length} nhóm\n` +
          `❌ Gửi thất bại: ${failedThreads.length} nhóm\n` +
          `📎 Số file đính kèm: ${attachments.length}\n` +
          `⏱️ Thời gian hoàn thành: ${new Date().toLocaleString("vi-VN")}\n\n` +
          (failedThreads.length > 0
            ? `Các nhóm gửi thất bại:\n${failedThreads.join("\n")}`
            : ""),
        event.threadID
      );
    } catch (error) {
      console.error("[ERROR]", error);
      api.sendMessage(
        `❌ Lỗi: ${error.message}\nMã thông báo: ${notiCode}`,
        event.threadID
      );
    }
  },
};