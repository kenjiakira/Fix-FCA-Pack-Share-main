const express = require('express');
const botService = require('../services/botService');

const router = express.Router();

// GET /api/bot/status - Get bot status
router.get('/status', (req, res) => {
  try {
    const status = botService.getBotStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bot/restart - Restart bot
router.post('/restart', (req, res) => {
  try {
    const result = botService.restartBot();
    res.json(result);
  } catch (error) {
    console.error('Error restarting bot:', error);
    res.status(500).json({ error: 'Failed to restart bot' });
  }
});

// POST /api/bot/update-stats - Update bot statistics
router.post('/update-stats', (req, res) => {
  try {
    const stats = req.body;
    botService.updateStats(stats);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating bot stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bot/uptime-history - Get uptime history
router.get('/uptime-history', (req, res) => {
  try {
    const period = req.query.period || '24h';
    const history = botService.getUptimeHistory(period);
    res.json(history);
  } catch (error) {
    console.error('Error getting uptime history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bot/logs - Get system logs
router.get('/logs', (req, res) => {
  try {
    const logs = botService.getLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
