const fs = require("fs");
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));

module.exports = {
  name: "admin",
  usedby: 4,
  dev: "Jonell Magallanes",
  onPrefix: true,
  cooldowns: 1,
  info: "Danh sách Quản trị viên và Điều hành viên",
  hide: true,

  onLaunch: async function ({ api, event, target }) {
    let getUserName = (userID) => {
      return new Promise((resolve) => {
        api.getUserInfo(userID, (err, info) => {
          if (err || !info[userID]) return resolve("");
          resolve(info[userID].name || `User ID: ${userID}`);
        });
      });
    };

    if (adminConfig.adminUIDs.includes(event.senderID)) {
      let replyUser = event.messageReply ? event.messageReply.senderID : null;
      let action = target[0];
      let role = target[1];
      let targetUID = target[2] || replyUser;

      if ((action === "add" || action === "remove") && !targetUID) {
        return api.sendMessage("Vui lòng chỉ định một UID hoặc phản hồi tới một người dùng.", event.threadID);
      }

      if (action === "add") {
        if (role === "admin" && !adminConfig.adminUIDs.includes(targetUID)) {
          adminConfig.adminUIDs.push(targetUID);
          fs.writeFileSync("admin.json", JSON.stringify(adminConfig, null, 2), "utf8");
          let userName = await getUserName(targetUID);
          if (userName) {
            return api.sendMessage(`🛡️ 𝗔𝗱𝗺𝗶𝗻 𝗔𝗱𝗱𝗲𝗱\n${global.line}\nĐã thêm quản trị viên mới ${userName}`, event.threadID, () => {
              process.exit(1);
            });
          }
        } else if (role === "mod" && (!adminConfig.moderatorUIDs || !adminConfig.moderatorUIDs.includes(targetUID))) {
          adminConfig.moderatorUIDs = adminConfig.moderatorUIDs || [];
          adminConfig.moderatorUIDs.push(targetUID);
          fs.writeFileSync("admin.json", JSON.stringify(adminConfig, null, 2), "utf8");
          let userName = await getUserName(targetUID);
          if (userName) {
            return api.sendMessage(`👮 𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗼𝗿 𝗔𝗱𝗱𝗲𝗱\n${global.line}\nĐã thêm điều hành viên mới ${userName}`, event.threadID, () => {
              process.exit(1);
            });
          }
        } else {
          let userName = await getUserName(targetUID);
          if (userName) {
            return api.sendMessage(`${userName} đã là một ${role}.`, event.threadID);
          }
        }
      }

      if (action === "remove" && role === "admin") {
        if (adminConfig.adminUIDs.includes(targetUID)) {
          adminConfig.adminUIDs = adminConfig.adminUIDs.filter(uid => uid !== targetUID);
          fs.writeFileSync("admin.json", JSON.stringify(adminConfig, null, 2), "utf8");
          let userName = await getUserName(targetUID);
          if (userName) {
            return api.sendMessage(`🛡️ 𝗔𝗱𝗺𝗶𝗻 𝗥𝗲𝗺𝗼𝘃𝗲𝗱\n${global.line}\nĐã xóa quản trị viên ${userName}`, event.threadID, () => {
              process.exit(1);
            });
          }
        }
      }

      let adminList = [];
      for (let adminUID of adminConfig.adminUIDs) {
        let adminName = await getUserName(adminUID);
        if (adminName) adminList.push(`[ ${adminUID} ] ${adminName}`);
      }

      let moderatorList = [];
      if (adminConfig.moderatorUIDs) {
        for (let modUID of adminConfig.moderatorUIDs) {
          let modName = await getUserName(modUID);
          if (modName) moderatorList.push(`[ ${modUID} ] ${modName}`);
        }
      }

      let message = `🛡️ Quản trị viên:\n${adminList.join("\n")}\n\n`;
      if (moderatorList.length > 0) {
        message += `👮 Điều hành viên:\n${moderatorList.join("\n")}`;
      } else {
        message += `👮 Không có điều hành viên nào được chỉ định.`;
      }

      api.sendMessage(message, event.threadID);
    } else {
      api.sendMessage(`🛡️Bạn không có quyền sử dụng lệnh này.`, event.threadID);
    }
  }
};
