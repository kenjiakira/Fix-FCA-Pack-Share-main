const fs = require('fs');
const path = require('path');
const userInfoService = require('./userInfoService');

class CurrencyService {
  constructor() {
    
    this.currenciesPath = path.join(__dirname, '../../../commands/json/currencies/banking.json');
    this.transactionsPath = path.join(__dirname, '../../../commands/json/currencies/transactions.json');
    this.balancePath = path.join(__dirname, '../../../database/currencies.json');
    this.balanceBackupPath = path.join(__dirname, '../../../database/currencies.json.backup');
    this.mainTransactionsPath = path.join(__dirname, '../../../commands/json/transactions.json');
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    try {
      const currenciesDir = path.dirname(this.currenciesPath);
      const balanceDir = path.dirname(this.balancePath);
      
      if (!fs.existsSync(currenciesDir)) {
        fs.mkdirSync(currenciesDir, { recursive: true });
      }
      
      if (!fs.existsSync(balanceDir)) {
        fs.mkdirSync(balanceDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error ensuring directories:', error);
    }
  }

  getCurrenciesData() {
    try {
      if (fs.existsSync(this.currenciesPath)) {
        const data = JSON.parse(fs.readFileSync(this.currenciesPath, 'utf8'));
        return data;
      }
      
      const initialData = { users: {}, transactions: {} };
      fs.writeFileSync(this.currenciesPath, JSON.stringify(initialData, null, 2));
      return initialData;
    } catch (error) {
      console.error('Error reading currencies data:', error);
      return { users: {}, transactions: {} };
    }
  }

  getBalanceData() {
    try {
      if (fs.existsSync(this.balancePath)) {
        const data = JSON.parse(fs.readFileSync(this.balancePath, 'utf8'));
        return data;
      }
      
      const initialData = { balance: {} };
      fs.writeFileSync(this.balancePath, JSON.stringify(initialData, null, 2));
      return initialData;
    } catch (error) {
      console.error('Error reading balance data:', error);
      return { balance: {} };
    }
  }

  getBalanceBackupData() {
    try {
      if (fs.existsSync(this.balanceBackupPath)) {
        const data = JSON.parse(fs.readFileSync(this.balanceBackupPath, 'utf8'));
        return data;
      }
      
      const initialData = { balance: {} };
      fs.writeFileSync(this.balanceBackupPath, JSON.stringify(initialData, null, 2));
      return initialData;
    } catch (error) {
      console.error('Error reading balance backup data:', error);
      return { balance: {} };
    }
  }

  saveBalanceData(balanceData) {
    try {
      fs.writeFileSync(this.balancePath, JSON.stringify(balanceData, null, 2));
      
      fs.writeFileSync(this.balanceBackupPath, JSON.stringify(balanceData, null, 2));
      
      return true;
    } catch (error) {
      console.error('Error saving balance data:', error);
      return false;
    }
  }

  getMainTransactionsData() {
    try {
      if (fs.existsSync(this.mainTransactionsPath)) {
        const data = JSON.parse(fs.readFileSync(this.mainTransactionsPath, 'utf8'));
        return data;
      }
      return {};
    } catch (error) {
      console.error('Error reading main transactions data:', error);
      return {};
    }
  }

  getCurrencyStats() {
    try {
      const currenciesData = this.getCurrenciesData();
      const balanceData = this.getBalanceData();
      const mainTransactionsData = this.getMainTransactionsData();

      const users = currenciesData.users || {};
      const balance = balanceData.balance || {};
      const transactions = currenciesData.transactions || {};

    
      const allUserIds = new Set([...Object.keys(users), ...Object.keys(balance)]);
      const totalUsers = allUserIds.size;
      const totalBalance = Object.values(balance).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      const totalBankBalance = Object.values(users).reduce((sum, user) => sum + (parseFloat(user.bankBalance) || 0), 0);

      const topUsersByBalance = Object.entries(balance)
        .sort((a, b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0))
        .slice(0, 10)
        .map(([userId, amount]) => {
          const userInfo = userInfoService.getUserInfo(userId);
          return { 
            userId, 
            amount: parseFloat(amount) || 0,
            name: userInfo.name,
            avatar: userInfo.avatar
          };
        });

      const topUsersByBankBalance = Object.entries(users)
        .sort((a, b) => (parseFloat(b[1].bankBalance) || 0) - (parseFloat(a[1].bankBalance) || 0))
        .slice(0, 10)
        .map(([userId, userData]) => {
          const userInfo = userInfoService.getUserInfo(userId);
          return { 
            userId, 
            bankBalance: parseFloat(userData.bankBalance) || 0,
            name: userInfo.name,
            avatar: userInfo.avatar
          };
        });

      const totalTransactions = Object.values(transactions).reduce((sum, userTxs) => {
        return sum + (Array.isArray(userTxs) ? userTxs.length : 0);
      }, 0);

      return {
        totalUsers,
        totalBalance,
        totalBankBalance,
        totalMiningBalance: 0,
        totalTransactions,
        topUsersByBalance,
        topUsersByBankBalance,
        currencyDistribution: {
          wallet: totalBalance,
          bank: totalBankBalance,
          mining: 0
        }
      };
    } catch (error) {
      console.error('Error getting currency stats:', error);
      return {
        totalUsers: 0,
        totalBalance: 0,
        totalBankBalance: 0,
        totalMiningBalance: 0,
        totalTransactions: 0,
        topUsersByBalance: [],
        topUsersByBankBalance: [],
        currencyDistribution: {
          wallet: 0,
          bank: 0,
          mining: 0
        }
      };
    }
  }


  getUserDetails(userId) {
    try {
      const currenciesData = this.getCurrenciesData();
      const balanceData = this.getBalanceData();
      const mainTransactionsData = this.getMainTransactionsData();

      const userBankData = currenciesData.users?.[userId] || {};
      const walletBalance = parseFloat(balanceData.balance?.[userId]) || 0;
      const transactions = currenciesData.transactions?.[userId] || [];
      
      const userInfo = userInfoService.getUserInfo(userId);

      return {
        userId,
        name: userInfo.name,
        avatar: userInfo.avatar,
        walletBalance,
        bankBalance: parseFloat(userBankData.bankBalance) || 0,
        miningBalance: 0, 
        creditScore: parseInt(userBankData.creditScore) || 0,
        createdAt: userBankData.createdAt,
        lastInterest: userBankData.lastInterest,
        totalTransactions: transactions.length,
        recentTransactions: transactions.slice(-10).reverse(),
        penalties: userBankData.penalties || [],
        balanceHistory: userBankData.balanceHistory || []
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      return {
        userId,
        name: 'Unknown',
        avatar: null,
        walletBalance: 0,
        bankBalance: 0,
        miningBalance: 0,
        creditScore: 0,
        createdAt: null,
        lastInterest: null,
        totalTransactions: 0,
        recentTransactions: [],
        penalties: [],
        balanceHistory: []
      };
    }
  }

  updateUserBalance(userId, amount, type = 'wallet') {
    try {
      if (type === 'wallet') {
        const balanceData = this.getBalanceData();
        balanceData.balance = balanceData.balance || {};
        balanceData.balance[userId] = (parseFloat(balanceData.balance[userId]) || 0) + parseFloat(amount);
        this.saveBalanceData(balanceData);
      } else if (type === 'bank') {
        const currenciesData = this.getCurrenciesData();
        currenciesData.users = currenciesData.users || {};
        if (!currenciesData.users[userId]) {
          currenciesData.users[userId] = {
            bankBalance: 0,
            lastInterest: Date.now(),
            createdAt: Date.now(),
            balanceHistory: [],
            penalties: [],
            creditScore: 0
          };
        }
        currenciesData.users[userId].bankBalance = (parseFloat(currenciesData.users[userId].bankBalance) || 0) + parseFloat(amount);
        fs.writeFileSync(this.currenciesPath, JSON.stringify(currenciesData, null, 2));
      }

      return { success: true, message: 'Balance updated successfully' };
    } catch (error) {
      console.error('Error updating user balance:', error);
      return { success: false, message: 'Failed to update balance' };
    }
  }

  setUserWalletBalance(userId, balance, description = 'Admin edit') {
    try {
      const balanceData = this.getBalanceData();
      balanceData.balance = balanceData.balance || {};
      const oldBalance = parseFloat(balanceData.balance[userId]) || 0;
      balanceData.balance[userId] = parseFloat(balance);
      
      this.createTransaction(userId, 'admin', parseFloat(balance) - oldBalance, description);
      
      this.saveBalanceData(balanceData);
      
      return { success: true, message: 'Wallet balance set successfully' };
    } catch (error) {
      console.error('Error setting wallet balance:', error);
      return { success: false, message: 'Failed to set wallet balance' };
    }
  }

  setUserBankBalance(userId, balance, description = 'Admin edit') {
    try {
      const currenciesData = this.getCurrenciesData();
      currenciesData.users = currenciesData.users || {};
      
      if (!currenciesData.users[userId]) {
        currenciesData.users[userId] = {
          bankBalance: 0,
          lastInterest: Date.now(),
          createdAt: Date.now(),
          balanceHistory: [],
          penalties: [],
          creditScore: 0
        };
      }
      
      const oldBalance = parseFloat(currenciesData.users[userId].bankBalance) || 0;
      currenciesData.users[userId].bankBalance = parseFloat(balance);
      
      this.createTransaction(userId, 'admin', parseFloat(balance) - oldBalance, description);
      
      fs.writeFileSync(this.currenciesPath, JSON.stringify(currenciesData, null, 2));
      return { success: true, message: 'Bank balance set successfully' };
    } catch (error) {
      console.error('Error setting bank balance:', error);
      return { success: false, message: 'Failed to set bank balance' };
    }
  }

  updateUserCreditScore(userId, creditScore, description = 'Admin edit') {
    try {
      const currenciesData = this.getCurrenciesData();
      currenciesData.users = currenciesData.users || {};
      
      if (!currenciesData.users[userId]) {
        currenciesData.users[userId] = {
          bankBalance: 0,
          lastInterest: Date.now(),
          createdAt: Date.now(),
          balanceHistory: [],
          penalties: [],
          creditScore: 0
        };
      }
      
      const oldCreditScore = parseInt(currenciesData.users[userId].creditScore) || 0;
      currenciesData.users[userId].creditScore = parseInt(creditScore);
      
      this.createTransaction(userId, 'admin', 0, `${description} - Credit score: ${oldCreditScore} → ${creditScore}`);
      
      fs.writeFileSync(this.currenciesPath, JSON.stringify(currenciesData, null, 2));
      return { success: true, message: 'Credit score updated successfully' };
    } catch (error) {
      console.error('Error updating credit score:', error);
      return { success: false, message: 'Failed to update credit score' };
    }
  }

  updateUserDetails(userId, userData) {
    try {
      const result = { success: true, messages: [] };
      
      if (userData.walletBalance !== undefined) {
        const walletResult = this.setUserWalletBalance(userId, userData.walletBalance, userData.description || 'Admin edit');
        if (!walletResult.success) {
          result.success = false;
          result.messages.push(walletResult.message);
        }
      }
      
      if (userData.bankBalance !== undefined) {
        const bankResult = this.setUserBankBalance(userId, userData.bankBalance, userData.description || 'Admin edit');
        if (!bankResult.success) {
          result.success = false;
          result.messages.push(bankResult.message);
        }
      }
      
      if (userData.creditScore !== undefined) {
        const creditResult = this.updateUserCreditScore(userId, userData.creditScore, userData.description || 'Admin edit');
        if (!creditResult.success) {
          result.success = false;
          result.messages.push(creditResult.message);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating user details:', error);
      return { success: false, message: 'Failed to update user details' };
    }
  }

  getTransactionHistory(userId = null, limit = 50) {
    try {
      const currenciesData = this.getCurrenciesData();
      const transactions = currenciesData.transactions || {};

      if (userId) {
        return transactions[userId] || [];
      }

      const allTransactions = [];
      Object.entries(transactions).forEach(([uid, userTxs]) => {
        if (Array.isArray(userTxs)) {
          userTxs.forEach(tx => {
            allTransactions.push({
              ...tx,
              userId: uid
            });
          });
        }
      });

      return allTransactions
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  createTransaction(userId, type, amount, description) {
    try {
      const currenciesData = this.getCurrenciesData();
      currenciesData.transactions = currenciesData.transactions || {};
      currenciesData.transactions[userId] = currenciesData.transactions[userId] || [];

      const transaction = {
        type,
        description,
        amount: parseFloat(amount),
        timestamp: Date.now()
      };

      currenciesData.transactions[userId].push(transaction);
      fs.writeFileSync(this.currenciesPath, JSON.stringify(currenciesData, null, 2));

      return { success: true, transaction };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { success: false, message: 'Failed to create transaction' };
    }
  }

  getUsersList(page = 1, limit = 20, search = '') {
    try {
      const currenciesData = this.getCurrenciesData();
      const balanceData = this.getBalanceData();

      const users = currenciesData.users || {};
      const balance = balanceData.balance || {};

      const allUserIds = new Set([...Object.keys(users), ...Object.keys(balance)]);
      
      let usersList = Array.from(allUserIds).map(userId => {
        const userInfo = userInfoService.getUserInfo(userId);
        return {
          userId,
          name: userInfo.name,
          avatar: userInfo.avatar,
          bankBalance: parseFloat(users[userId]?.bankBalance) || 0,
          walletBalance: parseFloat(balance[userId]) || 0,
          miningBalance: 0,
          creditScore: parseInt(users[userId]?.creditScore) || 0,
          createdAt: users[userId]?.createdAt,
          totalBalance: (parseFloat(users[userId]?.bankBalance) || 0) + (parseFloat(balance[userId]) || 0)
        };
      });

      if (search) {
        usersList = usersList.filter(user => 
          user.userId.includes(search) || 
          user.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      usersList.sort((a, b) => b.totalBalance - a.totalBalance);

      const total = usersList.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = usersList.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting users list:', error);
      return {
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      };
    }
  }
}

module.exports = new CurrencyService();
