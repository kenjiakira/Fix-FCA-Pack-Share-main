/**
 * Auto-Reload Watcher cho Commands, Events, Canvas
 * Chỉ hoạt động trong development mode
 * 
 * Usage:
 * - Set NODE_ENV=development hoặc dùng flag --watch
 * - Tự động reload khi file thay đổi
 */

const fs = require('fs');
const path = require('path');
require('./polyfillWebGlobals');
const chalk = require('chalk');
const gradient = require('gradient-string');

// Kiểm tra xem có nên bật watch mode không
const shouldWatch = () => {
    const args = process.argv.slice(2);
    const hasWatchFlag = args.includes('--watch');
    const isDev = process.env.NODE_ENV === 'development';
    const autoReload = process.env.AUTO_RELOAD === 'true';
    
    return hasWatchFlag || isDev || autoReload;
};

// Debounce function để tránh reload quá nhiều lần
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Extract error location từ stack trace
const extractErrorLocation = (error, moduleName, type = 'command') => {
    try {
        const stackLines = error.stack.split('\n');
        const modulePattern = type === 'command' ? 
            new RegExp(`${moduleName}\\.js:(\\d+):(\\d+)`) : 
            new RegExp(`${type}s[\\\\/]${moduleName}\\.js:(\\d+):(\\d+)`);
        
        const locationLine = stackLines.find(line => modulePattern.test(line));
        
        if (locationLine) {
            const matches = locationLine.match(modulePattern);
            if (matches && matches.length >= 3) {
                return {
                    line: parseInt(matches[1]),
                    column: parseInt(matches[2]),
                    snippet: locationLine.trim()
                };
            }
        }
        
        return { snippet: 'Location not available' };
    } catch (err) {
        return { snippet: 'Error parsing location' };
    }
};

// Reload command
const reloadCommand = (cmdName, commandsDir) => {
    try {
        const cmdPath = path.join(commandsDir, `${cmdName}.js`);
        
        if (!fs.existsSync(cmdPath)) {
            console.log(chalk.red(`❌ [WATCH] Lệnh "${cmdName}" không tồn tại!`));
            return { success: false, error: 'NOT_FOUND' };
        }

        const resolvedPath = require.resolve(cmdPath);
        delete require.cache[resolvedPath];
        
        const newCommand = require(resolvedPath);

        if (!newCommand.name) {
            console.log(chalk.yellow(`⚠️  [WATCH] Lệnh "${cmdName}" thiếu thuộc tính name`));
            return { success: false, error: 'INVALID_STRUCTURE' };
        }

        if (!global.cc || !global.cc.module || !global.cc.module.commands) {
            console.log(chalk.red(`❌ [WATCH] global.cc.module.commands chưa được khởi tạo`));
            return { success: false, error: 'NOT_INITIALIZED' };
        }

        global.cc.module.commands[newCommand.name] = newCommand;
        console.log(chalk.green(`✅ [WATCH] Đã tải lại lệnh "${cmdName}"`));
        return { success: true };

    } catch (error) {
        const locationInfo = extractErrorLocation(error, cmdName, 'command');
        console.log(chalk.red(`❌ [WATCH] Lỗi khi tải lại lệnh "${cmdName}": ${error.message}`));
        if (locationInfo.line) {
            console.log(chalk.gray(`   → Dòng ${locationInfo.line}`));
        }
        return { 
            success: false, 
            error: 'RUNTIME_ERROR', 
            details: error.message,
            location: locationInfo
        };
    }
};

// Reload event
const reloadEvent = (evtName, eventsDir) => {
    try {
        const evtPath = path.join(eventsDir, `${evtName}.js`);
        
        if (!fs.existsSync(evtPath)) {
            console.log(chalk.red(`❌ [WATCH] Event "${evtName}" không tồn tại!`));
            return { success: false, error: 'NOT_FOUND' };
        }

        const resolvedPath = require.resolve(evtPath);
        delete require.cache[resolvedPath];
        
        const newEvent = require(resolvedPath);

        if (!newEvent.name) {
            console.log(chalk.yellow(`⚠️  [WATCH] Event "${evtName}" thiếu thuộc tính name`));
            return { success: false, error: 'INVALID_STRUCTURE' };
        }

        if (!global.cc || !global.cc.module || !global.cc.module.events) {
            console.log(chalk.red(`❌ [WATCH] global.cc.module.events chưa được khởi tạo`));
            return { success: false, error: 'NOT_INITIALIZED' };
        }

        global.cc.module.events[newEvent.name] = newEvent;
        console.log(chalk.green(`✅ [WATCH] Đã tải lại event "${evtName}"`));
        return { success: true };

    } catch (error) {
        const locationInfo = extractErrorLocation(error, evtName, 'event');
        console.log(chalk.red(`❌ [WATCH] Lỗi khi tải lại event "${evtName}": ${error.message}`));
        if (locationInfo.line) {
            console.log(chalk.gray(`   → Dòng ${locationInfo.line}`));
        }
        return { 
            success: false, 
            error: 'RUNTIME_ERROR', 
            details: error.message,
            location: locationInfo
        };
    }
};

// Reload canvas
const reloadCanvas = (canvasName, canvasDir) => {
    try {
        const canvasPath = path.join(canvasDir, `${canvasName}.js`);
        
        if (!fs.existsSync(canvasPath)) {
            console.log(chalk.red(`❌ [WATCH] Canvas "${canvasName}" không tồn tại!`));
            return { success: false, error: 'NOT_FOUND' };
        }

        const resolvedPath = require.resolve(canvasPath);
        delete require.cache[resolvedPath];
        
        const newCanvas = require(resolvedPath);

        if (typeof newCanvas !== 'object' && typeof newCanvas !== 'function') {
            console.log(chalk.yellow(`⚠️  [WATCH] Canvas "${canvasName}" không hợp lệ`));
            return { 
                success: false, 
                error: 'INVALID_STRUCTURE', 
                details: 'Canvas phải là một module hợp lệ' 
            };
        }

        if (!global.canvas) {
            global.canvas = {};
        }

        // Remove old functions
        if (typeof newCanvas === 'object') {
            Object.keys(newCanvas).forEach(key => {
                delete global.canvas[key];
            });
            Object.assign(global.canvas, newCanvas);
        } else if (typeof newCanvas === 'function') {
            const funcName = canvasName.replace(/Canvas$/, '').toLowerCase();
            delete global.canvas[funcName];
            global.canvas[funcName] = newCanvas;
        }

        if (global.canvas._cache) {
            delete global.canvas._cache;
        }

        console.log(chalk.green(`✅ [WATCH] Đã tải lại canvas "${canvasName}"`));
        return { success: true };

    } catch (error) {
        const locationInfo = extractErrorLocation(error, canvasName, 'canvas');
        console.log(chalk.red(`❌ [WATCH] Lỗi khi tải lại canvas "${canvasName}": ${error.message}`));
        if (locationInfo.line) {
            console.log(chalk.gray(`   → Dòng ${locationInfo.line}`));
        }
        return { 
            success: false, 
            error: 'RUNTIME_ERROR', 
            details: error.message,
            location: locationInfo
        };
    }
};

/**
 * Khởi động file watcher
 * @param {Object} options - Cấu hình watcher
 */
const startWatcher = (options = {}) => {
    if (!shouldWatch()) {
        return null; // Không bật watcher nếu không phải development mode
    }

    const commandsDir = options.commandsDir || path.join(__dirname, '../commands');
    const eventsDir = options.eventsDir || path.join(__dirname, '../events');
    const canvasDir = options.canvasDir || path.join(__dirname, '../game/canvas');
    const debounceTime = parseInt(process.env.AUTO_RELOAD_DEBOUNCE) || 500;

    // Sử dụng fs.watch (built-in Node.js) - không cần thêm dependency
    // Nếu muốn hiệu năng tốt hơn, có thể dùng chokidar
    let watchers = [];

    // Watch commands directory
    const watchCommands = () => {
        try {
            const watcher = fs.watch(commandsDir, { recursive: false }, (eventType, filename) => {
                if (!filename || !filename.endsWith('.js')) return;
                
                // Bỏ qua file load.js để tránh vòng lặp vô hạn
                if (filename === 'load.js') return;

                const cmdName = filename.replace('.js', '');
                
                debounce(() => {
                    console.log(chalk.cyan(`🔄 [WATCH] Phát hiện thay đổi: ${filename}`));
                    reloadCommand(cmdName, commandsDir);
                }, debounceTime)();
            });

            watchers.push({ type: 'commands', watcher, path: commandsDir });
            console.log(chalk.green(`👀 [WATCH] Đang theo dõi thư mục commands: ${commandsDir}`));
        } catch (error) {
            console.error(chalk.red(`❌ [WATCH] Lỗi khi watch commands: ${error.message}`));
        }
    };

    // Watch events directory
    const watchEvents = () => {
        try {
            const watcher = fs.watch(eventsDir, { recursive: false }, (eventType, filename) => {
                if (!filename || !filename.endsWith('.js')) return;

                const evtName = filename.replace('.js', '');
                
                debounce(() => {
                    console.log(chalk.cyan(`🔄 [WATCH] Phát hiện thay đổi: ${filename}`));
                    reloadEvent(evtName, eventsDir);
                }, debounceTime)();
            });

            watchers.push({ type: 'events', watcher, path: eventsDir });
            console.log(chalk.green(`👀 [WATCH] Đang theo dõi thư mục events: ${eventsDir}`));
        } catch (error) {
            console.error(chalk.red(`❌ [WATCH] Lỗi khi watch events: ${error.message}`));
        }
    };

    // Watch canvas directory
    const watchCanvas = () => {
        try {
            if (!fs.existsSync(canvasDir)) {
                console.log(chalk.yellow(`⚠️  [WATCH] Thư mục canvas không tồn tại: ${canvasDir}`));
                return;
            }

            const watcher = fs.watch(canvasDir, { recursive: false }, (eventType, filename) => {
                if (!filename || !filename.endsWith('.js')) return;

                const canvasName = filename.replace('.js', '');
                
                debounce(() => {
                    console.log(chalk.cyan(`🔄 [WATCH] Phát hiện thay đổi canvas: ${filename}`));
                    reloadCanvas(canvasName, canvasDir);
                }, debounceTime)();
            });

            watchers.push({ type: 'canvas', watcher, path: canvasDir });
            console.log(chalk.green(`👀 [WATCH] Đang theo dõi thư mục canvas: ${canvasDir}`));
        } catch (error) {
            console.error(chalk.red(`❌ [WATCH] Lỗi khi watch canvas: ${error.message}`));
        }
    };

    // Khởi động các watchers
    watchCommands();
    watchEvents();
    watchCanvas();

    console.log(chalk.bold(gradient.vice('\n━━━━━━━[ AUTO-RELOAD WATCHER ENABLED ]━━━━━━━━━━━')));
    console.log(chalk.gray('💡 Đang theo dõi thay đổi files. Auto-reload khi save file.\n'));

    // Trả về object để có thể stop watchers
    return {
        stop: () => {
            watchers.forEach(({ type, watcher }) => {
                watcher.close();
                console.log(chalk.yellow(`⏹️  [WATCH] Đã dừng watcher cho ${type}`));
            });
            watchers = [];
        },
        watchers
    };
};

module.exports = {
    startWatcher,
    shouldWatch,
    reloadCommand,
    reloadEvent,
    reloadCanvas
};

