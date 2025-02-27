const fs = require('fs');
const path = require('path');

module.exports = {
    name: "cmd",
    dev: "HNT",
    category: "Admin Commands",
    info: "Thay đổi cài đặt của lệnh",
    usedby: 2,
    onPrefix: true,
    usages: "cmd <tên lệnh> <usedby/prefix/cooldown> <giá trị>",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (target.length < 3) {
            return api.sendMessage(
                "Sử dụng: cmd <tên lệnh> <thuộc tính> <giá trị>\n" +
                "- Thuộc tính: usedby/prefix/cooldown\n" +
                "- Ví dụ:\n" +
                "  + cmd help usedby 1\n" +
                "  + cmd ping prefix false\n" +
                "  + cmd check cooldown 10\n\n" +
                "Giá trị:\n" +
                "- usedby: 0 (all), 1 (admin box), 2 (admin bot)\n" +
                "- prefix: true/false\n" +
                "- cooldown: số giây (0-300)",
                threadID, messageID
            );
        }

        const cmdName = target[0];
        const property = target[1].toLowerCase();
        const value = target[2].toLowerCase();

        if (!['usedby', 'prefix', 'cooldown'].includes(property)) {
            return api.sendMessage("❌ Thuộc tính không hợp lệ! (usedby/prefix/cooldown)", threadID, messageID);
        }

        const cmdPath = path.join(__dirname, `${cmdName}.js`);
        
        if (!fs.existsSync(cmdPath)) {
            return api.sendMessage(`❌ Lệnh "${cmdName}" không tồn tại!`, threadID, messageID);
        }

        try {
            let fileContent = fs.readFileSync(cmdPath, 'utf8');
            const oldContent = fileContent;

            const requiredProps = {
                usedby: '0',
                onPrefix: 'true',
                cooldowns: '5'
            };

            const moduleExportsMatch = fileContent.match(/module\.exports\s*=\s*{([\s\S]*?)};/);
            if (moduleExportsMatch) {
                let moduleContent = moduleExportsMatch[1];

                for (const [prop, defaultValue] of Object.entries(requiredProps)) {
                    if (!moduleContent.includes(`${prop}:`)) {
                        const insertPosition = moduleContent.indexOf('onLaunch:') - 1;
                        if (insertPosition > -1) {
                            moduleContent = moduleContent.slice(0, insertPosition) + 
                                         `    ${prop}: ${defaultValue},\n` + 
                                         moduleContent.slice(insertPosition);
                        }
                    }
                }

                fileContent = fileContent.replace(moduleExportsMatch[1], moduleContent);
            }

            switch (property) {
                case 'usedby':
                    const usedbyValue = parseInt(value);
                    if (![0, 1, 2].includes(usedbyValue)) {
                        return api.sendMessage("❌ Giá trị usedby không hợp lệ! (0/1/2)", threadID, messageID);
                    }
                    fileContent = fileContent.replace(/usedby:\s*\d+/, `usedby: ${usedbyValue}`);
                    break;

                case 'prefix':
                    if (!['true', 'false'].includes(value)) {
                        return api.sendMessage("❌ Giá trị prefix không hợp lệ! (true/false)", threadID, messageID);
                    }
                    fileContent = fileContent.replace(/onPrefix:\s*\w+/, `onPrefix: ${value}`);
                    break;

                case 'cooldown':
                    const cooldownValue = parseInt(value);
                    if (isNaN(cooldownValue) || cooldownValue < 0 || cooldownValue > 300) {
                        return api.sendMessage("❌ Giá trị cooldown không hợp lệ! (0-300)", threadID, messageID);
                    }
                    fileContent = fileContent.replace(/cooldowns:\s*\d+/, `cooldowns: ${cooldownValue}`);
                    break;
            }

            if (oldContent === fileContent) {
                return api.sendMessage("❌ Không tìm thấy thuộc tính để thay đổi!", threadID, messageID);
            }

            fs.writeFileSync(cmdPath, fileContent);
            
            delete require.cache[require.resolve(cmdPath)];

            return api.sendMessage(
                `✅ Đã cập nhật lệnh "${cmdName}":\n` +
                `- ${property}: ${value}`,
                threadID, messageID
            );

        } catch (error) {
            console.error(error);
            return api.sendMessage(
                `❌ Đã xảy ra lỗi khi cập nhật lệnh:\n${error.message}`, 
                threadID, messageID
            );
        }
    }
};
