const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "noti",
  usedby: 2,
  onPrefix: true,
  dev: "HNT",
  info: "Tin nhắn từ Admin",
  cooldowns: 30,
  onLaunch: async function ({ api, event, target }) {
    const content = target.join(" ");
    let attachments = [];
    
    const tmpFolderPath = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpFolderPath)) {
      fs.mkdirSync(tmpFolderPath);
    }

    if (event.messageReply && event.messageReply.attachments) {
      try {
        for (const att of event.messageReply.attachments) {
          const url = att.url;
          const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${att.type === 'photo' ? 'jpg' : 'mp4'}`;
          const filepath = path.join(tmpFolderPath, filename);
          
          const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
          });

          await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          attachments.push(fs.createReadStream(filepath));
        }
      } catch (error) {
        console.error("Error downloading attachments:", error);
        return api.sendMessage("❌ Có lỗi xảy ra khi xử lý file đính kèm!", event.threadID);
      }
    }

    if (!content && attachments.length === 0) {
      return api.sendMessage("⚠️ Vui lòng nhập nội dung hoặc reply một tin nhắn có ảnh/video để thông báo!", event.threadID);
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
      body: `📢 THÔNG BÁO QUAN TRỌNG 📢\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `${content || ""}${content ? "\n\n" : ""}` +
        `👤 Người gửi: ${senderName}\n` +
        `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💌 Hãy phản hồi nếu bạn có thắc mắc`,
      attachment: attachments
    };

    try {
      let threads = await api.getThreadList(100, null, ['INBOX']); 
      let threadIDs = threads
        .filter(thread => thread.isGroup)
        .map(thread => thread.threadID);

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
           
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Send message timeout'));
                }, 30000); 

                api.sendMessage(messageObject, id, (err) => {
                  clearTimeout(timeout);
                  if (err) reject(err);
                  else resolve();
                });
              });
              
              successCount++;
              
              await new Promise(resolve => setTimeout(resolve, 5000));
              break;
              
            } catch (err) {
              console.error(`Lỗi khi gửi đến nhóm ${id}, lần thử ${retries + 1}:`, err.message);
              retries++;
              
              if (retries === maxRetries) {
                failedThreads.push(id);
              }
              
              await new Promise(resolve => setTimeout(resolve, 10000));
            }
          }
        }
    
        await new Promise(resolve => setTimeout(resolve, 15000));
      }

      attachments.forEach(attachment => {
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
        `✅ Đã gửi thành công: ${successCount}/${threadIDs.length} nhóm\n` +
        `❌ Gửi thất bại: ${failedThreads.length} nhóm\n` +
        `📎 Số file đính kèm: ${attachments.length}\n` +
        `⏱️ Thời gian hoàn thành: ${new Date().toLocaleString('vi-VN')}\n\n` +
        (failedThreads.length > 0 ? `Các nhóm gửi thất bại:\n${failedThreads.join('\n')}` : ''),
        event.threadID
      );
    } catch (error) {
      console.error('[ERROR]', error);
      api.sendMessage('❌ Đã xảy ra lỗi khi gửi thông báo.', event.threadID);
    }
  }
};
