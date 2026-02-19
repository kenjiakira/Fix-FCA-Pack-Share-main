const fs = require('fs');
const path = require('path');

const RESTART_INTERVAL = 3.5 * 60 * 60 * 1000;

let restartTimer = null;
let apiInstance = null;
let startTime = null;

async function performRestart() {
    try {
        console.log('Auto Restart: Đang khởi động lại bot...');

        const restartInfo = {
            timestamp: Date.now(),
            type: 'auto',
            message: 'Bot đã tự động khởi động lại sau 3h30'
        };
        
        const restartFile = path.join(__dirname, '../database/autoRestart.json');
        fs.writeFileSync(restartFile, JSON.stringify(restartInfo, null, 2));
        
        if (apiInstance) {
            try {
                console.log('Auto Restart: Đã lưu thông tin restart');
            } catch (err) {
                console.error('Lỗi gửi thông báo restart:', err);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Auto Restart: Khởi động lại bot...');
        setImmediate(() => {
            setTimeout(() => {
                process.exit(1);
            }, 100);
        });
    } catch (error) {
        console.error('❌ Lỗi trong quá trình auto restart:', error);
    }
}

function startAutoRestart(api) {
    if (restartTimer) {
        clearInterval(restartTimer);
        restartTimer = null;
    }
    
    apiInstance = api;
    startTime = Date.now();

    const timeRemaining = RESTART_INTERVAL;
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    
    console.log(`✅ Auto Restart đã được khởi động (mỗi ${hours}h${minutes}m)`);
    console.log(`⏰ Bot sẽ tự động restart sau ${hours} giờ ${minutes} phút`);
    
    restartTimer = setInterval(async () => {
        await performRestart();
    }, RESTART_INTERVAL);
    
    return restartTimer;
}

function stopAutoRestart() {
    if (restartTimer) {
        clearInterval(restartTimer);
        restartTimer = null;
        console.log('⏸️ Auto Restart đã được dừng');
        return true;
    }
    return false;
}

function getAutoRestartInfo() {
    if (!restartTimer || !startTime) {
        return {
            enabled: false,
            timeRemaining: null,
            nextRestart: null
        };
    }
    
    const elapsed = Date.now() - startTime;
    const timeRemaining = RESTART_INTERVAL - elapsed;
    const nextRestart = new Date(Date.now() + timeRemaining);
    
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
    
    return {
        enabled: true,
        timeRemaining: {
            total: timeRemaining,
            hours: hours,
            minutes: minutes,
            seconds: seconds
        },
        nextRestart: nextRestart,
        interval: RESTART_INTERVAL
    };
}

module.exports = {
    startAutoRestart,
    stopAutoRestart,
    getAutoRestartInfo,
    performRestart
};

