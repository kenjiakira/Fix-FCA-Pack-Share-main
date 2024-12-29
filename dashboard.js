const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const os = require('os');
const session = require('express-session');
const { spawn } = require('child_process');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));
const PORT = process.env.PORT || 8080; 
const chalk = require("chalk");
const boldText = (text) => chalk.bold(text)
const gradient = require("gradient-string");

io.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

app.use('/toolbox', express.static(path.join(__dirname, 'Toolbox')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const username = adminConfig.loginpanel.user;
const password = adminConfig.loginpanel.password;
const restartPasscode = adminConfig.loginpanel.passcode;

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

function getBotInfo() {
    return {
        botName: adminConfig.botName || "Aki Bot",
        prefix: adminConfig.prefix || ".",
        ownerName: adminConfig.ownerName || "Kenji Akira",
        commandsCount: fs.readdirSync('./commands').length,
        eventsCount: fs.readdirSync('./events').length,
        threadsCount: Object.keys(JSON.parse(fs.readFileSync('./database/threads.json', 'utf8') || "{}")).length,
        usersCount: Object.keys(JSON.parse(fs.readFileSync('./database/users.json', 'utf8') || "{}")).length,
        uptime: `${Math.floor(process.uptime())} seconds`,
        os: `${os.type()} ${os.release()} (${os.platform()})`,
        hostname: os.hostname(),
        responseTime: `${responseLatency}ms`
    };
}

let responseLatency = 0;

const { exec } = require('child_process');
let activeProcess = null;

const { initializeSocket } = require('./utils/logs');

// After creating io
initializeSocket(io);

io.on('connection', (socket) => {
    console.log('Client connected to socket');
    
    socket.emit('updateStats', getBotInfo());

    let activeProcess = null;

    socket.on('executeCommand', async (command) => {
        if (activeProcess) {
            activeProcess.kill();
        }

        const startTime = Date.now();
        
        try {
            if (command.toLowerCase() === 'clear') {
                socket.emit('clearConsole');
                return;
            }

            if (command.toLowerCase() === 'restart') {
                socket.emit('commandOutput', {
                    output: 'Restarting bot...',
                    color: '#00f2fe'
                });
                setTimeout(() => {
                    process.exit(1);
                }, 1000);
                return;
            }

            activeProcess = spawn(command, [], {
                shell: true,
                env: { ...process.env, FORCE_COLOR: true }
            });

            activeProcess.stdout.on('data', (data) => {
                socket.emit('commandOutput', {
                    output: data.toString(),
                    color: '#00f2fe'
                });
            });

            activeProcess.stderr.on('data', (data) => {
                socket.emit('commandOutput', {
                    output: data.toString(),
                    color: '#ff416c'
                });
            });

            activeProcess.on('close', (code) => {
                const elapsedTime = Date.now() - startTime;
                socket.emit('commandOutput', {
                    output: `Command completed with code ${code} (${elapsedTime}ms)`,
                    color: code === 0 ? '#00f2fe' : '#ff416c'
                });
                activeProcess = null;
            });

        } catch (err) {
            socket.emit('commandOutput', {
                output: `Error: ${err.message}`,
                color: '#ff416c'
            });
        }
    });

    socket.on('stopCommand', () => {
        if (activeProcess) {
            activeProcess.kill();
            socket.emit('commandOutput', {
                output: 'Command execution stopped',
                color: '#ffd700'
            });
            activeProcess = null;
        }
    });

    socket.on('restartBot', (passcode) => {
        if (passcode === restartPasscode) {
            socket.emit('restartSuccess', 'Bot is restarting...');
            setTimeout(() => {
                process.exit(1);
            }, 2000);
        } else {
            socket.emit('restartFailed', 'Invalid passcode');
        }
    });

    socket.on('disconnect', () => {
        if (activeProcess) {
            activeProcess.kill();
        }
        console.log('Client disconnected');
    });

    // Add handler for bot logs
    socket.on('botLog', (data) => {
        io.emit('botLog', data);
    });

    setInterval(() => {
        const start = Date.now();
        io.emit('updateStats', getBotInfo());
        responseLatency = Date.now() - start;
    }, 1000);
});

app.post('/login', (req, res) => {
    const { username: inputUsername, password: inputPassword } = req.body;

    if (username === inputUsername && password === inputPassword) {
        req.session.loggedin = true;
        res.redirect('/console');
    } else {
        res.redirect('/login.html?error=Unauthorized'); 
    }
});

function checkAuth(req, res, next) {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect('/login.html'); 
    }
}

app.get('/console', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'Toolbox', '3028.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'toolbox', 'login.html'));
});

app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.redirect('/console');
    } else {
        res.redirect('/login');
    }
});

server.listen(PORT, () => {
console.error(boldText(gradient.cristal(`[ Deploying Dashboard Bot Server Proxy is: ${PORT} ]`)));
});

// Export the server instance
module.exports = server;