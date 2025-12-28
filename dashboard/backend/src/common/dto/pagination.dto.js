class PaginationDto {
    constructor(page = 1, limit = 20) {
        this.page = Math.max(1, parseInt(page) || 1);
        this.limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
        this.skip = (this.page - 1) * this.limit;
    }

    static fromQuery(query) {
        return new PaginationDto(query.page, query.limit);
    }

    toResponse(total, data) {
        return {
            success: true,
            data,
            pagination: {
                page: this.page,
                limit: this.limit,
                total,
                totalPages: Math.ceil(total / this.limit)
            }
        };
    }
}

module.exports = PaginationDto;

