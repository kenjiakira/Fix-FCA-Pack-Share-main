const fs = require('fs');
const path = require('path');

module.exports = {
    name: "onprefix",
    usedby: 2,
    category: "System",
    dmUser: false,
    dev: "Jonell Magallanes",
    info: "Chuyển trạng thái onPrefix của bất kỳ lệnh nào đó",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function ({ api, event, target }) {
        const threadID = event.threadID;
        const commandName = target[1];
        const newState = target[0] === "true" ? true : false;

        if (commandName) {
            const filePath = path.join(__dirname, `${commandName}.js`);

            if (fs.existsSync(filePath)) {
                const confirmationMessage = `⚠️ 𝗖𝗼𝗻𝗳𝗶𝗿𝗺 𝗖𝗵𝗮𝗻𝗴𝗶𝗻𝗴 𝗼𝗻𝗣𝗿𝗲𝗳𝗶𝘅\nBạn có muốn thay đổi trạng thái "onPrefix" của "${commandName}" thành ${newState}? Phản ứng (👍) để xác nhận hoặc (👎) để hủy bỏ.`;
                const sentMessage = await api.sendMessage(confirmationMessage, threadID);

                global.client.callReact.push({
                    name: this.name,
                    messageID: sentMessage.messageID,
                    commandName: commandName,
                    newState: newState,
                    action: 'toggleOnPrefix'
                });
            } else {
                await api.sendMessage(`❌ Lệnh "${commandName}" không tồn tại.`, threadID);
            }
        } else {
            await api.sendMessage("Cách sử dụng: -onPrefix [true|false] [tên lệnh]", threadID);
        }
    },

    callReact: async function ({ reaction, event, api }) {
        const { threadID, messageID } = event;
        const reactData = global.client.callReact.find(item => item.messageID === messageID);

        if (!reactData) return;

        const { commandName, newState, action, messageID: sentMessageID } = reactData;
        await api.unsendMessage(sentMessageID);

        if (reaction === '👍') {
            if (action === 'toggleOnPrefix') {
                const filePath = path.join(__dirname, `${commandName}.js`);

                if (fs.existsSync(filePath)) {
                    let commandFileContent = fs.readFileSync(filePath, 'utf-8');
                    commandFileContent = commandFileContent.replace(/onPrefix:\s*(true|false)/, `onPrefix: ${newState}`);

                    fs.writeFileSync(filePath, commandFileContent);
                    global.cc.reload[commandName];

                    const bold = global.fonts.bold("✅ Thay đổi onPrefix thành công");

                    await api.sendMessage(`${bold}\n${global.line}\nĐã thay đổi trạng thái "onPrefix" của "${commandName}" thành ${newState} thành công.`, threadID);
                } else {
                    await api.sendMessage(`❌ Lệnh "${commandName}" không tồn tại.`, threadID);
                }
            }
        } else if (reaction === '👎') {
            await api.sendMessage(`❌ Hành động thay đổi trạng thái "onPrefix" cho "${commandName}" đã bị hủy.`, threadID);
        }
    }
};
