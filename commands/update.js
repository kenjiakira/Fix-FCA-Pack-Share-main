const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const updatesPath = path.join(__dirname, '../database/json/updates.json');

const adminPath = path.join(__dirname, '../admin.json');

function loadAdminData() {
    try {
        if (fs.existsSync(adminPath)) {
            return JSON.parse(fs.readFileSync(adminPath, 'utf8'));
        } else {
            console.error('Admin file not found');
            return { adminUIDs: [] };
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
        return { adminUIDs: [] };
    }
}

function loadUpdates() {
    try {
        if (fs.existsSync(updatesPath)) {
            return JSON.parse(fs.readFileSync(updatesPath, 'utf8'));
        } else {
            const defaultData = {
                lastModified: Date.now(),
                updates: []
            };
            fs.mkdirSync(path.dirname(updatesPath), { recursive: true });
            fs.writeFileSync(updatesPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
    } catch (error) {
        console.error('Error loading updates:', error);
        return {
            lastModified: Date.now(),
            updates: []
        };
    }
}

function saveUpdates(data) {
    try {
        fs.mkdirSync(path.dirname(updatesPath), { recursive: true });
        fs.writeFileSync(updatesPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving updates:', error);
        return false;
    }
}

function addUpdate(type, title, description, adminOnly = false) {
    const data = loadUpdates();
    
    data.updates.unshift({
        id: Date.now().toString(),
        type: type, 
        title: title,
        description: description,
        date: Date.now(),
        adminOnly: adminOnly
    });
    
    data.lastModified = Date.now();
    saveUpdates(data);
}

module.exports = {
    name: "update",
    dev: "HNT",
    usedby: 0,
    category: "System",
    info: "Hiển thị các cập nhật mới trong 7 ngày gần nhất",
    onPrefix: true,
    usages: "update [add/list/del/view/pull] [userID]",
    cooldowns: 5,

    onLaunch: async ({ api, event, target }) => {
        const { threadID, senderID, messageID } = event;
        const adminData = loadAdminData();
        const isAdmin = Array.isArray(adminData.adminUIDs) && adminData.adminUIDs.includes(senderID);
        
        if (!target[0]) {
            return showUpdates(api, threadID, senderID, messageID, isAdmin);
        }

        const command = target[0].toLowerCase();

        if (isAdmin) {
            switch (command) {
                case "add": {
                    const type = target[1];
                    const title = target[2] || "Cập nhật mới";
                    const description = target.slice(3).join(" ");
                    const adminOnly = false;
                    
                    if (!type || !title) {
                        return api.sendMessage(
                            "⚠️ Thiếu thông tin! Sử dụng:\n" +
                            "update add loại tiêu_đề\n\n" +
                            "Loại: feature, bugfix, improvement, security\n" +
                            "Ví dụ:\n" +
                            "update add feature \"Thêm tính năng mới\"",
                            threadID, messageID
                        );
                    }
                    
                    addUpdate(type, title, description || title, adminOnly);
                    return api.sendMessage("✅ Đã thêm cập nhật mới!", threadID, messageID);
                }
                
                case "del": {
                    const updateId = target[1];
                    if (!updateId) {
                        return api.sendMessage("⚠️ Vui lòng cung cấp ID cập nhật cần xóa!", threadID, messageID);
                    }
                    
                    const data = loadUpdates();
                    const updateIndex = data.updates.findIndex(update => update.id === updateId);
                    
                    if (updateIndex === -1) {
                        return api.sendMessage(`❌ Không tìm thấy cập nhật với ID: ${updateId}`, threadID, messageID);
                    }
                    
                    data.updates.splice(updateIndex, 1);
                    data.lastModified = Date.now();
                    saveUpdates(data);
                    
                    return api.sendMessage("✅ Đã xóa cập nhật!", threadID, messageID);
                }
                
                case "list": {
                    const data = loadUpdates();
                    if (data.updates.length === 0) {
                        return api.sendMessage("❌ Chưa có cập nhật nào được thêm vào!", threadID, messageID);
                    }
                    
                    let msg = "📋 Danh sách tất cả cập nhật:\n\n";
                    data.updates.forEach((update, index) => {
                        msg += `${index + 1}. [${update.id}] ${update.title}\n`;
                        msg += `📅 ${new Date(update.date).toLocaleDateString()}\n`;
                        msg += `🔒 Admin: ${update.adminOnly ? "Có" : "Không"}\n`;
                        msg += `ℹ️ ${update.description.substring(0, 50)}${update.description.length > 50 ? "..." : ""}\n\n`;
                    });
                    
                    return api.sendMessage(msg, threadID, messageID);
                }
                
                case "view": {
                    const userId = target[1];
                    if (!userId) {
                        return api.sendMessage("⚠️ Vui lòng cung cấp ID người dùng!", threadID, messageID);
                    }
                    
                    return showUpdates(api, threadID, userId, messageID, false);
                }
                
                case "pull":
                case "sync": {
                    const loadingMsg = await api.sendMessage("⏳ Đang cập nhật code từ Git...", threadID);
                    
                    try {
                        const isGitRepo = fs.existsSync(path.join(__dirname, '../.git'));
                        if (!isGitRepo) {
                            api.unsendMessage(loadingMsg.messageID);
                            return api.sendMessage(
                                "❌ Thư mục này chưa được khởi tạo Git!\n" +
                                "💡 Vui lòng clone repo từ GitHub trước.",
                                threadID, messageID
                            );
                        }
                        
                        let currentBranch;
                        try {
                            currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
                                cwd: path.join(__dirname, '../'),
                                encoding: 'utf8'
                            }).trim();
                        } catch (err) {
                            api.unsendMessage(loadingMsg.messageID);
                            return api.sendMessage(
                                "❌ Không thể xác định branch hiện tại!",
                                threadID, messageID
                            );
                        }
                        
                        try {
                            execSync('git stash push -m "Auto-stash before update"', {
                                cwd: path.join(__dirname, '../'),
                                stdio: 'ignore'
                            });
                        } catch (err) {
                        }
                        
                        execSync('git fetch origin', {
                            cwd: path.join(__dirname, '../'),
                            encoding: 'utf8'
                        });
                        
                        const pullOutput = execSync(`git pull origin ${currentBranch}`, {
                            cwd: path.join(__dirname, '../'),
                            encoding: 'utf8'
                        });
                        
                        let needInstall = false;
                        try {
                            const changedFiles = execSync('git diff HEAD@{1} HEAD --name-only', {
                                cwd: path.join(__dirname, '../'),
                                encoding: 'utf8'
                            });
                            if (changedFiles.includes('package.json')) {
                                needInstall = true;
                            }
                        } catch (err) {
            
                        }
                        
                        let resultMsg = `✅ Đã cập nhật code thành công!\n\n`;
                        resultMsg += `🌿 Branch: ${currentBranch}\n`;
                        resultMsg += `📥 Output:\n${pullOutput.substring(0, 500)}${pullOutput.length > 500 ? '...' : ''}\n`;
                        
                        if (needInstall) {
                            resultMsg += `\n📦 Phát hiện thay đổi package.json\n`;
                            resultMsg += `💡 Vui lòng chạy 'npm install' để cài đặt dependencies mới`;
                        }
                        
                        api.unsendMessage(loadingMsg.messageID);
                        return api.sendMessage(resultMsg, threadID, messageID);
                        
                    } catch (err) {
                        api.unsendMessage(loadingMsg.messageID);
                        return api.sendMessage(
                            `❌ Lỗi khi cập nhật code:\n${err.message}\n\n` +
                            `💡 Kiểm tra lại:\n` +
                            `1. Kết nối mạng\n` +
                            `2. Quyền truy cập Git\n` +
                            `3. Có conflict cần giải quyết`,
                            threadID, messageID
                        );
                    }
                }
            }
        }
        
        // Show the updates for both admin and users 
        // if they don't use any special command or use an invalid command
        return showUpdates(api, threadID, senderID, messageID, isAdmin);
    }
};

// Function to show updates
function showUpdates(api, threadID, userID, messageID, isAdmin) {
    const data = loadUpdates();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Filter updates from the last 7 days
    // If admin, show all updates from the last 7 days
    // If user, only show non-admin updates from the last 7 days
    const recentUpdates = data.updates.filter(update => 
        update.date >= sevenDaysAgo && (isAdmin || !update.adminOnly)
    );
    
    if (recentUpdates.length === 0) {
        return api.sendMessage(
            "📢 Không có cập nhật nào trong 7 ngày qua!" +
            (isAdmin ? "\n\nBạn có thể thêm cập nhật mới bằng lệnh:\nupdate add [loại] [tiêu đề] [mô tả]" : ""),
            threadID, messageID
        );
    }
    
    // Group updates by type
    const updatesByType = {};
    recentUpdates.forEach(update => {
        if (!updatesByType[update.type]) {
            updatesByType[update.type] = [];
        }
        updatesByType[update.type].push(update);
    });
    
    let msg = "╭─「 UPGRADE NOTES 」─╮\n\n";
    
    if (updatesByType['feature']) {
        msg += "✨ TÍNH NĂNG MỚI:\n";
        updatesByType['feature'].forEach(update => {
            msg += `• ${update.title}: ${update.description}\n`;
            msg += `  📅 ${new Date(update.date).toLocaleDateString()}\n`;
        });
        msg += "\n";
    }
    
    if (updatesByType['improvement']) {
        msg += "🔄 CẢI TIẾN:\n";
        updatesByType['improvement'].forEach(update => {
            msg += `• ${update.title}: ${update.description}\n`;
            msg += `  📅 ${new Date(update.date).toLocaleDateString()}\n`;
        });
        msg += "\n";
    }
    
    if (updatesByType['bugfix']) {
        msg += "🛠️ SỬA LỖI:\n";
        updatesByType['bugfix'].forEach(update => {
            msg += `• ${update.title}: ${update.description}\n`;
            msg += `  📅 ${new Date(update.date).toLocaleDateString()}\n`;
        });
        msg += "\n";
    }
    
    Object.keys(updatesByType).forEach(type => {
        if (!['feature', 'improvement', 'bugfix'].includes(type)) {
            const emoji = type === 'security' ? '🔒' : '📝';
            msg += `${emoji} ${type.toUpperCase()}:\n`;
            updatesByType[type].forEach(update => {
                msg += `• ${update.title}: ${update.description}\n`;
                msg += `  📅 ${new Date(update.date).toLocaleDateString()}\n`;
            });
            msg += "\n";
        }
    });
    
    msg += "╰──────────────╯";
    
    if (isAdmin) {
        msg += "\n\n👑 ADMIN COMMANDS:\n";
        msg += "• update add loại tiêu_đề mô_tả\n";
        msg += "• update del [id]\n";
        msg += "• update list\n";
        msg += "• update view [userID]\n";
        msg += "• update pull - Cập nhật code từ Git\n";
        msg += "\nLoại: feature, bugfix, improvement, security";
    }
    
    return api.sendMessage(msg, threadID, messageID);
}