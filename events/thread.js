const fs = require('fs');
const path = require('path');
const { sendThreadNotification } = require('../utils/logs');

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

    try {
        const info = await api.getUserInfo(userID);
        this.lastApiCall = Date.now();
        if (info[userID]?.name) {
            this.saveName(userID, info[userID].name);
            return info;
        }
    } catch (err) {
    
    }

    if (threadID) {  
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            if (threadInfo?.userInfo) {
                const participant = threadInfo.userInfo.find(user => user.id === userID);
                if (participant?.name) {
                    this.saveName(userID, participant.name);
                    return {[userID]: {name: participant.name}};
                }
            }
        } catch (e) {
          
        }
    }

    if (this.nameCache[userID]) {
        return {[userID]: {name: this.nameCache[userID].name}};
    }

    const fallbackName = `Người dùng Facebook (${userID})`;
    this.saveName(userID, fallbackName);
    return {[userID]: {name: fallbackName}};
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
      const SPAM_WINDOW = 2000;
      const SPAM_LIMIT = 5;
      
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
      const antiadmintagPath = path.join(__dirname, '../commands/json/anti/antiadmintag.json');
      
      // Check for admin mentions first
      if (fs.existsSync(antiadmintagPath)) {
        try {
          const antiadmintagData = JSON.parse(fs.readFileSync(antiadmintagPath));
          if (antiadmintagData.threads?.[threadID]) {
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            const adminUIDs = adminConfig.adminUIDs || [];
            const mentionsKeys = Object.keys(event.mentions);
            
            const hasAdminMention = mentionsKeys.some(key => adminUIDs.includes(key));
            if (hasAdminMention) {
              try {
                await api.removeUserFromGroup(event.senderID, threadID);
                api.sendMessage(
                  `🚫 Đã kick ${event.senderName || "thành viên"} vì tag admin!\n` +
                  `⚡ Lý do: Không được phép tag admin bot`,
                  threadID
                );
                return;
              } catch (error) {
                console.error("Anti-admin-tag kick error:", error);
                api.sendMessage(
                  "❌ Không thể kick thành viên. Bot cần quyền quản trị viên!",
                  threadID
                );
                return;
              }
            }
          }
        } catch (error) {
          console.error("Error checking admin mentions:", error);
        }
      }

      // Then check for everyone mentions
      if (!fs.existsSync(antitagPath)) return;
      let antitagData = JSON.parse(fs.readFileSync(antitagPath));
      if (!antitagData.threads?.[threadID]) return;

      const mentionsKeys = Object.keys(event.mentions);
      const hasEveryoneMention = mentionsKeys.some(key => 
          event.mentions[key].toLowerCase().includes('mọi người') || 
          event.mentions[key].toLowerCase().includes('everyone')
      );

      if (!hasEveryoneMention) return;

      const now = Date.now();
      const HOURS_24 = 24 * 60 * 60 * 1000;
      
      if (!antitagData.tagData[threadID]) {
          antitagData.tagData[threadID] = {};
      }
      
      if (!antitagData.tagData[threadID][event.senderID]) {
          antitagData.tagData[threadID][event.senderID] = {
              count: 0,
              lastReset: now,
              lastTagTime: 0,
              tagsInWindow: 0
          };
      }

      let userData = antitagData.tagData[threadID][event.senderID];
      
      if (now - userData.lastReset >= HOURS_24) {
          userData.count = 0;
          userData.lastReset = now;
          userData.tagsInWindow = 0;
      }

      if (now - userData.lastTagTime > 10000) {
          userData.tagsInWindow = 0;
      }

      userData.count++;
      userData.tagsInWindow++;
      userData.lastTagTime = now;

      if (userData.count === 2) {
          api.sendMessage(
              `⚠️ Cảnh báo ${event.senderName || "Thành viên"}: \n` +
              `Bạn đã tag everyone/mọi người ${userData.count}/3 lần cho phép trong 24h.\n` +
              `Lần cuối sẽ bị kick khỏi nhóm!`,
              threadID
          );
      }
      
      if (userData.count >= 3 || userData.tagsInWindow >= 5) {
          try {
              await api.removeUserFromGroup(event.senderID, threadID);
              api.sendMessage(
                  `🚫 Đã kick ${event.senderName || "thành viên"} vì:\n` +
                  (userData.count >= 3 ? 
                      `👉 Tag everyone/mọi người quá 3 lần trong 24h` : 
                      `👉 Tag everyone/mọi người spam ${userData.tagsInWindow} lần trong 10 giây`),
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
          let success = false;
          
          while (retryCount < maxRetries && !success) {
              try {
                  await new Promise((resolve, reject) => {
                      api.addUserToGroup(leftParticipantFbId, threadID, (err) => {
                          if (err) {
                              if (typeof err === 'object') {
                                  reject(new Error(err.error || 'Unknown error'));
                              } else {
                                  reject(err);
                              }
                          } else {
                              resolve();
                          }
                      });
                  });
                  
                  success = true;
                  await api.sendMessage(
                      `🔒 Đã thêm ${userName} trở lại nhóm!\n⚠️ Nhóm đang bật chế độ chống rời nhóm.`,
                      threadID
                  );
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
          
          if (error.message?.includes('not found')) {
              errorMsg += "Không tìm thấy người dùng.";
          } else if (error.message?.includes('blocked')) {
              errorMsg += "Người dùng đã chặn bot.";
          } else if (error.message?.includes('limit')) {
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
        try {
            const info = await this.getUserInfo(api, author, threadID);
            return info[author]?.name || `Người dùng Facebook (${author})`;
        } catch (error) {
            return `Người dùng Facebook (${author})`;
        }
    };

    if (logMessageType === "log:thread-image") {
        try {
            const authorName = await getAuthorName();
            const msg = `👥 THAY ĐỔI ẢNH NHÓM\n` +
                       `━━━━━━━━━━━━━━━━━━\n\n` +
                       `👤 Người thay đổi: ${authorName}\n` +
                       `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;
            
            await sendThreadNotification(api, threadID, msg, 'avatar');
        } catch (error) {
            console.error('Thread Image Update Error:', error.message);
        }
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
                 
        await sendThreadNotification(api, threadID, msg, 'admin');
      } catch (error) {
        console.error('Admin Update Error:', error);
        api.sendMessage("❌ Không thể lấy thông tin người dùng", threadID);
      }
    }

    if (logMessageType === "log:user-nickname") {
      try {
        const authorName = await getAuthorName();
        const changedFor = logMessageData.participant_id;
        const oldNickname = logMessageData.previous_nickname || "Tên mặc định";
        const newNickname = logMessageData.new_nickname || "Tên mặc định";
        
        let msg = `👥 THAY ĐỔI BIỆT DANH\n` +
                 `━━━━━━━━━━━━━━━━━━\n\n` +
                 `👤 Người thay đổi: ${authorName}\n` +
                 `🎯 Đối tượng: ${await getAuthorName(changedFor)}\n` +
                 `📝 Tên cũ: ${oldNickname}\n` +
                 `📝 Tên mới: ${newNickname}\n` +
                 `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;

        await sendThreadNotification(api, threadID, msg, 'nick');
      } catch (error) {
        console.error('Nickname Update Error:', error);
      }
    }

    if (logMessageType === "log:thread-color") {
      // Theme/color change notification disabled
    } else if (logMessageType === "log:thread-icon") {
      // Emoji change notification disabled
    }

    if (logMessageType === "log:user-nickname") {
      const antinickPath = path.join(__dirname, '../commands/json/antinc.json');
      if (!fs.existsSync(antinickPath)) return;
      
      const antinickData = JSON.parse(fs.readFileSync(antinickPath));
      if (!antinickData.threads?.[threadID]?.enable) return;

      try {
          const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
          const isAdminBot = adminConfig.adminUIDs.includes(author);
          const threadInfo = await api.getThreadInfo(threadID);
          const isGroupAdmin = threadInfo.adminIDs.some(e => e.id == author);
          const isBotAction = author === api.getCurrentUserID();

          if (isBotAction || isAdminBot || isGroupAdmin) return;

          const changedFor = logMessageData.participant_id;
          const oldNickname = logMessageData.previous_nickname || "";
          
          await api.changeNickname(
              oldNickname,
              threadID,
              changedFor
          );

          const authorInfo = await this.getUserInfo(api, author, threadID);
          const authorName = authorInfo[author]?.name || "Người dùng Facebook";

          api.sendMessage(
              `⚠️ ${authorName} đã cố gắng đổi biệt danh!\n` +
              `💡 Chỉ admin bot và quản trị viên mới có thể đổi biệt danh.`,
              threadID
          );

      } catch (error) {
          console.error("Anti-nickname error:", error);
          api.sendMessage(
              "❌ Không thể hoàn tác biệt danh. Bot cần là quản trị viên!",
              threadID
          );
      }
    }
  }
};
