const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { handleNewMember } = require('../commands/groups');

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
                
                const guideMsg = `=== [ BOT GUIDE ] ===\n\n`
                    + `👋 Xin chào! Tôi là ${adminConfig.botName}\n\n`
                    + `📝 HƯỚNG DẪN CƠ BẢN:\n\n`
                    + `1. Prefix của bot: ${adminConfig.prefix}\n`
                    + `2. Xem danh sách lệnh: ${adminConfig.prefix}help\n`
                    + `3. Xem chi tiết lệnh: ${adminConfig.prefix}help <tên lệnh>\n`
                    + `4. Xem theo danh mục: ${adminConfig.prefix}help và reply số\n`
                    + `5. Xem danh sách Game: ${adminConfig.prefix}game\n\n`
                    + `💡 MẸO HAY:\n`
                    + `• Đọc kỹ hướng dẫn trước khi dùng lệnh\n`
                    + `• Tham khảo ${adminConfig.prefix}help all để xem tất cả lệnh\n`
                    + `• Liên hệ admin nếu cần trợ giúp: ${adminConfig.ownerName}\n\n`
                    + `⚠️ LƯU Ý:\n`
                    + `• Không spam để tránh bị bot block\n`
                    + `• Tôn trọng bot và thành viên khác\n`
                    + `• Vui lòng sử dụng bot đúng mục đích\n\n`
                    + `[Gõ "${adminConfig.prefix}help" để xem chi tiết hơn]`;
                
                const botImages = [
                    "https://imgur.com/UXlo2NL.jpg",  
                    "https://imgur.com/x9y8nEb.jpg",  
                    "https://imgur.com/TgVrFvF.jpg"
            
                ];
                

                const randomImage = botImages[Math.floor(Math.random() * botImages.length)];

                try {
                    const cachePath = path.join(__dirname, 'cache');
                    if (!fs.existsSync(cachePath)) {
                        fs.mkdirSync(cachePath, { recursive: true });
                    }
                    
                    console.log(`Đang tải ảnh từ URL: ${randomImage}`);
                    
                    const response = await axios.get(randomImage, { 
                        responseType: 'arraybuffer',
                        timeout: 10000 
                    });
                    
                    if (!response || !response.data || !response.data.length) {
                        throw new Error("Dữ liệu ảnh trống hoặc không hợp lệ");
                    }
                    
                    const fileExt = randomImage.endsWith('.gif') ? 'gif' : 
                                   (randomImage.endsWith('.png') ? 'png' : 'jpg');
                    const tempPath = path.join(cachePath, `botWelcome_${Date.now()}.${fileExt}`);
                    
                    fs.writeFileSync(tempPath, Buffer.from(response.data));
                    
                    if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
                        throw new Error("File tạm không tồn tại hoặc kích thước bằng 0");
                    }
                    
                    console.log(`Đã tải ảnh thành công: ${tempPath}`);
                    
                    await api.sendMessage(
                        {
                            body: guideMsg,
                            attachment: fs.createReadStream(tempPath)
                        },
                        event.threadID
                    );
                    
                    setTimeout(() => {
                        try {
                            if (fs.existsSync(tempPath)) {
                                fs.unlinkSync(tempPath);
                            }
                        } catch (e) {
                            console.error("Error deleting temp file:", e);
                        }
                    }, 10000);
                    
                    return;
                } catch (imgError) {
                    console.error("Error sending welcome image:", imgError.message);
                    console.error("Stack trace:", imgError.stack);
                    
                    return api.sendMessage(guideMsg, event.threadID);
                }
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
