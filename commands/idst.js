module.exports = {
    name: "idst",
    info: "lấy ID sticker", 
    dev: "HNT",
    category: "Tiện Ích",
    usedby: 4,
    onPrefix: true,
    dmUser: true,
    usages: "[ID sticker] hoặc reply sticker\n- Reply sticker: Lấy thông tin và ID của sticker\n- ID sticker: Bot sẽ gửi sticker tương ứng",
    cooldowns: 0,
    onLaunch: async function ({ api, event, target }) {
        if (event.type == "message_reply") {
            if (event.messageReply.attachments && event.messageReply.attachments[0].type == "sticker") {
                const sticker = event.messageReply.attachments[0];
                let msg = `🏷️ ID Sticker: ${sticker.stickerID}\n`;
                if (sticker.description) msg += `📝 Mô tả: ${sticker.description}\n`;
                if (sticker.packID) msg += `📦 Pack ID: ${sticker.packID}\n`;
                
                return api.sendMessage({
                    body: msg
                }, event.threadID);
            } else {
                return api.sendMessage("❌ Vui lòng reply một sticker để xem thông tin.", event.threadID);
            }
        } else if (target[0]) {
            try {
                const stickerID = target[0];
                return api.sendMessage({
                    body: "🎯 Sticker của bạn đây:",
                    sticker: stickerID
                }, event.threadID);
            } catch (err) {
                return api.sendMessage("❌ ID sticker không hợp lệ hoặc không tồn tại!", event.threadID);
            }
        } else {
            return api.sendMessage("ℹ️ Hướng dẫn sử dụng:\n- Reply một sticker để xem thông tin\n- Gửi ID sticker để bot gửi lại sticker đó", event.threadID);
        }
    }
};
