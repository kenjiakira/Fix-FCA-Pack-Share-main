const express = require('express');
const cors = require('cors');
const path = require('path');

const botController = require('./controllers/botController');
const userController = require('./controllers/userController');
const commandController = require('./controllers/commandController');
const systemController = require('./controllers/systemController');
const vipController = require('./controllers/vipController');
const currencyController = require('./controllers/currencyController');
const userInfoController = require('./controllers/userInfoController');
const adminController = require('./controllers/adminController');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/avatars', express.static(path.join(__dirname, '../../commands/cache/avatars')));

app.use('/api/bot', botController);
app.use('/api/users', userController);
app.use('/api/commands', commandController);
app.use('/api/system', systemController);
app.use('/api/vip', vipController);
app.use('/api/currencies', currencyController);
app.use('/api/userinfo', userInfoController);
app.use('/api/admin', adminController);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

app.listen(PORT, () => {
  console.log(`Dashboard API server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;
