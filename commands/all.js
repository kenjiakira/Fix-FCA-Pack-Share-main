const fs = require('fs');
const path = require('path');

// Lưu trữ các vòng lặp đang hoạt động
if (!global.allLoops) {
    global.allLoops = {};
}

module.exports = {
    name: "all",
    dev: "Hoàng Ngọc Từ",
    category: "Groups",
    info: "tag toàn bộ thành viên",
    onPrefix: true,
    usedby: 5,
    usages: "Tag mọi người với: .all <text> hoặc .all id <thread_id> <số_lần> <text> hoặc .all loop <text> (admin) hoặc .all stop (admin)",
    cooldowns: 60,
  
    onLaunch: async function({ api, event, target }) {
      try {
        const botID = api.getCurrentUserID();
        const { threadID, senderID } = event;
        const listUserID = event.participantIDs.filter(ID => ID != botID && ID != event.senderID);

        // Kiểm tra quyền admin cho các lệnh loop và stop
        if (target[0] === "loop" || target[0] === "stop") {
            const threadsDBPath = path.join(__dirname, '../database/threads.json');
            const adminConfigPath = path.join(__dirname, '../admin.json');
            
            let threadsDB = {};
            let adminConfig = {};
            
            try {
                threadsDB = JSON.parse(fs.readFileSync(threadsDBPath, "utf8") || "{}");
                adminConfig = JSON.parse(fs.readFileSync(adminConfigPath, "utf8"));
            } catch (e) {
                console.error("Error reading files:", e);
            }
            
            const isAdminBot = adminConfig.adminUIDs?.includes(senderID);
            const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(
                admin => (typeof admin === 'object' ? admin.id : admin) === senderID
            );
            
            if (!isAdminBot && !isGroupAdmin) {
                return api.sendMessage(
                    "⚠️ Chỉ Admin bot hoặc Quản trị viên nhóm mới có thể sử dụng lệnh này!",
                    threadID,
                    event.messageID
                );
            }
        }

        // Dừng vòng lặp tag all liên tục
        if (target[0] === "stop") {
            if (global.allLoops[threadID]) {
                clearInterval(global.allLoops[threadID]);
                delete global.allLoops[threadID];
                return api.sendMessage("✅ Đã dừng tag all liên tục!", threadID, event.messageID);
            } else {
                return api.sendMessage("❌ Không có vòng lặp tag all nào đang chạy!", threadID, event.messageID);
            }
        }

        // Bắt đầu tag all liên tục (chỉ admin)
        if (target[0] === "loop") {
            const message = target.slice(1).join(" ") || "Everyone!";
            
            // Dừng vòng lặp cũ nếu có
            if (global.allLoops[threadID]) {
                clearInterval(global.allLoops[threadID]);
            }
            
            // Tạo vòng lặp tag all liên tục
            const loopInterval = setInterval(async () => {
                try {
                    let index = 0;
                    let mentions = [];
                    
                    for (const idUser of listUserID) {
                        mentions.push({ id: idUser, tag: message, fromIndex: index });
                        index += message.length;
                    }
                    
                    await api.sendMessage({ body: message, mentions }, threadID);
                } catch (e) {
                    console.error("Error in loop:", e);
                    // Dừng vòng lặp nếu có lỗi
                    if (global.allLoops[threadID]) {
                        clearInterval(global.allLoops[threadID]);
                        delete global.allLoops[threadID];
                    }
                }
            }, 100); // Tag mỗi 0.5 giây (nhanh hơn)
            
            global.allLoops[threadID] = loopInterval;
            return api.sendMessage(
                `✅ Đã bắt đầu tag all liên tục!\n📝 Tin nhắn: ${message}\n⏹️ Dùng ".all stop" để dừng`,
                threadID,
                event.messageID
            );
        }

        // Lệnh tag all với id và số lần
        if (target[0] === "id" && target.length >= 3) {
          const targetThreadID = target[1];
          const spamCount = parseInt(target[2]) || 5;
          const message = target.slice(3).join(" ") || "Everyone!";
          
          for (let spam = 0; spam < spamCount; spam++) {
            let index = 0;
            let mentionsPerMessage = [];
            
            for (const idUser of listUserID) {
              mentionsPerMessage.push({ id: idUser, tag: message, fromIndex: index });
              index += message.length;
            }
            
            await api.sendMessage({ body: message, mentions: mentionsPerMessage }, targetThreadID);
          }
          
          return api.sendMessage(`Đã ping spam ${spamCount} lần thành công!`, event.threadID, event.messageID);
        } else {
          // Lệnh tag all thông thường
          var body = (target.length != 0) ? target.join(" ") : "Everyone!"; 
          var mentions = [], index = 0;
    
          for (const idUser of listUserID) {
            mentions.push({ id: idUser, tag: body, fromIndex: index });
            index += body.length;
          }
    
          return api.sendMessage({ body, mentions }, event.threadID, event.messageID);
        }
      } catch (e) {
        console.log(e);
        return api.sendMessage("Đã xảy ra lỗi!", event.threadID);
      }
    }
};
