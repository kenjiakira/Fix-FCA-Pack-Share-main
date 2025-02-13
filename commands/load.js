module.exports = {
    name: "load",
    info: "Load lệnh",
    onPrefix: true,
    usedby: 2,
    cooldowns: 0,
    hide: true,

    onLaunch: async function({ target, actions, api, event }) {
        const fs = require('fs');
        const chalk = require('chalk');

        if (!target.length) {
            return actions.reply(
                "Sử dụng:\n" +
                "- load <tên lệnh 1> <tên lệnh 2> ... : Tải lại nhiều lệnh\n" +
                "- load Allcmd : Tải lại tất cả lệnh\n" +
                "Ví dụ: load help ping\n" +
                "       load Allcmd"
            );
        }

        const loadingMsg = await actions.reply("⏳ Đang tải lại Module...");
        let msg = "📋 Kết quả tải lại lệnh:\n";
        
        const loadSingleCommand = (cmdName) => {
            try {
                const cmdPath = require.resolve(__dirname + `/${cmdName}.js`);
                
                if (!fs.existsSync(cmdPath)) {
                    console.log(chalk.red(`❌ Lệnh "${cmdName}" không tồn tại!`));
                    return { success: false, error: 'NOT_FOUND' };
                }

                delete require.cache[cmdPath];
                const newCommand = require(cmdPath);

                if (!newCommand.name || typeof newCommand.name !== 'string') {
                    console.log(chalk.yellow(`⚠️ Lệnh "${cmdName}" thiếu thuộc tính name!`));
                    return { success: false, error: 'INVALID_STRUCTURE' };
                }

                if (!newCommand.onLaunch || typeof newCommand.onLaunch !== 'function') {
                    console.log(chalk.yellow(`⚠️ Lệnh "${cmdName}" thiếu hàm onLaunch!`));
                    return { success: false, error: 'NO_ONLAUNCH' };
                }

                global.cc.module.commands[newCommand.name] = newCommand;
                console.log(chalk.green(`✅ Đã tải lại lệnh "${cmdName}"`));
                return { success: true };

            } catch (error) {
                console.log(chalk.red(`❌ Lỗi khi tải "${cmdName}":`, error.message));
                return { 
                    success: false, 
                    error: 'RUNTIME_ERROR',
                    details: error.message 
                };
            }
        };

        if (target[0].toLowerCase() === 'allcmd') { 
            console.log(chalk.blue('🔄 Đang tải lại tất cả lệnh...'));
            
            let successCount = 0;
            let errorCount = 0;
            let errors = [];

            const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
            
            for (const file of files) {
                if (file === 'load.js') continue;
                
                const cmdName = file.slice(0, -3);
                const result = loadSingleCommand(cmdName);

                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                    errors.push({
                        command: cmdName,
                        error: result.error,
                        details: result.details
                    });
                }
            }

            msg += `✅ Thành công: ${successCount} lệnh\n`;
            
            if (errorCount > 0) {
                msg += `❌ Thất bại: ${errorCount} lệnh\n\n`;
                msg += "📝 Chi tiết lỗi:\n";
                errors.forEach(err => {
                    const errorMessages = {
                        'NOT_FOUND': 'Không tìm thấy file',
                        'INVALID_STRUCTURE': 'Thiếu thuộc tính name',
                        'NO_ONLAUNCH': 'Thiếu hàm onLaunch',
                        'RUNTIME_ERROR': err.details
                    };
                    msg += `- ${err.command}: ${errorMessages[err.error]}\n`;
                });
            }

        } else {
            console.log(chalk.blue(`🔄 Đang tải lại ${target.length} lệnh...`));
            
            let results = {
                success: [],
                errors: []
            };

            for (const cmdName of target) {
                const result = loadSingleCommand(cmdName);
                
                if (result.success) {
                    results.success.push(cmdName);
                } else {
                    results.errors.push({
                        command: cmdName,
                        error: result.error,
                        details: result.details
                    });
                }
            }

            if (results.success.length > 0) {
                msg += `✅ Đã tải thành công ${results.success.length} lệnh:\n`;
                msg += results.success.map(cmd => `- ${cmd}`).join('\n') + '\n\n';
            }

            if (results.errors.length > 0) {
                msg += `❌ Lỗi ${results.errors.length} lệnh:\n`;
                results.errors.forEach(err => {
                    const errorMessages = {
                        'NOT_FOUND': 'Không tìm thấy file',
                        'INVALID_STRUCTURE': 'Thiếu thuộc tính name',
                        'NO_ONLAUNCH': 'Thiếu hàm onLaunch',
                        'RUNTIME_ERROR': err.details
                    };
                    msg += `- ${err.command}: ${errorMessages[err.error]}\n`;
                });
            }
        }

        api.editMessage(msg, loadingMsg.messageID);
    }
};
