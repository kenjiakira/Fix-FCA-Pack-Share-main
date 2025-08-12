const axios = require('axios');
const fs = require('fs');
const path = require('path');

class UptimeMonitor {
  constructor() {
    this.apiUrl = 'http://localhost:3002/api';
    this.stats = {
      totalCommands: 0,
      activeUsers: 0,
      totalMessages: 0,
      commandUsage: {},
      startTime: Date.now(),
      lastUpdate: Date.now()
    };
    
    this.loadStats();
    this.startPeriodicUpdate();
  }

  // Load existing stats from file
  loadStats() {
    try {
      const statsFile = path.join(__dirname, '../database/uptime_stats.json');
      if (fs.existsSync(statsFile)) {
        const data = fs.readFileSync(statsFile, 'utf8');
        this.stats = { ...this.stats, ...JSON.parse(data) };
      }
    } catch (error) {
      console.log('Could not load uptime stats:', error.message);
    }
  }

  // Save stats to file
  saveStats() {
    try {
      const statsFile = path.join(__dirname, '../database/uptime_stats.json');
      const data = JSON.stringify(this.stats, null, 2);
      fs.writeFileSync(statsFile, data);
    } catch (error) {
      console.log('Could not save uptime stats:', error.message);
    }
  }

  // Update command usage
  trackCommand(commandName) {
    this.stats.totalCommands++;
    this.stats.commandUsage[commandName] = (this.stats.commandUsage[commandName] || 0) + 1;
    this.stats.lastUpdate = Date.now();
  }

  // Update user count
  updateUserCount(count) {
    this.stats.activeUsers = count;
    this.stats.lastUpdate = Date.now();
  }

  // Update message count
  trackMessage() {
    this.stats.totalMessages++;
    this.stats.lastUpdate = Date.now();
  }

  // Send stats to API server
  async updateAPI() {
    try {
      await axios.post(`${this.apiUrl}/update-stats`, {
        commands: this.stats.totalCommands,
        users: this.stats.activeUsers,
        messages: this.stats.totalMessages,
        commandUsage: this.stats.commandUsage,
        startTime: this.stats.startTime,
        lastUpdate: this.stats.lastUpdate
      });
    } catch (error) {
      console.log('Failed to update uptime API:', error.message);
    }
  }

  // Periodic update to API server
  startPeriodicUpdate() {
    setInterval(() => {
      this.updateAPI();
      this.saveStats();
    }, 30000); // Update every 30 seconds
  }

  // Get current stats
  getStats() {
    return {
      ...this.stats,
      uptime: Math.floor((Date.now() - this.stats.startTime) / 1000)
    };
  }

  // Reset stats
  resetStats() {
    this.stats = {
      totalCommands: 0,
      activeUsers: 0,
      totalMessages: 0,
      commandUsage: {},
      startTime: Date.now(),
      lastUpdate: Date.now()
    };
    this.saveStats();
  }

  // Get top commands
  getTopCommands(limit = 10) {
    return Object.entries(this.stats.commandUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([command, usage]) => ({ command, usage }));
  }
}

// Create global instance
const uptimeMonitor = new UptimeMonitor();

// Export for use in bot
module.exports = uptimeMonitor;

// Add to global.cc for easy access
if (typeof global.cc !== 'undefined') {
  global.cc.uptimeMonitor = uptimeMonitor;
}
