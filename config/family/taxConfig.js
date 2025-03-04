/**
 * Cấu hình hệ thống thuế
 */


const SINGLE_TAX_RATE = 0.03; 


const WEALTH_TAX_RATE = 0.05; 


const WEALTH_THRESHOLD = 500000000; 


const CHILD_TAX_RATE_PER_CHILD = 0.01; 


const TAX_INTERVAL = 24 * 60 * 60 * 1000; 


const SUSPICIOUS_PENALTY_RATE = 0.5; 


const MIN_TAX = 1000; 
const MAX_TAX_RATE = 0.1; 

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
