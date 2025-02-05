const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { handleNewMember } = require('../commands/setname');

async function sendWelcomeMessage(api, threadID, userName, threadName, memberNumber) {
    try {
        const configPath = path.join(__dirname, '../database/threadSettings.json');
        let settings = {};
        
        try {
            if (fs.existsSync(configPath)) {
                settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (err) {
            console.error("Error loading settings:", err);
        }

        if (settings[threadID] && !settings[threadID].notifications) {
            return;
        }

        let welcomeMessage = "🎉 Xin chào {userName}!\nChào mừng bạn đến với nhóm \"{threadName}\"!\nBạn là thành viên thứ {memberNumber} của nhóm này.";
        if (settings[threadID] && settings[threadID].welcomeMessage) {
            welcomeMessage = settings[threadID].welcomeMessage;
        }

        welcomeMessage = welcomeMessage
            .replace(/{userName}/g, userName)
            .replace(/{threadName}/g, threadName)
            .replace(/{memberNumber}/g, memberNumber);

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
                body: welcomeMessage,
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
        
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
            try {
                threadInfo = await api.getThreadInfo(threadID);
                if (threadInfo) break;
            } catch (err) {
                retries++;
                if (retries === maxRetries) {
                    console.error("Failed to get thread info after", maxRetries, "attempts");
                    threadInfo = { participantIDs: [] };
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                }
            }
        }

        const threadName = threadInfo?.threadName || `Nhóm ${threadID}`;
        const participantIDs = threadInfo?.participantIDs || [];
        const addedParticipants = event.logMessageData.addedParticipants;

        for (let newParticipant of addedParticipants) {
            const userID = newParticipant.userFbId;
            if (userID === api.getCurrentUserID()) continue;

            const userName = newParticipant.fullName || `Thành viên mới`;
            const memberNumber = participantIDs.length;

            await sendWelcomeMessage(api, threadID, userName, threadName, memberNumber);

         
            try {
                await handleNewMember(api, {
                    threadID: threadID,
                    participantIDs: [userID]
                });
            } catch (memberError) {
                console.error("Error handling new member:", memberError);
            }
        }
    } catch (error) {
        console.error("Error in handleLogSubscribe:", error);

    }
};

module.exports = { handleLogSubscribe };
