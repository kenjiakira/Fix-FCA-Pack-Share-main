class Validator {
    static validateRequest(schema) {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            req.validated = value;
            next();
        };
    }
}

module.exports = Validator;

