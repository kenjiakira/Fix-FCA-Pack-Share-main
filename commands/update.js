const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const { bumpVersion, getVersion, syncDirectory } = require('../utils/update');

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
    'fonts',
    'etc',
    'dashboard'
];

function loadAdminData() {
    try {
        if (fs.existsSync(adminPath)) {
            return JSON.parse(fs.readFileSync(adminPath, 'utf8'));
        }
        return { adminUIDs: [] };
    } catch (error) {
        console.error('Error loading admin data:', error);
        return { adminUIDs: [] };
    }
}

function resolveRepoURL(adminData, overrideURL) {
    if (overrideURL) return overrideURL;
    return adminData.gitURL || DEFAULT_GIT_URL;
}

module.exports = {
    name: "update",
    dev: "HNT",
    usedby: 2,
    category: "System",
    info: "Remote URL và đồng bộ Git",
    onPrefix: true,
    usages: "update [remote|sync] — remote: xem URL; sync: đồng bộ [branch] [gitURL]",
    cooldowns: 5,

    onLaunch: async ({ api, event, target }) => {
        const { threadID, senderID, messageID } = event;
        const adminData = loadAdminData();
        const isAdmin = Array.isArray(adminData.adminUIDs) && adminData.adminUIDs.includes(senderID);

        if (!target[0]) {
            const v = getVersion();
            let msg = `📦 v${v.version}`;
            if (isAdmin) {
                msg += '\n\nAdmin:\n• update remote — URL mặc định / đang dùng\n• update sync [branch] [gitURL] — đồng bộ (mặc định branch dev)';
            }
            return api.sendMessage(msg, threadID, messageID);
        }

        const cmd = target[0].toLowerCase();

        if (cmd === 'remote') {
            if (!isAdmin) {
                return api.sendMessage('Chỉ admin mới dùng được lệnh này.', threadID, messageID);
            }
            const fromAdmin = adminData.gitURL;
            const effective = resolveRepoURL(adminData, null);
            let msg = '🔗 Remote (sync)\n\n';
            msg += `📌 Mặc định trong code:\n${DEFAULT_GIT_URL}\n`;
            if (fromAdmin) {
                msg += `\n📝 admin.json (gitURL):\n${fromAdmin}\n`;
            } else {
                msg += '\n📝 admin.json: (chưa set gitURL)\n';
            }
            msg += `\n✅ URL thực tế khi sync: ${effective}`;
            return api.sendMessage(msg, threadID, messageID);
        }

        if (cmd !== 'sync') {
            return api.sendMessage(
                isAdmin
                    ? 'Dùng: update remote | update sync [branch] [gitURL]'
                    : 'Không có quyền.',
                threadID,
                messageID
            );
        }

        if (!isAdmin) {
            return api.sendMessage('Chỉ admin mới dùng được lệnh này.', threadID, messageID);
        }

        const targetBranch = target[1] || 'dev';
        const gitURL = target[2] || null;
        const repoURL = resolveRepoURL(adminData, gitURL);
        const projectRoot = path.join(__dirname, '../');
        const tempDir = path.join(os.tmpdir(), `fca-update-${Date.now()}`);

        const loadingMsg = await api.sendMessage('⏳ Đang đồng bộ từ remote...', threadID);

        try {
            execSync(`git clone -b ${targetBranch} --depth 1 ${repoURL} "${tempDir}"`, {
                encoding: 'utf8',
                stdio: 'pipe'
            });

            const syncResult = syncDirectory(tempDir, projectRoot, EXCLUDE_PATTERNS);
            const versionBump = bumpVersion();

            fs.rmSync(tempDir, { recursive: true, force: true });

            const versionInfo = getVersion();
            let resultMsg = '✅ Đồng bộ xong.\n';
            if (versionBump) {
                resultMsg += `📦 v${versionBump.oldVersion} → v${versionBump.newVersion}\n`;
            } else {
                resultMsg += `📦 v${versionInfo.version}\n`;
            }
            resultMsg += `🌿 ${targetBranch} | ${repoURL}\n`;
            resultMsg += `📊 copy ${syncResult.copied.length} | bỏ qua ${syncResult.skipped.length} | xóa ${syncResult.deleted.length}`;
            if (syncResult.errors.length > 0) {
                resultMsg += ` | ⚠️ lỗi ${syncResult.errors.length}`;
            }

            api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(resultMsg, threadID, messageID);
        } catch (err) {
            try {
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            } catch (_) {}

            api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${err.message}\n\n` +
                    `Kiểm tra URL, nhánh "${targetBranch}", mạng, và đã cài git.`,
                threadID,
                messageID
            );
        }
    }
};
