const fs = require('fs');
const path = require('path');
const { sendThreadNotification } = require('../utils/logs');
const getThreadParticipantIDs = require('../utils/getParticipantIDs');

function cleanupThreadData(threadData) {
  const essentialFields = {
    members: threadData.members || [],
    messageCount: threadData.messageCount || {},
    lastActivity: threadData.lastActivity || Date.now(),
    adminIDs: threadData.adminIDs || [],
    adminLastUpdate: threadData.adminLastUpdate || Date.now()
  };
  return essentialFields;
}

async function updateInviteQuest(inviterId) {
  try {
    const userQuests = require('../utils/currencies').getUserQuests(inviterId);
    if (!userQuests.completed['invite_friends']) {
      userQuests.progress['invite_friends'] = (userQuests.progress['invite_friends'] || 0) + 1;
    }
  } catch (error) {
    console.error("Error updating invite quest:", error);
  }
}

function getRankDataName(userID) {
  try {
    const rankDataPath = path.join(__dirname, '../database/rankData.json');
    if (fs.existsSync(rankDataPath)) {
      const rankData = JSON.parse(fs.readFileSync(rankDataPath, 'utf8'));
      if (rankData[userID] && rankData[userID].name) {
        return rankData[userID].name;
      }
    }
  } catch (err) {
    console.error("Error reading rankData:", err);
  }
  return null;
}

module.exports = {
  name: "thread",
  info: "Thông báo khi nhóm thay đổi chủ đề, emoji, tên, admin hoặc ảnh",
  pro: "HNT",
  userCache: new Map(),
  lastApiCall: 0,
  API_COOLDOWN: 2000,

  nameCache: {},
  nameCachePath: path.join(__dirname, '../database/json/usernames.json'),
  fetchAndUpdateThreadInfo: async function (api, threadID) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      if (!threadInfo) {
        console.error(`❌ Could not fetch thread info for ${threadID}`);
        return null;
      }

      let participants = [];
      try {
        participants = await getThreadParticipantIDs(api, threadID);
      } catch (err) {
        console.error(`⚠️ Could not fetch participants for ${threadID}:`, err);

        participants = threadInfo.participantIDs || [];
      }

      const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");

      if (!threadsDB[threadID]) {
        threadsDB[threadID] = {
          members: [],
          messageCount: {},
          lastActivity: Date.now(),
          adminIDs: [],
          adminLastUpdate: Date.now()
        };
      }

      let memberNames = {};
      for (const participantID of participants) {
        const name = getRankDataName(participantID);
        if (name) {
          memberNames[participantID] = name;
        }
      }

      threadsDB[threadID] = {
        ...threadsDB[threadID],
        members: participants,
        memberNames: memberNames,
        name: threadInfo?.threadName || threadInfo?.name || `Nhóm ${threadID}`,
        threadType: threadInfo?.isGroup ? 'GROUP' : 'OTHER',
        lastActivity: Date.now(),
        adminIDs: threadInfo?.adminIDs || [],
        adminLastUpdate: Date.now()
      };

      if (threadInfo?.imageSrc) {
        threadsDB[threadID].avatarUrl = threadInfo.imageSrc;
      } else if (threadInfo?.thumbSrc) {
        threadsDB[threadID].avatarUrl = threadInfo.thumbSrc;
      }

      if (threadInfo?.emoji) threadsDB[threadID].emoji = threadInfo.emoji;
      if (threadInfo?.color) threadsDB[threadID].color = threadInfo.color;

      threadsDB[threadID] = cleanupThreadData(threadsDB[threadID]);

      fs.writeFileSync("./database/threads.json", JSON.stringify(threadsDB, null, 2));
      console.log(`✅ Successfully updated info for thread ${threadID}`);

      return threadsDB[threadID];
    } catch (error) {
      console.error(`❌ Error updating thread info for ${threadID}:`, error);
      return null;
    }
  },
  initNameCache: function () {
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

  saveName: function (userID, name) {
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

  getUserInfo: async function (api, userID, threadID) {
    if (!this.nameCache) this.initNameCache();

    if (this.nameCache[userID]) {
      const cached = this.nameCache[userID];
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return { [userID]: { name: cached.name } };
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
            return { [userID]: { name: participant.name } };
          }
        }
      } catch (e) {

      }
    }

    if (this.nameCache[userID]) {
      return { [userID]: { name: this.nameCache[userID].name } };
    }

    const fallbackName = `Người dùng Facebook (${userID})`;
    this.saveName(userID, fallbackName);
    return { [userID]: { name: fallbackName } };
  },

  async tryChangeColor(api, color, threadID) {
    return new Promise((resolve, reject) => {
      api.changeThreadColor(color, threadID, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  getUserName: async function(api, userID) {
    const rankDataName = getRankDataName(userID);
    if (rankDataName) return rankDataName;

    try {
      const info = await api.getUserInfo(userID);
      if (info && info[userID]?.name) {
        return info[userID].name;
      }
    } catch (err) {
      console.error("Error getting user info:", err);
    }
    return `Người dùng Facebook (${userID})`;
  },

  onEvents: async function ({ api, event, Threads }) {
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
              `⚡ Lý do: ${SPAM_LIMIT} tin nhắn trong ${SPAM_WINDOW / 1000} giây`,
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
    if (logMessageType === "log:thread-name") {
      try {
        const authorName = await getAuthorName();
        const newName = logMessageData.name || "Tên nhóm mới";

        try {
          const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");
          if (threadsDB[threadID]) {
            threadsDB[threadID].name = newName;
            fs.writeFileSync("./database/threads.json", JSON.stringify(threadsDB, null, 2));
            console.log(`Đã cập nhật tên nhóm ${threadID} thành: ${newName}`);
          }
        } catch (dbError) {
          console.error("Lỗi khi cập nhật tên nhóm vào database:", dbError);
        }

        let msg = `👥 THAY ĐỔI TÊN NHÓM\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `👤 Người thay đổi: ${authorName}\n` +
          `🏷️ Tên mới: ${newName}\n` +
          `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;

        await sendThreadNotification(api, threadID, msg, 'name');
      } catch (error) {
        console.error('Thread Name Update Error:', error);
      }
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

        // Cập nhật nhiệm vụ mời người cho người thêm thành viên
        if (author !== api.getCurrentUserID()) {
          await updateInviteQuest(author);
        }

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

        try {
          const threadInfo = await api.getThreadInfo(threadID);
          const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");

          if (!threadsDB[threadID]) {
            threadsDB[threadID] = {
              members: [],
              adminIDs: [],
              messageCount: {},
              lastActivity: Date.now(),
              name: threadInfo.name || `Nhóm ${threadID}`
            };
          }

          if (threadInfo.imageSrc) {
            threadsDB[threadID].avatarUrl = threadInfo.imageSrc;
          } else if (threadInfo.thumbSrc) {
            threadsDB[threadID].avatarUrl = threadInfo.thumbSrc;
          }

          fs.writeFileSync("./database/threads.json", JSON.stringify(threadsDB, null, 2));
          console.log(`Đã cập nhật avatar URL cho nhóm ${threadID}`);
        } catch (avatarError) {
          console.error("Lỗi khi cập nhật avatar URL:", avatarError);
        }

        await sendThreadNotification(api, threadID, msg, 'avatar');
      } catch (error) {
        console.error('Thread Image Update Error:', error.message);
      }
    }

    if (logMessageType === "log:thread-admins") {
      const threadID = event.threadID;
      const isRemoving = event.logMessageData.ADMIN_EVENT === "remove_admin";
      const targetID = event.logMessageData.TARGET_ID;
      const authorID = event.author; // ID của người thực hiện hành động
      const authorName = await this.getUserName(api, authorID);
      const targetName = await this.getUserName(api, targetID);
      
      try {
          const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");
          
          if (!threadsDB[threadID]) {
              threadsDB[threadID] = {
                  members: [],
                  messageCount: {},
                  lastActivity: Date.now(),
                  adminIDs: [],
                  adminLastUpdate: Date.now(),
                  adminVerified: false
              };
          }

          if (isRemoving) {
              if (threadsDB[threadID].adminIDs) {
                  threadsDB[threadID].adminIDs = threadsDB[threadID].adminIDs.filter(admin => 
                      (typeof admin === 'object' ? admin.id !== targetID : admin !== targetID)
                  );
              }
          } 
          else {
              if (!threadsDB[threadID].adminIDs) {
                  threadsDB[threadID].adminIDs = [];
              }

              const targetExists = threadsDB[threadID].adminIDs.some(admin => 
                  (typeof admin === 'object' ? admin.id === targetID : admin === targetID)
              );
              if (!targetExists) {
                  threadsDB[threadID].adminIDs.push({ id: targetID });
              }

              const authorExists = threadsDB[threadID].adminIDs.some(admin => 
                  (typeof admin === 'object' ? admin.id === authorID : admin === authorID)
              );
              if (!authorExists) {
                  threadsDB[threadID].adminIDs.push({ id: authorID });
              }
          }

          threadsDB[threadID].adminLastUpdate = Date.now();
          fs.writeFileSync("./database/threads.json", JSON.stringify(threadsDB, null, 2));

          let msg = `👥 THAY ĐỔI QUẢN TRỊ VIÊN\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `👤 Người thực hiện: ${authorName}\n` +
              `🎯 Đối tượng: ${targetName}\n` +
              `📝 Hành động: ${isRemoving ? "Gỡ Admin" : "Thêm Admin"}\n` +
              `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;

          await sendThreadNotification(api, threadID, msg, 'admin');
      } catch (error) {
          console.error('Admin Update Error:', error);
      }
    }
  }
};
