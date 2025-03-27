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
                "- load canvas <tên canvas> : Tải lại canvas cụ thể\n" +
                "- load Allcanvas : Tải lại tất cả canvas\n" +
                "Ví dụ: load help ping\n" +
                "       load busyEvent\n" +
                "       load canvas petCanvas\n" +
                "       load Allcanvas"
            );
        }

        const loadingMsg = await actions.reply("⏳ Đang tải lại Module...");
        let msg = "📋 Kết quả tải lại module:\n";
        
        function extractErrorLocation(error, moduleName, type = 'command') {
            try {
                let stackLines = error.stack.split('\n');
                let modulePattern = type === 'command' ? 
                    new RegExp(`${moduleName}\\.js:(\\d+):(\\d+)`) : 
                    new RegExp(`events[\\\\/]${moduleName}\\.js:(\\d+):(\\d+)`);
                
                let locationLine = stackLines.find(line => modulePattern.test(line));
                
                if (locationLine) {
                    let matches = locationLine.match(modulePattern);
                    if (matches && matches.length >= 3) {
                        return {
                            line: parseInt(matches[1]),
                            column: parseInt(matches[2]),
                            snippet: locationLine.trim()
                        };
                    }
                }
                
                locationLine = stackLines.find(line => 
                    line.includes('.js:') && 
                    !line.includes('internal') && 
                    !line.includes('node:')
                );
                
                if (locationLine) {
                    return { snippet: locationLine.trim() };
                }
                
                return { snippet: 'Location not available' };
            } catch (err) {
                return { snippet: 'Error parsing location' };
            }
        }

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
                const locationInfo = extractErrorLocation(error, cmdName);
                return { 
                    success: false, 
                    error: 'RUNTIME_ERROR', 
                    details: error.message,
                    location: locationInfo
                };
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
                const locationInfo = extractErrorLocation(error, evtName, 'event');
                return { 
                    success: false, 
                    error: 'RUNTIME_ERROR', 
                    details: error.message,
                    location: locationInfo
                };
            }
        };

        const loadCanvas = (canvasName) => {
            try {
                const canvasPath = path.join(__dirname, '../game/canvas', `${canvasName}.js`);
                
                if (!fs.existsSync(canvasPath)) {
                    console.log(chalk.red(`❌ Canvas "${canvasName}" không tồn tại!`));
                    return { success: false, error: 'NOT_FOUND' };
                }

                delete require.cache[require.resolve(canvasPath)];
                const newCanvas = require(canvasPath);
 
                if (typeof newCanvas !== 'object' && typeof newCanvas !== 'function') {
                    return { success: false, error: 'INVALID_STRUCTURE', details: 'Canvas phải là một module hợp lệ' };
                }

                if (global.canvas) {
                    for (const key in newCanvas) {
                        if (typeof newCanvas[key] === 'function') {
                            global.canvas[key] = newCanvas[key];
                        }
                    }
                }

                console.log(chalk.green(`✅ Đã tải lại canvas "${canvasName}"`));
                return { success: true };

            } catch (error) {
                const locationInfo = extractErrorLocation(error, canvasName, 'canvas');
                return { 
                    success: false, 
                    error: 'RUNTIME_ERROR', 
                    details: error.message,
                    location: locationInfo
                };
            }
        };

        const results = {
            success: [],
            errors: []
        };

        if (target[0] === 'Allcmd') {
            const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const cmdName = file.replace('.js', '');
                const result = loadCommand(cmdName);
                
                if (result.success) {
                    results.success.push({ type: 'cmd', name: cmdName });
                } else {
                    results.errors.push({ type: 'cmd', name: cmdName, ...result });
                }
            }
            
            msg += `✅ Đã tải lại thành công ${results.success.length} lệnh!\n`;
            
        } else if (target[0] === 'Allevt') {
            const eventFiles = fs.readdirSync(path.join(__dirname, '../events')).filter(file => file.endsWith('.js'));
            
            for (const file of eventFiles) {
                const evtName = file.replace('.js', '');
                const result = loadEvent(evtName);
                
                if (result.success) {
                    results.success.push({ type: 'evt', name: evtName });
                } else {
                    results.errors.push({ type: 'evt', name: evtName, ...result });
                }
            }
            
            msg += `✅ Đã tải lại thành công ${results.success.length} events!\n`;
            
        } else if (target[0] === 'All') {
         
            const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const cmdName = file.replace('.js', '');
                const result = loadCommand(cmdName);
                
                if (result.success) {
                    results.success.push({ type: 'cmd', name: cmdName });
                } else {
                    results.errors.push({ type: 'cmd', name: cmdName, ...result });
                }
            }
            
            const eventFiles = fs.readdirSync(path.join(__dirname, '../events')).filter(file => file.endsWith('.js'));
            
            for (const file of eventFiles) {
                const evtName = file.replace('.js', '');
                const result = loadEvent(evtName);
                
                if (result.success) {
                    results.success.push({ type: 'evt', name: evtName });
                } else {
                    results.errors.push({ type: 'evt', name: evtName, ...result });
                }
            }
            
            msg += `✅ Đã tải lại thành công ${results.success.length} modules!\n`;
            
        } else if (target[0].toLowerCase() === 'canvas') {
            if (!target[1]) {
                return api.sendMessage("❌ Vui lòng nhập tên canvas cần tải lại!", event.threadID, event.messageID);
            }

            // Initialize global.canvas if not exists
            if (!global.canvas) {
                global.canvas = {};
            }

            const result = loadCanvas(target[1]);
            if (result.success) {
                msg += `✅ Đã tải lại canvas "${target[1]}" thành công\n`;
            } else {
                const errorMsg = {
                    'NOT_FOUND': 'Không tìm thấy canvas',
                    'INVALID_STRUCTURE': 'Canvas không hợp lệ: ' + (result.details || ''),
                    'RUNTIME_ERROR': result.details
                }[result.error];
                
                let locationInfo = '';
                if (result.error === 'RUNTIME_ERROR' && result.location) {
                    if (result.location.line) {
                        locationInfo = ` (dòng ${result.location.line})`;
                    }
                    if (result.location.snippet) {
                        locationInfo += `\n   → ${result.location.snippet}`;
                    }
                }
                
                msg += `❌ Lỗi khi tải canvas ${target[1]}: ${errorMsg}${locationInfo}\n`;
            }

        } else if (target[0] === 'Allcanvas') {
            const canvasDir = path.join(__dirname, '../game/canvas');
            if (!fs.existsSync(canvasDir)) {
                return api.sendMessage("❌ Thư mục canvas không tồn tại!", event.threadID, event.messageID);
            }

            if (!global.canvas) {
                global.canvas = {};
            }

            const canvasFiles = fs.readdirSync(canvasDir).filter(file => file.endsWith('.js'));
            let successCount = 0;
            let errorList = [];
            
            for (const file of canvasFiles) {
                const canvasName = file.replace('.js', '');
                const result = loadCanvas(canvasName);
                
                if (result.success) {
                    successCount++;
                } else {
                    errorList.push({
                        name: canvasName,
                        error: result.error,
                        details: result.details,
                        location: result.location
                    });
                }
            }
            
            msg += `✅ Đã tải lại ${successCount}/${canvasFiles.length} canvas\n`;
            
            if (errorList.length > 0) {
                msg += `❌ ${errorList.length} canvas lỗi:\n`;
                errorList.forEach(err => {
                    let errorMsg = {
                        'NOT_FOUND': 'Không tìm thấy file',
                        'INVALID_STRUCTURE': 'Canvas không hợp lệ: ' + (err.details || ''),
                        'RUNTIME_ERROR': err.details
                    }[err.error];
                    
                    if (err.error === 'RUNTIME_ERROR' && err.location) {
                        if (err.location.line) {
                            errorMsg += ` (dòng ${err.location.line})`;
                        }
                        if (err.location.snippet) {
                            errorMsg += `\n   → ${err.location.snippet}`;
                        }
                    }
                    
                    msg += `- Canvas ${err.name}: ${errorMsg}\n`;
                });
            }
        } else {
            for (const name of target) {
                let result;
                
                if (fs.existsSync(path.join(__dirname, '../events', `${name}.js`))) {
                    result = loadEvent(name);
                    if (result.success) {
                        msg += `✅ Đã tải lại event "${name}"\n`;
                    }
                } else {
                    result = loadCommand(name);
                    if (result.success) {
                        msg += `✅ Đã tải lại lệnh "${name}"\n`;
                    }
                }
                
                if (!result.success) {
                    const errorMsg = {
                        'NOT_FOUND': 'Không tìm thấy module',
                        'INVALID_STRUCTURE': 'Thiếu thuộc tính name',
                        'RUNTIME_ERROR': result.details
                    }[result.error];
                    
                    let locationInfo = '';
                    if (result.error === 'RUNTIME_ERROR' && result.location) {
                        if (result.location.line) {
                            locationInfo = ` (dòng ${result.location.line})`;
                        }
                        if (result.location.snippet) {
                            locationInfo += `\n   → ${result.location.snippet}`;
                        }
                    }
                    
                    msg += `❌ Lỗi khi tải ${name}: ${errorMsg}${locationInfo}\n`;
                }
            }
        }
        
        if (target[0] === 'Allcmd' || target[0] === 'Allevt' || target[0] === 'All') {
            if (results.errors.length > 0) {
                msg += `❌ Lỗi ${results.errors.length} module:\n`;
                results.errors.forEach(err => {
                    let errorMsg = {
                        'NOT_FOUND': 'Không tìm thấy file',
                        'INVALID_STRUCTURE': 'Thiếu thuộc tính name',
                        'RUNTIME_ERROR': err.details
                    }[err.error];
                    
                    if (err.error === 'RUNTIME_ERROR' && err.location) {
                        if (err.location.line) {
                            errorMsg += ` (dòng ${err.location.line})`;
                        }
                        if (err.location.snippet) {
                            errorMsg += `\n   → ${err.location.snippet}`;
                        }
                    }
                    
                    msg += `- ${err.type === 'cmd' ? 'Lệnh' : 'Event'} ${err.name}: ${errorMsg}\n`;
                });
            }
        }

        api.editMessage(msg, loadingMsg.messageID);
    }
};