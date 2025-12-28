const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const adminConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../admin.json"), "utf8")
);

module.exports = {
  name: "noti",
  usedby: 0,
  onPrefix: true,
  category: "Admin Commands",
  dev: "HNT",
  info: "Gửi thông báo",
  usages: [
    "noti [nội dung] - Gửi thông báo ngay lập tức (Admin)",
  ],
  cooldowns: 30,

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

  onLaunch: async function ({ api, event, target }) {
    const { threadID, senderID, messageID } = event;

    if (!this.isAdmin(senderID)) {
      return api.sendMessage(
        "❌ Bạn không có quyền sử dụng lệnh này!",
        threadID,
        messageID
      );
    }

    const content = target.join(" ");

    const notiCode = `NOTI-${Date.now().toString(36)}`;

    let attachments = [];

    const tmpFolderPath = path.join(__dirname, "../database/cache");
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
        `${content ? `${content}\n\n` : ""}` +
        `👤 Người gửi: Admin\n` +
        `💌 Reply tin nhắn này để phản hồi lại`,
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
