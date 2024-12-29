const { log } = require("npmlog");

module.exports = {
  name: "setname",
  dev: "HNT",
  usedby: 1,
  info: "Đặt biệt danh cho thành viên trong nhóm",
  onPrefix: true,
  dmUser: false,
  usages: "setname <biệt danh> (reply/tag)",
  cooldowns: 5,

  onLaunch: async ({ api, event, target }) => {
    try {
      const { threadID, messageID, type, messageReply } = event;
      let uid, newNickname;

      if (target.length === 0) {
        return api.sendMessage(
          "Cách sử dụng lệnh setname:\n\n" +
          "1. Reply và đặt tên: setname <biệt danh>\n" +
          "2. Tag và đặt tên: @tag setname <biệt danh>",
          threadID, messageID
        );
      }

      if (type === "message_reply") {
        uid = messageReply.senderID;
        newNickname = target.join(" ");
      } else if (Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
        newNickname = target.join(" ").replace(event.mentions[uid], "").trim();
      } else {
        return api.sendMessage(
          "Vui lòng tag hoặc reply người muốn đổi biệt danh", 
          threadID, messageID
        );
      }

      if (!newNickname || newNickname.length > 50) {
        return api.sendMessage(
          "Biệt danh không được để trống và không được quá 50 ký tự", 
          threadID, messageID
        );
      }

      const form = {
        nickname: newNickname,
        participant_id: uid,
        thread_or_other_fbid: threadID
      };

      await api.sendMessage("Đang thực hiện đổi biệt danh...", threadID);

      await api.changeNickname(form.nickname, form.thread_or_other_fbid, form.participant_id);
      
      return api.sendMessage(
        `Đã đổi biệt danh thành công: ${newNickname}`,
        threadID,
        messageID
      );

    } catch (error) {
      console.error(error);
      return api.sendMessage(
        "Đã có lỗi xảy ra khi đổi biệt danh. Vui lòng thử lại sau.\nLưu ý: Bot cần là quản trị viên để thực hiện lệnh này.", 
        event.threadID, 
        event.messageID
      );
    }
  }
};
