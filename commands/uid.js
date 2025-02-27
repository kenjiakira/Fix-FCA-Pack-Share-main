const axios = require('axios');

module.exports = {
  name: "uid",
  dev: "HNT",
  usedby: 0,
  category: "Khác",
  info: "lấy UID facebook của người nào đó",
  onPrefix: false,
  dmUser: false,
  usages: "gõ .UID [tag], [reply] or .UID all",
  cooldowns: 0,

  onLaunch: async ({ api, event, target }) => {
    try {
      if (target.length === 0) {
        let uid;
        if (event.type === 'message_reply') {
          uid = event.messageReply.senderID;
        } else {
          uid = event.senderID;
        }
        console.log('UID:', uid);
        return api.sendMessage(uid, event.threadID, event.messageID);
      }

      if (target[0] === 'all') {
   
        const threadID = event.threadID;
        const threadInfo = await api.getThreadInfo(threadID);

        if (!threadInfo || !Array.isArray(threadInfo.participants)) {
          console.log('Không thể lấy thông tin nhóm hoặc không có thành viên');
          return api.sendMessage('Không thể lấy thông tin nhóm hoặc không có thành viên.', event.threadID, event.messageID);
        }

        let membersUID = '';
        threadInfo.participants.forEach(member => {
          membersUID += `UID của ${member.name}: ${member.userID}\n`;
        });

        return api.sendMessage(membersUID || 'Không tìm thấy thành viên trong nhóm.', event.threadID, event.messageID);
      }

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        for (let i = 0; i < Object.keys(event.mentions).length; i++) {
          const mentionedUID = Object.keys(event.mentions)[i];
          console.log('UID Mentioned:', mentionedUID);
          api.sendMessage(mentionedUID, event.threadID, event.messageID);
        }
        return; 
      }

      const input = target[0];

      if (!isNaN(input)) {
        console.log('Input is an ID:', input);
        return api.sendMessage(input, event.threadID, event.messageID);
      }

      const protocol = 'https:';
      const hostname = [
        'www.facebook.com',
        'facebook.com',
        'm.facebook.com',
        'mbasic.facebook.com',
        'fb.com'
      ];

      let urlHost;
      try {
        urlHost = new URL(input).hostname;
      } catch (error) {
        console.log('Invalid input format:', input);
        return api.sendMessage('Vui lòng nhập một URL hợp lệ hoặc ID.', event.threadID);
      }

      if (!hostname.includes(urlHost)) {
        console.log(`Link không đúng định dạng: ${protocol}//www.facebook.com/ + user name`);
        return api.sendMessage(`Link phải đúng định dạng: ${protocol}//www.facebook.com/ + user name`, event.threadID);
      }

      const accessToken = '6628568379%7Cc1e620fa708a1d5696fb991c1bde5662';
      const getID = (await axios.get(`https://graph.facebook.com/v12.0/${input}?access_token=${accessToken}`)).data;

      if (!getID.id) {
        console.log('Không tìm thấy UID cho liên kết này.');
        return api.sendMessage('Không tìm thấy UID cho liên kết này.', event.threadID, event.messageID);
      }

      console.log('UID:', getID.id);
      return api.sendMessage(getID.id, event.threadID, event.messageID);

    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('Yêu cầu bị từ chối. Vui lòng kiểm tra lại API key hoặc liên hệ với quản trị viên.');
        return api.sendMessage('Yêu cầu bị từ chối. Vui lòng kiểm tra lại API key hoặc liên hệ với quản trị viên.', event.threadID, event.messageID);
      }
      console.log(`Đã xảy ra lỗi: ${error.message}`);
      return api.sendMessage(`Đã xảy ra lỗi: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
