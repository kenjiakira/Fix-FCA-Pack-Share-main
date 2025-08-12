const express = require('express');
const currencyService = require('../services/currencyService');

const router = express.Router();

// GET /api/currencies/stats - Lấy thống kê tổng quan
router.get('/stats', (req, res) => {
  try {
    console.log('Fetching currency stats...');
    const stats = currencyService.getCurrencyStats();
    console.log('Currency stats fetched successfully:', {
      totalUsers: stats.totalUsers,
      totalBalance: stats.totalBalance,
      totalBankBalance: stats.totalBankBalance,
      totalTransactions: stats.totalTransactions
    });
    res.json(stats);
  } catch (error) {
    console.error('Error getting currency stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể tải thống kê tiền tệ',
      details: error.message 
    });
  }
});

// GET /api/currencies/users - Lấy danh sách users với pagination
router.get('/users', (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    console.log('Fetching users list with params:', { page, limit, search });
    
    const usersList = currencyService.getUsersList(
      parseInt(page), 
      parseInt(limit), 
      search
    );
    
    console.log('Users list fetched successfully:', {
      totalUsers: usersList.users.length,
      totalPages: usersList.pagination.totalPages,
      currentPage: usersList.pagination.page
    });
    
    res.json(usersList);
  } catch (error) {
    console.error('Error getting users list:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể tải danh sách người dùng',
      details: error.message 
    });
  }
});

// GET /api/currencies/users/:userId - Lấy thông tin chi tiết user
router.get('/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching user details for:', userId);
    
    const userDetails = currencyService.getUserDetails(userId);
    console.log('User details fetched successfully for:', userId);
    
    res.json(userDetails);
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể tải thông tin người dùng',
      details: error.message 
    });
  }
});

// PUT /api/currencies/users/:userId/balance - Cập nhật balance của user
router.put('/users/:userId/balance', (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type = 'wallet' } = req.body;

    console.log('Updating user balance:', { userId, amount, type });

    if (typeof amount !== 'number' && isNaN(parseFloat(amount))) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'Số tiền không hợp lệ' 
      });
    }

    const result = currencyService.updateUserBalance(userId, amount, type);
    
    if (result.success) {
      console.log('User balance updated successfully:', { userId, amount, type });
      res.json(result);
    } else {
      console.error('Failed to update user balance:', result.message);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating user balance:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể cập nhật số dư người dùng',
      details: error.message 
    });
  }
});

// PUT /api/currencies/users/:userId/details - Cập nhật nhiều thông tin user cùng lúc
router.put('/users/:userId/details', (req, res) => {
  try {
    const { userId } = req.params;
    const { walletBalance, bankBalance, creditScore, description } = req.body;

    console.log('Updating user details:', { userId, walletBalance, bankBalance, creditScore, description });

    const userData = {};
    if (walletBalance !== undefined) userData.walletBalance = parseFloat(walletBalance);
    if (bankBalance !== undefined) userData.bankBalance = parseFloat(bankBalance);
    if (creditScore !== undefined) userData.creditScore = parseInt(creditScore);
    if (description) userData.description = description;

    const result = currencyService.updateUserDetails(userId, userData);
    
    if (result.success) {
      console.log('User details updated successfully:', { userId, userData });
      res.json(result);
    } else {
      console.error('Failed to update user details:', result.messages);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể cập nhật thông tin người dùng',
      details: error.message 
    });
  }
});

// PUT /api/currencies/users/:userId/wallet - Đặt số dư ví tuyệt đối
router.put('/users/:userId/wallet', (req, res) => {
  try {
    const { userId } = req.params;
    const { balance, description = 'Admin edit' } = req.body;

    console.log('Setting user wallet balance:', { userId, balance, description });

    if (typeof balance !== 'number' && isNaN(parseFloat(balance))) {
      return res.status(400).json({ 
        error: 'Invalid balance',
        message: 'Số dư không hợp lệ' 
      });
    }

    const result = currencyService.setUserWalletBalance(userId, balance, description);
    
    if (result.success) {
      console.log('User wallet balance set successfully:', { userId, balance });
      res.json(result);
    } else {
      console.error('Failed to set user wallet balance:', result.message);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error setting user wallet balance:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể đặt số dư ví người dùng',
      details: error.message 
    });
  }
});

// PUT /api/currencies/users/:userId/bank - Đặt số dư ngân hàng tuyệt đối
router.put('/users/:userId/bank', (req, res) => {
  try {
    const { userId } = req.params;
    const { balance, description = 'Admin edit' } = req.body;

    console.log('Setting user bank balance:', { userId, balance, description });

    if (typeof balance !== 'number' && isNaN(parseFloat(balance))) {
      return res.status(400).json({ 
        error: 'Invalid balance',
        message: 'Số dư không hợp lệ' 
      });
    }

    const result = currencyService.setUserBankBalance(userId, balance, description);
    
    if (result.success) {
      console.log('User bank balance set successfully:', { userId, balance });
      res.json(result);
    } else {
      console.error('Failed to set user bank balance:', result.message);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error setting user bank balance:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể đặt số dư ngân hàng người dùng',
      details: error.message 
    });
  }
});

// PUT /api/currencies/users/:userId/credit-score - Cập nhật điểm tín dụng
router.put('/users/:userId/credit-score', (req, res) => {
  try {
    const { userId } = req.params;
    const { creditScore, description = 'Admin edit' } = req.body;

    console.log('Updating user credit score:', { userId, creditScore, description });

    if (typeof creditScore !== 'number' && isNaN(parseInt(creditScore))) {
      return res.status(400).json({ 
        error: 'Invalid credit score',
        message: 'Điểm tín dụng không hợp lệ' 
      });
    }

    const result = currencyService.updateUserCreditScore(userId, creditScore, description);
    
    if (result.success) {
      console.log('User credit score updated successfully:', { userId, creditScore });
      res.json(result);
    } else {
      console.error('Failed to update user credit score:', result.message);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating user credit score:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể cập nhật điểm tín dụng người dùng',
      details: error.message 
    });
  }
});

// GET /api/currencies/transactions - Lấy lịch sử giao dịch
router.get('/transactions', (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;
    console.log('Fetching transaction history:', { userId, limit });
    
    const transactions = currencyService.getTransactionHistory(
      userId || null, 
      parseInt(limit)
    );
    
    console.log('Transaction history fetched successfully:', {
      totalTransactions: transactions.length,
      userId: userId || 'all'
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể tải lịch sử giao dịch',
      details: error.message 
    });
  }
});

// POST /api/currencies/transactions - Tạo giao dịch mới
router.post('/transactions', (req, res) => {
  try {
    const { userId, type, amount, description } = req.body;

    console.log('Creating new transaction:', { userId, type, amount, description });

    if (!userId || !type || (typeof amount !== 'number' && isNaN(parseFloat(amount))) || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Thiếu thông tin bắt buộc: userId, type, amount, description' 
      });
    }

    const result = currencyService.createTransaction(userId, type, amount, description);
    
    if (result.success) {
      console.log('Transaction created successfully:', result.transaction);
      res.json(result);
    } else {
      console.error('Failed to create transaction:', result.message);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể tạo giao dịch',
      details: error.message 
    });
  }
});

// GET /api/currencies/leaderboard - Lấy bảng xếp hạng
router.get('/leaderboard', (req, res) => {
  try {
    console.log('Fetching currency leaderboard...');
    const stats = currencyService.getCurrencyStats();
    
    const leaderboard = {
      topUsersByBalance: stats.topUsersByBalance,
      topUsersByBankBalance: stats.topUsersByBankBalance
    };
    
    console.log('Leaderboard fetched successfully');
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể tải bảng xếp hạng',
      details: error.message 
    });
  }
});

// GET /api/currencies/overview - Lấy tổng quan hệ thống
router.get('/overview', (req, res) => {
  try {
    console.log('Fetching currency overview...');
    const stats = currencyService.getCurrencyStats();
    const recentTransactions = currencyService.getTransactionHistory(null, 10);
    
    const overview = {
      stats,
      recentTransactions,
      currencyTypes: ['wallet', 'bank', 'mining'],
      lastUpdated: new Date().toISOString()
    };
    
    console.log('Currency overview fetched successfully');
    res.json(overview);
  } catch (error) {
    console.error('Error getting currency overview:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể tải tổng quan hệ thống tiền tệ',
      details: error.message 
    });
  }
});

module.exports = router;
