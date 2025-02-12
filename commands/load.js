module.exports = {
    name: "load",
    info: "Tải lại một lệnh",
    onPrefix: false,
    usedby: 2,
    cooldowns: 0,
    hide: true,

    onLaunch: async function({ target, actions, api, event }) {
        const fs = require('fs');
        const name = target[0];
        if (!name) return actions.reply('Vui lòng nhập tên lệnh!');

        try {
            let msg = "";
            const loadingMsg = await actions.reply("Đang tải lại Module...");
            
            if (name === "all") {
                let errorCount = 0;
                let successCount = 0;
                let failedCommands = [];
                let successCommands = [];

                const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
                for (const file of files) {
                    if (file === "load.js") continue;
                    
                    try {
                        delete require.cache[require.resolve(__dirname + `/${file}`)];
                        const newCommand = require(__dirname + `/${file}`);
                        
                        if (newCommand.name && typeof newCommand.name === 'string') {
                           
                            global.cc.module.commands[newCommand.name] = newCommand;
                            successCount++;
                            successCommands.push(newCommand.name);
                        } else {
                            throw new Error('Cấu trúc lệnh không hợp lệ');
                        }
                    } catch (e) {
                        errorCount++;
                        failedCommands.push(file);
                        console.error(`Lỗi khi tải ${file}:`, e);
                    }
                }

                msg = `Kết quả tải lại lệnh:\n`;
                msg += `✅ Thành công: ${successCount} lệnh\n`;
                if (successCommands.length) msg += `📝 Các lệnh đã tải: ${successCommands.join(", ")}\n`;
                if (errorCount > 0) {
                    msg += `❌ Thất bại: ${errorCount} lệnh\n`;
                    msg += `⚠️ Các lệnh lỗi: ${failedCommands.join(", ")}`;
                }

            } else {
                if (!fs.existsSync(__dirname + `/${name}.js`)) {
                    return api.editMessage(`❌ Lệnh "${name}" không tồn tại!`, loadingMsg.messageID);
                }

                try {
                    delete require.cache[require.resolve(__dirname + `/${name}.js`)];
                    const newCommand = require(__dirname + `/${name}.js`);
                    
                    if (newCommand.name && typeof newCommand.name === 'string') {
                 
                        global.cc.module.commands[newCommand.name] = newCommand;
                        msg = `✅ Đã tải lại thành công lệnh "${name}"`;
                    } else {
                        throw new Error('Cấu trúc lệnh không hợp lệ');
                    }
                } catch (e) {
                    msg = `❌ Lỗi khi tải lại lệnh "${name}": ${e.message}`;
                }
            }

            api.editMessage(msg, loadingMsg.messageID);

        } catch (error) {
            return actions.reply(`❌ Đã xảy ra lỗi: ${error.message}`);
        }
    }
};
