const express = require('express');
const os = require('os');

const router = express.Router();

// GET /api/system/info - Get system information
router.get('/info', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      totalMemory: totalMem,
      freeMemory: freeMem,
      usedMemory: totalMem - freeMem,
      memoryUsage: Math.round(memoryUsage * 10) / 10,
      cpuUsage: Math.round((Math.random() * 30 + 10) * 10) / 10, // Mock CPU usage
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      hostname: os.hostname(),
      userInfo: os.userInfo(),
      networkInterfaces: os.networkInterfaces()
    };
    
    res.json(systemInfo);
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/system/memory - Get memory information
router.get('/memory', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    const memoryInfo = {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
      usage: Math.round(memoryUsage * 10) / 10,
      processMemory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      }
    };
    
    res.json(memoryInfo);
  } catch (error) {
    console.error('Error getting memory info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/system/cpu - Get CPU information
router.get('/cpu', (req, res) => {
  try {
    const cpus = os.cpus();
    const cpuInfo = {
      model: cpus[0].model,
      speed: cpus[0].speed,
      cores: cpus.length,
      loadAverage: os.loadavg(),
      usage: Math.round((Math.random() * 30 + 10) * 10) / 10 // Mock CPU usage
    };
    
    res.json(cpuInfo);
  } catch (error) {
    console.error('Error getting CPU info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/system/network - Get network information
router.get('/network', (req, res) => {
  try {
    const networkInfo = {
      interfaces: os.networkInterfaces(),
      hostname: os.hostname(),
      platform: os.platform()
    };
    
    res.json(networkInfo);
  } catch (error) {
    console.error('Error getting network info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
