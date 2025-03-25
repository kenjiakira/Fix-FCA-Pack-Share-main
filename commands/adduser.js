const threadInfoCache = new Map();
const getThreadParticipantIDs = require("../utils/getParticipantIDs");

module.exports = {
    name: "adduser",
    dev: "HNT",
    usedby: 5,
    category: "Groups",
    info: "add người dùng vào nhóm theo ID FB",
    onPrefix: true,
    usages: "thêm người dùng vào nhóm bằng cách thêm ID\nVD: bạn muốn thêm người A có ID 123456 vào nhóm\n gõ [.adduser 123456]\n\n Bạn muốn thêm qua Liên kết\nhãy lên Facebook copy liên kết của người đó rồi sử dụng lệnh\n\nvd: người tên A có link là fb.com/1234 ta sử dụng lệnh \n [.adduser fb.com/1234]",
    cooldowns: 5,
  
    onLaunch: async function({ api, event, target }) {
      const { threadID, messageID } = event;
      const botID = api.getCurrentUserID();
      const out = msg => api.sendMessage(msg, threadID, messageID);
      
      async function getUID(url, api) {
        try {
          if (!isNaN(url)) {
            return [url, null, false];
          }

          url = url.replace(/\/$/, ''); 
          const segments = url.split('/');
          const lastSegment = segments[segments.length - 1];

          try {
            const userInfo = await api.getUserID(lastSegment);
            if (userInfo && userInfo[0]) {
              return [userInfo[0].userID.toString(), userInfo[0].name, false];
            }
          } catch (err) {
            console.error("Error getting user info:", err);
            return [null, null, true];
          }

          return [null, null, true];
        } catch (err) {
          console.error("Error in getUID:", err);
          return [null, null, true];
        }
      }

      let participantIDs = [];
      try {
        participantIDs = await getThreadParticipantIDs(api, threadID);
        
        if (!participantIDs || participantIDs.length === 0) {
          throw new Error("Không thể lấy danh sách thành viên nhóm");
        }
      } catch (error) {
        console.error("Error getting participants:", error);
        return out(`❌ ${error.message}`);
      }

      const parsedParticipantIDs = participantIDs.map(e => parseInt(e));

      if (!target[0]) return out("⚠️ Vui lòng nhập ID hoặc link profile người dùng cần thêm!");
      
      async function adduser(id, name) {
        id = parseInt(id);
        if (parsedParticipantIDs.includes(id)) {
          return out(`⚠️ ${name ? name : "Người dùng"} đã có trong nhóm!`);
        }

        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await api.addUserToGroup(id, threadID);
          
          threadInfoCache.delete(threadID);
          return out(`✅ Đã thêm ${name ? name : "người dùng"} vào nhóm!`);
          
        } catch (error) {
          console.error("Add user error:", error);
          
          if (error.message?.includes("blocked") || 
              error.error?.includes("blocked") ||
              error.error?.includes("limit") ||
              error.message?.includes("limit")) {
            return out(`❌ Facebook đang tạm thời chặn bot. Vui lòng thử lại sau 1-2 phút.`);
          }

          return out(`❌ Không thể thêm ${name ? name : "người dùng"} vào nhóm!\nCó thể do:\n- Người dùng đã chặn bot\n- Bot không phải là quản trị viên\n- Facebook đang giới hạn tính năng này\n- Người dùng đã chặn yêu cầu vào nhóm`);
        }
      }

      if (!isNaN(target[0])) {
        return adduser(target[0], undefined);
      } else {
        try {
          var [id, name, fail] = await getUID(target[0], api);
          if (fail == true && id != null) return out(id);
          else if (fail == true && id == null) return out("❌ Không tìm thấy ID người dùng! Vui lòng kiểm tra lại link profile.");
          else {
            await adduser(id, name || "Người dùng Facebook");
          }
        } catch (e) {
          console.error("Error processing user input:", e);
          return out(`❌ Lỗi xử lý: ${e.message || "Không xác định"}. Vui lòng thử lại sau.`);
        }
      }
    }
};
