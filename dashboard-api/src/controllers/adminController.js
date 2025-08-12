const express = require('express');
const fs = require('fs');
const path = require('path');
const userInfoService = require('../services/userInfoService');

const router = express.Router();

const ADMIN_CONFIG_PATH = path.join(__dirname, '../../../admin.json');

const loadAdminConfig = () => {
  try {
    return JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.error('Error loading admin config:', error);
    return null;
  }
};

const saveAdminConfig = (config) => {
  try {
    fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving admin config:', error);
    return false;
  }
};

// GET /api/admin/config - Get admin configuration
router.get('/config', (req, res) => {
  try {
    const config = loadAdminConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load admin configuration' });
    }
    
    res.json({
      success: true,
      data: {
        prefix: config.prefix,
        botName: config.botName,
        ownerName: config.ownerName,
        facebookLink: config.facebookLink,
        adminUIDs: config.adminUIDs || [],
        moderatorUIDs: config.moderatorUIDs || [],
        supportUIDs: config.supportUIDs || [],
        feedbackGroupID: config.feedbackGroupID || [],
        resend: config.resend,
        notilogs: config.notilogs,
        restart: config.restart,
        restartTime: config.restartTime,
        mtnMode: config.mtnMode,
        customCommands: config.customCommands || {}
      }
    });
  } catch (error) {
    console.error('Error getting admin config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/config - Update admin configuration
router.post('/config', (req, res) => {
  try {
    const config = loadAdminConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load admin configuration' });
    }

    const {
      prefix,
      botName,
      ownerName,
      facebookLink,
      resend,
      notilogs,
      restart,
      restartTime,
      mtnMode
    } = req.body;

    // Update basic settings
    if (prefix !== undefined) config.prefix = prefix;
    if (botName !== undefined) config.botName = botName;
    if (ownerName !== undefined) config.ownerName = ownerName;
    if (facebookLink !== undefined) config.facebookLink = facebookLink;
    if (resend !== undefined) config.resend = resend;
    if (notilogs !== undefined) config.notilogs = notilogs;
    if (restart !== undefined) config.restart = restart;
    if (restartTime !== undefined) config.restartTime = restartTime;
    if (mtnMode !== undefined) config.mtnMode = mtnMode;

    if (saveAdminConfig(config)) {
      res.json({
        success: true,
        message: 'Admin configuration updated successfully',
        data: config
      });
    } else {
      res.status(500).json({ error: 'Failed to save admin configuration' });
    }
  } catch (error) {
    console.error('Error updating admin config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users - Get all admin users
router.get('/users', (req, res) => {
  try {
    const config = loadAdminConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load admin configuration' });
    }

    // Get all UIDs
    const adminUIDs = config.adminUIDs || [];
    const moderatorUIDs = config.moderatorUIDs || [];
    const supportUIDs = config.supportUIDs || [];

    // Get user info for all UIDs
    const allUIDs = [...adminUIDs, ...moderatorUIDs, ...supportUIDs];
    const usersInfo = userInfoService.getUsersInfo(allUIDs);

    // Map users with their info
    const adminUsers = adminUIDs.map(uid => ({
      uid,
      role: 'admin',
      type: 'admin',
      name: usersInfo[uid]?.name || 'Unknown',
      avatar: usersInfo[uid]?.avatar || null
    }));

    const moderatorUsers = moderatorUIDs.map(uid => ({
      uid,
      role: 'moderator',
      type: 'moderator',
      name: usersInfo[uid]?.name || 'Unknown',
      avatar: usersInfo[uid]?.avatar || null
    }));

    const supportUsers = supportUIDs.map(uid => ({
      uid,
      role: 'support',
      type: 'support',
      name: usersInfo[uid]?.name || 'Unknown',
      avatar: usersInfo[uid]?.avatar || null
    }));

    res.json({
      success: true,
      data: {
        admins: adminUsers,
        moderators: moderatorUsers,
        support: supportUsers,
        total: adminUsers.length + moderatorUsers.length + supportUsers.length
      }
    });
  } catch (error) {
    console.error('Error getting admin users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/add - Add admin user
router.post('/users/add', (req, res) => {
  try {
    const { uid, role } = req.body;
    
    if (!uid || !role) {
      return res.status(400).json({ error: 'UID and role are required' });
    }

    if (!['admin', 'moderator', 'support'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, moderator, or support' });
    }

    const config = loadAdminConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load admin configuration' });
    }

    // Initialize arrays if they don't exist
    if (!config.adminUIDs) config.adminUIDs = [];
    if (!config.moderatorUIDs) config.moderatorUIDs = [];
    if (!config.supportUIDs) config.supportUIDs = [];

    // Remove user from all roles first
    config.adminUIDs = config.adminUIDs.filter(id => id !== uid);
    config.moderatorUIDs = config.moderatorUIDs.filter(id => id !== uid);
    config.supportUIDs = config.supportUIDs.filter(id => id !== uid);

    // Add user to specified role
    switch (role) {
      case 'admin':
        if (!config.adminUIDs.includes(uid)) {
          config.adminUIDs.push(uid);
        }
        break;
      case 'moderator':
        if (!config.moderatorUIDs.includes(uid)) {
          config.moderatorUIDs.push(uid);
        }
        break;
      case 'support':
        if (!config.supportUIDs.includes(uid)) {
          config.supportUIDs.push(uid);
        }
        break;
    }

    if (saveAdminConfig(config)) {
      res.json({
        success: true,
        message: `User ${uid} added as ${role} successfully`,
        data: {
          uid,
          role,
          adminUIDs: config.adminUIDs,
          moderatorUIDs: config.moderatorUIDs,
          supportUIDs: config.supportUIDs
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to save admin configuration' });
    }
  } catch (error) {
    console.error('Error adding admin user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/remove - Remove admin user
router.post('/users/remove', (req, res) => {
  try {
    const { uid, role } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const config = loadAdminConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load admin configuration' });
    }

    let removed = false;

    if (role) {
      // Remove from specific role
      switch (role) {
        case 'admin':
          if (config.adminUIDs && config.adminUIDs.includes(uid)) {
            config.adminUIDs = config.adminUIDs.filter(id => id !== uid);
            removed = true;
          }
          break;
        case 'moderator':
          if (config.moderatorUIDs && config.moderatorUIDs.includes(uid)) {
            config.moderatorUIDs = config.moderatorUIDs.filter(id => id !== uid);
            removed = true;
          }
          break;
        case 'support':
          if (config.supportUIDs && config.supportUIDs.includes(uid)) {
            config.supportUIDs = config.supportUIDs.filter(id => id !== uid);
            removed = true;
          }
          break;
      }
    } else {
      // Remove from all roles
      if (config.adminUIDs && config.adminUIDs.includes(uid)) {
        config.adminUIDs = config.adminUIDs.filter(id => id !== uid);
        removed = true;
      }
      if (config.moderatorUIDs && config.moderatorUIDs.includes(uid)) {
        config.moderatorUIDs = config.moderatorUIDs.filter(id => id !== uid);
        removed = true;
      }
      if (config.supportUIDs && config.supportUIDs.includes(uid)) {
        config.supportUIDs = config.supportUIDs.filter(id => id !== uid);
        removed = true;
      }
    }

    if (saveAdminConfig(config)) {
      res.json({
        success: true,
        message: removed ? `User ${uid} removed successfully` : `User ${uid} not found in specified role`,
        data: {
          uid,
          role,
          removed,
          adminUIDs: config.adminUIDs,
          moderatorUIDs: config.moderatorUIDs,
          supportUIDs: config.supportUIDs
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to save admin configuration' });
    }
  } catch (error) {
    console.error('Error removing admin user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/bulk - Bulk operations
router.post('/users/bulk', (req, res) => {
  try {
    const { action, users } = req.body;
    
    if (!action || !users || !Array.isArray(users)) {
      return res.status(400).json({ error: 'Action and users array are required' });
    }

    const config = loadAdminConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load admin configuration' });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const { uid, role } = user;
        
        if (!uid || !role) {
          results.push({ uid, success: false, error: 'UID and role are required' });
          errorCount++;
          continue;
        }

        if (!['admin', 'moderator', 'support'].includes(role)) {
          results.push({ uid, success: false, error: 'Invalid role' });
          errorCount++;
          continue;
        }

        // Initialize arrays if they don't exist
        if (!config.adminUIDs) config.adminUIDs = [];
        if (!config.moderatorUIDs) config.moderatorUIDs = [];
        if (!config.supportUIDs) config.supportUIDs = [];

        if (action === 'add') {
          // Remove from all roles first
          config.adminUIDs = config.adminUIDs.filter(id => id !== uid);
          config.moderatorUIDs = config.moderatorUIDs.filter(id => id !== uid);
          config.supportUIDs = config.supportUIDs.filter(id => id !== uid);

          // Add to specified role
          switch (role) {
            case 'admin':
              if (!config.adminUIDs.includes(uid)) {
                config.adminUIDs.push(uid);
              }
              break;
            case 'moderator':
              if (!config.moderatorUIDs.includes(uid)) {
                config.moderatorUIDs.push(uid);
              }
              break;
            case 'support':
              if (!config.supportUIDs.includes(uid)) {
                config.supportUIDs.push(uid);
              }
              break;
          }
          results.push({ uid, role, success: true });
          successCount++;
        } else if (action === 'remove') {
          let removed = false;
          switch (role) {
            case 'admin':
              if (config.adminUIDs.includes(uid)) {
                config.adminUIDs = config.adminUIDs.filter(id => id !== uid);
                removed = true;
              }
              break;
            case 'moderator':
              if (config.moderatorUIDs.includes(uid)) {
                config.moderatorUIDs = config.moderatorUIDs.filter(id => id !== uid);
                removed = true;
              }
              break;
            case 'support':
              if (config.supportUIDs.includes(uid)) {
                config.supportUIDs = config.supportUIDs.filter(id => id !== uid);
                removed = true;
              }
              break;
          }
          results.push({ uid, role, success: true, removed });
          successCount++;
        }
      } catch (error) {
        results.push({ uid: user.uid, success: false, error: error.message });
        errorCount++;
      }
    }

    if (saveAdminConfig(config)) {
      res.json({
        success: true,
        message: `Bulk operation completed. ${successCount} successful, ${errorCount} failed`,
        data: {
          action,
          results,
          summary: {
            total: users.length,
            successful: successCount,
            failed: errorCount
          },
          config: {
            adminUIDs: config.adminUIDs,
            moderatorUIDs: config.moderatorUIDs,
            supportUIDs: config.supportUIDs
          }
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to save admin configuration' });
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/check/:uid - Check user role
router.get('/users/check/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    
    const config = loadAdminConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load admin configuration' });
    }

    const roles = [];
    
    if (config.adminUIDs && config.adminUIDs.includes(uid)) {
      roles.push('admin');
    }
    if (config.moderatorUIDs && config.moderatorUIDs.includes(uid)) {
      roles.push('moderator');
    }
    if (config.supportUIDs && config.supportUIDs.includes(uid)) {
      roles.push('support');
    }

    // Get user info
    const userInfo = userInfoService.getUserInfo(uid);

    res.json({
      success: true,
      data: {
        uid,
        roles,
        isAdmin: roles.includes('admin'),
        isModerator: roles.includes('moderator'),
        isSupport: roles.includes('support'),
        hasAnyRole: roles.length > 0,
        userInfo: {
          name: userInfo.name,
          avatar: userInfo.avatar
        }
      }
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/info/:uid - Get detailed user info
router.get('/users/info/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    
    const config = loadAdminConfig();
    if (!config) {
      return res.status(500).json({ error: 'Failed to load admin configuration' });
    }

    // Get user info
    const userInfo = userInfoService.getUserInfo(uid);
    
    // Check roles
    const roles = [];
    if (config.adminUIDs && config.adminUIDs.includes(uid)) {
      roles.push('admin');
    }
    if (config.moderatorUIDs && config.moderatorUIDs.includes(uid)) {
      roles.push('moderator');
    }
    if (config.supportUIDs && config.supportUIDs.includes(uid)) {
      roles.push('support');
    }

    res.json({
      success: true,
      data: {
        uid,
        name: userInfo.name,
        avatar: userInfo.avatar,
        roles,
        isAdmin: roles.includes('admin'),
        isModerator: roles.includes('moderator'),
        isSupport: roles.includes('support'),
        hasAnyRole: roles.length > 0,
        primaryRole: roles.length > 0 ? roles[0] : null
      }
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
