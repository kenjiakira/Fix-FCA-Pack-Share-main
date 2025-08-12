const fs = require('fs');
const path = require('path');

class UserService {
  constructor() {
    this.rankDataPath = path.join(__dirname, '../../../events/cache/rankData.json');
    this.userRankings = [];
    this.warningsPath = path.join(__dirname, '../../../commands/json/warns.json');
    this.bannedPath = path.join(__dirname, '../../../commands/json/banned.json');
    this.transactionsPath = path.join(__dirname, '../../../commands/json/transactions.json');
    this.actionsPath = path.join(__dirname, '../../../commands/json/userActions.json');
    this.initializeActionFiles();
  }

  initializeActionFiles() {
    const files = [this.warningsPath, this.bannedPath];
    files.forEach(filePath => {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
      }
    });
    
    // Initialize actions file as array
    const actionsDir = path.dirname(this.actionsPath);
    if (!fs.existsSync(actionsDir)) {
      fs.mkdirSync(actionsDir, { recursive: true });
    }
    if (!fs.existsSync(this.actionsPath)) {
      fs.writeFileSync(this.actionsPath, JSON.stringify([], null, 2));
    }
  }

  loadUserRankings() {
    try {
      if (fs.existsSync(this.rankDataPath)) {
        const data = JSON.parse(fs.readFileSync(this.rankDataPath, 'utf8'));
        
        this.userRankings = Object.entries(data)
          .filter(([userId, userData]) => userData && userData.name) 
          .map(([userId, userData]) => ({
            userId,
            name: userData.name || 'Unknown',
            exp: userData.exp || 0,
            level: userData.level || 1,
            rank: this.getRankFromLevel(userData.level || 1),
            lastActive: userData.lastMessageTime || Date.now(),
            totalCommands: userData.totalCommands || 0,
            joinDate: userData.joinDate || Date.now(),
            rankNumber: userData.rank || 999,
            avatar: this.getAvatarUrl(userId),
            bio: userData.bio || '',
            status: userData.status || 'active',
            warnings: userData.warnings || 0,
            isBanned: userData.isBanned || false,
            banReason: userData.banReason || null,
            banDate: userData.banDate || null,
            banExpiry: userData.banExpiry || null
          }))
          .sort((a, b) => b.exp - a.exp);
        
        console.log(`Loaded ${this.userRankings.length} users from rankData.json`);
        return this.userRankings;
      } else {
        console.log('rankData.json not found at:', this.rankDataPath);
        return [];
      }
    } catch (error) {
      console.error('Error loading user rankings:', error);
      return [];
    }
  }

  getRankFromLevel(level) {
    if (level >= 20) return 'Diamond';
    if (level >= 15) return 'Platinum';
    if (level >= 10) return 'Gold';
    if (level >= 5) return 'Silver';
    return 'Bronze';
  }

  getAvatarUrl(userId) {
    const avatarPath = path.join(__dirname, '../../../commands/cache/avatars', `${userId}.jpg`);
    if (fs.existsSync(avatarPath)) {
      return `/api/avatars/${userId}.jpg`;
    }
    return null;
  }

  avatarExists(userId) {
    const avatarPath = path.join(__dirname, '../../../commands/cache/avatars', `${userId}.jpg`);
    return fs.existsSync(avatarPath);
  }

  getUserStats() {
    const users = this.loadUserRankings();
    
    if (users.length === 0) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        topUsers: [],
        rankDistribution: {
          Bronze: 0,
          Silver: 0,
          Gold: 0,
          Platinum: 0,
          Diamond: 0
        },
        averageExp: 0,
        averageLevel: 0,
        recentActivity: [],
        warnings: 0
      };
    }

    const activeUsers = users.filter(user => 
      Date.now() - user.lastActive < 24 * 60 * 60 * 1000
    );

    const bannedUsers = users.filter(user => user.isBanned);

    const rankDistribution = {
      Bronze: users.filter(u => u.rank === 'Bronze').length,
      Silver: users.filter(u => u.rank === 'Silver').length,
      Gold: users.filter(u => u.rank === 'Gold').length,
      Platinum: users.filter(u => u.rank === 'Platinum').length,
      Diamond: users.filter(u => u.rank === 'Diamond').length
    };

    const averageExp = Math.round(
      users.reduce((sum, user) => sum + user.exp, 0) / users.length
    );
    
    const averageLevel = Math.round(
      users.reduce((sum, user) => sum + user.level, 0) / users.length
    );

    const totalWarnings = users.reduce((sum, user) => sum + user.warnings, 0);

    const recentActivity = users
      .filter(user => Date.now() - user.lastActive < 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.lastActive - a.lastActive)
      .slice(0, 10);

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      bannedUsers: bannedUsers.length,
      topUsers: users.slice(0, 10),
      rankDistribution,
      averageExp,
      averageLevel,
      recentActivity,
      warnings: totalWarnings
    };
  }

  getUserById(userId) {
    const users = this.loadUserRankings();
    return users.find(user => user.userId === userId);
  }

  getTopUsersByRank(rank, limit = 10) {
    const users = this.loadUserRankings();
    return users
      .filter(user => user.rank === rank)
      .slice(0, limit);
  }

  getActiveUsers(hours = 24) {
    const users = this.loadUserRankings();
    const timeThreshold = Date.now() - (hours * 60 * 60 * 1000);
    return users.filter(user => user.lastActive > timeThreshold);
  }

  async getUsers(page = 1, limit = 20, search = '', status = 'all', rank = 'all', sortBy = 'exp', sortOrder = 'desc') {
    try {
      const users = this.loadUserRankings();
      
      let filteredUsers = users.filter(user => {
        const matchesSearch = !search || 
          user.userId.includes(search) || 
          user.name.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = status === 'all' || 
          (status === 'active' && !user.isBanned) ||
          (status === 'banned' && user.isBanned) ||
          (status === 'inactive' && Date.now() - user.lastActive > 7 * 24 * 60 * 60 * 1000);
        
        const matchesRank = rank === 'all' || user.rank === rank;
        
        return matchesSearch && matchesStatus && matchesRank;
      });
      
      filteredUsers.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'level':
            aValue = a.level;
            bValue = b.level;
            break;
          case 'lastActive':
            aValue = a.lastActive;
            bValue = b.lastActive;
            break;
          case 'joinDate':
            aValue = a.joinDate;
            bValue = b.joinDate;
            break;
          case 'warnings':
            aValue = a.warnings;
            bValue = b.warnings;
            break;
          default:
            aValue = a.exp;
            bValue = b.exp;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      const usersWithAvatars = filteredUsers.map(user => ({
        ...user,
        avatar: this.getAvatarUrl(user.userId)
      }));
      
      const totalUsers = usersWithAvatars.length;
      const totalPages = Math.ceil(totalUsers / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = usersWithAvatars.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          users: paginatedUsers,
          pagination: {
            currentPage: page,
            totalPages,
            totalUsers,
            limit
          }
        }
      };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error: 'Failed to get users' };
    }
  }

  async getUserDetails(userId) {
    try {
      const user = this.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const warnings = this.loadWarnings();
      const transactions = this.loadTransactions();
      
      const userWarnings = warnings.filter(w => w.userId === userId);
      const userTransactions = transactions.filter(t => t.userId === userId);

      const userDetails = {
        ...user,
        avatar: this.getAvatarUrl(userId),
        warnings: userWarnings,
        transactions: userTransactions,
        stats: {
          totalWarnings: userWarnings.length,
          totalTransactions: userTransactions.length,
          totalSpent: userTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
          daysSinceJoin: Math.floor((Date.now() - user.joinDate) / (24 * 60 * 60 * 1000)),
          daysSinceLastActive: Math.floor((Date.now() - user.lastActive) / (24 * 60 * 60 * 1000))
        }
      };

      return {
        success: true,
        data: userDetails
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      return { success: false, error: 'Failed to get user details' };
    }
  }

  async updateUser(userId, updates) {
    try {
      const users = this.loadUserRankings();
      const userIndex = users.findIndex(u => u.userId === userId);
      
      if (userIndex === -1) {
        return { success: false, error: 'User not found' };
      }

      users[userIndex] = { ...users[userIndex], ...updates };
      
      const data = {};
      users.forEach(user => {
        data[user.userId] = {
          name: user.name,
          exp: user.exp,
          level: user.level,
          lastMessageTime: user.lastActive,
          totalCommands: user.totalCommands,
          joinDate: user.joinDate,
          rank: user.rankNumber,
          avatar: user.avatar,
          bio: user.bio,
          status: user.status,
          warnings: user.warnings,
          isBanned: user.isBanned,
          banReason: user.banReason,
          banDate: user.banDate,
          banExpiry: user.banExpiry
        };
      });

      fs.writeFileSync(this.rankDataPath, JSON.stringify(data, null, 2));
      
      return {
        success: true,
        message: 'User updated successfully',
        data: users[userIndex]
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Failed to update user' };
    }
  }

  async banUser(userId, reason, duration = null) {
    try {
      // Update rankData.json
      const rankData = this.loadRankData();
      if (rankData[userId]) {
        rankData[userId].isBanned = true;
        rankData[userId].banReason = reason;
        rankData[userId].banDate = Date.now();
        rankData[userId].banExpiry = duration ? Date.now() + (duration * 24 * 60 * 60 * 1000) : null;
        rankData[userId].status = 'banned';
        this.saveRankData(rankData);
      }

      // Update banned.json (for manage.js compatibility)
      const bannedData = this.loadBannedData();
      bannedData[userId] = {
        reason: reason,
        time: Date.now(),
        duration: duration,
        expiry: duration ? Date.now() + (duration * 24 * 60 * 60 * 1000) : null
      };
      this.saveBannedData(bannedData);

      // Log action
      this.logUserAction('ban', userId, { reason, duration });

      return {
        success: true,
        message: 'User banned successfully',
        data: { userId, reason, duration }
      };
    } catch (error) {
      console.error('Error banning user:', error);
      return { success: false, error: 'Failed to ban user' };
    }
  }

  async unbanUser(userId) {
    try {
      // Update rankData.json
      const rankData = this.loadRankData();
      if (rankData[userId]) {
        rankData[userId].isBanned = false;
        rankData[userId].banReason = null;
        rankData[userId].banDate = null;
        rankData[userId].banExpiry = null;
        rankData[userId].status = 'active';
        this.saveRankData(rankData);
      }

      // Update banned.json (for manage.js compatibility)
      const bannedData = this.loadBannedData();
      delete bannedData[userId];
      this.saveBannedData(bannedData);

      // Log action
      this.logUserAction('unban', userId, {});

      return {
        success: true,
        message: 'User unbanned successfully',
        data: { userId }
      };
    } catch (error) {
      console.error('Error unbanning user:', error);
      return { success: false, error: 'Failed to unban user' };
    }
  }

  async warnUser(userId, reason) {
    try {
      // Update rankData.json
      const rankData = this.loadRankData();
      if (rankData[userId]) {
        rankData[userId].warnings = (rankData[userId].warnings || 0) + 1;
        this.saveRankData(rankData);
      }

      // Update warns.json (for manage.js compatibility)
      const warnsData = this.loadWarnsData();
      if (!warnsData[userId]) {
        warnsData[userId] = [];
      }
      warnsData[userId].push({
        reason: reason,
        time: Date.now(),
        threadID: 'dashboard'
      });
      this.saveWarnsData(warnsData);

      // Check if user should be auto-banned (3 warnings)
      if (warnsData[userId].length >= 3) {
        await this.banUser(userId, 'Auto-ban: Đủ 3 lần cảnh báo');
        return {
          success: true,
          message: 'User warned and auto-banned due to 3 warnings',
          data: { userId, reason, autoBanned: true }
        };
      }

      // Log action
      this.logUserAction('warn', userId, { reason });

      return {
        success: true,
        message: 'User warned successfully',
        data: { userId, reason, warnings: warnsData[userId].length }
      };
    } catch (error) {
      console.error('Error warning user:', error);
      return { success: false, error: 'Failed to warn user' };
    }
  }

  async removeWarning(warningId) {
    try {
      const warnings = this.loadWarnings();
      const warningIndex = warnings.findIndex(w => w.id === warningId);
      
      if (warningIndex === -1) {
        return { success: false, error: 'Warning not found' };
      }

      const warning = warnings[warningIndex];
      warnings.splice(warningIndex, 1);
      this.saveWarnings(warnings);

      // Update rankData.json
      const rankData = this.loadRankData();
      if (rankData[warning.userId]) {
        rankData[warning.userId].warnings = Math.max(0, (rankData[warning.userId].warnings || 0) - 1);
        this.saveRankData(rankData);
      }

      this.logUserAction('remove_warning', warning.userId, { warningId });

      return {
        success: true,
        message: 'Warning removed successfully'
      };
    } catch (error) {
      console.error('Error removing warning:', error);
      return { success: false, error: 'Failed to remove warning' };
    }
  }

  async getUserAnalytics() {
    try {
      const users = this.loadUserRankings();
      
      const analytics = {
        totalUsers: users.length,
        activeUsers: users.filter(u => Date.now() - u.lastActive < 24 * 60 * 60 * 1000).length,
        bannedUsers: users.filter(u => u.isBanned).length,
        newUsersThisWeek: users.filter(u => Date.now() - u.joinDate < 7 * 24 * 60 * 60 * 1000).length,
        newUsersThisMonth: users.filter(u => Date.now() - u.joinDate < 30 * 24 * 60 * 60 * 1000).length,
        rankDistribution: {},
        activityTrend: [],
        topUsers: users.slice(0, 10),
        usersWithWarnings: users.filter(u => u.warnings > 0).length
      };

      users.forEach(user => {
        analytics.rankDistribution[user.rank] = (analytics.rankDistribution[user.rank] || 0) + 1;
      });

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
        
        const activeUsers = users.filter(u => u.lastActive >= startOfDay && u.lastActive < endOfDay).length;
        
        analytics.activityTrend.push({
          date: date.toISOString().split('T')[0],
          activeUsers
        });
      }

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { success: false, error: 'Failed to get user analytics' };
    }
  }

  loadWarnings() {
    try {
      if (fs.existsSync(this.warningsPath)) {
        return JSON.parse(fs.readFileSync(this.warningsPath, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error('Error loading warnings:', error);
      return [];
    }
  }

  saveWarnings(warnings) {
    try {
      fs.writeFileSync(this.warningsPath, JSON.stringify(warnings, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving warnings:', error);
      return false;
    }
  }

  loadTransactions() {
    try {
      if (fs.existsSync(this.transactionsPath)) {
        return JSON.parse(fs.readFileSync(this.transactionsPath, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  logUserAction(action, userId, details) {
    try {
      const actions = this.loadActions();
      const newAction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        action,
        userId,
        details,
        admin: 'dashboard'
      };
      actions.push(newAction);
      this.saveActions(actions);
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }

  async getUserActions(page = 1, limit = 20, actionType = 'all', timeFilter = 'all') {
    try {
      const actions = this.loadActions();
      let filteredActions = actions;

      // Add sample data for testing if no actions exist
      if (actions.length === 0) {
        const sampleActions = [
          {
            id: 'sample-1',
            timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
            action: 'warn',
            userId: 'sample-user-1',
            details: { reason: 'Spam messages', warnings: 1 },
            admin: 'dashboard'
          },
          {
            id: 'sample-2',
            timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            action: 'ban',
            userId: 'sample-user-2',
            details: { reason: 'Inappropriate content', duration: 7 },
            admin: 'dashboard'
          },
          {
            id: 'sample-3',
            timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
            action: 'unban',
            userId: 'sample-user-3',
            details: {},
            admin: 'dashboard'
          }
        ];
        
        // Save sample data
        this.saveActions(sampleActions);
        filteredActions = sampleActions;
      }

      // Filter by action type
      if (actionType !== 'all') {
        filteredActions = filteredActions.filter(action => action.action === actionType);
      }

      // Filter by time
      const now = Date.now();
      switch (timeFilter) {
        case '1h':
          filteredActions = filteredActions.filter(action => now - action.timestamp < 60 * 60 * 1000);
          break;
        case '24h':
          filteredActions = filteredActions.filter(action => now - action.timestamp < 24 * 60 * 60 * 1000);
          break;
        case '7d':
          filteredActions = filteredActions.filter(action => now - action.timestamp < 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          filteredActions = filteredActions.filter(action => now - action.timestamp < 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Sort by timestamp (newest first)
      filteredActions.sort((a, b) => b.timestamp - a.timestamp);

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedActions = filteredActions.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          actions: paginatedActions,
          pagination: {
            page,
            limit,
            total: filteredActions.length,
            totalPages: Math.ceil(filteredActions.length / limit)
          }
        }
      };
    } catch (error) {
      console.error('Error getting user actions:', error);
      return { success: false, error: 'Failed to get user actions' };
    }
  }

  async performBulkAction(actionType, userIds, reason, duration = null) {
    try {
      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          let result;
          switch (actionType) {
            case 'ban':
              result = await this.banUser(userId, reason, duration);
              break;
            case 'warn':
              result = await this.warnUser(userId, reason);
              break;
            case 'unban':
              result = await this.unbanUser(userId);
              break;
            default:
              throw new Error(`Unknown action type: ${actionType}`);
          }

          if (result.success) {
            results.push({ userId, success: true, data: result.data });
          } else {
            errors.push({ userId, error: result.error });
          }
        } catch (error) {
          errors.push({ userId, error: error.message });
        }
      }

      return {
        success: true,
        data: {
          actionType,
          total: userIds.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors
        }
      };
    } catch (error) {
      console.error('Error performing bulk action:', error);
      return { success: false, error: 'Failed to perform bulk action' };
    }
  }

  async getUserWarnings(userId) {
    try {
      const warnsData = this.loadWarnsData();
      const userWarnings = warnsData[userId] || [];
      
      return {
        success: true,
        data: {
          userId,
          warnings: userWarnings,
          totalWarnings: userWarnings.length,
          isBanned: this.isUserBanned(userId)
        }
      };
    } catch (error) {
      console.error('Error getting user warnings:', error);
      return { success: false, error: 'Failed to get user warnings' };
    }
  }

  // Helper methods for file operations
  loadRankData() {
    try {
      if (fs.existsSync(this.rankDataPath)) {
        return JSON.parse(fs.readFileSync(this.rankDataPath, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error('Error loading rank data:', error);
      return {};
    }
  }

  saveRankData(data) {
    try {
      fs.writeFileSync(this.rankDataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving rank data:', error);
    }
  }

  loadWarnsData() {
    try {
      if (fs.existsSync(this.warningsPath)) {
        return JSON.parse(fs.readFileSync(this.warningsPath, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error('Error loading warns data:', error);
      return {};
    }
  }

  saveWarnsData(data) {
    try {
      fs.writeFileSync(this.warningsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving warns data:', error);
    }
  }

  loadBannedData() {
    try {
      if (fs.existsSync(this.bannedPath)) {
        return JSON.parse(fs.readFileSync(this.bannedPath, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error('Error loading banned data:', error);
      return {};
    }
  }

  saveBannedData(data) {
    try {
      fs.writeFileSync(this.bannedPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving banned data:', error);
    }
  }

  loadActions() {
    try {
      console.log('Loading actions from:', this.actionsPath)
      if (fs.existsSync(this.actionsPath)) {
        const data = fs.readFileSync(this.actionsPath, 'utf8')
        console.log('Raw actions data:', data)
        const parsed = JSON.parse(data)
        console.log('Parsed actions:', parsed)
        return Array.isArray(parsed) ? parsed : []
      }
      console.log('Actions file does not exist, returning empty array')
      return []
    } catch (error) {
      console.error('Error loading actions:', error)
      return []
    }
  }

  saveActions(actions) {
    try {
      fs.writeFileSync(this.actionsPath, JSON.stringify(actions, null, 2));
    } catch (error) {
      console.error('Error saving actions:', error);
    }
  }

  isUserBanned(userId) {
    try {
      const bannedData = this.loadBannedData();
      return !!bannedData[userId];
    } catch (error) {
      console.error('Error checking if user is banned:', error);
      return false;
    }
  }
}

module.exports = new UserService();
