module.exports = {
    name: "load",
    info: "Tải lại một lệnh",
    onPrefix: true,
    usedby: 2,
    cooldowns: 0,

    onLaunch: async function({ target, actions, api, event }) {
        const fs = require('fs');
        let name = target[0];
        if (!name) return actions.reply('Vui lòng nhập tên lệnh!');

        try {
            let msg = "";
            const h = await actions.reply("Đang tải lại Module...");
            let count = 0;
            if (name === "all") {
                let errorCount = 0;
                let successCount = 0;
                let failedCommand = [];
                let successCommand = [];
                for (let file of fs.readdirSync(__dirname).filter(file => file.endsWith('.js'))) {
                    api.editMessage("Đang triển khai.....", h.messageID, event.threadID, event.messageID);
                    if (file === "load.js") continue;
                    try {
                        delete require.cache[require.resolve(__dirname + `/${file}`)];
                        let newCommand = require(__dirname + `/${file}`);
                        if (newCommand.name && typeof newCommand.name === 'string') {
                            successCount++;
                            successCommand.push(newCommand.name);
                            count++;
                            msg += `Đã tải ${count}. ${newCommand.name}\n`;
                        } else {
                            throw new Error('Cấu trúc lệnh không hợp lệ');
                        }
                    } catch (e) {
                        errorCount++;
                        failedCommand.push(file);
                        msg += `Không thể tải ${count + 1}. ${file} - ${e.message}\n`;
                    }
                }
                msg += `\nĐã tải thành công ${successCount} lệnh.\nKhông thể tải ${errorCount} lệnh.\n\n${failedCommand.join(", ")}`;
                actions.reply(msg);
                setTimeout(() => {
                    process.exit(1);
                }, 2000); 
                return;
            }

            if (!fs.existsSync(__dirname + `/${name}.js`)) return actions.reply('Tệp ' + name + ".js không tồn tại!");

            delete require.cache[require.resolve(__dirname + `/${name}.js`)];
            let newCommand = require(__dirname + '/' + name);
            if (newCommand.name && typeof newCommand.name === 'string') {
                console.log('Lệnh ' + name + ' đã được tải!');
                actions.reply('Lệnh ' + name + ' đã được tải!');
            } else {
                throw new Error('Cấu trúc lệnh không hợp lệ');
            }

            setTimeout(() => {
                process.exit(1);
            }, 2000); 
        } catch (s) {
            return actions.reply('Lỗi: ' + s.message);
        }
    }
};
