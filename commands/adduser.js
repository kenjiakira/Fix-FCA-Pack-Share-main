module.exports = {
    name: "adduser",
    dev: "HNT",
    info: "add người dùng vào nhóm theo ID FB",
    onPrefix: true,
    usages: "thêm người dùng vào nhóm bằng cách thêm ID\nVD: bạn muốn thêm người A có ID 123456 vào nhóm\n gõ [.adduser 123456]\n\n Bạn muốn thêm qua Liên kết\nhãy lên Facebook copy liên kết của người đó rồi sử dụng lệnh\n\nvd: người tên A có link là fb.com/1234 ta sử dụng lệnh \n [.adduser fb.com/1234]",
    cooldowns: 5,
  
    onLaunch: async function({ api, event, target }) {
      const { threadID, messageID } = event;
      const botID = api.getCurrentUserID();
      const out = msg => api.sendMessage(msg, threadID, messageID);
      var { participantIDs, approvalMode, adminIDs } = await api.getThreadInfo(threadID);
      participantIDs = participantIDs.map(e => parseInt(e));
  
      if (!target[0]) return out("Please enter an id/link profile user to add.");
      if (!isNaN(target[0])) return adduser(target[0], undefined);
      else {
        try {
          var [id, name, fail] = await getUID(target[0], api);
          if (fail == true && id != null) return out(id);
          else if (fail == true && id == null) return out("Không tìm thấy ID người dùng.");
          else {
            await adduser(id, name || "Người dùng Facebook");
          }
        } catch (e) {
          return out(`${e.name}: ${e.message}.`);
        }
      }
      
      async function adduser(id, name) {
        id = parseInt(id);
        if (participantIDs.includes(id)) return out(`${name ? name : "Người dùng"} đã có trong nhóm.`);
        else {
          var admins = adminIDs.map(e => parseInt(e.id));
          try {
            await api.addUserToGroup(id, threadID);
          } catch {
            return out(`Không thể thêm ${name ? name : "người dùng"} vào nhóm.`);
          }
          if (approvalMode === true && !admins.includes(botID)) return out(`Đã thêm ${name ? name : "người dùng"} vào danh sách phê duyệt!`);
          else return out(`Đã thêm ${name ? name : "người dùng"} vào nhóm!`);
        }
      }
    }
  };
  