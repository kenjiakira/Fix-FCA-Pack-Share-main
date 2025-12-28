const fs = require('fs');
const path = require('path');

class SystemService {
    async getStatus() {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        return {
            status: 'online',
            uptime,
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memoryUsage.rss / 1024 / 1024)
            },
            nodeVersion: process.version,
            platform: process.platform,
            timestamp: Date.now()
        };
    }

    async getSystemInfo() {
        const commandsPath = path.join(__dirname, '../../../../commands');
        const eventsPath = path.join(__dirname, '../../../../events');
        
        const commands = fs.existsSync(commandsPath) 
            ? fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).length 
            : 0;
        const events = fs.existsSync(eventsPath)
            ? fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')).length
            : 0;

        const uptime = process.uptime();
        const memUsage = process.memoryUsage();

        return {
            status: 'online',
            uptime,
            commands,
            events,
            nodeVersion: process.version,
            platform: process.platform,
            memory: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            memoryDetails: {
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
                rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
            },
            cpuUsage: process.cpuUsage ? 'Available' : 'N/A'
        };
    }
}

module.exports = new SystemService();

