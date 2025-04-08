module.exports = {
    name: "all",
    dev: "Hoàng Ngọc Từ",
    category: "Groups",
    info: "tag toàn bộ thành viên",
    onPrefix: true,
    usedby: 5,
    usages: "Tag mọi người với: .all <text> hoặc .all id <thread_id> <số_lần> <text>",
    cooldowns: 60,
  
    onLaunch: async function({ api, event, target }) {
      try {
        const botID = api.getCurrentUserID();
        const listUserID = event.participantIDs.filter(ID => ID != botID && ID != event.senderID);

        if (target[0] === "id" && target.length >= 3) {
          const threadID = target[1];
          const spamCount = parseInt(target[2]) || 5;
          const message = target.slice(3).join(" ") || "Everyone!";
          
          for (let spam = 0; spam < spamCount; spam++) {
            let index = 0;
            let mentionsPerMessage = [];
            
            for (const idUser of listUserID) {
              mentionsPerMessage.push({ id: idUser, tag: message, fromIndex: index });
              index += message.length;
            }
            
            await api.sendMessage({ body: message, mentions: mentionsPerMessage }, threadID);
          }
          
          return api.sendMessage(`Đã ping spam ${spamCount} lần thành công!`, event.threadID, event.messageID);
        } else {
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
