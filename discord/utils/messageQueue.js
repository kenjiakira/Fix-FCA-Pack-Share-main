const { logBotEvent } = require('./logs');

class MessageQueue {
    constructor() {
        this.queue = new Map();
        this.processing = false;
    }

    async add(message, updateFunction) {
        if (!message || !message.id) return;
        
        this.queue.set(message.id, {
            message,
            updateFunction,
            retries: 0,
            maxRetries: 3
        });

        if (!this.processing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.processing || this.queue.size === 0) return;
        this.processing = true;

        for (const [messageId, item] of this.queue) {
            try {
                if (!item.message.client?.token) {
                    // If client is not ready, wait and retry
                    if (item.retries < item.maxRetries) {
                        item.retries++;
                        continue;
                    } else {
                        logBotEvent('MESSAGE_QUEUE_ERROR', `Max retries reached for message ${messageId}`);
                        this.queue.delete(messageId);
                        continue;
                    }
                }

                // Attempt to update the message
                await item.updateFunction(item.message);
                this.queue.delete(messageId);
            } catch (error) {
                if (error.code === 10008 || error.code === 50001) {
                    // Message not found or no access, remove from queue
                    this.queue.delete(messageId);
                } else if (item.retries < item.maxRetries) {
                    // For other errors, increment retry counter
                    item.retries++;
                    logBotEvent('MESSAGE_QUEUE_RETRY', `Retry ${item.retries} for message ${messageId}: ${error.message}`);
                } else {
                    // Max retries reached, remove from queue
                    this.queue.delete(messageId);
                    logBotEvent('MESSAGE_QUEUE_ERROR', `Failed to update message ${messageId}: ${error.message}`);
                }
            }
        }

        this.processing = false;

        // If there are still items in the queue, process again after a delay
        if (this.queue.size > 0) {
            setTimeout(() => this.processQueue(), 1000);
        }
    }

    clear() {
        this.queue.clear();
        this.processing = false;
    }
}

const messageQueue = new MessageQueue();
module.exports = messageQueue;
