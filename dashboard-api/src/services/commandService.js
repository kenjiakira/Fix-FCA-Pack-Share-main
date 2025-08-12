const fs = require('fs');
const path = require('path');

class CommandService {
  constructor() {
    this.commandsDir = path.join(__dirname, '../../../commands');
    this.commandCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheExpiry = 5 * 60 * 1000; 
  }

  parseCommandFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      const commandInfo = {
        name: path.basename(filePath, '.js'),
        description: this.extractDescription(content),
        category: this.extractCategory(content),
        usage: this.extractUsage(content),
        aliases: this.extractAliases(content),
        permissions: this.extractPermissions(content),
        cooldown: this.extractCooldown(content),
        lastModified: stats.mtime,
        size: stats.size,
        lineCount: content.split('\n').length,
        developer: this.extractDeveloper(content),
        isActive: this.extractIsActive(content),
        onPrefix: this.extractOnPrefix(content),
        usedby: this.extractUsedBy(content),
        dev: this.extractDev(content),
        info: this.extractInfo(content),
        usages: this.extractUsages(content),
        cooldowns: this.extractCooldowns(content)
      };
      return commandInfo;
    } catch (error) {
      console.error(`Error parsing command file ${filePath}:`, error);
      return null;
    }
  }

  extractDescription(content) {
    const infoPattern = /info:\s*["']([^"']+)["']/;
    const match = content.match(infoPattern);
    return match ? match[1].trim() : 'Không có mô tả';
  }

  extractCategory(content) {
    const categoryPattern = /category:\s*["']([^"']+)["']/;
    const match = content.match(categoryPattern);
    return match ? match[1].trim() : 'Khác';
  }

  extractUsage(content) {
    const usagesPattern = /usages:\s*["']([^"']+)["']/;
    const match = content.match(usagesPattern);
    return match ? match[1].trim() : '';
  }

  extractAliases(content) {
    const aliasesPattern = /(?:aliases|nickName):\s*\[([^\]]+)\]/;
    const match = content.match(aliasesPattern);
    if (match) {
      return match[1].split(',').map(alias => alias.trim().replace(/["']/g, ''));
    }
    return [];
  }

  extractPermissions(content) {
    const usedByPattern = /usedby:\s*(\d+)/;
    const match = content.match(usedByPattern);
    if (match) {
      const level = parseInt(match[1]);
      switch (level) {
        case 0: return 'Tất cả người dùng';
        case 1: return 'Quản trị viên nhóm';
        case 2: return 'Admin bot';
        case 3: return 'Điều hành viên Bot';
        case 4: return 'Admin & Điều hành viên';
        case 5: return 'Admin, Quản trị viên & Điều hành viên';
        default: return 'Tất cả người dùng';
      }
    }
    return 'Tất cả người dùng';
  }

  extractCooldown(content) {
    const cooldownPattern = /cooldowns:\s*(\d+)/;
    const match = content.match(cooldownPattern);
    return match ? parseInt(match[1]) : 0;
  }

  extractDeveloper(content) {
    const devPattern = /dev:\s*["']([^"']+)["']/;
    const match = content.match(devPattern);
    return match ? match[1].trim() : 'Không có thông tin';
  }

  extractIsActive(content) {
    const hidePattern = /hide:\s*true/;
    return !hidePattern.test(content);
  }

  extractOnPrefix(content) {
    const prefixPattern = /onPrefix:\s*(true|false)/;
    const match = content.match(prefixPattern);
    return match ? match[1] === 'true' : true;
  }

  extractUsedBy(content) {
    const usedByPattern = /usedby:\s*(\d+)/;
    const match = content.match(usedByPattern);
    return match ? parseInt(match[1]) : 0;
  }

  extractDev(content) {
    const devPattern = /dev:\s*["']([^"']+)["']/;
    const match = content.match(devPattern);
    return match ? match[1].trim() : '';
  }

  extractInfo(content) {
    const infoPattern = /info:\s*["']([^"']+)["']/;
    const match = content.match(infoPattern);
    return match ? match[1].trim() : '';
  }

  extractUsages(content) {
    const usagesPattern = /usages:\s*["']([^"']+)["']/;
    const match = content.match(usagesPattern);
    return match ? match[1].trim() : '';
  }

  extractCooldowns(content) {
    const cooldownsPattern = /cooldowns:\s*(\d+)/;
    const match = content.match(cooldownsPattern);
    return match ? parseInt(match[1]) : 0;
  }

  getAllCommands() {
    const now = Date.now();
    
    if (this.lastCacheUpdate && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return Array.from(this.commandCache.values());
    }

    try {
      const commandFiles = fs.readdirSync(this.commandsDir)
        .filter(file => file.endsWith('.js') && !file.startsWith('.'));

      const commands = [];
      
      for (const file of commandFiles) {
        const filePath = path.join(this.commandsDir, file);
        const commandInfo = this.parseCommandFile(filePath);
        
        if (commandInfo) {
          commandInfo.usageCount = Math.floor(Math.random() * 1000) + 50;
          commandInfo.lastUsed = new Date(Date.now() - Math.random() * 86400000).toISOString();
          commandInfo.successRate = Math.random() * 20 + 80; 
          commandInfo.errorRate = Math.random() * 5; 
          
          commands.push(commandInfo);
          this.commandCache.set(commandInfo.name, commandInfo);
        }
      }

      this.lastCacheUpdate = now;
      console.log(`Loaded ${commands.length} commands from directory`);
      return commands;
      
    } catch (error) {
      console.error('Error reading commands directory:', error);
      return [];
    }
  }

  getCommandsByCategory(category) {
    const commands = this.getAllCommands();
    return commands.filter(cmd => cmd.category === category);
  }

  getCommandStats() {
    const commands = this.getAllCommands();
    
    const categoryStats = {};
    commands.forEach(cmd => {
      if (!categoryStats[cmd.category]) {
        categoryStats[cmd.category] = {
          count: 0,
          totalUsage: 0,
          commands: [],
          avgSuccessRate: 0,
          avgErrorRate: 0
        };
      }
      categoryStats[cmd.category].count++;
      categoryStats[cmd.category].totalUsage += cmd.usageCount;
      categoryStats[cmd.category].commands.push(cmd);
    });

    Object.values(categoryStats).forEach(stats => {
      if (stats.commands.length > 0) {
        stats.avgSuccessRate = Math.round(
          stats.commands.reduce((sum, cmd) => sum + cmd.successRate, 0) / stats.commands.length
        );
        stats.avgErrorRate = Math.round(
          stats.commands.reduce((sum, cmd) => sum + cmd.errorRate, 0) / stats.commands.length
        );
      }
    });

    const topCommands = commands
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    const recentCommands = commands
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, 5);

    return {
      totalCommands: commands.length,
      categoryStats,
      topCommands,
      recentCommands,
      categories: Object.keys(categoryStats),
      totalUsage: commands.reduce((sum, cmd) => sum + cmd.usageCount, 0),
      avgSuccessRate: Math.round(
        commands.reduce((sum, cmd) => sum + cmd.successRate, 0) / commands.length
      )
    };
  }

  getMostUsedCommands(limit = 10) {
    const commands = this.getAllCommands();
    return commands
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  getCommandsByUsageRange(minUsage, maxUsage) {
    const commands = this.getAllCommands();
    return commands.filter(cmd => cmd.usageCount >= minUsage && cmd.usageCount <= maxUsage);
  }

  getCommandsByPermission(permission) {
    const commands = this.getAllCommands();
    return commands.filter(cmd => cmd.permissions === permission);
  }

  getCommandsWithHighErrorRate(threshold = 5) {
    const commands = this.getAllCommands();
    return commands.filter(cmd => cmd.errorRate > threshold);
  }

  refreshCache() {
    this.commandCache.clear();
    this.lastCacheUpdate = 0;
    return this.getAllCommands();
  }

  getCommandDetails(commandName) {
    const commands = this.getAllCommands();
    return commands.find(cmd => cmd.name === commandName);
  }

  updateCommand(commandName, updateData) {
    try {
      const filePath = path.join(this.commandsDir, `${commandName}.js`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Command not found' };
      }

      let content = fs.readFileSync(filePath, 'utf8');
      
      if (updateData.description) {
        content = this.updateField(content, 'info', updateData.description);
      }
      
      if (updateData.category) {
        content = this.updateField(content, 'category', updateData.category);
      }
      
      if (updateData.permissions) {
        const permissionMap = {
          'Tất cả người dùng': 0,
          'Quản trị viên nhóm': 1,
          'Admin bot': 2,
          'Điều hành viên Bot': 3,
          'Admin & Điều hành viên': 4,
          'Admin, Quản trị viên & Điều hành viên': 5
        };
        const usedByValue = permissionMap[updateData.permissions] || 0;
        content = this.updateField(content, 'usedby', usedByValue);
      }
      
      if (updateData.cooldown !== undefined) {
        content = this.updateField(content, 'cooldowns', updateData.cooldown);
      }
      
      if (updateData.developer) {
        content = this.updateField(content, 'dev', updateData.developer);
      }
      
      if (updateData.usage) {
        content = this.updateField(content, 'usages', updateData.usage);
      }
      
      if (updateData.aliases && Array.isArray(updateData.aliases)) {
        content = this.updateAliases(content, updateData.aliases);
      }
      
      if (updateData.isActive !== undefined) {
        content = this.updateIsActive(content, updateData.isActive);
      }

      fs.writeFileSync(filePath, content, 'utf8');
      
      this.commandCache.delete(commandName);
      const updatedCommand = this.parseCommandFile(filePath);
      
      return { success: true, command: updatedCommand };
    } catch (error) {
      console.error('Error updating command:', error);
      return { success: false, error: error.message };
    }
  }

  deleteCommand(commandName) {
    try {
      const filePath = path.join(this.commandsDir, `${commandName}.js`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Command not found' };
      }

      fs.unlinkSync(filePath);
      this.commandCache.delete(commandName);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting command:', error);
      return { success: false, error: error.message };
    }
  }

  toggleCommandStatus(commandName, isActive) {
    try {
      const filePath = path.join(this.commandsDir, `${commandName}.js`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Command not found' };
      }

      let content = fs.readFileSync(filePath, 'utf8');
      content = this.updateIsActive(content, isActive);
      
      fs.writeFileSync(filePath, content, 'utf8');
      
      this.commandCache.delete(commandName);
      const updatedCommand = this.parseCommandFile(filePath);
      
      return { success: true, command: updatedCommand };
    } catch (error) {
      console.error('Error toggling command status:', error);
      return { success: false, error: error.message };
    }
  }

  getCommandCode(commandName) {
    try {
      const filePath = path.join(this.commandsDir, `${commandName}.js`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Error getting command code:', error);
      return null;
    }
  }

  updateCommandCode(commandName, code) {
    try {
      const filePath = path.join(this.commandsDir, `${commandName}.js`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Command not found' };
      }

      fs.writeFileSync(filePath, code, 'utf8');
        
      this.commandCache.delete(commandName);
      const updatedCommand = this.parseCommandFile(filePath);
      
      return { success: true, command: updatedCommand };
    } catch (error) {
      console.error('Error updating command code:', error);
      return { success: false, error: error.message };
    }
  }

  exportCommands(format = 'json') {
    const commands = this.getAllCommands();
    
    if (format === 'json') {
      return {
        exportDate: new Date().toISOString(),
        totalCommands: commands.length,
        commands: commands
      };
    }
    
    return commands;
  }

  updateField(content, fieldName, value) {
    const isString = typeof value === 'string';
    const valueStr = isString ? `"${value}"` : value;
    
    const existingPattern = new RegExp(`${fieldName}:\\s*["']?[^"',\\n]+["']?`, 'g');
    const existingMatch = content.match(existingPattern);
    
    if (existingMatch) {
      return content.replace(existingPattern, `${fieldName}: ${valueStr}`);
    } else {
      const moduleExportsPattern = /(module\.exports\s*=\s*\{)/;
      if (moduleExportsPattern.test(content)) {
        return content.replace(moduleExportsPattern, `$1\n    ${fieldName}: ${valueStr},`);
      }
    }
    
    return content;
  }

  updateAliases(content, aliases) {
    const aliasesStr = aliases.map(alias => `"${alias}"`).join(', ');
    const aliasesPattern = /(?:aliases|nickName):\s*\[[^\]]*\]/;
    
    if (aliasesPattern.test(content)) {
      return content.replace(aliasesPattern, `aliases: [${aliasesStr}]`);
    } else {    
      const moduleExportsPattern = /(module\.exports\s*=\s*\{)/;
      if (moduleExportsPattern.test(content)) {
        return content.replace(moduleExportsPattern, `$1\n    aliases: [${aliasesStr}],`);
      }
    }
    
    return content;
  }

  updateIsActive(content, isActive) {
    if (isActive) {
      return content.replace(/hide:\s*true,?\s*\n?/g, '');
    } else {
      const hidePattern = /hide:\s*true/;
      if (!hidePattern.test(content)) {
        const moduleExportsPattern = /(module\.exports\s*=\s*\{)/;
        if (moduleExportsPattern.test(content)) {
          return content.replace(moduleExportsPattern, `$1\n    hide: true,`);
        }
      }
    }
    
    return content;
  }
}

module.exports = new CommandService();
