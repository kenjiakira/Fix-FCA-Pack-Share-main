const fs = require('fs');
const path = require('path');

class VipService {
  constructor() {
    this.vipDataPath = path.join(__dirname, '../../../commands/json/vip.json');
    this.vipConfigPath = path.join(__dirname, '../../../game/vip/vipConfig.js');
    this.vipLogsPath = path.join(__dirname, '../../../commands/json/vip_logs.json');
    this.vipDisplayConfigPath = path.join(__dirname, '../../../commands/json/vip_display_config.json');
    this.rankDataPath = path.join(__dirname, '../../../events/cache/rankData.json');
  }

  loadVipData() {
    try {
      if (fs.existsSync(this.vipDataPath)) {
        return JSON.parse(fs.readFileSync(this.vipDataPath, 'utf8'));
      }
      return { users: {} };
    } catch (error) {
      console.error('Error loading VIP data:', error);
      return { users: {} };
    }
  }

  saveVipData(data) {
    try {
      fs.writeFileSync(this.vipDataPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving VIP data:', error);
      return false;
    }
  }

  loadVipConfig() {
    try {
      return {
        GOLD: {
          id: 3,
          name: "VIP Gold",
          price: {
            original: "250,000",
            sale: "200,000"
          },
          description: "Gói VIP Gold cao cấp với nhiều quyền lợi đặc biệt",
          benefits: {
            miningBonus: 0.8,
            stolenProtection: 1,
            withdrawalBonusLimit: 2,
            dailyMiningLimit: 50,
            autoMiningDiscount: 0.05,
            teamBonusMultiplier: 1.2,
            fishingCooldown: 120000,
            fishExpMultiplier: 4,
            rareBonus: 0.4,
            dailyTransferLimit: 5000000000,
            gachaBonus: 0.15,
            dailyBonus: true,
            videoDownload: true,
            smsSpam: true,
            giftcodeVIP: true
          }
        }
      };
    } catch (error) {
      console.error('Error loading VIP config:', error);
      return {};
    }
  }

  saveVipConfig(packages) {
    try {
      console.log('VIP config save requested:', packages);
      return true;
    } catch (error) {
      console.error('Error saving VIP config:', error);
      return false;
    }
  }

  logVipAction(action, userId, details) {
    try {
      const logsPath = this.vipLogsPath;
      let logs = [];
      
      if (fs.existsSync(logsPath)) {
        try {
          const fileContent = fs.readFileSync(logsPath, 'utf8');
          const parsed = JSON.parse(fileContent);

          logs = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.error('Error parsing VIP logs file:', parseError);
          logs = [];
        }
      }
      
      logs.push({
        timestamp: Date.now(),
        action,
        userId,
        details,
        admin: 'dashboard'
      });

      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }
      
      fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('Error logging VIP action:', error);
    }
  }

  loadUserRankings() {
    try {
      if (fs.existsSync(this.rankDataPath)) {
        const data = JSON.parse(fs.readFileSync(this.rankDataPath, 'utf8'));
        return data;
      }
      return {};
    } catch (error) {
      console.error('Error loading user rankings:', error);
      return {};
    }
  }

  async getVIPUsers(page = 1, limit = 20, search = '', status = 'all') {
    try {
      const vipData = this.loadVipData();
      const userRankings = this.loadUserRankings();
      const users = Object.entries(vipData.users || {});
      
      let filteredUsers = users.filter(([userId, userData]) => {
        const userRanking = userRankings[userId];
        const userName = userRanking ? userRanking.name : null;
        
        const matchesSearch = !search || 
          userId.includes(search) || 
          (userName && userName.toLowerCase().includes(search.toLowerCase()));
        
        const matchesStatus = status === 'all' || 
          (status === 'active' && userData.expireTime > Date.now()) ||
          (status === 'expired' && userData.expireTime <= Date.now());
        
        return matchesSearch && matchesStatus;
      });
      
      const totalUsers = filteredUsers.length;
      const totalPages = Math.ceil(totalUsers / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      const transformedUsers = paginatedUsers.map(([userId, userData]) => {
        const daysLeft = Math.ceil((userData.expireTime - Date.now()) / (24 * 60 * 60 * 1000));
        const userRanking = userRankings[userId];
        const userName = userRanking ? userRanking.name : null;
        
        return {
          userId,
          packageId: userData.packageId,
          name: userData.name,
          userName: userName,
          expireTime: userData.expireTime,
          daysLeft: Math.max(0, daysLeft),
          isExpired: userData.expireTime <= Date.now(),
          status: userData.expireTime > Date.now() ? 'active' : 'expired',
          purchaseInfo: userData.purchaseInfo
        };
      });
      
      return {
        success: true,
        data: {
          users: transformedUsers,
          pagination: {
            currentPage: page,
            totalPages,
            totalUsers,
            limit
          }
        }
      };
    } catch (error) {
      console.error('Error getting VIP users:', error);
      return { success: false, error: 'Failed to get VIP users' };
    }
  }

  async addVIPUser(userId, packageId, months, reason) {
    try {
      const vipData = this.loadVipData();
      if (!vipData.users) vipData.users = {};
      
      const displayConfig = this.loadVIPDisplayConfig();
      const packageInfo = displayConfig.gold;
      
      if (!packageInfo) {
        return { success: false, error: 'Invalid package ID' };
      }
      
      const daysToAdd = months * 30 + (packageId === 3 ? months * 7 : 0);
      
      vipData.users[userId] = {
        packageId,
        name: packageInfo.name,
        expireTime: Date.now() + (daysToAdd * 24 * 60 * 60 * 1000),
        benefits: packageInfo.benefits,
        purchaseInfo: {
          purchaseDate: Date.now(),
          months: months,
          voucherApplied: null
        }
      };
      
      if (this.saveVipData(vipData)) {
        this.logVipAction('add', userId, { packageId, months, reason });
        return { 
          success: true, 
          message: 'VIP user added successfully',
          data: vipData.users[userId]
        };
      } else {
        return { success: false, error: 'Failed to save VIP data' };
      }
    } catch (error) {
      console.error('Error adding VIP user:', error);
      return { success: false, error: 'Failed to add VIP user' };
    }
  }

  async updateVIPUser(userId, packageId, months, reason) {
    try {
      const vipData = this.loadVipData();
      if (!vipData.users || !vipData.users[userId]) {
        return { success: false, error: 'User not found' };
      }
      
      const displayConfig = this.loadVIPDisplayConfig();
      const packageInfo = displayConfig.gold;
      
      if (!packageInfo) {
        return { success: false, error: 'Invalid package ID' };
      }
      
      const daysToAdd = months * 30 + (packageId === 3 ? months * 7 : 0);
      
      vipData.users[userId] = {
        packageId,
        name: packageInfo.name,
        expireTime: Date.now() + (daysToAdd * 24 * 60 * 60 * 1000),
        benefits: packageInfo.benefits,
        purchaseInfo: {
          purchaseDate: Date.now(),
          months: months,
          voucherApplied: null
        }
      };
      
      if (this.saveVipData(vipData)) {
        this.logVipAction('update', userId, { packageId, months, reason });
        return { 
          success: true, 
          message: 'VIP user updated successfully',
          data: vipData.users[userId]
        };
      } else {
        return { success: false, error: 'Failed to save VIP data' };
      }
    } catch (error) {
      console.error('Error updating VIP user:', error);
      return { success: false, error: 'Failed to update VIP user' };
    }
  }

  async removeVIPUser(userId, reason) {
    try {
      const vipData = this.loadVipData();
      if (!vipData.users || !vipData.users[userId]) {
        return { success: false, error: 'User not found' };
      }
      
      delete vipData.users[userId];
      
      if (this.saveVipData(vipData)) {
        this.logVipAction('remove', userId, { reason });
        return { 
          success: true, 
          message: 'VIP user removed successfully'
        };
      } else {
        return { success: false, error: 'Failed to save VIP data' };
      }
    } catch (error) {
      console.error('Error removing VIP user:', error);
      return { success: false, error: 'Failed to remove VIP user' };
    }
  }

  async getVIPPackages() {
    try {
      const displayConfig = this.loadVIPDisplayConfig();
      const packagesArray = Object.entries(displayConfig).map(([key, config]) => ({
        id: key === 'gold' ? 3 : 1,
        name: config.name,
        price: {
          original: config.price,
          sale: config.price
        },
        description: config.description,
        benefits: config.benefits
      }));
      
      return {
        success: true,
        data: packagesArray
      };
    } catch (error) {
      console.error('Error getting VIP packages:', error);
      return { success: false, error: 'Failed to get VIP packages' };
    }
  }

  async updateVIPPackage(packageId, updates) {
    try {
      const displayConfig = this.loadVIPDisplayConfig();
      const packageKey = packageId === '3' ? 'gold' : 'gold';
      
      if (!displayConfig[packageKey]) {
        return { success: false, error: 'Package not found' };
      }
      
      displayConfig[packageKey] = {
        ...displayConfig[packageKey],
        ...updates
      };
      
      if (this.saveVIPDisplayConfig(displayConfig)) {
        this.logVipAction('update_package', null, { packageId, updates });
        return { 
          success: true, 
          message: 'VIP package updated successfully',
          data: displayConfig[packageKey]
        };
      } else {
        return { success: false, error: 'Failed to save VIP display config' };
      }
    } catch (error) {
      console.error('Error updating VIP package:', error);
      return { success: false, error: 'Failed to update VIP package' };
    }
  }

  async getVIPStats() {
    try {
      const vipData = this.loadVipData();
      const users = Object.values(vipData.users || {});
      const now = Date.now();
      
      const stats = {
        total: users.length,
        active: users.filter(user => user.expireTime > now).length,
        expired: users.filter(user => user.expireTime <= now).length,
        byPackage: {},
        expiringSoon: users.filter(user => {
          const daysLeft = Math.ceil((user.expireTime - now) / (24 * 60 * 60 * 1000));
          return daysLeft > 0 && daysLeft <= 7;
        }).length,
        revenue: {
          total: 0,
          thisMonth: 0,
          thisYear: 0
        }
      };
      
      users.forEach(user => {
        const packageName = user.name || 'Unknown';
        stats.byPackage[packageName] = (stats.byPackage[packageName] || 0) + 1;
      });
      
      const displayConfig = this.loadVIPDisplayConfig();
      users.forEach(user => {
        const packageInfo = displayConfig.gold;
        if (packageInfo && user.purchaseInfo) {
          const basePrice = parseInt(packageInfo.price.replace(/,/g, '')) || 0;
          const months = user.purchaseInfo.months || 1;
          const revenue = basePrice * months;
          
          stats.revenue.total += revenue;
          
          const purchaseDate = new Date(user.purchaseInfo.purchaseDate);
          const currentDate = new Date();
          
          if (purchaseDate.getMonth() === currentDate.getMonth() && 
              purchaseDate.getFullYear() === currentDate.getFullYear()) {
            stats.revenue.thisMonth += revenue;
          }
          
          if (purchaseDate.getFullYear() === currentDate.getFullYear()) {
            stats.revenue.thisYear += revenue;
          }
        }
      });
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting VIP stats:', error);
      return { success: false, error: 'Failed to get VIP stats' };
    }
  }

  async getVIPRevenue() {
    try {
      const vipData = this.loadVipData();
      const users = Object.values(vipData.users || {});
      const displayConfig = this.loadVIPDisplayConfig();
      
      const revenue = {
        total: 0,
        byMonth: {},
        byPackage: {},
        trend: []
      };
      
      users.forEach(user => {
        const packageInfo = displayConfig.gold;
        if (packageInfo && user.purchaseInfo) {
          const basePrice = parseInt(packageInfo.price.replace(/,/g, '')) || 0;
          const months = user.purchaseInfo.months || 1;
          const userRevenue = basePrice * months;
          
          revenue.total += userRevenue;
          
          const packageName = user.name || 'Unknown';
          revenue.byPackage[packageName] = (revenue.byPackage[packageName] || 0) + userRevenue;
          
          const purchaseDate = new Date(user.purchaseInfo.purchaseDate);
          const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
          revenue.byMonth[monthKey] = (revenue.byMonth[monthKey] || 0) + userRevenue;
        }
      });
      
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
        
        revenue.trend.push({
          month: monthName,
          revenue: revenue.byMonth[monthKey] || 0
        });
      }
      
      return {
        success: true,
        data: revenue
      };
    } catch (error) {
      console.error('Error getting VIP revenue:', error);
      return { success: false, error: 'Failed to get VIP revenue' };
    }
  }

  async exportVIPData(format = 'json') {
    try {
      const vipData = this.loadVipData();
      const users = Object.entries(vipData.users || {});
      
      if (format === 'csv') {
        const csvHeaders = 'User ID,Package Name,Expire Date,Days Left,Status,Purchase Date,Months\n';
        const csvRows = users.map(([userId, userData]) => {
          const daysLeft = Math.ceil((userData.expireTime - Date.now()) / (24 * 60 * 60 * 1000));
          const status = userData.expireTime > Date.now() ? 'Active' : 'Expired';
          const expireDate = new Date(userData.expireTime).toLocaleDateString('vi-VN');
          const purchaseDate = userData.purchaseInfo ? 
            new Date(userData.purchaseInfo.purchaseDate).toLocaleDateString('vi-VN') : 'N/A';
          const months = userData.purchaseInfo ? userData.purchaseInfo.months : 'N/A';
          
          return `${userId},"${userData.name}",${expireDate},${Math.max(0, daysLeft)},${status},${purchaseDate},${months}`;
        }).join('\n');
        
        return {
          success: true,
          data: csvHeaders + csvRows
        };
      } else {
        return {
          success: true,
          data: users.map(([userId, userData]) => ({
            userId,
            packageId: userData.packageId,
            name: userData.name,
            expireTime: userData.expireTime,
            daysLeft: Math.max(0, Math.ceil((userData.expireTime - Date.now()) / (24 * 60 * 60 * 1000))),
            status: userData.expireTime > Date.now() ? 'active' : 'expired',
            purchaseInfo: userData.purchaseInfo
          }))
        };
      }
    } catch (error) {
      console.error('Error exporting VIP data:', error);
      return { success: false, error: 'Failed to export VIP data' };
    }
  }

  loadVIPDisplayConfig() {
    try {
      if (fs.existsSync(this.vipDisplayConfigPath)) {
        return JSON.parse(fs.readFileSync(this.vipDisplayConfigPath, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error('Error loading VIP display config:', error);
      return {};
    }
  }

  saveVIPDisplayConfig(config) {
    try {
      fs.writeFileSync(this.vipDisplayConfigPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving VIP display config:', error);
      return false;
    }
  }

  async getVIPDisplayConfig() {
    try {
      const config = this.loadVIPDisplayConfig();
      return {
        success: true,
        data: config
      };
    } catch (error) {
      console.error('Error getting VIP display config:', error);
      return { success: false, error: 'Failed to get VIP display config' };
    }
  }

  async updateVIPDisplayConfig(config) {
    try {
      if (this.saveVIPDisplayConfig(config)) {
        this.logVipAction('update_display_config', null, { config });
        return {
          success: true,
          message: 'VIP display config updated successfully',
          data: config
        };
      } else {
        return { success: false, error: 'Failed to save VIP display config' };
      }
    } catch (error) {
      console.error('Error updating VIP display config:', error);
      return { success: false, error: 'Failed to update VIP display config' };
    }
  }
}

module.exports = new VipService();
