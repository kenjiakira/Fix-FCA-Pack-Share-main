const path = require('path');
const fs = require('fs');

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.DASHBOARD_PORT || 3002;

console.log('\n' + '='.repeat(60));
console.log('🚀 BOT DASHBOARD API SERVER');
console.log('='.repeat(60));
console.log(`📅 Started at: ${new Date().toLocaleString()}`);
console.log(`🌍 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`📁 Working directory: ${process.cwd()}`);
console.log('='.repeat(60) + '\n');

const appPath = path.join(__dirname, 'src', 'app.js');
if (!fs.existsSync(appPath)) {
  console.error('❌ Error: src/app.js not found!');
  console.error('   Please make sure the file exists at:', appPath);
  process.exit(1);
}

const packagePath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('❌ Error: package.json not found!');
  console.error('   Please run: npm install');
  process.exit(1);
}

try {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['express', 'cors'];
  
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
      console.error(`❌ Error: Missing dependency '${dep}'`);
      console.error('   Please run: npm install');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
  process.exit(1);
}

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

try {
  console.log('🔄 Starting Dashboard API server...');
  
  require('./src/app');
  
  console.log('✅ Dashboard API server started successfully!');
  console.log(`🌐 API available at: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log('\n📊 Available endpoints:');
  console.log('   GET  /api/health                    - Health check');
  console.log('   GET  /api/bot/status               - Bot status');
  console.log('   GET  /api/bot/uptime-history       - Uptime history');
  console.log('   GET  /api/bot/logs                 - System logs');
  console.log('   POST /api/bot/restart              - Restart bot');
  console.log('   POST /api/bot/update-stats         - Update statistics');
  console.log('   GET  /api/users                    - User statistics');
  console.log('   GET  /api/users/top                - Top users');
  console.log('   GET  /api/users/active             - Active users');
  console.log('   GET  /api/commands                 - All commands');
  console.log('   GET  /api/commands/stats           - Command statistics');
  console.log('   GET  /api/commands/top             - Top commands');
  console.log('   POST /api/commands/refresh         - Refresh command cache');
  console.log('   GET  /api/system/info              - System information');
  console.log('   GET  /api/system/memory            - Memory usage');
  console.log('   GET  /api/system/cpu               - CPU information');
  console.log('   GET  /api/system/network           - Network information');
  console.log('   🎖️  VIP Management:');
  console.log('   GET  /api/vip/users                - Get VIP users');
  console.log('   GET  /api/vip/users/:id            - Get VIP user details');
  console.log('   POST /api/vip/users                - Add VIP user');
  console.log('   PUT  /api/vip/users/:id            - Update VIP user');
  console.log('   DELETE /api/vip/users/:id          - Remove VIP user');
  console.log('   GET  /api/vip/packages             - Get VIP packages');
  console.log('   GET  /api/vip/stats                - VIP statistics');
  console.log('   GET  /api/vip/revenue              - VIP revenue');
  console.log('   GET  /api/vip/expiring             - Expiring VIP users');
  console.log('   GET  /api/vip/logs                 - VIP activity logs');
  console.log('   POST /api/vip/bulk                 - Bulk operations');
  console.log('   GET  /api/vip/export               - Export VIP data');
  console.log('\n' + '='.repeat(60));
  
} catch (error) {
  console.error('❌ Failed to start Dashboard API server:', error);
  console.error('   Stack trace:', error.stack);
  process.exit(1);
}
