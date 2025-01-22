const fs = require('fs');
const path = require('path');

module.exports = {
  name: "thread",
  info: "Thông báo khi nhóm thay đổi chủ đề, emoji, tên, admin hoặc ảnh", 
  pro: "HNT",

  userCache: new Map(),
  lastApiCall: 0,
  API_COOLDOWN: 2000, 

  nameCache: {},
  nameCachePath: path.join(__dirname, '../database/json/usernames.json'),

  initNameCache: function() {
    try {
      if (fs.existsSync(this.nameCachePath)) {
        this.nameCache = JSON.parse(fs.readFileSync(this.nameCachePath));
      } else {
        if (!fs.existsSync(path.dirname(this.nameCachePath))) {
          fs.mkdirSync(path.dirname(this.nameCachePath), { recursive: true });
        }
        fs.writeFileSync(this.nameCachePath, JSON.stringify({}));
      }
    } catch (err) {
      console.error('Name cache init error:', err);
    }
  },

  saveName: function(userID, name) {
    try {
      this.nameCache[userID] = {
        name: name,
        timestamp: Date.now()
      };
      fs.writeFileSync(this.nameCachePath, JSON.stringify(this.nameCache, null, 2));
    } catch (err) {
      console.error('Name cache save error:', err);
    }
  },

  getUserInfo: async function(api, userID, threadID) {  
    if (!this.nameCache) this.initNameCache();

    if (this.nameCache[userID]) {
      const cached = this.nameCache[userID];
     
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return {[userID]: {name: cached.name}};
      }
    }

    const now = Date.now();
    if (now - this.lastApiCall < this.API_COOLDOWN) {
      await new Promise(resolve => setTimeout(resolve, this.API_COOLDOWN));
    }
    
    try {
      const info = await api.getUserInfo(userID);
      this.lastApiCall = Date.now();
      if (info[userID]?.name) {
        this.saveName(userID, info[userID].name);
        return info;
      }
      throw new Error('No name in response');
    } catch (err) {
      console.log(`Failed to get info for ${userID}:`, err);
      
      if (threadID) {  
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          const participant = threadInfo.userInfo?.find(user => user.id === userID);
          if (participant?.name) {
            this.saveName(userID, participant.name);
            return {[userID]: {name: participant.name}};
          }
        } catch (e) {
          console.error('Fallback name fetch failed:', e);
        }
      }

      if (this.nameCache[userID]) {
        return {[userID]: {name: this.nameCache[userID].name}};
      }

      const fallbackName = `Người dùng Facebook (${userID})`;
      this.saveName(userID, fallbackName);
      return {[userID]: {name: fallbackName}};
    }
  },

  async tryChangeColor(api, color, threadID) {
    return new Promise((resolve, reject) => {
        api.changeThreadColor(color, threadID, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
  },

  onEvents: async function({ api, event, Threads }) {
    const { threadID, author, logMessageType, logMessageData } = event;

    if (event.type === "message") {
      const antispamPath = path.join(__dirname, '../commands/json/antispam.json');
      if (!fs.existsSync(antispamPath)) return;
      
      let antispamData = JSON.parse(fs.readFileSync(antispamPath));
      if (!antispamData.threads?.[threadID]) return;

      const now = Date.now();
      const SPAM_WINDOW = 5000;
      const SPAM_LIMIT = 15; 
      
      if (!antispamData.spamData[threadID]) {
          antispamData.spamData[threadID] = {};
      }
      
      if (!antispamData.spamData[threadID][event.senderID]) {
          antispamData.spamData[threadID][event.senderID] = {
              messages: [{
                  timestamp: now
              }],
              warnings: 0
          };
      } else {

          antispamData.spamData[threadID][event.senderID].messages.push({
              timestamp: now
          });

          const recentMessages = antispamData.spamData[threadID][event.senderID].messages
              .filter(msg => now - msg.timestamp < SPAM_WINDOW);

          antispamData.spamData[threadID][event.senderID].messages = recentMessages;

          if (recentMessages.length >= SPAM_LIMIT) {
              try {
                  await api.removeUserFromGroup(event.senderID, threadID);
                  api.sendMessage(
                      `🚫 Đã kick ${event.senderName || "thành viên"} vì spam!\n` +
                      `⚡ Lý do: ${SPAM_LIMIT} tin nhắn trong ${SPAM_WINDOW/1000} giây`,
                      threadID
                  );
                  delete antispamData.spamData[threadID][event.senderID];
              } catch (error) {
                  console.error("Anti-spam kick error:", error);
                  api.sendMessage(
                      "❌ Không thể kick thành viên spam. Bot cần quyền quản trị viên!",
                      threadID
                  );
              }
          }
      }

      fs.writeFileSync(antispamPath, JSON.stringify(antispamData, null, 4));
    }

    if (event.type === "message" && event.mentions) {
      const antitagPath = path.join(__dirname, '../commands/json/antitag.json');
      if (!fs.existsSync(antitagPath)) return;
      
      let antitagData = JSON.parse(fs.readFileSync(antitagPath));
      if (!antitagData.threads?.[threadID]) return;

      const mentionsCount = Object.keys(event.mentions).length;
      if (mentionsCount === 0) return;

      const now = Date.now();
      const HOURS_24 = 24 * 60 * 60 * 0;
      
      if (!antitagData.tagData[threadID]) {
          antitagData.tagData[threadID] = {};
      }
      
      if (!antitagData.tagData[threadID][event.senderID]) {
          antitagData.tagData[threadID][event.senderID] = {
              count: 0,
              lastReset: now
          };
      }

      let userData = antitagData.tagData[threadID][event.senderID];
      
      if (now - userData.lastReset >= HOURS_24) {
          userData.count = 0;
          userData.lastReset = now;
      }

      userData.count += mentionsCount;

      if (userData.count === 2) {
          api.sendMessage(
              `⚠️ Cảnh báo ${event.senderName || "Thành viên"}: \n` +
              `Bạn đã tag 2/3 lần cho phép trong 24h.\n` +
              `Lần cuối sẽ bị kick khỏi nhóm!`,
              threadID
          );
      }
      
      if (userData.count >= 3) {
          try {
              await api.removeUserFromGroup(event.senderID, threadID);
              api.sendMessage(
                  `🚫 Đã kick ${event.senderName || "thành viên"} vì tag spam quá giới hạn!\n` +
                  `👉 3 lần/24h`,
                  threadID
              );
              delete antitagData.tagData[threadID][event.senderID];
          } catch (error) {
              console.error("Anti-tag kick error:", error);
              api.sendMessage(
                  "❌ Không thể kick thành viên. Bot cần quyền quản trị viên!",
                  threadID
              );
          }
      }

      fs.writeFileSync(antitagPath, JSON.stringify(antitagData, null, 4));
    }

    if (logMessageType === "log:unsubscribe") {
      const antioutPath = path.join(__dirname, '../commands/json/antiout.json');
      if (!fs.existsSync(antioutPath)) return;
      
      const antioutData = JSON.parse(fs.readFileSync(antioutPath));
      if (!antioutData[threadID]) return;

      const leftParticipantFbId = event.logMessageData.leftParticipantFbId || 
                                 event.logMessageData.participantFbId;
      
      try {
          if (leftParticipantFbId == api.getCurrentUserID()) return;
          
          const isKicked = event.author !== leftParticipantFbId;
          if (isKicked) return;

          const userName = event.logMessageData.leftParticipantFbId_name || 
                          event.logMessageData.name ||
                          "Thành viên";
          
          await new Promise(resolve => setTimeout(resolve, 2000));

          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
              try {
                  await api.addUserToGroup(leftParticipantFbId, threadID);
                  
                  await api.sendMessage(
                      `🔒 Đã thêm ${userName} trở lại nhóm!\n⚠️ Nhóm đang bật chế độ chống rời nhóm.`,
                      threadID
                  );
                  return;
              } catch (addError) {
                  retryCount++;
                  if (retryCount < maxRetries) {
                      await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                      continue;
                  }
                  throw addError;
              }
          }
      } catch (error) {
          console.error("Anti-out error:", error);
          let errorMsg = "⚠️ Không thể thêm lại thành viên vào nhóm. ";
          
          if (error.error === 6) {
              errorMsg += "Người dùng đã chặn bot.";
          } else if (error.error === 3252001) {
              errorMsg += "Bot đang bị Facebook hạn chế tính năng.";
          } else {
              errorMsg += "Có thể bot không phải là quản trị viên.";
          }

          api.sendMessage(errorMsg, threadID);
      }
      return;
    }

    if (logMessageType === "log:subscribe") {
      const antimemPath = path.join(__dirname, '../commands/json/antijoin.json');
      if (!fs.existsSync(antimemPath)) return;
      
      const antimemData = JSON.parse(fs.readFileSync(antimemPath));
      if (!antimemData[threadID]) return;

      const addedParticipants = event.logMessageData.addedParticipants;
      if (!addedParticipants || !addedParticipants.length) return;

      try {
          const authorInfo = await this.getUserInfo(api, author, threadID);
          const authorName = authorInfo[author]?.name || "Người dùng Facebook";

          for (const user of addedParticipants) {
              if (user.userFbId === api.getCurrentUserID()) continue;
              
              await api.removeUserFromGroup(user.userFbId, threadID);
          }

          api.sendMessage(
              `⚠️ ${authorName} đã cố gắng thêm thành viên mới!\n` +
              `🚫 Đã kick các thành viên mới do nhóm đang bật chế độ chống thêm thành viên.`,
              threadID
          );
      } catch (error) {
          console.error("Anti-member error:", error);
          api.sendMessage(
              "❌ Không thể kick thành viên mới. Có thể bot không phải là quản trị viên.",
              threadID
          );
      }
      return;
    }

    const getAuthorName = async () => {
      const info = await this.getUserInfo(api, author, threadID);
      return info[author]?.name || "Người dùng Facebook";
    };

    if (logMessageType === "log:thread-image") {
      try {
        const authorName = await getAuthorName();
        
        let msg = `👥 THAY ĐỔI ẢNH NHÓM\n` +
                 `━━━━━━━━━━━━━━━━━━\n\n` +
                 `👤 Người thay đổi: ${authorName}\n` +
                 `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;
        
        api.sendMessage(msg, threadID);
        
      } catch (error) {
        console.error('Thread Image Update Error:', error);
        api.sendMessage("❌ Có lỗi xảy ra khi cập nhật ảnh nhóm", threadID);
      }
      return;
    }

    if (logMessageType === "log:thread-admins") {
      try {
        const antirolePath = path.join(__dirname, '../commands/json/antirole.json');
        if (fs.existsSync(antirolePath)) {
          const antiroleData = JSON.parse(fs.readFileSync(antirolePath));
          
          if (antiroleData.threads?.[threadID]) {
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            const isAdminBot = adminConfig.adminUIDs.includes(author);
            const isBotAction = author === api.getCurrentUserID();

            if (isBotAction) return;

            if (!isAdminBot) {
              const targetID = logMessageData.TARGET_ID;
              const isAddAdmin = logMessageData.ADMIN_EVENT === "add_admin";
              
              setTimeout(async () => {
                try {
                  antiroleData.lastBotAction = {
                    threadID,
                    targetID,
                    timestamp: Date.now()
                  };
                  fs.writeFileSync(antirolePath, JSON.stringify(antiroleData, null, 4));

                  if (isAddAdmin) {
                    await api.changeAdminStatus(threadID, targetID, false);
                  } else {
                    await api.changeAdminStatus(threadID, targetID, true);
                  }

                  const authorInfo = await this.getUserInfo(api, author, threadID);
                  const authorName = authorInfo[author]?.name || "Người dùng Facebook";
                  const targetInfo = await this.getUserInfo(api, targetID, threadID);
                  const targetName = targetInfo[targetID]?.name || "Người dùng Facebook";

                  api.sendMessage(
                    `⚠️ ${authorName} đã cố gắng ${isAddAdmin ? "thêm" : "gỡ"} quản trị viên!\n` +
                    `🔄 Đã hoàn tác quyền quản trị của ${targetName}\n` +
                    `💡 Chỉ admin bot mới có thể thay đổi quyền quản trị.`,
                    threadID
                  );
                } catch (error) {
                  console.error("Role restore error:", error);
                  api.sendMessage(
                    "❌ Không thể hoàn tác thay đổi quyền quản trị. Bot cần là quản trị viên!",
                    threadID
                  );
                }
              }, 1000);

              return;
            }
          }
        }

        const authorName = await getAuthorName();
        const targetID = logMessageData.TARGET_ID;
   
        const targetInfo = await this.getUserInfo(api, targetID, threadID);
        const targetName = targetInfo[targetID]?.name || "Người dùng Facebook";
        
        let msg = `👥 THAY ĐỔI QUẢN TRỊ VIÊN\n` +
                 `━━━━━━━━━━━━━━━━━━\n\n` +
                 `👤 Người thực hiện: ${authorName}\n` +
                 `🎯 Đối tượng: ${targetName}\n` +
                 `📝 Hành động: ${logMessageData.ADMIN_EVENT === "add_admin" ? "Thêm Admin" : "Gỡ Admin"}\n` +
                 `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;
                 
        api.sendMessage(msg, threadID);
      } catch (error) {
        console.error('Admin Update Error:', error);
        api.sendMessage("❌ Không thể lấy thông tin người dùng", threadID);
      }
    }

    if (logMessageType === "log:thread-color" || logMessageType === "log:thread-icon") {
      try {
        const authorName = await getAuthorName();
        
        if (logMessageType === "log:thread-color") {
          const oldColor = logMessageData.old_color || "Mặc định";
          const newColor = logMessageData.new_color || "Mặc định";
          
          let msg = `👥 THAY ĐỔI CHỦ ĐỀ NHÓM\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `👤 Người thay đổi: ${authorName}\n` +
                    `🎨 Màu cũ: ${oldColor}\n` +
                    `🎨 Màu mới: ${newColor}\n` +
                    `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;
          
          api.sendMessage(msg, threadID);
        } else if (logMessageType === "log:thread-icon") {
          const oldEmoji = logMessageData.old_emoji || "⚪";
          const newEmoji = logMessageData.new_emoji || "⚪";
          
          let msg = `👥 THAY ĐỔI EMOJI NHÓM\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `👤 Người thay đổi: ${authorName}\n` +
                    `😀 Emoji cũ: ${oldEmoji}\n` +
                    `😀 Emoji mới: ${newEmoji}\n` +
                    `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;
          
          api.sendMessage(msg, threadID);
        }
        
      } catch (error) {
        console.error('Thread Update Event Error:', error);
        api.sendMessage("❌ Có lỗi xảy ra khi xử lý thay đổi nhóm", threadID);
      }
    }
  }
};