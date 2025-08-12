const express = require('express');
const userInfoService = require('../services/userInfoService');
const router = express.Router();

// GET /api/userinfo/:userId - Lấy thông tin user
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userInfo = userInfoService.getUserInfo(userId);
    
    res.json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// POST /api/userinfo/batch - Lấy thông tin nhiều users
router.post('/batch', (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'userIds must be an array'
      });
    }
    
    const usersInfo = userInfoService.getUsersInfo(userIds);
    
    res.json({
      success: true,
      data: usersInfo
    });
  } catch (error) {
    console.error('Error getting users info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users info'
    });
  }
});

// GET /api/userinfo/avatar/:userId - Kiểm tra avatar có tồn tại không
router.get('/avatar/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const exists = userInfoService.avatarExists(userId);
    const avatarUrl = userInfoService.getAvatarUrl(userId);
    
    res.json({
      success: true,
      data: {
        exists,
        avatarUrl
      }
    });
  } catch (error) {
    console.error('Error checking avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check avatar'
    });
  }
});

// GET /api/userinfo/all - Lấy danh sách tất cả users
router.get('/all', (req, res) => {
  try {
    const allUsers = userInfoService.getAllUsers();
    
    res.json({
      success: true,
      data: allUsers
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all users'
    });
  }
});

module.exports = router;
