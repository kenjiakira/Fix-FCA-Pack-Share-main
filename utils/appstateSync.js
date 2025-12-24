require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const gradient = require('gradient-string');

const APPSTATE_PATH = path.join(__dirname, '..', 'appstate.json');
const LAST_CHECK_FILE = path.join(__dirname, '..', '.appstate-last-check.json');

let checkInterval = null;
let lastContentHash = null;

function boldText(text) {
    return chalk.bold(text);
}

async function fetchAppStateFromURL(url, apiKey = null) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        
        if (apiKey) {
            headers['X-Master-Key'] = apiKey;
            console.log(boldText(gradient.cristal('🔑 Đang sử dụng API key')));
        } else {
            console.log(boldText(gradient.passion('⚠️ Không có API key, có thể cần cho private bin')));
        }
        
        console.log(boldText(gradient.cristal(`📥 Đang tải từ URL: ${url}`)));
        
        const response = await axios.get(url, {
            timeout: 30000,
            headers: headers,
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        if (response.status === 401) {
            console.error(boldText(gradient.passion('❌ Lỗi 401: Unauthorized')));
            console.error(boldText(gradient.passion('💡 Có thể do:')));
            console.error(boldText(gradient.passion('   - API key không đúng hoặc thiếu')));
            console.error(boldText(gradient.passion('   - Bin là private nhưng không có API key')));
            console.error(boldText(gradient.passion('   - API key đã hết hạn hoặc bị thu hồi')));
            if (apiKey) {
                console.error(boldText(gradient.passion(`   - API key hiện tại: ${apiKey.substring(0, 10)}...`)));
            }
            throw new Error(`401 Unauthorized - Kiểm tra API key trong .env (APPSTATE_SYNC_API_KEY)`);
        }
        
        if (response.status === 404) {
            throw new Error(`404 Not Found - URL không tồn tại: ${url}`);
        }
        
        if (response.status !== 200) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        
        let content = response.data;
        if (content && content.record) {
            content = content.record;
            console.log(boldText(gradient.cristal('✅ Đã tải thành công từ JSONBin.io')));
        } else if (content && content.data) {
            content = content.data;
            console.log(boldText(gradient.cristal('✅ Đã tải thành công (format có data wrapper)')));
        } else {
            console.log(boldText(gradient.cristal('✅ Đã tải thành công')));
        }
        
        if (typeof content === 'string') {
            content = content.trim();
        }
        
        return content;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const statusText = error.response.statusText;
            const data = error.response.data;
            
            console.error(boldText(gradient.passion(`❌ HTTP Error ${status}: ${statusText}`)));
            if (data) {
                console.error(boldText(gradient.passion(`📄 Response: ${JSON.stringify(data).substring(0, 200)}`)));
            }
            
            if (status === 401) {
                throw new Error(`401 Unauthorized - Kiểm tra APPSTATE_SYNC_API_KEY trong .env`);
            }
            throw new Error(`HTTP ${status}: ${statusText}`);
        }
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            throw error;
        }
        
        throw new Error(`Không thể tải từ URL: ${error.message}`);
    }
}

function validateAppState(content) {
    try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        
        if (!Array.isArray(parsed)) {
            throw new Error('Nội dung phải là một mảng JSON (array)');
        }
        
        for (const item of parsed) {
            if (!item.key || !item.value || !item.domain) {
                throw new Error('Cấu trúc appstate không hợp lệ');
            }
        }
        
        return parsed;
    } catch (error) {
        if (error.message.includes('JSON')) {
            throw new Error(`JSON không hợp lệ: ${error.message}`);
        }
        throw error;
    }
}

function getContentHash(content) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
}


function saveAppState(content) {
    try {
        const formatted = JSON.stringify(content, null, 4);
        fs.writeFileSync(APPSTATE_PATH, formatted, 'utf8');
        
        const hash = getContentHash(content);
        fs.writeFileSync(LAST_CHECK_FILE, JSON.stringify({ hash, timestamp: Date.now() }), 'utf8');
        lastContentHash = hash;
        
        return true;
    } catch (error) {
        throw new Error(`Không thể lưu file: ${error.message}`);
    }
}

function loadLastCheck() {
    try {
        if (fs.existsSync(LAST_CHECK_FILE)) {
            const data = JSON.parse(fs.readFileSync(LAST_CHECK_FILE, 'utf8'));
            return data.hash;
        }
    } catch (error) {
    }
    return null;
}

async function checkAndUpdateAppState(syncURL, apiKey = null, shouldRestart = false) {
    if (!syncURL) {
        return false;
    }

    try {
        console.log(boldText(gradient.cristal('🔄 Đang kiểm tra appstate từ URL...')));
        
        const content = await fetchAppStateFromURL(syncURL, apiKey);
        
        const validatedContent = validateAppState(content);
        
        const currentHash = getContentHash(validatedContent);
        const lastHash = lastContentHash || loadLastCheck();
        
        if (currentHash === lastHash) {
            console.log(boldText(gradient.cristal('✅ Appstate không có thay đổi')));
            return false;
        }
        
        console.log(boldText(gradient.retro('📥 Phát hiện appstate mới, đang cập nhật...')));
        
        saveAppState(validatedContent);
        
        console.log(boldText(gradient.retro('✅ Đã cập nhật appstate.json thành công!')));
        
        if (shouldRestart) {
            console.log(boldText(gradient.retro('🔄 Đang khởi động lại bot để áp dụng appstate mới...')));
            setTimeout(() => {
                process.exit(1);
            }, 2000);
        }
        
        return true;
        
    } catch (error) {
        console.error(boldText(gradient.passion('❌ Lỗi khi đồng bộ appstate:')), error.message);
        return false;
    }
}

async function checkAppStateBeforeLogin(syncURL, apiKey = null) {
    if (!syncURL) {
        return false;
    }

    try {
        console.log(boldText(gradient.cristal('🔍 Kiểm tra appstate trước khi đăng nhập...')));
        const updated = await checkAndUpdateAppState(syncURL, apiKey, true);
        return updated;
    } catch (error) {
        console.error(boldText(gradient.passion('❌ Lỗi kiểm tra appstate:')), error.message);
        return false;
    }
}

function startAppStateSync(syncURL, intervalMinutes = 5, apiKey = null) {
    if (!syncURL) {
        return;
    }

    console.log(boldText(gradient.cristal('🔄 Khởi động đồng bộ appstate từ URL...')));
    console.log(boldText(gradient.cristal(`📎 URL: ${syncURL}`)));
    console.log(boldText(gradient.cristal(`⏱️  Chu kỳ kiểm tra: ${intervalMinutes} phút`)));

    lastContentHash = loadLastCheck();
    
    checkAndUpdateAppState(syncURL, apiKey, false).catch(err => {
        console.error(boldText(gradient.passion('❌ Lỗi kiểm tra lần đầu:')), err.message);
    });
    
    const intervalMs = intervalMinutes * 60 * 1000;
    checkInterval = setInterval(async () => {
        try {
            const updated = await checkAndUpdateAppState(syncURL, apiKey, true);
            if (updated) {
                console.log(boldText(gradient.retro('🔄 Bot sẽ tự động restart sau 2 giây...')));
            }
        } catch (err) {
            console.error(boldText(gradient.passion('❌ Lỗi kiểm tra định kỳ:')), err.message);
        }
    }, intervalMs);
    
    console.log(boldText(gradient.cristal(`✅ Đã bật đồng bộ appstate (tự động kiểm tra mỗi ${intervalMinutes} phút)`)));
    console.log(boldText(gradient.retro('🔄 Tự động restart khi phát hiện appstate mới')));
}

module.exports = {
    startAppStateSync,
    checkAndUpdateAppState,
    checkAppStateBeforeLogin
};

