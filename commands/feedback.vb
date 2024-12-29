module.exports.config = {
  name: "feedback",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "NTKhang, ManhG Fix Get and Refix bu Jonell",
  description: "Gửi phản hồi đến chủ sở hữu bot",
  commandCategory: "Phản hồi",
  usePrefix: false,
  usages: "[Nhập phản hồi của bạn để gửi cho chủ sở hữu bot]",
  cooldowns: 5
}, 

module.exports.handleReply = async function({
  api: e,
  args: n,
  event: a,
  Users: s,
  handleReply: o
}) {
  var i = await s.getNameUser(a.senderID);
  switch (o.type) {
      case "reply":
          var t = global.config.ADMINBOT;
          for (let n of t) e.sendMessage({
              body: "📄 Phản hồi từ " + i + ":\n" + a.body,
              mentions: [{
                  id: a.senderID,
                  tag: i
              }]
          }, n, ((e, n) => global.client.handleReply.push({
              name: this.config.name,
              messageID: n.messageID,
              messID: a.messageID,
              author: a.senderID,
              id: a.threadID,
              type: "calladmin"
          })));
          break;
      case "calladmin":
          e.sendMessage({
              body: `Phản hồi từ admin📌 ${i} đến bạn:\n--------\n${a.body}\n--------\n»💬Trả lời tin nhắn này để tiếp tục gửi báo cáo cho admin`,
              mentions: [{
                  tag: i,
                  id: a.senderID
              }]
          }, o.id, ((e, n) => global.client.handleReply.push({
              name: this.config.name,
              author: a.senderID,
              messageID: n.messageID,
              type: "reply"
          })), o.messID)
  }
},

module.exports.run = async function({
  api: e,
  event: n,
  args: a,
  Users: s,
  Threads: o
}) {
  if (!a[0]) return e.sendMessage("❌ | Bạn chưa nhập nội dung phản hồi", n.threadID, n.messageID);
  let i = await s.getNameUser(n.senderID);
  var t = n.senderID,
      d = n.threadID;
  let r = (await o.getData(n.threadID)).threadInfo;
  var l = require("moment-timezone").tz("Asia/Ho_Chi_Minh").format("HH:mm:ss D/MM/YYYY");
  e.sendMessage(`Vào lúc: ${l}\nPhản hồi của bạn đã được gửi tới các admin của bot`, n.threadID, (() => {
      var s = global.config.ADMINBOT;
      for (let o of s) {
          let s = r.threadName;
          e.sendMessage(`👤Phản hồi từ: ${i}\n👨‍👩‍👧‍👧Nhóm: ${s}\n🔰ID nhóm: ${d}\n🔷ID người dùng: ${t}\n----------------------------------\n⚠️Lỗi: ${a.join(" ")}\n----------------------------------\nThời gian: ${l}`, o, ((e, a) => global.client.handleReply.push({
              name: this.config.name,
              messageID: a.messageID,
              author: n.senderID,
              messID: n.messageID,
              id: d,
              type: "calladmin"
          })))
      }
  }))
};