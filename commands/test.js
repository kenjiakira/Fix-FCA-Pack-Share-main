module.exports = {
    name: "test",
    info: "Test lệnh",
    onPrefix: true,
    category: "System",
    usedby: 0,
    cooldowns: 0,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        return api.sendMessage("Test lệnh", threadID, messageID);
    }
}   
