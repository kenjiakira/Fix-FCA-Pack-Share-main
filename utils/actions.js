//actions and idea by liane since 2023 give me tutorial

const actions = (api, event) => {
    return {
        reply: async (message) => {
            return await api.sendMessage(message, event.threadID, event.messageID);
        },
        
        send: async (message) => {
            return await api.sendMessage(message, event.threadID);
        },
        
        react: async (reaction) => {
            return await api.setMessageReaction(reaction, event.messageID, () => {}, true);
        },
        
        kick: async (userID) => {
            return await api.removeUserFromGroup(userID, event.threadID, () => {});
        },
        
        leave: async () => {
            return await api.removeUserFromGroup(api.getCurrentUserID(), event.threadID, () => {});
        },
        
        edit: async (newMessage, messageID) => {
            return await api.editMessage(newMessage, messageID, event.threadID, event.messageID);
        },
        
        share: async (contact, callback) => {
            return await api.shareContact(contact, callback);
        }
    };
};

module.exports = { actions };