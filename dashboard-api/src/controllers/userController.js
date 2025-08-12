const express = require('express');
const userService = require('../services/userService');

const router = express.Router();

// GET /api/users - Get user statistics
router.get('/', (req, res) => {
  try {
    const userStats = userService.getUserStats();
    res.json(userStats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/list - Get users with pagination and filters
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const rank = req.query.rank || 'all';
    const sortBy = req.query.sortBy || 'exp';
    const sortOrder = req.query.sortOrder || 'desc';

    const result = await userService.getUsers(page, limit, search, status, rank, sortBy, sortOrder);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error getting users list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/analytics - Get user analytics
router.get('/analytics', async (req, res) => {
  try {
    const result = await userService.getUserAnalytics();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/top - Get top users
router.get('/top', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = userService.loadUserRankings();
    const topUsers = users.slice(0, limit);
    res.json(topUsers);
  } catch (error) {
    console.error('Error getting top users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/active - Get active users
router.get('/active', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const activeUsers = userService.getActiveUsers(hours);
    res.json(activeUsers);
  } catch (error) {
    console.error('Error getting active users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/rank/:rank - Get users by rank
router.get('/rank/:rank', (req, res) => {
  try {
    const rank = req.params.rank;
    const limit = parseInt(req.query.limit) || 10;
    const users = userService.getTopUsersByRank(rank, limit);
    res.json(users);
  } catch (error) {
    console.error('Error getting users by rank:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:userId - Get specific user
router.get('/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const user = userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:userId/details - Get detailed user information
router.get('/:userId/details', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await userService.getUserDetails(userId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:userId - Update user
router.put('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const updates = req.body;
    
    const result = await userService.updateUser(userId, updates);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:userId/ban - Ban user
router.post('/:userId/ban', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { reason, duration } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Ban reason is required' });
    }
    
    const result = await userService.banUser(userId, reason, duration);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:userId/unban - Unban user
router.post('/:userId/unban', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await userService.unbanUser(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/actions - Get user actions history
router.get('/actions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const actionType = req.query.actionType || 'all';
    const timeFilter = req.query.timeFilter || 'all';
    
    const result = await userService.getUserActions(page, limit, actionType, timeFilter);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error getting user actions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/bulk-actions - Bulk actions (ban/warn multiple users)
router.post('/bulk-actions', async (req, res) => {
  try {
    const { actionType, userIds, reason, duration } = req.body;
    
    if (!actionType || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Invalid bulk action parameters' });
    }
    
    const result = await userService.performBulkAction(actionType, userIds, reason, duration);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:userId/warnings - Get user warnings
router.get('/:userId/warnings', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await userService.getUserWarnings(userId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error getting user warnings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:userId/warn - Warn user
router.post('/:userId/warn', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Warning reason is required' });
    }
    
    const result = await userService.warnUser(userId, reason);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error warning user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/warnings/:warningId - Remove warning
router.delete('/warnings/:warningId', async (req, res) => {
  try {
    const warningId = req.params.warningId;
    const result = await userService.removeWarning(warningId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error removing warning:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/search/:query - Search users
router.get('/search/:query', (req, res) => {
  try {
    const query = req.params.query;
    const users = userService.loadUserRankings();
    
    const searchResults = users.filter(user => 
      user.userId.includes(query) || 
      user.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:userId/avatar - Check if user has avatar
router.get('/:userId/avatar', (req, res) => {
  try {
    const userId = req.params.userId;
    const hasAvatar = userService.avatarExists(userId);
    
    res.json({
      userId,
      hasAvatar,
      avatarUrl: hasAvatar ? `/api/avatars/${userId}.jpg` : null
    });
  } catch (error) {
    console.error('Error checking avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/stats/export - Export user statistics
router.get('/stats/export', (req, res) => {
  try {
    const format = req.query.format || 'json';
    const userStats = userService.getUserStats();
    
    if (format === 'csv') {
      const csvHeaders = 'Total Users,Active Users,Banned Users,Average Level,Average Exp,Total Warnings\n';
      const csvRow = `${userStats.totalUsers},${userStats.activeUsers},${userStats.bannedUsers},${userStats.averageLevel},${userStats.averageExp},${userStats.warnings}\n`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=user-stats.csv');
      res.send(csvHeaders + csvRow);
    } else {
      res.json(userStats);
    }
  } catch (error) {
    console.error('Error exporting user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
