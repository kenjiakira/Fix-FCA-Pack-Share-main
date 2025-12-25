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

function getVersion() {
    try {
        const packagePath = path.join(__dirname, '../package.json');
        let version = 'N/A';
        let gitTag = null;
        let commitHash = null;
        let branch = null;
        
        // Lấy version từ package.json
        if (fs.existsSync(packagePath)) {
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            version = packageData.version || 'N/A';
        }
        
        // Kiểm tra xem có phải Git repo không
        const isGitRepo = fs.existsSync(path.join(__dirname, '../.git'));
        if (isGitRepo) {
            try {
                // Lấy Git tag gần nhất (nếu có)
                try {
                    gitTag = execSync('git describe --tags --abbrev=0', {
                        cwd: path.join(__dirname, '../'),
                        encoding: 'utf8',
                        stdio: ['ignore', 'pipe', 'ignore']
                    }).trim();
                } catch (err) {
                    // Không có tag, bỏ qua
                }
                
                // Lấy commit hash ngắn
                try {
                    commitHash = execSync('git rev-parse --short HEAD', {
                        cwd: path.join(__dirname, '../'),
                        encoding: 'utf8'
                    }).trim();
                } catch (err) {
                    // Không thể lấy commit hash
                }
                
                // Lấy branch hiện tại
                try {
                    branch = execSync('git rev-parse --abbrev-ref HEAD', {
                        cwd: path.join(__dirname, '../'),
                        encoding: 'utf8'
                    }).trim();
                } catch (err) {
                    // Không thể lấy branch
                }
            } catch (err) {
                // Git commands failed
            }
        }
        
        return {
            version: version,
            gitTag: gitTag,
            commitHash: commitHash,
            branch: branch
        };
    } catch (error) {
        return {
            version: 'N/A',
            gitTag: null,
            commitHash: null,
            branch: null
        };
    }
}

module.exports = {
    name: "update",
    dev: "HNT",
    usedby: 0,
    category: "System",
    info: "Hiển thị các cập nhật mới trong 7 ngày gần nhất",
    onPrefix: true,
    usages: "update [add/list/del/view/pull/version] [branch/userID]",
    cooldowns: 5,

    onLaunch: async ({ api, event, target }) => {
        const { threadID, senderID, messageID } = event;
        const adminData = loadAdminData();
        const isAdmin = Array.isArray(adminData.adminUIDs) && adminData.adminUIDs.includes(senderID);
        
        if (!target[0]) {
            // Nếu không có command, hiển thị version và updates
            const versionInfo = getVersion();
            let msg = `╭─「 THÔNG TIN PHIÊN BẢN 」─╮\n\n`;
            msg += `📦 Phiên bản: v${versionInfo.version}\n`;
            if (versionInfo.gitTag) {
                msg += `🏷️ Git Tag: ${versionInfo.gitTag}\n`;
            }
            if (versionInfo.branch) {
                msg += `🌿 Nhánh: ${versionInfo.branch}\n`;
            }
            if (versionInfo.commitHash) {
                msg += `🔖 Commit: ${versionInfo.commitHash}\n`;
            }
            msg += `\n╰───────────────────────╯\n\n`;
            
            // Gửi version trước, sau đó hiển thị updates
            await api.sendMessage(msg, threadID);
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
                
                case "version":
                case "v":
                case "ver": {
                    const versionInfo = getVersion();
                    let msg = "╭─「 THÔNG TIN PHIÊN BẢN 」─╮\n\n";
                    msg += `📦 Phiên bản: v${versionInfo.version}\n`;
                    
                    msg += "\n╰───────────────────────╯";
                    
                    return api.sendMessage(msg, threadID, messageID);
                }
                
                case "pull":
                case "sync": {
                    const targetBranch = target[1] || 'dev';
                    const loadingMsg = await api.sendMessage(`⏳ Đang cập nhật bản mới nhất"...`, threadID);
                    
                    try {
                        const isGitRepo = fs.existsSync(path.join(__dirname, '../.git'));
                        if (!isGitRepo) {
                            api.unsendMessage(loadingMsg.messageID);
                            return api.sendMessage(
                                "❌ Thư mục này không xác định được!\n" +
                                "💡 Vui lòng kiểm tra đúng phiên bản đang sử dụng.",
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
                                "❌ Không thể xác định phiên bản hiện tại!",
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
                        
                        execSync('git fetch --all --prune --tags', {
                            cwd: path.join(__dirname, '../'),
                            encoding: 'utf8'
                        });
                        
                        let branchExists = false;
                        try {
                            execSync(`git ls-remote --heads origin ${targetBranch}`, {
                                cwd: path.join(__dirname, '../'),
                                stdio: 'ignore'
                            });
                            branchExists = true;
                        } catch (err) {
                            branchExists = false;
                        }
                        
                        if (!branchExists) {
                            api.unsendMessage(loadingMsg.messageID);
                            return api.sendMessage(
                                `❌ Phiên bản "${targetBranch}" không tồn tại trên remote!\n\n`,
                                threadID, messageID
                            );
                        }
                        
                        let checkoutOutput = '';
                        if (currentBranch !== targetBranch) {
                            try {

                                try {
                                    execSync(`git rev-parse --verify ${targetBranch}`, {
                                        cwd: path.join(__dirname, '../'),
                                        stdio: 'ignore'
                                    });
                                    checkoutOutput = execSync(`git checkout ${targetBranch}`, {
                                        cwd: path.join(__dirname, '../'),
                                        encoding: 'utf8'
                                    });
                                } catch (err) {
                                    checkoutOutput = execSync(`git checkout -b ${targetBranch} origin/${targetBranch}`, {
                                        cwd: path.join(__dirname, '../'),
                                        encoding: 'utf8'
                                    });
                                }
                            } catch (err) {
                                api.unsendMessage(loadingMsg.messageID);
                                return api.sendMessage(
                                    `❌ Không thể chuyển sang nhánh "${targetBranch}":\n${err.message}`,    
                                    threadID, messageID
                                );
                            }
                        }
                        
                        let pullOutput = '';
                        try {
                            execSync(`git reset --hard origin/${targetBranch}`, {
                                cwd: path.join(__dirname, '../'),
                                encoding: 'utf8'
                            });
                            pullOutput = `Đã reset và đồng bộ hoàn toàn với origin/${targetBranch}`;
                        } catch (err) {
                            pullOutput = execSync(`git pull origin ${targetBranch} --no-edit`, {
                                cwd: path.join(__dirname, '../'),
                                encoding: 'utf8'
                            });
                        }
                        
                        try {
                            execSync('git clean -fd', {
                                cwd: path.join(__dirname, '../'),
                                stdio: 'ignore'
                            });
                        } catch (err) {
                        }
                        
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
                        
                        const versionInfo = getVersion();
                        
                        let latestCommit = '';
                        let commitMessage = '';
                        try {
                            latestCommit = execSync('git rev-parse --short HEAD', {
                                cwd: path.join(__dirname, '../'),
                                encoding: 'utf8'
                            }).trim();
                            commitMessage = execSync('git log -1 --pretty=format:"%s"', {
                                cwd: path.join(__dirname, '../'),
                                encoding: 'utf8'
                            }).trim();
                        } catch (err) {
                        }
                        
                        let changedFilesCount = 0;
                        try {
                            const changedFiles = execSync('git diff --name-only HEAD@{1} HEAD', {
                                cwd: path.join(__dirname, '../'),
                                encoding: 'utf8'
                            });
                            changedFilesCount = changedFiles.trim().split('\n').filter(f => f.trim()).length;
                        } catch (err) {
                        }
                        
                        let resultMsg = `✅ ĐÃ CẬP NHẬT TOÀN BỘ HỆ THỐNG THÀNH CÔNG!\n\n`;
                        resultMsg += `📦 Phiên bản: v${versionInfo.version}\n`;
                        resultMsg += `🌿 Nhánh: ${targetBranch}\n`;
                        
                        if (latestCommit) {
                            resultMsg += `🔖 Commit mới nhất: ${latestCommit}\n`;
                        }
                        
                        if (commitMessage) {
                            resultMsg += `📝 Message: ${commitMessage.substring(0, 50)}${commitMessage.length > 50 ? '...' : ''}\n`;
                        }
                        
                        if (changedFilesCount > 0) {
                            resultMsg += `📊 Số file đã cập nhật: ${changedFilesCount}\n`;
                        }
                        
                        if (currentBranch !== targetBranch) {
                            resultMsg += `🔄 Đã chuyển từ "${currentBranch}" → "${targetBranch}"\n`;
                        }
                        
                        resultMsg += `\n✨ Hệ thống đã được cập nhật toàn diện!\n`;
                        resultMsg += `📁 Bao gồm: commands, events, utils, game, assets, và tất cả thư mục khác\n`;
                        
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
                            `3. Nhánh "${targetBranch}" có tồn tại không\n` +
                            `4. Có conflict cần giải quyết`,
                            threadID, messageID
                        );
                    }
                }
            }
        }
        
        return showUpdates(api, threadID, senderID, messageID, isAdmin);
    }
};

function showUpdates(api, threadID, userID, messageID, isAdmin) {
    const data = loadUpdates();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
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
        msg += "• update pull [branch] - Cập nhật code từ Git (mặc định: dev)\n";
        msg += "• update version - Xem phiên bản hiện tại\n";
        msg += "\nLoại: feature, bugfix, improvement, security";
    }
    
    return api.sendMessage(msg, threadID, messageID);
}