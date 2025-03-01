/**
 * Cấu hình hệ thống thuế
 */

// Thuế suất cho người độc thân
const SINGLE_TAX_RATE = 0.03; // 3% tài sản hàng ngày

// Thuế suất cho người giàu
const WEALTH_TAX_RATE = 0.05; // 5% tài sản hàng ngày

// Ngưỡng thuế người giàu
const WEALTH_THRESHOLD = 500000000; // 500 triệu xu

// Thuế suất cho trường hợp có nhiều con (>3)
const CHILD_TAX_RATE_PER_CHILD = 0.01; // 1% mỗi con thêm

// Khoảng thời gian giữa các lần thu thuế (ms)
const TAX_INTERVAL = 24 * 60 * 60 * 1000; // 24 giờ

// Phạt cho các giao dịch đáng ngờ
const SUSPICIOUS_PENALTY_RATE = 0.5; // Tăng 50% thuế

// Tối thiểu và tối đa
const MIN_TAX = 1000; // 1,000 xu 
const MAX_TAX_RATE = 0.1; // 10% tối đa

module.exports = {
    SINGLE_TAX_RATE,
    WEALTH_TAX_RATE,
    WEALTH_THRESHOLD,
    CHILD_TAX_RATE_PER_CHILD,
    TAX_INTERVAL,
    SUSPICIOUS_PENALTY_RATE,
    MIN_TAX,
    MAX_TAX_RATE
};
