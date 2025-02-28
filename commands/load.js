module.exports = {
    name: "load",
    info: "Load lệnh và events",
    onPrefix: true,
    category: "System",
    usedby: 2,
    cooldowns: 0,
    hide: true,
    noBot: true, 

    onLaunch: async function({ target, actions, api, event }) {
        const fs = require('fs');
        const path = require('path');
        const chalk = require('chalk');

        if (!target.length) {
            return actions.reply(
                "Sử dụng:\n" +
                "- load <tên lệnh/event> : Tải lại lệnh hoặc event cụ thể\n" +
                "- load Allcmd : Tải lại tất cả lệnh\n" +
                "- load Allevt : Tải lại tất cả events\n" +
                "- load All : Tải lại tất cả lệnh và events\n" +
                "Ví dụ: load help ping\n" +
                "       load busyEvent\n" +
                "       load Allcmd"
            );
        }

        const loadingMsg = await actions.reply("⏳ Đang tải lại Module...");
        let msg = "📋 Kết quả tải lại module:\n";
        
        const loadCommand = (cmdName) => {
            try {
                const cmdPath = require.resolve(__dirname + `/${cmdName}.js`);
                
                if (!fs.existsSync(cmdPath)) {
                    console.log(chalk.red(`❌ Lệnh "${cmdName}" không tồn tại!`));
                    return { success: false, error: 'NOT_FOUND' };
                }

                delete require.cache[cmdPath];
                const newCommand = require(cmdPath);

                if (!newCommand.name) {
                    return { success: false, error: 'INVALID_STRUCTURE' };
                }

                global.cc.module.commands[newCommand.name] = newCommand;
                console.log(chalk.green(`✅ Đã tải lại lệnh "${cmdName}"`));
                return { success: true };

            } catch (error) {
                return { success: false, error: 'RUNTIME_ERROR', details: error.message };
            }
        };

        const loadEvent = (evtName) => {
            try {
                const evtPath = require.resolve(path.join(__dirname, '../events', `${evtName}.js`));
                
                if (!fs.existsSync(evtPath)) {
                    console.log(chalk.red(`❌ Event "${evtName}" không tồn tại!`));
                    return { success: false, error: 'NOT_FOUND' };
                }

                delete require.cache[evtPath];
                const newEvent = require(evtPath);

                if (!newEvent.name) {
                    return { success: false, error: 'INVALID_STRUCTURE' };
                }

                global.cc.module.events[newEvent.name] = newEvent;
                console.log(chalk.green(`✅ Đã tải lại event "${evtName}"`));
                return { success: true };

            } catch (error) {
                return { success: false, error: 'RUNTIME_ERROR', details: error.message };
            }
        };

        const loadAll = async (type) => {
            let results = { success: [], errors: [] };
            
            if (type === 'cmd' || type === 'all') {
                const cmdFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
                for (const file of cmdFiles) {
                    if (file === 'load.js') continue;
                    const cmdName = file.slice(0, -3);
                    const result = loadCommand(cmdName);
                    if (result.success) results.success.push({ type: 'cmd', name: cmdName });
                    else results.errors.push({ type: 'cmd', name: cmdName, ...result });
                }
            }
            
            if (type === 'evt' || type === 'all') {
                const evtPath = path.join(__dirname, '../events');
                const evtFiles = fs.readdirSync(evtPath).filter(file => file.endsWith('.js'));
                for (const file of evtFiles) {
                    const evtName = file.slice(0, -3);
                    const result = loadEvent(evtName);
                    if (result.success) results.success.push({ type: 'evt', name: evtName });
                    else results.errors.push({ type: 'evt', name: evtName, ...result });
                }
            }
            
            return results;
        };

        if (['all', 'allcmd', 'allevt'].includes(target[0].toLowerCase())) {
            const type = target[0].toLowerCase() === 'allcmd' ? 'cmd' : 
                        target[0].toLowerCase() === 'allevt' ? 'evt' : 'all';
            
            const results = await loadAll(type);
            
            if (results.success.length > 0) {
                const cmdCount = results.success.filter(r => r.type === 'cmd').length;
                const evtCount = results.success.filter(r => r.type === 'evt').length;
                msg += `✅ Đã tải thành công:\n`;
                if (cmdCount > 0) msg += `- ${cmdCount} lệnh\n`;
                if (evtCount > 0) msg += `- ${evtCount} event\n\n`;
            }

            if (results.errors.length > 0) {
                msg += `❌ Lỗi ${results.errors.length} module:\n`;
                results.errors.forEach(err => {
                    const errorMsg = {
                        'NOT_FOUND': 'Không tìm thấy file',
                        'INVALID_STRUCTURE': 'Thiếu thuộc tính name',
                        'RUNTIME_ERROR': err.details
                    }[err.error];
                    msg += `- ${err.type === 'cmd' ? 'Lệnh' : 'Event'} ${err.name}: ${errorMsg}\n`;
                });
            }
        } else {
            for (const name of target) {
                // Try loading as command first
                let result = loadCommand(name);
                
                // If command not found, try loading as event
                if (result.error === 'NOT_FOUND') {
                    result = loadEvent(name);
                }

                if (result.success) {
                    msg += `✅ Đã tải lại thành công: ${name}\n`;
                } else {
                    const errorMsg = {
                        'NOT_FOUND': 'Không tìm thấy module',
                        'INVALID_STRUCTURE': 'Thiếu thuộc tính name',
                        'RUNTIME_ERROR': result.details
                    }[result.error];
                    msg += `❌ Lỗi khi tải ${name}: ${errorMsg}\n`;
                }
            }
        }

        api.editMessage(msg, loadingMsg.messageID);
    }
};
