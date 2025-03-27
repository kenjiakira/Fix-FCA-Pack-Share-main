const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "git",
    dev: "HNT",
    category: "Admin Commands", 
    info: "Github",
    usedby: 1,
    onPrefix: true,
    cooldowns: 30,
    
    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        try {
            const isGitRepo = fs.existsSync(path.join(__dirname, '../.git'));
            if (!isGitRepo) {
                return api.sendMessage("❌ Thư mục này chưa được khởi tạo Git!", threadID, messageID);
            }

            const action = target[0]?.toLowerCase();
            const commitMsg = target.slice(1).join(" ") || "🤖 Auto commit by bot";

            switch (action) {
                case "push":
                    const loadingMsg = await api.sendMessage("⏳ Đang push code lên Github...", threadID);

                    try {
                        execSync('git add .', { cwd: path.join(__dirname, '../') });

                        execSync(`git commit -m "${commitMsg}"`, { cwd: path.join(__dirname, '../') });

                        execSync('git push', { cwd: path.join(__dirname, '../') });

                        api.unsendMessage(loadingMsg.messageID);
                        return api.sendMessage(
                            "✅ Đã push code lên Github thành công!\n\n" +
                            `📝 Commit message: ${commitMsg}`, 
                            threadID, messageID
                        );

                    } catch (err) {
                        api.unsendMessage(loadingMsg.messageID);
                        return api.sendMessage(
                            `❌ Lỗi khi push code: ${err.message}\n\n` +
                            "💡 Kiểm tra lại:\n" +
                            "1. Kết nối mạng\n" +
                            "2. Cấu hình Git (user.name, user.email)\n" +
                            "3. Token Github\n" +
                            "4. Remote URL", 
                            threadID, messageID
                        );
                    }
                    break;

                case "status":
                    const status = execSync('git status', { 
                        cwd: path.join(__dirname, '../'),
                        encoding: 'utf8'
                    });

                    return api.sendMessage(
                        "📊 Git Status:\n\n" + status,
                        threadID, messageID
                    );

                case "log":
                    const logs = execSync('git log -5 --oneline', { 
                        cwd: path.join(__dirname, '../'),
                        encoding: 'utf8'
                    });

                    return api.sendMessage(
                        "📜 Last 5 commits:\n\n" + logs,
                        threadID, messageID
                    );

                default:
                    return api.sendMessage(
                        "🌟 Git Commands 🌟\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "1. Push code lên Github:\n" +
                        "   .git push [commit message]\n\n" +
                        "2. Xem trạng thái Git:\n" +
                        "   .git status\n\n" +
                        "3. Xem lịch sử commit:\n" +
                        "   .git log\n\n" +
                        "💡 Tip: Nếu không nhập commit message,\n" +
                        "sẽ tự động dùng message mặc định",
                        threadID, messageID
                    );
            }

        } catch (error) {
            console.error('Git Command Error:', error);
            return api.sendMessage(
                `❌ Đã xảy ra lỗi: ${error.message}`,
                threadID, messageID
            );
        }
    }
};
