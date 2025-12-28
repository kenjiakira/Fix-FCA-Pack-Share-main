class ResponseDto {
    static success(data, message = 'Success') {
        return {
            success: true,
            message,
            data
        };
    }

    static error(message = 'Error', statusCode = 400) {
        const error = new Error(message);
        error.statusCode = statusCode;
        throw error;
    }

    static paginated(data, pagination) {
        return {
            success: true,
            data,
            pagination
        };
    }
}

module.exports = ResponseDto;

