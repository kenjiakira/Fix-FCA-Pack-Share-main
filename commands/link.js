const fs = require('fs');
const path = require('path');

const linksFile = path.join(__dirname, '../database/discord_links.json');

function loadLinks() {
    try {
        if (!fs.existsSync(linksFile)) {
            const initialData = { links: [] };
            fs.writeFileSync(linksFile, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
        // Ensure links array exists
        if (!data.links) {
            data.links = [];
        }
        return data;
    } catch (error) {
        console.error('Error loading links:', error);
        return { links: [] };
    }
}

function saveLink(messengerId, discordId) {
    try {
        const links = loadLinks();
        links.links.push({
            messengerId,
            discordId,
            timestamp: new Date().toISOString()
        });
        fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving link:', error);
        return false;
    }
}

module.exports = {
    name: "link",
    category: "Khác",
    info: "Liên kết tài khoản Discord",
    usedby: 0,
    onPrefix: true,
    usages: ".link <Discord ID>",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "=== HƯỚNG DẪN LIÊN KẾT ===\n" +
                "\n1. Vào Discord server" +
                "\n2. Mở ticket Hỗ Trợ" +
                "\n3. Nhấn nút Liên Kết Tài Khoản" +
                "\n4. Làm theo hướng dẫn" +
                "\n\n⚠️ Lưu ý:" +
                "\n• Mỗi tài khoản chỉ liên kết được 1 lần" +
                "\n• Liên kết không thể hoàn tác",
                threadID
            );
        }

        const discordId = target[0];
        if (!/^\d{17,19}$/.test(discordId)) {
            return api.sendMessage("❌ Discord ID không hợp lệ!", threadID);
        }

        try {
            const links = loadLinks();
            
            // Check if Messenger ID is already linked
            if (links.links.some(l => l.messengerId === senderID)) {
                return api.sendMessage("❌ Tài khoản Messenger này đã được liên kết!", threadID);
            }

            // Check if Discord ID is already linked
            if (links.links.some(l => l.discordId === discordId)) {
                return api.sendMessage("❌ Discord ID này đã được liên kết với tài khoản khác!", threadID);
            }

            // Save new link
            if (saveLink(senderID, discordId)) {
                return api.sendMessage(
                    "✅ Liên kết thành công!\n" +
                    "\nBạn có thể quay lại Discord để đổi Nitro." +
                    "\nNếu cần hỗ trợ, hãy mở ticket trong Discord.",
                    threadID
                );
            } else {
                return api.sendMessage("❌ Lỗi khi lưu liên kết!", threadID);
            }

        } catch(err) {
            console.error('Link error:', err);
            return api.sendMessage("❌ Đã xảy ra lỗi hệ thống!", threadID);
        }
    }
};
