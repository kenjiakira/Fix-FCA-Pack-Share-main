const express = require('express');
const commandService = require('../services/commandService');

const router = express.Router();

// GET /api/commands - Get all commands
router.get('/', (req, res) => {
  try {
    const commands = commandService.getAllCommands();
    res.json(commands);
  } catch (error) {
    console.error('Error getting commands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/stats - Get command statistics
router.get('/stats', (req, res) => {
  try {
    const stats = commandService.getCommandStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting command stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/top - Get most used commands
router.get('/top', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const commands = commandService.getMostUsedCommands(limit);
    res.json(commands);
  } catch (error) {
    console.error('Error getting top commands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/category/:category - Get commands by category
router.get('/category/:category', (req, res) => {
  try {
    const category = req.params.category;
    const commands = commandService.getCommandsByCategory(category);
    res.json(commands);
  } catch (error) {
    console.error('Error getting commands by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/usage - Get commands by usage range
router.get('/usage', (req, res) => {
  try {
    const minUsage = parseInt(req.query.min) || 0;
    const maxUsage = parseInt(req.query.max) || 1000;
    const commands = commandService.getCommandsByUsageRange(minUsage, maxUsage);
    res.json(commands);
  } catch (error) {
    console.error('Error getting commands by usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/permission/:permission - Get commands by permission
router.get('/permission/:permission', (req, res) => {
  try {
    const permission = req.params.permission;
    const commands = commandService.getCommandsByPermission(permission);
    res.json(commands);
  } catch (error) {
    console.error('Error getting commands by permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/errors - Get commands with high error rate
router.get('/errors', (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const commands = commandService.getCommandsWithHighErrorRate(threshold);
    res.json(commands);
  } catch (error) {
    console.error('Error getting commands with errors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/recent - Get recently modified commands
router.get('/recent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const commands = commandService.getAllCommands();
    const recentCommands = commands
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, limit);
    res.json(recentCommands);
  } catch (error) {
    console.error('Error getting recent commands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commands/refresh - Refresh command cache
router.post('/refresh', (req, res) => {
  try {
    const commands = commandService.refreshCache();
    res.json({ 
      success: true, 
      message: 'Command cache refreshed',
      count: commands.length 
    });
  } catch (error) {
    console.error('Error refreshing command cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/:commandName - Get specific command
router.get('/:commandName', (req, res) => {
  try {
    const commandName = req.params.commandName;
    const command = commandService.getCommandDetails(commandName);
    
    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }
    
    res.json(command);
  } catch (error) {
    console.error('Error getting command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/commands/:commandName - Update command
router.put('/:commandName', (req, res) => {
  try {
    const commandName = req.params.commandName;
    const updateData = req.body;
    
    const result = commandService.updateCommand(commandName, updateData);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      message: 'Command updated successfully',
      command: result.command
    });
  } catch (error) {
    console.error('Error updating command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/commands/:commandName - Delete command
router.delete('/:commandName', (req, res) => {
  try {
    const commandName = req.params.commandName;
    
    const result = commandService.deleteCommand(commandName);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      message: 'Command deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/commands/:commandName/status - Toggle command status
router.patch('/:commandName/status', (req, res) => {
  try {
    const commandName = req.params.commandName;
    const { isActive } = req.body;
    
    const result = commandService.toggleCommandStatus(commandName, isActive);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      message: `Command ${isActive ? 'activated' : 'deactivated'} successfully`,
      command: result.command
    });
  } catch (error) {
    console.error('Error toggling command status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/:commandName/code - Get command source code
router.get('/:commandName/code', (req, res) => {
  try {
    const commandName = req.params.commandName;
    const code = commandService.getCommandCode(commandName);
    
    if (!code) {
      return res.status(404).json({ error: 'Command not found' });
    }
    
    res.json({
      success: true,
      commandName,
      code,
      language: 'javascript'
    });
  } catch (error) {
    console.error('Error getting command code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commands/:commandName/code - Update command source code
router.post('/:commandName/code', (req, res) => {
  try {
    const commandName = req.params.commandName;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const result = commandService.updateCommandCode(commandName, code);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      message: 'Command code updated successfully',
      command: result.command
    });
  } catch (error) {
    console.error('Error updating command code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/export - Export commands data
router.get('/export', (req, res) => {
  try {
    const format = req.query.format || 'json';
    const data = commandService.exportCommands(format);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="commands-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(data);
  } catch (error) {
    console.error('Error exporting commands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
