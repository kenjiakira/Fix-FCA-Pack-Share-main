class Logger {
    static requestLogger(req, res, next) {
        // Skip logging for browser extension/tracking requests
        if (req.path.includes('/hybridaction/') || 
            req.path.includes('/favicon.ico') ||
            req.path.includes('/robots.txt')) {
            return next();
        }

        const start = Date.now();
        const timestamp = new Date().toISOString();

        res.on('finish', () => {
            const duration = Date.now() - start;
            const log = {
                timestamp,
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip || req.connection.remoteAddress
            };
            console.log(`[${log.timestamp}] ${log.method} ${log.path} ${log.status} - ${log.duration}`);
        });

        next();
    }
}

module.exports = Logger;

