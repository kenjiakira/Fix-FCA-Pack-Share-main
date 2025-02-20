const { logBotEvent } = require('./logs');
const messageQueue = require('./messageQueue');

class MessageHandler {
    static async updateMessage(message, content, retries = 3) {
        if (!message) return;

        return new Promise((resolve, reject) => {
            messageQueue.add(message, async (msg) => {
                try {
                 
                    if (!msg.client?.token) {
                        throw new Error('Client not ready or token missing');
                    }

                    const updatedMsg = await msg.edit(content);
                    resolve(updatedMsg);
                } catch (error) {
                    logBotEvent('MESSAGE_UPDATE_ERROR', `Error updating message: ${error.message}`);
                    
                    if (retries > 0 && error.message.includes('token')) {
                       
                        setTimeout(() => {
                            MessageHandler.updateMessage(message, content, retries - 1)
                                .then(resolve)
                                .catch(reject);
                        }, 1000);
                    } else {
                        reject(error);
                    }
                }
            });
        });
    }

    static async sendMessage(channel, content, retries = 3) {
        return new Promise(async (resolve, reject) => {
            try {
              
                if (!channel.client?.token) {
                    throw new Error('Client not ready or token missing');
                }

                const message = await channel.send(content);
                resolve(message);
            } catch (error) {
                logBotEvent('MESSAGE_SEND_ERROR', `Error sending message: ${error.message}`);
                
                if (retries > 0 && error.message.includes('token')) {
                    // Wait and retry if token error
                    setTimeout(() => {
                        MessageHandler.sendMessage(channel, content, retries - 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000);
                } else {
                    reject(error);
                }
            }
        });
    }

    static async deleteMessage(message, retries = 3) {
        if (!message) return;

        return new Promise(async (resolve, reject) => {
            try {
                // Check if message is deletable and client has token
                if (!message.deletable || !message.client?.token) {
                    throw new Error('Message not deletable or token missing');
                }

                await message.delete();
                resolve(true);
            } catch (error) {
                logBotEvent('MESSAGE_DELETE_ERROR', `Error deleting message: ${error.message}`);
                
                if (retries > 0 && error.message.includes('token')) {
                    // Wait and retry if token error
                    setTimeout(() => {
                        MessageHandler.deleteMessage(message, retries - 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000);
                } else {
                    reject(error);
                }
            }
        });
    }

    static async bulkDelete(channel, messages, retries = 3) {
        return new Promise(async (resolve, reject) => {
            try {
                // Check if client is ready and has token
                if (!channel.client?.token) {
                    throw new Error('Client not ready or token missing');
                }

                await channel.bulkDelete(messages);
                resolve(true);
            } catch (error) {
                logBotEvent('BULK_DELETE_ERROR', `Error bulk deleting messages: ${error.message}`);
                
                if (retries > 0 && error.message.includes('token')) {
                    // Wait and retry if token error
                    setTimeout(() => {
                        MessageHandler.bulkDelete(channel, messages, retries - 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000);
                } else {
                    reject(error);
                }
            }
        });
    }
}

module.exports = MessageHandler;
