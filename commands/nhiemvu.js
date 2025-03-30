
module.exports = {
    name: "nhiemvu",
    dev: "HNT",
    usedby: 0,
    hide: true,
    onPrefix: true,
    usages: "nhiemvu",
    cooldowns: 5,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;

        const message =
            "🎯 THÔNG BÁO ĐỔI LỆNH\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "gõ .rewards quest để xem Nhiệm vụ\n";

        api.sendMessage(message, threadID, messageID);
    }
};
