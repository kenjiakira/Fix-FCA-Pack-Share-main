/**
 * Hệ thống theo dõi lệnh user dùng nhiều nhất
 * Lưu: database/json/command_usage.json
 * Format: { [userId]: { [commandName]: count } }
 */

const fs = require('fs');
const path = require('path');

const USAGE_PATH = path.join(__dirname, '../database/json/command_usage.json');

let _cache = null;

function ensureFile() {
    const dir = path.dirname(USAGE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(USAGE_PATH)) {
        fs.writeFileSync(USAGE_PATH, '{}', 'utf8');
    }
}

function load() {
    if (_cache !== null) return _cache;
    ensureFile();
    try {
        const raw = fs.readFileSync(USAGE_PATH, 'utf8');
        _cache = typeof raw === 'string' && raw.trim() ? JSON.parse(raw) : {};
    } catch (e) {
        _cache = {};
    }
    return _cache;
}

function save() {
    if (_cache === null) return;
    ensureFile();
    try {
        fs.writeFileSync(USAGE_PATH, JSON.stringify(_cache, null, 2), 'utf8');
    } catch (e) {
        console.error('[commandUsage] Save error:', e.message);
    }
}

/**
 * Ghi nhận 1 lần user dùng lệnh
 * @param {string} userId - ID người dùng (senderID)
 * @param {string} commandName - Tên lệnh (command.name)
 */
function trackCommandUsage(userId, commandName) {
    if (!userId || !commandName) return;
    const data = load();
    if (!data[userId]) data[userId] = {};
    data[userId][commandName] = (data[userId][commandName] || 0) + 1;
}

/**
 * Lấy thống kê lệnh của 1 user, sắp xếp giảm dần theo số lần dùng
 * @param {string} userId
 * @returns {Array<{ command: string, count: number }>}
 */
function getUserCommandStats(userId) {
    const data = load();
    const user = data[userId];
    if (!user || typeof user !== 'object') return [];
    return Object.entries(user)
        .map(([command, count]) => ({ command, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Lấy top N lệnh user dùng nhiều nhất
 * @param {string} userId
 * @param {number} limit
 * @returns {Array<{ command: string, count: number }>}
 */
function getTopCommandsForUser(userId, limit = 10) {
    return getUserCommandStats(userId).slice(0, limit);
}

/**
 * Tổng số lần dùng lệnh của user
 * @param {string} userId
 * @returns {number}
 */
function getTotalCommandUsage(userId) {
    const stats = getUserCommandStats(userId);
    return stats.reduce((sum, item) => sum + item.count, 0);
}

/**
 * Thống kê toàn hệ thống: lệnh nào được mọi người dùng nhiều nhất (gộp tất cả user)
 * @param {number} limit
 * @returns {Array<{ command: string, count: number }>}
 */
function getGlobalCommandStats(limit = 20) {
    const data = load();
    const agg = {};
    for (const userId of Object.keys(data)) {
        const user = data[userId];
        if (!user || typeof user !== 'object') continue;
        for (const [cmd, count] of Object.entries(user)) {
            agg[cmd] = (agg[cmd] || 0) + count;
        }
    }
    return Object.entries(agg)
        .map(([command, count]) => ({ command, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

/**
 * Danh sách user có trong thống kê (để admin xem stats từng người)
 * @returns {string[]} userIds
 */
function getAllTrackedUserIds() {
    return Object.keys(load());
}

module.exports = {
    trackCommandUsage,
    getUserCommandStats,
    getTopCommandsForUser,
    getTotalCommandUsage,
    getGlobalCommandStats,
    getAllTrackedUserIds,
    load,
    save
};
