const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');
const { image } = require('image-downloader');

module.exports = {
  name: 'removebg',
  info: 'Tách nền ảnh',
  dev: 'HNT',
  usedby: 0,
  onPrefix: false,
  dmUser: false,
  nickName: ['removebg'],
  usages: 'Reply ảnh để tách Background',
  cooldowns: 5,

  onLaunch: async function ({ api, event, actions }) {
    const successMessage = `━━『 TÁCH NỀN ẢNH 』━━
[🎯] → Tách nền ảnh thành công!
[💝] → Ảnh đã được xử lý và loại bỏ background
[⚜️] → Chúc bạn một ngày tốt lành!`;

    if (event.type !== "message_reply") {
      return await actions.reply("━━『 LỖI 』━━\n[❗] → Vui lòng reply một ảnh để thực hiện tách nền.");
    }

    if (!event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return await actions.reply("━━『 LỖI 』━━\n[❗] → Bạn cần reply một ảnh để sử dụng lệnh.");
    }

    if (event.messageReply.attachments[0].type !== "photo") {
      return await actions.reply("━━『 LỖI 』━━\n[❗] → File bạn reply không phải là ảnh.");
    }

    const content = event.messageReply.attachments[0].url;
    const KeyApi = [
      "t4Jf1ju4zEpiWbKWXxoSANn4",
      "CTWSe4CZ5AjNQgR8nvXKMZBd",
      "PtwV35qUq557yQ7ZNX1vUXED",
      "wGXThT64dV6qz3C6AhHuKAHV",
      "82odzR95h1nRp97Qy7bSRV5M",
      "4F1jQ7ZkPbkQ6wEQryokqTmo",
      "sBssYDZ8qZZ4NraJhq7ySySR",
      "NuZtiQ53S2F5CnaiYy4faMek",
      "f8fujcR1G43C1RmaT4ZSXpwW"
    ];
    
    const inputPath = path.resolve(__dirname, 'cache', 'photo.png');
    const outputPath = path.resolve(__dirname, 'cache', 'photo_removed_bg.png');

    try {
      
      const waitMessage = await actions.reply("━━『 ĐANG XỬ LÝ 』━━\n[⏳] → Đang tách nền ảnh...\n[💫] → Vui lòng chờ trong giây lát!");

      await image({ url: content, dest: inputPath });

      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('image_file', fs.createReadStream(inputPath), path.basename(inputPath));

      const response = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: formData,
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': KeyApi[Math.floor(Math.random() * KeyApi.length)],
        },
        encoding: null
      });

      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      fs.writeFileSync(outputPath, response.data);

      await actions.reply({ body: successMessage, attachment: fs.createReadStream(outputPath) });

      setTimeout(() => {
        api.unsendMessage(waitMessage.messageID);
      }, 3000); 

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

    } catch (error) {
      console.error('Lỗi:', error);
      
      await actions.reply(`━━『 LỖI XỬ LÝ 』━━\n[❗] → Đã xảy ra lỗi: ${error.message}\n[💠] → Vui lòng thử lại sau hoặc liên hệ admin.`);

      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      
      if (waitMessage && waitMessage.messageID) {
        api.unsendMessage(waitMessage.messageID);
      }
    }
  }
};
