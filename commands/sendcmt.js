module.exports = {
    name: "sendcmt",
    usedby: 4,
    category: "Tiện Ích",
    info: "Gửi bình luận vào bài viết bằng bot",
    onPrefix: true,
    dev: "Jonell Magallanes",
    cooldowns: 5,
  
    onLaunch: async function ({ api, event, target }) {
      if (target.length < 2) {
        return api.sendMessage("Cú pháp: sendcmt [URL] [bình luận]", event.threadID, event.messageID);
      }
  
      const sending = await api.sendMessage("Đang gửi bình luận...", event.threadID, event.messageID);
      const url = target[0];
      const comment = target.slice(1).join(" ");
  
      const regexPfbid = /pfbid\w+/;
      const regexPostSegment = /\/posts\/(\w+)/;
      const regexGroupID = /\/groups\/[^/]+\/permalink\/(\d+)/;
      const regexSharePost = /\share\/p\/([\w\d]+)/;
  
      let postID = url.match(regexPfbid);

      if (!postID) {
          let match = url.match(regexPostSegment);
          if (!match) {
              match = url.match(regexGroupID);
          }
          if (!match) {
              match = url.match(regexSharePost)
          }
          postID = match ? match[1] : null;
      } else {
          postID = postID[0];
      }

      api.editMessage("Đang trích xuất URL bài viết thành POST ID", sending.messageID, event.threadID, event.messageID);
  
      if (!postID) {
        return api.editMessage("URL không hợp lệ. Vui lòng cung cấp một URL bài viết Facebook hợp lệ.", sending.messageID, event.threadID, event.messageID);
      }
  
      try {
        await api.sendComment(comment, postID);
        api.editMessage(`Bình luận đã gửi thành công!\nPOST ID: ${postID}\n━━━━━━━━━━━━━━━━━━\n`, sending.messageID, event.threadID, event.messageID);
      } catch (error) {
        api.editMessage(error.message, sending.messageID, event.threadID, event.messageID);
      }
    }
  }
  