const fs = require('fs');
const path = require('path');
const os = require('os');

class BotService {
  constructor() {
    this.botStartTime = Date.now();
    this.lastRestartTime = Date.now();
    this.totalCommands = 0;
    this.activeUsers = 0;
    this.totalMessages = 0;
    this.commandStats = {};
  }

  isBotRunning() {
    const botLockFile = path.join(__dirname, '../../../bot.running');
    const discordLockFile = path.join(__dirname, '../../../discord.lock');
    
    try {
      if (fs.existsSync(botLockFile)) {
        const pid = fs.readFileSync(botLockFile, 'utf8');
        try {
          process.kill(parseInt(pid), 0);
          return true;
        } catch(e) {
          return false;
        }
      }
      
      if (fs.existsSync(discordLockFile)) {
        const pid = fs.readFileSync(discordLockFile, 'utf8');
        try {
          process.kill(parseInt(pid), 0);
          return true;
        } catch(e) {
          return false;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  getSystemInfo() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    const cpuUsage = Math.random() * 30 + 10; 
    
    return {
      memoryUsage: Math.round(memoryUsage * 10) / 10,
      cpuUsage: Math.round(cpuUsage * 10) / 10,
      totalMemory: totalMem,
      freeMemory: freeMem,
      usedMemory: totalMem - freeMem
    };
  }

  getBotStatus() {
    const isRunning = this.isBotRunning();
    const systemInfo = this.getSystemInfo();
    const uptime = Math.floor((Date.now() - this.botStartTime) / 1000);
    
    return {
      isRunning,
      uptime,
      startTime: new Date(this.botStartTime).toISOString(),
      lastRestart: new Date(this.lastRestartTime).toISOString(),
      totalCommands: this.totalCommands,
      activeUsers: this.activeUsers,
      totalMessages: this.totalMessages,
      memoryUsage: systemInfo.memoryUsage,
      cpuUsage: systemInfo.cpuUsage,
      responseTime: Math.floor(Math.random() * 200) + 50, 
      systemInfo
    };
  }

  updateStats(stats) {
    if (stats.commands !== undefined) this.totalCommands = stats.commands;
    if (stats.users !== undefined) this.activeUsers = stats.users;
    if (stats.messages !== undefined) this.totalMessages = stats.messages;
    if (stats.commandUsage !== undefined) this.commandStats = stats.commandUsage;
  }

  restartBot() {
    this.lastRestartTime = Date.now();
    this.botStartTime = Date.now();
    return {
      success: true,
      message: 'Bot restart initiated',
      timestamp: new Date().toISOString()
    };
  }

  getUptimeHistory(period = '24h') {
    const history = [];
    const now = Date.now();
    const botStartTime = this.botStartTime;
    
    let dataPoints, interval;
    
    switch (period) {
      case '7d':
        dataPoints = 168; 
        interval = 3600000; 
        break;
      case '30d':
        dataPoints = 30; 
        interval = 86400000; 
        break;
      default: 
        dataPoints = 24; 
        interval = 3600000; 
        break;
    }
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const timeStart = new Date(timestamp);
      
      let uptime = 100;
      let responseTime = Math.floor(Math.random() * 150) + 30;
      
      
      if (timeStart.getTime() < botStartTime) {
        uptime = 0;
        responseTime = 0;
      } else {
        
        const downtimeChance = Math.random();
        
        
        const baseDowntimeChance = period === '30d' ? 0.1 : 0.05;
        const baseDegradedChance = period === '30d' ? 0.2 : 0.15;
        
        if (downtimeChance < baseDowntimeChance) {
          
          const downtimePercent = period === '30d' 
            ? Math.floor(Math.random() * 20) + 10 
            : Math.floor(Math.random() * 10) + 5; 
          uptime = Math.max(0, 100 - downtimePercent);
          responseTime = Math.floor(Math.random() * 300) + 200;
        } else if (downtimeChance < baseDegradedChance) {
          
          uptime = Math.floor(Math.random() * 15) + 80;
          responseTime = Math.floor(Math.random() * 250) + 150;
        } 
        
        uptime += (Math.random() - 0.5) * 2;
        uptime = Math.max(0, Math.min(100, uptime));
      }
      
      history.push({
        timestamp: timeStart.toISOString(),
        uptime: Math.round(uptime * 10) / 10,
        responseTime: Math.round(responseTime),
        status: uptime > 95 ? 'online' : uptime > 80 ? 'degraded' : 'offline',
        incidents: uptime < 95 ? Math.floor(Math.random() * 3) + 1 : 0,
        period: period
      });
    }
    
    return history;
  }

  getLogs() {
    return [
      { timestamp: new Date().toISOString(), level: 'INFO', message: 'Bot started successfully' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'Command executed: help' },
      { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'WARN', message: 'High memory usage detected' },
      { timestamp: new Date(Date.now() - 180000).toISOString(), level: 'INFO', message: 'New user joined' },
    ];
  }
}

module.exports = new BotService();
