const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function sendWelcomeMessage(api, threadID, userName, threadName, memberNumber) {
    try {
      
        const welcomeGifs = [
            "https://files.catbox.moe/kcbilv.gif",
            "https://files.catbox.moe/szphas.gif",

        ];

        const randomGif = welcomeGifs[Math.floor(Math.random() * welcomeGifs.length)];
        
        const response = await axios.get(randomGif, { responseType: 'arraybuffer' });
        const tempPath = path.join(__dirname, 'cache', `welcome_${Date.now()}.gif`);
        
        fs.writeFileSync(tempPath, Buffer.from(response.data));

        await api.sendMessage(
            {
                body: `🎉 Xin chào ${userName}!\nChào mừng bạn đến với nhóm "${threadName}"!\nBạn là thành viên thứ ${memberNumber} của nhóm này.\n\nChúc bạn vui vẻ khi tham gia nhóm nha! 😊`,
                attachment: fs.createReadStream(tempPath)
            },
            threadID
        );

        fs.unlinkSync(tempPath);

    } catch (error) {
        console.error("Error sending welcome message:", error);
   
        await api.sendMessage(
            `🎉 Xin chào ${userName}!\nChào mừng bạn đến với nhóm "${threadName}"!`,
            threadID
        );
    }
}

const handleLogSubscribe = async (api, event, adminConfig) => {
    try {
        if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
            try {
                await api.changeNickname(
                    `${adminConfig.botName} • [ ${adminConfig.prefix} ]`,
                    event.threadID,
                    api.getCurrentUserID()
                );
                
                return api.sendMessage(
                    `✅ 𝗕𝗼𝘁 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱\n━━━━━━━━━━━━━━━━━━\n${adminConfig.botName} Bot đã kết nối thành công!\nGõ "${adminConfig.prefix}help all" để xem toàn bộ lệnh.\n\nLiên hệ: ${adminConfig.ownerName}`,
                    event.threadID
                );
            } catch (error) {
                console.error("Error setting bot nickname:", error);
            }
        }

        const { threadID } = event;
        let threadInfo;
        try {
            threadInfo = await api.getThreadInfo(threadID);
        } catch (error) {
            console.error("Error getting thread info:", error);
            threadInfo = { participantIDs: [], threadName: "Unnamed group" };
        }

        let threadName = threadInfo.threadName || "Unnamed group";
        let { participantIDs } = threadInfo;
        let addedParticipants = event.logMessageData.addedParticipants;

        for (let newParticipant of addedParticipants) {
            let userID = newParticipant.userFbId;
            if (userID === api.getCurrentUserID()) continue;

            let userName = newParticipant.fullName || "Thành viên mới";
            const memberNumber = participantIDs.length;

            await sendWelcomeMessage(api, threadID, userName, threadName, memberNumber);
        }
    } catch (error) {
        console.error("Lỗi trong handleLogSubscribe:", error);
    }
};

module.exports = { handleLogSubscribe };
