module.exports = {
    name: "permission",
    dev: "HNT",
    nickName: ["perm"],
    info: "Xem quyền sử dụng lệnh",
    onPrefix: true,
    cooldowns: 5,

    onLaunch: async function({ api, event }) {
        const { threadID, senderID } = event;
        const fs = require("fs");
        
        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const threadInfo = await api.getThreadInfo(threadID);
            const threadAdmins = threadInfo?.adminIDs?.map(admin => admin.id) || [];

            const isAdmin = adminConfig.adminUIDs?.includes(senderID);
            const isMod = adminConfig.moderatorUIDs?.includes(senderID);
            const isThreadAdmin = threadAdmins.includes(senderID);

            let permLevel = "Thành viên thường";
            let canUse = "Lệnh cơ bản";

            if (isAdmin) {
                permLevel = "Admin Bot";
                canUse = "Tất cả lệnh";
            } else if (isMod) {
                permLevel = "Điều hành viên";
                canUse = "Lệnh điều hành + Lệnh quản trị";
            } else if (isThreadAdmin) {
                permLevel = "Quản trị viên nhóm";
                canUse = "Lệnh quản trị nhóm";
            }

            const msg = `👤 Quyền hạn của bạn:\n` +
                       `▸ Cấp bậc: ${permLevel}\n` +
                       `▸ Có thể dùng: ${canUse}\n\n` +
                       `📝 Phân loại lệnh:\n` +
                       `1️⃣ Lệnh cơ bản: Mọi thành viên\n` +
                       `2️⃣ Lệnh quản trị: QTV nhóm\n` +
                       `3️⃣ Lệnh điều hành: Mod bot\n` +
                       `4️⃣ Lệnh admin: Chỉ admin bot`;

            return api.sendMessage(msg, threadID);

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã có lỗi xảy ra!", threadID);
        }
    }
};
