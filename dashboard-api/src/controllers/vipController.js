const express = require('express');
const fs = require('fs');
const path = require('path');
const vipService = require('../services/vipService');

const router = express.Router();

// GET /api/vip/users - Get VIP users with pagination and filters
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
    const result = await vipService.getVIPUsers(parseInt(page), parseInt(limit), search, status);
    res.json(result);
  } catch (error) {
    console.error('Error getting VIP users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/vip/users - Add new VIP user
router.post('/users', async (req, res) => {
  try {
    const { userId, packageId, months, reason } = req.body;
    const result = await vipService.addVIPUser(userId, packageId, months, reason);
    res.json(result);
  } catch (error) {
    console.error('Error adding VIP user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/vip/users/:userId - Update VIP user
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { packageId, months, reason } = req.body;
    const result = await vipService.updateVIPUser(userId, packageId, months, reason);
    res.json(result);
  } catch (error) {
    console.error('Error updating VIP user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/vip/users/:userId - Remove VIP user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const result = await vipService.removeVIPUser(userId, reason);
    res.json(result);
  } catch (error) {
    console.error('Error removing VIP user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vip/packages - Get VIP packages
router.get('/packages', async (req, res) => {
  try {
    const result = await vipService.getVIPPackages();
    res.json(result);
  } catch (error) {
    console.error('Error getting VIP packages:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/vip/packages/:packageId - Update VIP package
router.put('/packages/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const { name, description, price, benefits } = req.body;
    const result = await vipService.updateVIPPackage(packageId, { name, description, price, benefits });
    res.json(result);
  } catch (error) {
    console.error('Error updating VIP package:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vip/stats - Get VIP statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await vipService.getVIPStats();
    res.json(result);
  } catch (error) {
    console.error('Error getting VIP stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vip/revenue - Get VIP revenue data
router.get('/revenue', async (req, res) => {
  try {
    const result = await vipService.getVIPRevenue();
    res.json(result);
  } catch (error) {
    console.error('Error getting VIP revenue:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vip/export - Export VIP data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const result = await vipService.exportVIPData(format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vip_users.csv');
      res.send(result.data);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Error exporting VIP data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vip/display-config - Get VIP display configuration
router.get('/display-config', async (req, res) => {
  try {
    const result = await vipService.getVIPDisplayConfig();
    res.json(result);
  } catch (error) {
    console.error('Error getting VIP display config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/vip/display-config - Update VIP display configuration
router.put('/display-config', async (req, res) => {
  try {
    const { config } = req.body;
    const result = await vipService.updateVIPDisplayConfig(config);
    res.json(result);
  } catch (error) {
    console.error('Error updating VIP display config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
