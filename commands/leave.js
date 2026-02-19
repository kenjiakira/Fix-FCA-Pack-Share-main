module.exports = {
    name: "leave",
    dev: "HNT",
    category: "Admin Commands",
    usedby: 2,
    info: "Rời khỏi nhóm",
    onPrefix: true,
    nickName: ["out"],
    cooldowns: 20,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const args = target;
        
        const targetThreadID = args[0] || threadID;
        
        if (isNaN(targetThreadID)) {
            return api.sendMessage("❌ Vui lòng nhập ID nhóm hợp lệ!", threadID, messageID);
        }
        
        try {
            await api.removeUserFromGroup(api.getCurrentUserID(), targetThreadID);
            return api.sendMessage(`✅ Đã rời nhóm với ID: ${targetThreadID}`, threadID, messageID);
        } catch (error) {
            console.error("Leave Error:", error);
            return api.sendMessage("❌ Không thể rời nhóm, vui lòng thử lại sau!", threadID, messageID);
        }
    }
};

