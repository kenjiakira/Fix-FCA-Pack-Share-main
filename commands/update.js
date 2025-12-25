const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const updatesPath = path.join(__dirname, '../database/json/updates.json');

const adminPath = path.join(__dirname, '../admin.json');

const DEFAULT_GIT_URL = 'https://github.com/kenjiakira/Fix-FCA-Pack-Share-main.git';

const EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    'appstate.json',
    'admin.json',
    'package-lock.json',
    '.env',
    '.appstate-last-check.json',
    'database',
    'logins'
];

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

function copyDirectory(src, dest, excludePatterns = []) {
    try {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (excludePatterns.some(pattern => entry.name.includes(pattern) || srcPath.includes(pattern))) {
                continue;
            }

            if (entry.isDirectory()) {
                copyDirectory(srcPath, destPath, excludePatterns);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
        return true;
    } catch (error) {
        throw new Error(`Lỗi khi copy thư mục: ${error.message}`);
    }
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
    info: "Cập nhật hệ thống từ nguồn cập nhật",
    onPrefix: true,
    usages: "update [pull/sync/version] [branch] [gitURL]",
    cooldowns: 5,

    onLaunch: async ({ api, event, target }) => {
        const { threadID, senderID, messageID } = event;
        const adminData = loadAdminData();
        const isAdmin = Array.isArray(adminData.adminUIDs) && adminData.adminUIDs.includes(senderID);
        
        if (!target[0]) {
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
            msg += `\n╰────────────╯\n\n`;
            
            if (isAdmin) {
                msg += `👑 ADMIN COMMANDS:\n`;
                msg += `• update pull [branch] [gitURL] - Cập nhật hệ thống\n`;
                msg += `• update version - Xem phiên bản hiện tại\n`;
            }
            
            return api.sendMessage(msg, threadID, messageID);
        }

        const command = target[0].toLowerCase();

        if (isAdmin) {
            switch (command) {
                case "version":
                case "v":
                case "ver": {
                    const versionInfo = getVersion();
                    let msg = "╭─「 THÔNG TIN PHIÊN BẢN 」─╮\n\n";
                    msg += `📦 Phiên bản: v${versionInfo.version}\n`;
                    
                    msg += "\n╰────────────╯";
                    
                    return api.sendMessage(msg, threadID, messageID);
                }
                
                case "pull":
                case "sync": {
                    const targetBranch = target[1] || 'dev';
                    const gitURL = target[2] || null;
                    const loadingMsg = await api.sendMessage(`⏳ Đang cập nhật bản mới nhất...`, threadID);
                    
                    try {
                        const adminData = loadAdminData();
                        const repoURL = gitURL || adminData.gitURL || DEFAULT_GIT_URL;
                        
                        const projectRoot = path.join(__dirname, '../');
                        const tempDir = path.join(os.tmpdir(), `fca-update-${Date.now()}`);
                        
                        try {
                            execSync(`git clone -b ${targetBranch} --depth 1 ${repoURL} "${tempDir}"`, {
                                encoding: 'utf8',
                                stdio: 'pipe'
                            });
                            
                            copyDirectory(tempDir, projectRoot, EXCLUDE_PATTERNS);
                        
                            fs.rmSync(tempDir, { recursive: true, force: true });
                            
                            const versionInfo = getVersion();
                            let resultMsg = `✅ ĐÃ CẬP NHẬT TOÀN BỘ HỆ THỐNG THÀNH CÔNG!\n\n`;
                            resultMsg += `📦 Phiên bản: v${versionInfo.version}\n`;
                            resultMsg += `🌿 Nhánh phát triển: ${targetBranch}\n`;
                            resultMsg += `🔗 Nguồn cập nhật: ${repoURL}\n`;
                            resultMsg += `\n✨ Hệ thống đã được cập nhật toàn diện!\n`;
                            resultMsg += `📁 Bao gồm: commands, events, utils, game, assets, và tất cả thư mục khác\n`;
                            resultMsg += `🔒 Đã giữ lại: appstate.json, admin.json, database, logins\n`;
                            
                            const packagePath = path.join(projectRoot, 'package.json');
                            if (fs.existsSync(packagePath)) {
                                resultMsg += `\n📦 Phát hiện package.json\n`;
                                resultMsg += `💡 Vui lòng chạy 'npm install' để cài đặt dependencies mới`;
                            }
                            
                            api.unsendMessage(loadingMsg.messageID);
                            return api.sendMessage(resultMsg, threadID, messageID);
                            
                        } catch (err) {
                
                            try {
                                if (fs.existsSync(tempDir)) {
                                    fs.rmSync(tempDir, { recursive: true, force: true });
                                }
                            } catch (cleanupErr) {}
                            
                            api.unsendMessage(loadingMsg.messageID);
                            return api.sendMessage(
                                `❌ Lỗi khi tải xuống từ nguồn cập nhật:\n${err.message}\n\n` +
                                `💡 Kiểm tra lại:\n` +
                                `1. Địa chỉ nguồn cập nhật có đúng không: ${repoURL}\n` +
                                `2. Phiên bản "${targetBranch}" có tồn tại không\n` +
                                `3. Kết nối mạng\n` +
                                `4. Hệ thống quản lý phiên bản đã được cài đặt chưa`,
                                threadID, messageID
                            );
                        }
                        
                    } catch (err) {
                        api.unsendMessage(loadingMsg.messageID);
                        return api.sendMessage(
                            `❌ Lỗi khi cập nhật hệ thống:\n${err.message}\n\n` +
                            `💡 Kiểm tra lại:\n` +
                            `1. Kết nối mạng\n` +
                            `2. Địa chỉ nguồn cập nhật có đúng không\n` +
                            `3. Phiên bản "${targetBranch}" có tồn tại không\n` +
                            `4. Hệ thống quản lý phiên bản đã được cài đặt chưa`,
                            threadID, messageID
                        );
                    }
                }
                
                default: {
                    return api.sendMessage(
                        "⚠️ Lệnh không hợp lệ!\n\n" +
                        "👑 ADMIN COMMANDS:\n" +
                        "• update pull [branch] [gitURL] - Cập nhật hệ thống\n" +
                        "• update version - Xem phiên bản hiện tại",
                        threadID, messageID
                    );
                }
            }
        }

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
        msg += `\n╰────────────╯`;
        
        return api.sendMessage(msg, threadID, messageID);
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
            "📢 Không có cập nhật nào trong 7 ngày qua!",
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
    
    return api.sendMessage(msg, threadID, messageID);
}