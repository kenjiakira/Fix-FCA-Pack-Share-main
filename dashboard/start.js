
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Đang khởi động Dashboard...\n');

const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

const nextjs = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'nextjs'),
  stdio: 'inherit',
  shell: true
});

const handleExit = (code) => {
  console.log(`\n⚠️  Process exited with code ${code}`);
  backend.kill();
  nextjs.kill();
  process.exit(code);
};

backend.on('exit', handleExit);
nextjs.on('exit', handleExit);

process.on('SIGINT', () => {
  console.log('\n🛑 Đang dừng các services...');
  backend.kill();
  nextjs.kill();
  process.exit(0);
});

console.log('✅ Backend API: http://localhost:3001');
console.log('✅ Next.js Dashboard: http://localhost:3000\n');

