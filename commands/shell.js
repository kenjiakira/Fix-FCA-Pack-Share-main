const { exec } = require('child_process');

module.exports = {
    name: "shell",
    usedby: 2,
    category: "Admin Commands",
    info: "Thực thi lệnh shell",
    onPrefix: true,
    nickName: ["exec", "linux"],
    dev: "HNT",
    cooldowns: 3,
    dmUser: false,
    usages: "shell <lệnh>",

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        const command = target.join(" ");

        if (!command) {
            return api.sendMessage("Vui lòng cung cấp lệnh shell để thực thi.", threadID, messageID);
        }
        const blockedCommands = ['rm -rf', 'mkfs', 'dd', ':(){:|:&};:', 'wget', 'curl'];
        if (blockedCommands.some(cmd => command.toLowerCase().includes(cmd))) {
            return api.sendMessage("Lệnh này không được phép thực thi vì lý do bảo mật.", threadID, messageID);
        }

        const teh = await api.sendMessage("Đang xử lý...", threadID, messageID);
        
        try {
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    return api.editMessage(`⚠️ Lỗi thực thi: ${error.message}`, teh.messageID, threadID, messageID);
                }
                if (stderr) {
                    return api.editMessage(`⚠️ Stderr: ${stderr}`, teh.messageID, threadID, messageID);
                }
                const output = stdout || "Lệnh đã được thực thi thành công (không có output)";
                api.editMessage(`✅ Kết quả:\n${output}`, teh.messageID, threadID, messageID);
            });
        } catch (err) {
            api.editMessage(`❌ Lỗi hệ thống: ${err.message}`, teh.messageID, threadID, messageID);
        }
    }
}
