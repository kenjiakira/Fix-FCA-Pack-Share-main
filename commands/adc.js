module.exports = {
  name: "adc",
  usedby: 2,
  info: "thêm lệnh và chia sẻ",
  onPrefix: true,
  cooldowns: 10,

  onLaunch: async function({ api, event, target }) {
    const axios = require('axios');
    const fs = require('fs');
    const request = require('request');
    const cheerio = require('cheerio');
    const { join, resolve } = require("path");
    const { senderID, threadID, messageID, messageReply, type } = event;
    var name = target[0];
    
    if (type == "message_reply") {
      var text = messageReply.body;
    }

    if (!text && !name) {
      return api.sendMessage('Vui lòng phản hồi tới liên kết mà bạn muốn áp dụng mã hoặc viết tên tệp để tải mã lên pastebin!', threadID, messageID);
    }

    if (!text && name) {
      var data = fs.readFile(
        `${__dirname}/${target[0]}.js`,
        "utf-8",
        async (err, data) => {
          if (err) return api.sendMessage(`Lệnh ${target[0]} không tồn tại!`, threadID, messageID);
          const { PasteClient } = require('pastebin-api');
          const client = new PasteClient("aeGtA7rxefvTnR3AKmYwG-jxMo598whT");

          async function pastepin(name) {
            const url = await client.createPaste({
              code: data,
              expireDate: 'N',
              format: "javascript",
              name: name,
              publicity: 1
            });
            var id = url.split('/')[3];
            return 'https://pastebin.com/raw/' + id;
          }

          var link = await pastepin(target[1] || 'noname');
          return api.sendMessage(link, threadID, messageID);
        }
      );
      return;
    }

    var urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    var url = text.match(urlR);

    if (url[0].indexOf('pastebin') !== -1) {
      axios.get(url[0]).then(i => {
        var data = i.data;
        fs.writeFile(
          `${__dirname}/${target[0]}.js`,
          data,
          "utf-8",
          function(err) {
            if (err) return api.sendMessage(`Đã xảy ra lỗi khi áp dụng mã ${target[0]}.js`, threadID, messageID);
            api.sendMessage(`Mã đã được áp dụng ${target[0]}.js, sử dụng lệnh load để sử dụng!`, threadID, messageID);
          }
        );
      });
    }

    if (url[0].indexOf('buildtool') !== -1 || url[0].indexOf('tinyurl.com') !== -1) {
      const options = {
        method: 'GET',
        url: messageReply.body
      };
      request(options, function(error, response, body) {
        if (error) return api.sendMessage('Vui lòng chỉ phản hồi tới liên kết (không chứa gì ngoài các liên kết)', threadID, messageID);
        const load = cheerio.load(body);
        load('.language-js').each((index, el) => {
          if (index !== 0) return;
          var code = el.children[0].data;
          fs.writeFile(`${__dirname}/${target[0]}.js`, code, "utf-8",
            function(err) {
              if (err) return api.sendMessage(`Đã xảy ra lỗi khi áp dụng mã mới cho "${target[0]}.js".`, threadID, messageID);
              return api.sendMessage(`Đã thêm mã này "${target[0]}.js", sử dụng lệnh load để sử dụng!`, threadID, messageID);
            }
          );
        });
      });
      return;
    }

    if (url[0].indexOf('drive.google') !== -1) {
      var id = url[0].match(/[-\w]{25,}/);
      const path = resolve(__dirname, `${target[0]}.js`);
      try {
        await utils.downloadFile(`https://drive.google.com/u/0/uc?id=${id}&export=download`, path);
        return api.sendMessage(`Đã thêm mã này "${target[0]}.js". Nếu có lỗi xảy ra, hãy đổi tệp drive sang định dạng txt!`, threadID, messageID);
      } catch (e) {
        return api.sendMessage(`Đã xảy ra lỗi khi áp dụng mã mới cho "${target[0]}.js".`, threadID, messageID);
      }
    }
  }
}
