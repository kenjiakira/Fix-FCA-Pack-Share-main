module.exports = {
    name: "all",
    dev: "Hoàng Ngọc Từ",
    info: "tag toàn bộ thành viên",
    onPrefix: true,
    usedby: 0,
    usages: "Tag mọi người bằng cách gõ .all <văn bản>",
    cooldowns: 0,
  
    onLaunch: async function({ api, event, target }) {
      try {
        const botID = api.getCurrentUserID();
        const listUserID = event.participantIDs.filter(ID => ID != botID && ID != event.senderID);

       var body = (target.length != 0) ? target.join(" ") : "Everyone!"; 

        var mentions = [], index = 0;
  
        for (const idUser of listUserID) {
          mentions.push({ id: idUser, tag: body, fromIndex: index });
          index += body.length;
        }
  
        return api.sendMessage({ body, mentions }, event.threadID, event.messageID);
  
      } catch (e) {
        console.log(e);
        return api.sendMessage("Đã xảy ra lỗi!", event.threadID);
      }
    }
};
