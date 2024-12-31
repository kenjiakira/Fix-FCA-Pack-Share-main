const fs = require("fs");
const path = require("path");

const nicknameConfigPath = path.join(__dirname, "../database/nicknames.json");
const setnameStatusPath = path.join(__dirname, "../database/setnameStatus.json");

if (!fs.existsSync(nicknameConfigPath)) {
  fs.writeFileSync(nicknameConfigPath, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(setnameStatusPath)) {
  fs.writeFileSync(setnameStatusPath, JSON.stringify({}, null, 2));
}

module.exports = {
  name: "setname",
  dev: "HNT",
  usedby: 1,
  info: "Đặt biệt danh cho thành viên trong nhóm",
  onPrefix: true,
  dmUser: false,
  usages: "setname <biệt danh> (reply/tag) | setname auto <mẫu biệt danh> | setname on/off | setname auto off",
  cooldowns: 5,

  onLaunch: async ({ api, event, target }) => {
    try {
      const { threadID, messageID, type, messageReply } = event;
      let uid, newNickname;

      if (target[0] === "on" || target[0] === "off") {
        let setnameStatus = {};
        try {
          setnameStatus = JSON.parse(fs.readFileSync(setnameStatusPath));
        } catch (err) {
          console.error("Error loading setname status:", err);
        }
        
        setnameStatus[threadID] = target[0] === "on";
        fs.writeFileSync(setnameStatusPath, JSON.stringify(setnameStatus, null, 2));
        
        return api.sendMessage(
          `Đã ${target[0] === "on" ? "bật" : "tắt"} chức năng đổi biệt danh trong nhóm này`,
          threadID,
          messageID
        );
      }

      const setnameStatus = JSON.parse(fs.readFileSync(setnameStatusPath));
      if (setnameStatus[threadID] === false) {
        return api.sendMessage(
          "Chức năng đổi biệt danh đang bị tắt trong nhóm này. Sử dụng 'setname on' để bật lại.",
          threadID,
          messageID
        );
      }

      if (target[0] === "auto") {
        const nickConfig = JSON.parse(fs.readFileSync(nicknameConfigPath));
        
        if (target[1] === "off") {
          delete nickConfig[threadID];
          fs.writeFileSync(nicknameConfigPath, JSON.stringify(nickConfig, null, 2));
          return api.sendMessage("Đã tắt chức năng đặt biệt danh tự động", threadID, messageID);
        }
        
        const pattern = target.slice(1).join(" ");
        if (!pattern) {
          return api.sendMessage(
            "Vui lòng nhập mẫu biệt danh.\nVí dụ: setname auto Member {name}",
            threadID, messageID
          );
        }
        
        nickConfig[threadID] = pattern;
        fs.writeFileSync(nicknameConfigPath, JSON.stringify(nickConfig, null, 2));
        return api.sendMessage(
          `Đã set mẫu biệt danh tự động: ${pattern}`,
          threadID, messageID
        );
      }

      if (target.length === 0) {
        return api.sendMessage(
          "Cách sử dụng lệnh setname:\n\n" +
          "1. Reply và đặt tên: setname <biệt danh>\n" +
          "2. Tag và đặt tên: @tag setname <biệt danh>" +
          "3. Auto đổi biệt danh: setname auto <mẫu biệt danh> | setname auto on/off để bật/tắt",
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
  },

  handleNewMember: async (api, event) => {
    try {
      const setnameStatus = JSON.parse(fs.readFileSync(setnameStatusPath));
      if (setnameStatus[event.threadID] === false) return;

      const { threadID, participantIDs } = event;
      
      const nickConfig = JSON.parse(fs.readFileSync(nicknameConfigPath));
      const pattern = nickConfig[threadID];
      
      if (!pattern) return; 
      
      const userInfo = await api.getUserInfo(participantIDs[0]);
      const userName = userInfo[participantIDs[0]].name;
      
      const newNickname = pattern.replace("{name}", userName);
      
      await api.changeNickname(
        newNickname,
        threadID,
        participantIDs[0]
      );
      
    } catch (error) {
      console.error("Error setting auto nickname:", error);
    }
  }
};
