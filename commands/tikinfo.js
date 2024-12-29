const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "tikinfo",
  dev: "Jonell Magallanes",
  usedby: 0,
  info: "Công cụ theo dõi người dùng TikTok",
  onPrefix: true,
  usage: "[tikinfo username]",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target }) {
    const tiktokusername = target[0];
    
    if (!tiktokusername) {
      return api.sendMessage("⚠️ Vui lòng cung cấp tên người dùng TikTok để theo dõi. Ví dụ: [tikinfo username]", event.threadID, event.messageID);
    }

    const checkMessage = await api.sendMessage("🔄 Đang lấy thông tin người dùng từ TikTok... Vui lòng đợi một chút.", event.threadID, event.messageID);

    try {
      const res = await axios.get(`https://ccexplorerapisjonell.vercel.app/api/tikstalk?unique_id=${tiktokusername}`);
      const data = res.data;

      const filePath = path.resolve(__dirname, 'cache', `${data.username}_avatar.jpg`);
      const writer = fs.createWriteStream(filePath);

      const avatarResponse = await axios({
        url: data.avatarLarger,
        method: 'GET',
        responseType: 'stream',
      });

      avatarResponse.data.pipe(writer);

      writer.on('finish', () => {
        api.sendMessage({
          body: `🎤 Người dùng TikTok 📱\n━━━━━━━━━━━━━━━━━━\n👤 ID: ${data.id}\n💬 Nickname: ${data.nickname}\n🖥️ Username: ${data.username}\n✍️ Signature: ${data.signature}\n🎥 Số video: ${data.videoCount}\n👥 Đang theo dõi: ${data.followingCount}\n👥 Người theo dõi: ${data.followerCount}\n❤️ Số tim: ${data.heartCount}\n━━━━━━━━━━━━━━━━━━\n🔍 Cập nhật từ TikTok!`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
          fs.unlinkSync(filePath);
        }, event.messageID);

        api.unsendMessage(checkMessage.messageID);
      });

      writer.on('error', (err) => {
        console.error("Không thể ghi tệp:", err);
        api.sendMessage("❌ Đã xảy ra lỗi trong quá trình tải ảnh đại diện từ TikTok. Vui lòng thử lại.", event.threadID, event.messageID);
        api.unsendMessage(checkMessage.messageID);
      });

    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng TikTok:", error.message);
      api.sendMessage("❌ Đã xảy ra lỗi khi lấy thông tin người dùng TikTok. Vui lòng thử lại sau.", event.threadID, event.messageID);
      api.unsendMessage(checkMessage.messageID);
    }
  }
};
