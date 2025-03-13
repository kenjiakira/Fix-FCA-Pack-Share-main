const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { initializeSocket } = require('../utils/logs');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from dashboard directory
app.use(express.static(path.join(__dirname)));

// Main route serves the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Dashboard client connected');
    
    // Send initial stats
    try {
        const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");
        const usersDB = JSON.parse(fs.readFileSync("./database/users.json", "utf8") || "{}");
        const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
        
        socket.emit('stats', {
            groups: Object.keys(threadsDB).length,
            users: Object.keys(usersDB).length,
            commands: Object.keys(global.cc?.module?.commands || {}).length,
            prefix: adminConfig.prefix
        });
    } catch (error) {
        console.error('Error sending initial stats:', error);
    }
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Dashboard client disconnected');
    });
});

// Initialize the socket in logs module
initializeSocket(io);

// Function to start the server
function startDashboard(port = 3000) {
    return new Promise((resolve, reject) => {
        server.listen(port, () => {
            console.log(`Dashboard running at http://localhost:${port}`);
            resolve(port);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is busy, trying ${port + 1}...`);
                startDashboard(port + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

module.exports = { startDashboard, io };
