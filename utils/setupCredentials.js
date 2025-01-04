const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ENCRYPTION_KEY = crypto.randomBytes(32);
fs.writeFileSync('./.env', `ENCRYPTION_KEY=${ENCRYPTION_KEY.toString('hex')}`);

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

async function setup() {
    const email = await new Promise(resolve => {
        rl.question('Nhập email Facebook: ', resolve);
    });
    
    const password = await new Promise(resolve => {
        rl.question('Nhập mật khẩu Facebook: ', resolve);
    });

    const credentials = {
        email: encrypt(email),
        password: encrypt(password)
    };

    fs.writeFileSync('./fbCredentials.json', JSON.stringify({
        credentials: credentials
    }, null, 2));

    console.log('Đã lưu thông tin đăng nhập được mã hóa vào fbCredentials.json');
    rl.close();
}

setup();
