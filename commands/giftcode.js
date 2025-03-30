
module.exports = {
    name: "giftcode",
    dev: "HNT",
    onPrefix: true,
    hide: true,
    usages: "[redeem/create/list] [code]",
    cooldowns: 5,
    isAdmin: false,

onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;

        const message =
            " THÔNG BÁO ĐỔI LỆNH\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "gõ .rewards redeem CODE\n";

        api.sendMessage(message, threadID, messageID);
    }
};
