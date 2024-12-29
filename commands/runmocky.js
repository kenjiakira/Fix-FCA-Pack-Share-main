module.exports = {
  name: "runmocky",
  usedby: 2,
  dev:"HNT",    
  info: "Chia sẻ lệnh từ mocky.io",
  onPrefix: true,
  cooldowns: 5,

  onLaunch: async function({ api, event, target }) {
    const axios = require('axios');
    const fs = require('fs');
    const request = require('request');
    const { messageReply, type } = event;
    const name = target[0];

    if (type == "message_reply") {
      const text = messageReply.body;
      if (!text || !name) return api.sendMessage('Vui lòng reply link và nhập tên command cần áp dụng!', event.threadID);
      
      var urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
      var url = text.match(urlR);
      if (!url) return api.sendMessage('Vui lòng chỉ reply link hợp lệ!', event.threadID);

      if (url[0].indexOf('mocky.io') !== -1) {
        try {
          const response = await axios.get(url[0]);
          fs.writeFileSync(`${__dirname}/${name}.js`, response.data);
          return api.sendMessage(`✅ Đã thêm lệnh "${name}.js", dùng lệnh load để sử dụng!`, event.threadID);
        } catch (err) {
          return api.sendMessage(`❌ Lỗi: Không thể tải mã từ link`, event.threadID);
        }
      }
      
      return api.sendMessage('❌ Chỉ hỗ trợ link từ mocky.io', event.threadID);
    }

    if (!name) return api.sendMessage('⚠️ Vui lòng nhập tên file cần chia sẻ!', event.threadID);

    try {
      const fileName = name.endsWith('.js') ? name : `${name}.js`;
      const filePath = `${__dirname}/${fileName}`;
      
      if (!fs.existsSync(filePath)) {
        return api.sendMessage(`❌ Lệnh ${fileName} không tồn tại!`, event.threadID);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const response = await axios.post("https://api.mocky.io/api/mock", {
        status: 200,
        content: fileContent,
        content_type: "application/javascript",
        charset: "UTF-8",
        expiration: "never"
      });

      return api.sendMessage(`✅ Link chia sẻ cho ${fileName}:\n${response.data.link}`, event.threadID);
    } catch (err) {
      return api.sendMessage(`❌ Lỗi: ${err.message}`, event.threadID);
    }
  }
};