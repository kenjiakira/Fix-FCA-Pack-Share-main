const axios = require("axios");

module.exports = {
  name: "anon",
  usedby: 0,
  category: "Tools",
  info: "Gửi tin nhắn ẩn danh đến người dùng qua ngl.link",
  dev: "HNT",
  onPrefix: true,
  usages: "<tên người nhận> [nội dung]",
  cooldowns: 10,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID } = event;

    if (!target[0]) {
      return api.sendMessage(
        "🕊️ Gửi tin nhắn ẩn danh:\n\n" +
          "Cách dùng: anon <username> <nội dung>\n" +
          "Hoặc: anon <username> -c <số lần> <nội dung>\n\n" +
          "Ví dụ:\n" +
          "1. anon johndoe Hello!\n" +
          "2. anon johndoe -c 5 Hello!\n\n" +
          "Lưu ý:\n" +
          "- Username là tên ngl.link của người nhận\n" +
          "- Số lần gửi tối đa là 10 tin/lần\n" +
          "- Tin nhắn sẽ được gửi ẩn danh",
        threadID,
        messageID
      );
    }

    const username = target[0];
    let count = 1;
    let message;

    if (target[1] === "-c") {
      count = parseInt(target[2]);
      if (isNaN(count) || count < 1 || count > 10) {
        return api.sendMessage(
          "⚠️ Số lần gửi phải từ 1 đến 10!",
          threadID,
          messageID
        );
      }
      message = target.slice(3).join(" ");
    } else {
      message = target.slice(1).join(" ");
    }

    if (!message) {
      return api.sendMessage(
        "⚠️ Vui lòng nhập nội dung tin nhắn!",
        threadID,
        messageID
      );
    }

    try {
      const headers = {
        referer: `https://ngl.link/${username}`,
        "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      };

      const data = {
        username: username,
        question: message,
        deviceId: "anon-" + Math.random().toString(36).substr(2, 9),
        gameSlug: "",
        referrer: "",
      };

      let successCount = 0;
      const progressMsg = await api.sendMessage(
        "🕊️ Đang gửi tin nhắn...",
        threadID
      );

      for (let i = 0; i < count; i++) {
        try {
          const response = await axios.post(
            "https://ngl.link/api/submit",
            data,
            { headers }
          );
          if (response.status === 200) successCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch {
          continue;
        }
      }

      if (successCount > 0) {
        await api.editMessage({
          body:
            `✅ Đã gửi thành công!\n\n` +
            `📝 Nội dung: ${message}\n` +
            `👤 Đến: @${username}\n` +
            `📨 Số tin đã gửi: ${successCount}/${count}`,
          messageID: progressMsg.messageID,
          threadID: event.threadID,
        });
      } else {
        throw new Error("Không thể gửi tin nhắn");
      }

      setTimeout(() => api.unsendMessage(progressMsg.messageID), 10000);
    } catch (error) {
      return api.sendMessage(
        "❌ Lỗi: Không thể gửi tin nhắn. Vui lòng kiểm tra lại username hoặc thử lại sau!",
        threadID,
        messageID
      );
    }
  },
};
