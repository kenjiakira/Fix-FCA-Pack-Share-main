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

    const getAuthorName = async () => {
      const info = await this.getUserInfo(api, author, threadID);
      return info[author]?.name || "Người dùng Facebook";
    };

    if (logMessageType === "log:thread-image") {
      try {
        const authorName = await getAuthorName();
        
        const antiimgPath = path.join(__dirname, '../commands/json/antiimage.json');
        if (fs.existsSync(antiimgPath)) {
          const antiimgData = JSON.parse(fs.readFileSync(antiimgPath));
          
          if (antiimgData[threadID]?.enable) {
        
            const threadInfo = await api.getThreadInfo(threadID);
            if (!threadInfo.adminIDs.some(e => e.id == author)) {
              await new Promise(resolve => setTimeout(resolve, 1000));

              if (antiimgData[threadID].localPath && fs.existsSync(antiimgData[threadID].localPath)) {
                try {
                  const imageStream = fs.createReadStream(antiimgData[threadID].localPath);
                  await api.changeGroupImage(imageStream, threadID);
                } catch (localError) {
                  console.error('Local image restore error:', localError);
                  
                  try {
                    const axios = require('axios');
                    const { data } = await axios.get(antiimgData[threadID].imageUrl, { responseType: 'stream' });
                    await api.changeGroupImage(data, threadID);
                  } catch (urlError) {
                    console.error('URL image restore error:', urlError);
                    return api.sendMessage("❌ Không thể khôi phục ảnh nhóm!", threadID);
                  }
                }
              } else {
                try {
                  const axios = require('axios');
                  const { data } = await axios.get(antiimgData[threadID].imageUrl, { responseType: 'stream' });
                  await api.changeGroupImage(data, threadID);
                } catch (error) {
                  console.error('Image restore error:', error);
                  return api.sendMessage("❌ Không thể khôi phục ảnh nhóm!", threadID);
                }
              }
              
              api.sendMessage(
                `⚠️ ${authorName} đã cố gắng đổi ảnh nhóm!\n` +
                `🚫 Đã khôi phục về ảnh cũ!`,
                threadID
              );
              return;
            }
          }
        }

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
        return;
      } catch (error) {
        console.error('Admin Update Error:', error);
        api.sendMessage("❌ Không thể lấy thông tin người dùng", threadID);
      }
    }

    if (logMessageType === "log:thread-name") {
      const antinamePath = path.join(__dirname, '../commands/json/antiname.json');
      if (fs.existsSync(antinamePath)) {
        const antinameData = JSON.parse(fs.readFileSync(antinamePath));
        
        if (antinameData[threadID]?.enable) {
          // Add admin check
          const threadInfo = await api.getThreadInfo(threadID);
          if (!threadInfo.adminIDs.some(e => e.id == author)) {
            const oldName = antinameData[threadID].name;
            try {
              await api.setTitle(oldName, threadID);
              const authorName = await getAuthorName();
              
              api.sendMessage(
                `⚠️ ${authorName} đã cố gắng đổi tên nhóm!\n` +
                `🚫 Đã khôi phục tên nhóm về: ${oldName}`,
                threadID
              );
              return;
            } catch (error) {
              console.error('Anti-name Error:', error);
            }
          }
        }
      }
    }
    
    if (logMessageType === "log:thread-color" || logMessageType === "log:thread-icon") {
      try {
        const authorName = await getAuthorName();
        
        if (logMessageType === "log:thread-color") {
          const anticolorPath = path.join(__dirname, '../commands/json/anticolor.json');
          if (fs.existsSync(anticolorPath)) {
            const anticolorData = JSON.parse(fs.readFileSync(anticolorPath));
            
            if (anticolorData[threadID]?.enable) {
              // Add admin check
              const threadInfo = await api.getThreadInfo(threadID);
              if (!threadInfo.adminIDs.some(e => e.id == author)) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                let success = false;
                const colors = anticolorData[threadID].colors;
                let currentIndex = anticolorData[threadID].currentColorIndex || 0;

                // Try each color in the array until one works
                for (let i = 0; i < colors.length; i++) {
                    const colorIndex = (currentIndex + i) % colors.length;
                    const color = colors[colorIndex];
                    
                    try {
                        await this.tryChangeColor(api, color, threadID);
                        success = true;
                        anticolorData[threadID].currentColorIndex = colorIndex;
                        fs.writeFileSync(anticolorPath, JSON.stringify(anticolorData, null, 4));
                        break;
                    } catch (err) {
                        console.log(`Failed to set color ${color}:`, err);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                }

                if (success) {
                    api.sendMessage(
                        `⚠️ ${authorName} đã cố gắng đổi màu chat!\n` +
                        `🚫 Đã khôi phục về màu cũ!`,
                        threadID
                    );
                } else {
                    throw new Error("All color restoration attempts failed");
                }
                return;
              }
            }
          }

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
        api.sendMessage(
          "❌ Có lỗi xảy ra khi xử lý thay đổi màu chat\n" +
          "💡 Hệ thống sẽ tự động thử lại sau.", 
          threadID
        );
      }
    }
  }
};
