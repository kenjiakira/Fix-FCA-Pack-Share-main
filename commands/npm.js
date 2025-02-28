const { exec } = require("child_process");

module.exports = {
    name: "npm",
    info: "Quản lý thư viện NPM",
    dev: "HNT",
    category: "System",
    usedBy: 2,
    onPrefix: true,
    usages: "npm [list | install | uninstall] <tên_gói>",
    cooldowns: 10,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        const action = target[0]?.toLowerCase();
        const packageName = target[1];

        if (!action) {
            return exec(`npm list --depth=0`, (error, stdout, stderr) => {
                if (error) {
                    return api.sendMessage(
                        "Không thể lấy danh sách gói đã cài đặt. Vui lòng thử lại sau.",
                        threadID,
                        messageID
                    );
                }

                const packageList = stdout
                    .split("\n")
                    .slice(1)
                    .filter(line => line.trim() && line.includes("@"))
                    .map((line, index) => `${index + 1}. ${line.trim()}`)
                    .join("\n");

                const response = packageList
                    ? `Các gói đã cài đặt:\n${packageList}`
                    : "Không có gói nào được cài đặt.";

                api.sendMessage(response, threadID, messageID);
            });
        }

        if (action === "install") {
            if (!packageName) {
                return api.sendMessage(
                    "Vui lòng cung cấp tên gói để cài đặt. Ví dụ: npm install axios",
                    threadID,
                    messageID
                );
            }

            return exec(`npm install ${packageName}`, (error, stdout, stderr) => {
                if (error) {
                    return api.sendMessage(
                        `Lỗi khi cài đặt gói "${packageName}".\nChi tiết: ${stderr}`,
                        threadID,
                        messageID
                    );
                }

                api.sendMessage(
                    `Gói "${packageName}" đã được cài đặt thành công! 🎉`,
                    threadID,
                    messageID
                );
            });
        }

        if (action === "uninstall") {
            if (!packageName) {
                return api.sendMessage(
                    "Vui lòng cung cấp tên gói để gỡ bỏ. Ví dụ: npm uninstall axios",
                    threadID,
                    messageID
                );
            }

            return exec(`npm uninstall ${packageName}`, (error, stdout, stderr) => {
                if (error) {
                    return api.sendMessage(
                        `Lỗi khi gỡ bỏ gói "${packageName}".\nChi tiết: ${stderr}`,
                        threadID,
                        messageID
                    );
                }

                api.sendMessage(
                    `Gói "${packageName}" đã được gỡ bỏ thành công! 🗑️`,
                    threadID,
                    messageID
                );
            });
        }

        return api.sendMessage(
            "Lệnh không hợp lệ. Vui lòng sử dụng: npm [list | install | uninstall] <tên_gói>",
            threadID,
            messageID
        );
    },
};
