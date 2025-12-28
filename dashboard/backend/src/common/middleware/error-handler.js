class ErrorHandler {
    static handle(err, req, res, next) {
        console.error('Error:', err);

        const statusCode = err.statusCode || err.status || 500;
        const message = err.message || 'Internal Server Error';

        res.status(statusCode).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    static notFound(req, res) {
        res.status(404).json({
            success: false,
            message: `Route ${req.method} ${req.path} not found`
        });
    }
}

module.exports = ErrorHandler;

