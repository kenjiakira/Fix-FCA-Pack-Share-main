const fs = require('fs');

let bannedUsers = {};

try {
    bannedUsers = JSON.parse(fs.readFileSync('./database/ban/users.json'));
} catch (err) {
    console.error("Lỗi khi đọc tệp dữ liệu người dùng bị cấm:", err);
}

const saveBannedData = () => {
    fs.writeFileSync('./database/ban/users.json', JSON.stringify(bannedUsers, null, 2));
};

module.exports = {
    name: "users",
    usedby: 4,
    info: "Cấm hoặc bỏ cấm người dùng",
    onPrefix: true,
    cooldowns: 20,

    onLaunch: async function ({ event, target, api }) {
        let action = target[0];
        let targetID;

        if (event.type === 'message_reply') {
            targetID = event.messageReply.senderID;
        } else {
            return api.sendMessage("𝗕𝗮𝗻 𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝘀𝗲𝗿 𝗠𝗮𝗻𝗮𝗴𝗲𝗿\n━━━━━━━━━━━━━━━━━━\nVui lòng trả lời tin nhắn để cấm hoặc bỏ cấm người dùng.", event.threadID);
        }

        let userName;
        try {
            const userInfo = await api.getUserInfo(targetID);
            userName = userInfo[targetID].name;
        } catch (err) {
            console.error("Lỗi khi lấy thông tin người dùng:", err);
            return api.sendMessage("𝗕𝗮𝗻 𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝘀𝗲𝗿 𝗠𝗮𝗻𝗮𝗴𝗲𝗿\n━━━━━━━━━━━━━━━━━━\nKhông thể lấy thông tin người dùng.", event.threadID);
        }

        const reason = target.slice(1).join(' ') || "Không có lý do nào được cung cấp";

        if (!action || !targetID) {
            return api.sendMessage("𝗕𝗮𝗻 𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝘀𝗲𝗿 𝗠𝗮𝗻𝗮𝗴𝗲𝗿\n━━━━━━━━━━━━━━━━━━\nCách sử dụng: Trả lời một tin nhắn với lệnh `!ban` hoặc `!unban` theo sau là [lý do] để cấm/bỏ cấm một người dùng.", event.threadID);
        }

        if (action.toLowerCase() === 'ban') {
            bannedUsers[targetID] = { reason };
            saveBannedData();
            api.sendMessage(`𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲𝗱 𝗕𝗮𝗻𝗻𝗲𝗱 𝗦𝘆𝘀𝘁𝗲𝗺\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã bị cấm. Lý do: ${reason}`, event.threadID, () => {
                process.exit(1);
            });
        } else if (action.toLowerCase() === 'unban') {
            if (bannedUsers[targetID]) {
                delete bannedUsers[targetID];
                saveBannedData();
                api.sendMessage(`𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲𝗱 𝗨𝗻𝗯𝗮𝗻𝗻𝗲𝗱 𝗦𝘆𝘀𝘁𝗲𝗺\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã được bỏ cấm.`, event.threadID, () => {
                    process.exit(1);  
                });
            } else {
                api.sendMessage("𝗕𝗮𝗻 𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝗻𝗯𝗮𝗻𝗻𝗲𝗱 𝗦𝘆𝘀𝘁𝗲𝗺\n━━━━━━━━━━━━━━━━━━\nNgười dùng này không bị cấm.", event.threadID);
            }
        } else {
            return api.sendMessage("𝗕𝗮𝗻 𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝘀𝗲𝗿 𝗠𝗮𝗻𝗮𝗴𝗲𝗿\n━━━━━━━━━━━━━━━━━━\nHành động không hợp lệ. Sử dụng 'ban' để cấm một người dùng hoặc 'unban' để bỏ cấm một người dùng.", event.threadID);
        }
    }
};
