const express = require('express');
const cors = require('cors');
const path = require('path');

// Middleware
const ErrorHandler = require('./common/middleware/error-handler');
const Logger = require('./common/middleware/logger');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const overviewRoutes = require('./modules/overview/overview.routes');
const usersRoutes = require('./modules/users/users.routes');
const vipRoutes = require('./modules/vip/vip.routes');
const threadsRoutes = require('./modules/threads/threads.routes');
const economyRoutes = require('./modules/economy/economy.routes');
const systemRoutes = require('./modules/system/system.routes');
const appStateRoutes = require('./modules/appstate/appstate.routes');

// Middleware
const AuthMiddleware = require('./common/middleware/auth.middleware');

class App {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // CORS
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: false
        }));

        // Body parser
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Cookie parser
        const cookieParser = require('cookie-parser');
        this.app.use(cookieParser());

        this.app.use(Logger.requestLogger);

        // Authentication middleware (before routes)
        this.app.use(AuthMiddleware.authenticate);
    }

    setupRoutes() {
        // Ignore browser extension/tracking requests
        this.app.get('/hybridaction/*', (req, res) => {
            res.status(200).json({ success: true });
        });

        // Auth Routes (no auth required)
        this.app.use('/api/auth', authRoutes);

        // API Routes (require auth)
        this.app.use('/api/overview', overviewRoutes);
        this.app.use('/api/users', usersRoutes);
        this.app.use('/api/vip', vipRoutes);
        this.app.use('/api/threads', threadsRoutes);
        this.app.use('/api/economy', economyRoutes);
        this.app.use('/api/system', systemRoutes);
        this.app.use('/api/appstate', appStateRoutes);

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ success: true, message: 'API is running' });
        });

        // Frontend được xử lý bởi Next.js, không serve HTML files nữa
        // Tất cả routes không phải API sẽ trả về 404 hoặc có thể redirect đến Next.js
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            ErrorHandler.notFound(req, res);
        });

        // Error handler
        this.app.use((err, req, res, next) => {
            ErrorHandler.handle(err, req, res, next);
        });
    }

    listen(port) {
        this.app.listen(port, () => {
            console.log(`📊 CMS Backend running on http://localhost:${port}`);
            console.log(`📊 API available at http://localhost:${port}/api`);
        });
    }
}

module.exports = App;

