const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { createReadStream, unlinkSync } = require('fs');
const { verifyThreadAdmins } = require('../utils/logsub');

module.exports = {
  name: "admin",
  category: "Admin Commands",
  info: "Quản lý bot",
  dev: "Merged by HNT",
  usedby: 2,
  cooldowns: 10,
  usages: "[subcommand]",
  onPrefix: true,

  onLaunch: async function ({ api, event, target }) {
    const subcommand = target[0]?.toLowerCase();
    const threadID = event.threadID;
    const messageID = event.messageID;

    // --- Subcommand Handlers ---
    const handleOut = () => {
      if (!target[1]) {
        return api.removeUserFromGroup(api.getCurrentUserID(), threadID);
      }
      if (!isNaN(target[1])) {
        return api.removeUserFromGroup(api.getCurrentUserID(), target.slice(1).join(" "));
      }
    };

    const handleShutdown = async () => {
      const confirmationMessage = `❓ Xác nhận tắt bot\n${global.line}\nPhản hồi tin nhắn này (👍) để xác nhận tắt bot hoặc phản hồi (👎) để hủy bỏ.`;
      const sentMessage = await api.sendMessage(confirmationMessage, threadID);
      global.client.callReact.push({ messageID: sentMessage.messageID, name: this.name, action: "shutdown" });
    };

    const handleRestart = () => {
      api.sendMessage("🔃 Đang khởi động lại\n━━━━━━━━━━━━━━━━━━\nBot đang khởi động lại...", threadID, (err) => {
        if (err) {
          console.error("Gửi tin nhắn khởi động lại thất bại:", err);
        } else {
          process.exit(1);
        }
      });
    };

    const handleSetAvatar = async () => {
      const tempPath = path.join(__dirname, "cache", `avatar_${Date.now()}.png`);
      let loadingMessage;
      try {
        loadingMessage = await api.sendMessage("⏳ Đang xử lý hình ảnh...", threadID);
        let imageUrl, caption = "";
        if (target.length > 1) {
          if (target[1].match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g)) {
            imageUrl = target[1];
            caption = target.slice(2).join(" ");
          } else {
            caption = target.slice(1).join(" ");
          }
        }

        if (event.messageReply && event.messageReply.attachments[0]) {
          const attachment = event.messageReply.attachments[0];
          if (!['photo', 'animated_image'].includes(attachment.type)) {
            api.unsendMessage(loadingMessage.messageID);
            return api.sendMessage("❌ Vui lòng chỉ dùng hình ảnh hoặc GIF!", threadID, messageID);
          }
          imageUrl = attachment.url;
        } else if (!imageUrl) {
          api.unsendMessage(loadingMessage.messageID);
          return api.sendMessage(
            "📝 Hướng dẫn sử dụng setavatar:\n\n" +
            "1. Reply ảnh + admin setavt [caption]\n" +
            "2. admin setavt [link ảnh] [caption]\n\n" +
            "💡 Caption là tùy chọn, có thể để trống",
            threadID, messageID
          );
        }

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        if (imageBuffer.length > 10 * 1024 * 1024) {
          api.unsendMessage(loadingMessage.messageID);
          return api.sendMessage("❌ Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB", threadID, messageID);
        }

        fs.writeFileSync(tempPath, imageBuffer);

        await api.sendMessage("⌛ Đang cập nhật avatar...", threadID, loadingMessage.messageID);

        await api.changeAvatar(createReadStream(tempPath), caption);

        api.unsendMessage(loadingMessage.messageID);
        api.sendMessage({
          body: `✅ Đã thay đổi avatar bot thành công!\n${caption ? `📝 Caption: ${caption}` : ""}`,
          attachment: createReadStream(tempPath)
        }, threadID, messageID);

      } catch (error) {
        console.error('Set Avatar Error:', error);
        if (loadingMessage) api.unsendMessage(loadingMessage.messageID);
        api.sendMessage(
          "❌ Lỗi khi thay đổi avatar bot:\n" +
          `${error.message || "Vui lòng thử lại sau"}`,
          threadID, messageID
        );
      } finally {
        if (fs.existsSync(tempPath)) {
          unlinkSync(tempPath);
        }
      }
    };

    const handleFile = () => {
      const fileCommand = require('./file');
      return fileCommand.onLaunch({ api, event, target: target.slice(1) });
    };

    const handleListThreads = async () => {
      try {
        const threads = await api.getThreadList(100, null, ['INBOX']);
        let msg = "📜 DANH SÁCH NHÓM BOT ĐANG THAM GIA 📜\n━━━━━━━━━━━━━━━━━━\n";
        let count = 1;
        for (const thread of threads) {
          if (thread.isGroup) {
            msg += `${count++}. ${thread.name || 'Không tên'} - ID: ${thread.threadID}\n`;
          }
        }
        api.sendMessage(msg, threadID, messageID);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhóm:", error);
        api.sendMessage("❌ Đã xảy ra lỗi khi lấy danh sách nhóm.", threadID, messageID);
      }
    };

    const handleSend = async () => {
      const targetThreadID = target[1];
      const messageToSend = target.slice(2).join(" ");

      if (!targetThreadID || isNaN(targetThreadID) || !messageToSend) {
        return api.sendMessage("❌ Sai cú pháp. Sử dụng: admin send [threadID] [nội dung tin nhắn]", threadID, messageID);
      }

      try {
        await api.sendMessage(messageToSend, targetThreadID);
        api.sendMessage(`✅ Đã gửi tin nhắn đến nhóm ${targetThreadID} thành công.`, threadID, messageID);
      } catch (error) {
        console.error(`Lỗi khi gửi tin nhắn đến nhóm ${targetThreadID}:`, error);
        api.sendMessage(`❌ Không thể gửi tin nhắn đến nhóm ${targetThreadID}. Lỗi: ${error.message}`, threadID, messageID);
      }
    };

    const handleCheckAdmin = async () => {
      const targetThreadID = target[0] || threadID;
      
      try {
        const result = await verifyThreadAdmins(api, targetThreadID);
        let message;
        
        if (result.success) {
          message = `✅ Kết quả kiểm tra admin nhóm ${targetThreadID}:\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `- Trạng thái: Thành công\n` +
            `- Số lượng admin: ${result.adminCount}\n` +
            `- Thời gian kiểm tra: ${new Date().toLocaleString('vi-VN')}`;
        } else {
          message = `⚠️ Kết quả kiểm tra admin nhóm ${targetThreadID}:\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `- Trạng thái: Thất bại\n` +
            `- Lý do: ${result.message}\n` +
            `- Thời gian kiểm tra: ${new Date().toLocaleString('vi-VN')}`;
        }
        
        api.sendMessage(message, threadID, messageID);
      } catch (error) {
        console.error("Check admin error:", error);
        api.sendMessage("❌ Đã xảy ra lỗi khi kiểm tra admin nhóm.", threadID, messageID);
      }
    };

    const handleSetAdmin = async () => {
      if (target.length < 3) {
        return api.sendMessage(
          "❌ Sai cú pháp. Sử dụng: admin setadmin [threadID] add/remove [UID1] [UID2]...", 
          threadID, 
          messageID
        );
      }
      
      const targetThreadID = target[0];
      const action = target[1].toLowerCase();
      const userIDs = target.slice(2);
      
      if (!targetThreadID || isNaN(targetThreadID)) {
        return api.sendMessage("❌ ThreadID không hợp lệ!", threadID, messageID);
      }
      
      if (action !== "add" && action !== "remove") {
        return api.sendMessage("❌ Hành động không hợp lệ. Chỉ chấp nhận 'add' hoặc 'remove'.", threadID, messageID);
      }
      
      if (userIDs.length === 0 || userIDs.some(id => isNaN(id))) {
        return api.sendMessage("❌ Danh sách UID không hợp lệ. Vui lòng cung cấp các UID hợp lệ.", threadID, messageID);
      }
      
      try {
        const threadsDBPath = path.join(__dirname, '../database/threads.json');
        const threadsDB = JSON.parse(fs.readFileSync(threadsDBPath, 'utf8') || '{}');
        
        if (!threadsDB[targetThreadID]) {
          threadsDB[targetThreadID] = {
            members: [],
            messageCount: {},
            lastActivity: Date.now(),
            adminIDs: [],
            adminLastUpdate: Date.now(),
            adminVerified: true  // Mark as manually verified
          };
        }
        
        // Initialize adminIDs if it doesn't exist
        if (!threadsDB[targetThreadID].adminIDs) {
          threadsDB[targetThreadID].adminIDs = [];
        }
        
        // Get current adminIDs, ensuring they're in the correct format
        let currentAdmins = threadsDB[targetThreadID].adminIDs.map(admin => 
          typeof admin === 'object' ? admin : { id: admin }
        );
        
        let updatedCount = 0;
        
        if (action === "add") {
          for (const uid of userIDs) {
            const exists = currentAdmins.some(admin => 
              (admin.id === uid || admin === uid)
            );
            
            if (!exists) {
              currentAdmins.push({ id: uid });
              updatedCount++;
            }
          }
          
          if (updatedCount === 0) {
            return api.sendMessage("⚠️ Tất cả người dùng đã là admin trong nhóm này rồi.", threadID, messageID);
          }
        } else { // remove
          const initialLength = currentAdmins.length;
          currentAdmins = currentAdmins.filter(admin => 
            !userIDs.includes(admin.id) && !userIDs.includes(admin)
          );
          
          updatedCount = initialLength - currentAdmins.length;
          
          if (updatedCount === 0) {
            return api.sendMessage("⚠️ Không tìm thấy admin nào cần gỡ trong danh sách.", threadID, messageID);
          }
        }
        
        // Update adminIDs in the database
        threadsDB[targetThreadID].adminIDs = currentAdmins;
        threadsDB[targetThreadID].adminLastUpdate = Date.now();
        
        fs.writeFileSync(threadsDBPath, JSON.stringify(threadsDB, null, 2));
        
        return api.sendMessage(
          `✅ Đã ${action === "add" ? "thêm" : "gỡ"} ${updatedCount} quản trị viên ${action === "add" ? "vào" : "khỏi"} nhóm ${targetThreadID} thành công.\n` +
          `Tổng số quản trị viên hiện tại: ${currentAdmins.length}`,
          threadID,
          messageID
        );
        
      } catch (error) {
        console.error("SetAdmin error:", error);
        return api.sendMessage(
          `❌ Đã xảy ra lỗi khi ${action === "add" ? "thêm" : "gỡ"} quản trị viên: ${error.message}`, 
          threadID, 
          messageID
        );
      }
    };

    const showHelp = () => {
      api.sendMessage(
        "📝 HƯỚNG DẪN SỬ DỤNG LỆNH ADMIN 📝\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "🔸 admin out: Rời khỏi nhóm chat hiện tại\n" +
        "🔸 admin out [threadID]: Rời khỏi nhóm chat cụ thể\n\n" +
        "🔸 admin shutdown: Tắt bot với xác nhận\n\n" +
        "🔸 admin restart: Khởi động lại bot\n\n" +
        "🔸 admin setavt: Thay đổi avatar bot\n" +
        "   ➤ Reply ảnh + admin setavt [caption]\n" +
        "   ➤ admin setavt [link ảnh] [caption]\n\n" +
        "🔸 admin file: Quản lý tệp tin hệ thống\n\n" +
        "🔸 admin listthreads: Liệt kê các nhóm bot đang tham gia\n\n" +
        "🔸 admin send [threadID] [message]: Gửi tin nhắn tới nhóm cụ thể\n\n" +
        "🔸 admin checkadmin [threadID]: Kiểm tra và cập nhật admin nhóm\n\n" +
        "🔸 admin setadmin [threadID] add [UID1] [UID2]...: Thêm quản trị viên thủ công\n" +
        "🔸 admin setadmin [threadID] remove [UID1] [UID2]...: Gỡ bỏ quản trị viên thủ công",
        threadID, messageID
      );
    };

    // --- Main Switch --- 
    switch (subcommand) {
      case "out": handleOut(); break;
      case "shutdown": await handleShutdown(); break;
      case "restart": handleRestart(); break;
      case "setavt":
      case "setavatar": // Alias
        await handleSetAvatar(); 
        break;
      case "file": handleFile(); break;
      case "listthreads":
      case "ls": // Alias
        await handleListThreads(); 
        break;
      case "send": await handleSend(); break;
      case "checkadmin": await handleCheckAdmin(); break;
      case "setadmin": await handleSetAdmin(); break;
      default: showHelp();
    }
  },

  callReact: async function ({ reaction, event, api }) {
    const { threadID } = event;

    if (reaction === '👍' && global.client.callReact.find(r => r.action === "shutdown")) {
      await api.sendMessage("📴 Đang tắt bot\n━━━━━━━━━━━━━━━━━━\nBot sẽ tắt trong giây lát...", threadID);
      console.log("Bot đang được tắt theo yêu cầu...");
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } else if (reaction === '👎') {
      api.sendMessage("❌ Tắt bot đã bị hủy", threadID);
    }
  }
};
