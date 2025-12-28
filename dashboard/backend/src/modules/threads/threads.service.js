const database = require('../../config/database');

class ThreadsService {
    async findAll(pagination) {
        const threads = database.getThreads();

        const threadList = Object.keys(threads).map(threadID => {
            const thread = threads[threadID];
            return {
                threadID,
                name: thread.name || 'N/A',
                memberCount: thread.memberIDs?.length || 0,
                prefix: thread.prefix || '/',
                lastMessageTime: thread.lastMessageTime || null
            };
        });

        const total = threadList.length;
        const paginatedData = threadList.slice(pagination.skip, pagination.skip + pagination.limit);

        return pagination.toResponse(total, paginatedData);
    }

    async findOne(threadID) {
        const threads = database.getThreads();
        const thread = threads[threadID];

        if (!thread) {
            throw new Error('Thread not found');
        }

        return {
            threadID,
            name: thread.name || 'N/A',
            memberCount: thread.memberIDs?.length || 0,
            prefix: thread.prefix || '/',
            lastMessageTime: thread.lastMessageTime || null
        };
    }
}

module.exports = new ThreadsService();

