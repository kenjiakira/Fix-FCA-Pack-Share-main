const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { getBalance, updateBalance } = require('../utils/currencies');
const BACKUP_DIR = path.join(__dirname, './json/coin/backups');
const DB_PATH = path.join(__dirname, '../database/coindb.sqlite');
const DB_DIR = path.dirname(DB_PATH);
const crypto = require('crypto');
const MAX_BUY_PERCENT = 0.1;
const MAX_HOLD_PERCENT = 0.2;

const MINE_RATE = 5;
const BASE_MINING_AMOUNT = 10;
const MAX_MINING_AMOUNT = 200;
const TEAM_BONUS = 0.1;
const BASE_PRICE = 100;
const LISTING_THRESHOLD = 10000;
const INITIAL_PRICE = 20;
const MINING_COOLDOWN = 15 * 1000;

const WALLET_CODE_LENGTH = 8;
let walletCodeIndex = {};
const MAX_BACKUPS = 10;

const NPC_COUNT = 10;
const NPC_PREFIX = 'NPC';
const NPC_MINING_INTERVAL = 60 * 60 * 1000;
const NPC_MIN_POWER = 0.1;
const NPC_MAX_POWER = 0.5;

const MARKET_CONSTANTS = {
    VOLATILITY: {
        NORMAL: 0.005,
        HIGH: 0.02,
        MAX: 0.05
    },
    IMPACT: {
        BUY: -0.01,
        SELL: 0.015
    },
    RECOVERY: {
        RATE: 0.001,
        TIME: 30 * 1000
    },
    RANDOM: {
        MIN: -0.005,   // -0.5% ngẫu nhiên tối thiểu
        MAX: 0.005     // +0.5% ngẫu nhiên tối đa
    }
};
const MINERS = {
    basic: { name: "Máy Đào Cơ Bản", power: 1, price: 0 },
    standard: { name: "Máy Đào Tiêu Chuẩn", power: 2, price: 10000 },
    advanced: { name: "Máy Đào Cao Cấp", power: 5, price: 50000 },
    professional: { name: "Máy Đào Chuyên Nghiệp", power: 10, price: 150000 },
    industrial: { name: "Máy Đào Công Nghiệp", power: 25, price: 500000 },
    quantum: { name: "Máy Đào Lượng Tử", power: 50, price: 2000000 }
};

const ACHIEVEMENTS = {
    first_million: { name: "Triệu Phú Đầu Tiên", requirement: 1000000, reward: 100 },
    team_leader: { name: "Người Dẫn Đầu", requirement: "createTeam", reward: 50 },
    power_user: { name: "Máy Đào Hiệu Suất", requirement: { type: "miningPower", value: 10 }, reward: 20 },
    devoted_miner: { name: "Thợ Mỏ Tận Tụy", requirement: { type: "miningCount", value: 100 }, reward: 30 },
    coin_master: { name: "Bậc Thầy Coin", requirement: { type: "level", value: 10 }, reward: 50 }
};


const MAINNET_ITEMS = {
    boost_1: { name: "Tăng Tốc 24h", description: "Tăng 50% tốc độ đào trong 24h", price: 5, effect: "miningBoost", value: 1.5, duration: 24 * 60 * 60 * 1000 },
    boost_2: { name: "Tăng Tốc 3 Ngày", description: "Tăng 30% tốc độ đào trong 3 ngày", price: 12, effect: "miningBoost", value: 1.3, duration: 3 * 24 * 60 * 60 * 1000 },
    exp_booster: { name: "Tăng XP", description: "Tăng 100% kinh nghiệm nhận được trong 12h", price: 8, effect: "expBoost", value: 2, duration: 12 * 60 * 60 * 1000 },
    team_upgrade: { name: "Nâng Cấp Team", description: "Tăng 10% hiệu quả team trong 7 ngày", price: 20, effect: "teamBoost", value: 1.1, duration: 7 * 24 * 60 * 60 * 1000 },
    premium_pick: { name: "Cúp Premium", description: "Tăng vĩnh viễn 15% tốc độ đào", price: 50, effect: "permanentBoost", value: 1.15, duration: 0 }
};


const SELLABLE_ITEMS = {
    gold_nugget: { name: "Vàng Thô", description: "Mảnh vàng quý tìm thấy khi đào", basePrice: 0.5, rarity: 0.1 },
    diamond: { name: "Kim Cương", description: "Kim cương hiếm có giá trị cao", basePrice: 2, rarity: 0.03 },
    ancient_relic: { name: "Cổ Vật", description: "Di tích cổ xưa có giá trị lớn", basePrice: 5, rarity: 0.01 }
};


class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.previousHash +
                this.timestamp +
                JSON.stringify(this.transactions) +
                this.nonce)
            .digest('hex');
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 1;
    }

    createGenesisBlock() {
        return new Block(Date.now(), [], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        this.chain.push(block);
        this.pendingTransactions = [
            {
                fromAddress: null,
                toAddress: miningRewardAddress,
                amount: this.miningReward
            }
        ];
    }

    addTransaction(fromAddress, toAddress, amount) {
        this.pendingTransactions.push({
            fromAddress,
            toAddress,
            amount,
            timestamp: Date.now()
        });
    }

    getBalanceOfAddress(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }
                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }
        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
}
const mainnetChain = new Blockchain();

function calculateRequiredXP(level) {

    return Math.floor(1000 * Math.pow(1.5, level - 1));
}

function createTablesIfNeeded(database) {
    try {
        console.log('[DB] Creating tables...');

        database.pragma('foreign_keys = ON');

        database.exec(`
            CREATE TABLE IF NOT EXISTS mining_data (
                user_id TEXT PRIMARY KEY,
                last_mined INTEGER,
                mining_power REAL,
                wallet_mainnet REAL,
                wallet_code TEXT UNIQUE,
                level INTEGER,
                experience INTEGER,
                stats_total_mined REAL,
                stats_mining_count INTEGER,
                stats_team_contribution REAL,
                created_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS user_miners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                miner_id TEXT,
                FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
            );
            
            CREATE TABLE IF NOT EXISTS user_achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                achievement_id TEXT,
                FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
            );
            
            CREATE TABLE IF NOT EXISTS user_notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                type TEXT,
                message TEXT,
                reward REAL,
                time INTEGER,
                FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
            );
            
            CREATE TABLE IF NOT EXISTS user_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                item_id TEXT,
                quantity INTEGER,
                FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
            );
            
            CREATE TABLE IF NOT EXISTS user_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                item_id TEXT,
                name TEXT,
                effect TEXT,
                value REAL,
                expires INTEGER,
                purchased_at INTEGER,
                FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
            );
            
            CREATE TABLE IF NOT EXISTS teams (
                team_id TEXT PRIMARY KEY,
                name TEXT,
                leader_id TEXT,
                created_at INTEGER,
                stats_total_power REAL,
                stats_total_mined REAL
            );
            
            CREATE TABLE IF NOT EXISTS team_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_id TEXT,
                user_id TEXT,
                FOREIGN KEY (team_id) REFERENCES teams(team_id),
                FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
            );
            
            CREATE TABLE IF NOT EXISTS market_data (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                price REAL,
                supply_demand_ratio REAL,
                last_update INTEGER,
                trend TEXT,
                total_supply REAL,
                total_transactions INTEGER,
                sentiment REAL,
                is_listed INTEGER,
                progress_to_listing REAL
            );
            
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                price REAL,
                time INTEGER,
                supply REAL,
                ratio REAL,
                event TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
            CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
            CREATE INDEX IF NOT EXISTS idx_user_miners_user_id ON user_miners(user_id);
        `);
        try {
            database.exec(`
                ALTER TABLE teams ADD COLUMN level INTEGER DEFAULT 1;
                ALTER TABLE teams ADD COLUMN exp INTEGER DEFAULT 0;
                ALTER TABLE teams ADD COLUMN max_members INTEGER DEFAULT 5;
                ALTER TABLE teams ADD COLUMN security_circle TEXT DEFAULT '[]';
                ALTER TABLE team_members ADD COLUMN role TEXT DEFAULT 'member';
                ALTER TABLE team_members ADD COLUMN joined_at INTEGER;
            `);
            database.exec(`
                CREATE TABLE IF NOT EXISTS transaction_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    type TEXT,
                    amount REAL,
                    price REAL,
                    time INTEGER
                );
            `);

        } catch (alterErr) {
            // Ignore errors if columns already exist
            console.log('[DB] Some columns might already exist:', alterErr.message);
        }

        console.log('[DB] Tables created successfully');
        return true;
    } catch (err) {
        console.error('[DB] Error creating tables:', err);
        return false;
    }
}

function initializeNPCs() {
    try {
        console.log('[NPC] Starting NPCs initialization...');

        // Kiểm tra số lượng NPC hiện có
        const existingCount = verifyNPCsCreated();

        if (existingCount > 0) {
            console.log(`[NPC] Found ${existingCount} existing NPCs, no need to create new ones`);
        } else {
            console.log(`[NPC] Creating ${NPC_COUNT} new NPCs...`);

            // Tạo từng NPC trong vòng lặp riêng biệt để dễ debug
            for (let i = 1; i <= NPC_COUNT; i++) {
                try {
                    const npcId = `${NPC_PREFIX}_${i}`;
                    const miningPower = NPC_MIN_POWER + (Math.random() * (NPC_MAX_POWER - NPC_MIN_POWER));
                    const walletCode = generateWalletCode();

                    // Kiểm tra trước khi thêm
                    const exists = db.prepare('SELECT user_id FROM mining_data WHERE user_id = ?').get(npcId);
                    if (exists) {
                        console.log(`[NPC] NPC ${npcId} already exists, skipping`);
                        continue;
                    }

                    // Thêm NPC với INSERT OR IGNORE để tránh lỗi
                    db.prepare(`
                        INSERT OR IGNORE INTO mining_data (
                            user_id, mining_power, wallet_mainnet, wallet_code,
                            level, experience, last_mined,
                            stats_total_mined, stats_mining_count, 
                            stats_team_contribution, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        npcId,
                        miningPower,
                        0,
                        walletCode,
                        1,
                        0,
                        Date.now(),
                        0,
                        0,
                        0,
                        Date.now()
                    );

                    // Thêm vào bảng wallet_code_index
                    walletCodeIndex[walletCode] = npcId;

                    if (i % 10 === 0 || i === NPC_COUNT) {
                        console.log(`[NPC] Created ${i}/${NPC_COUNT} NPCs`);
                    }
                } catch (err) {
                    console.error(`[NPC] Error creating NPC ${i}:`, err);
                }
            }

            // Kiểm tra lại sau khi tạo
            const finalCount = verifyNPCsCreated();
            console.log(`[NPC] After initialization: ${finalCount} NPCs exist in database`);
        }

        // Thiết lập chu kỳ đào cho NPC
        if (global.npcMiningInterval) {
            clearInterval(global.npcMiningInterval);
            console.log('[NPC] Cleared existing mining interval');
        }

        // Bắt đầu chu kỳ đào mới
        global.npcMiningInterval = setInterval(() => {
            try {
                const startTime = Date.now();
                const miningResult = npcMiningCycle();
                console.log(`[NPC] Mining cycle completed in ${Date.now() - startTime}ms, processed ${miningResult.count} NPCs`);
            } catch (err) {
                console.error('[NPC] Mining cycle error:', err);
            }
        }, NPC_MINING_INTERVAL);

        console.log('[NPC] Initialized mining interval successfully');
        return true;
    } catch (err) {
        console.error('[NPC] Critical initialization error:', err);
        return false;
    }
}
function upgradeDatabaseForAutomining() {
    try {
        // Add new columns for auto-mining
        db.exec(`
            ALTER TABLE mining_data ADD COLUMN mining_active INTEGER DEFAULT 0;
            ALTER TABLE mining_data ADD COLUMN mining_start_time INTEGER DEFAULT 0;
            ALTER TABLE mining_data ADD COLUMN mining_end_time INTEGER DEFAULT 0;
            ALTER TABLE mining_data ADD COLUMN mining_rate REAL DEFAULT 1.0;
            ALTER TABLE mining_data ADD COLUMN last_claimed INTEGER DEFAULT 0;
        `);
        console.log('[AUTOMINING] Database schema updated');
        return true;
    } catch (err) {
        console.log('[AUTOMINING] Database already updated or error:', err);
        return false;
    }
}
function npcMiningCycle() {
    try {
        const now = Date.now();

        // Lấy các NPC đủ điều kiện đào
        const npcs = db.prepare(`
            SELECT * FROM mining_data 
            WHERE user_id LIKE '${NPC_PREFIX}_%'
            AND (? - last_mined) >= ?
        `).all(now, NPC_MINING_INTERVAL - 1000); // Giảm 1 giây để đảm bảo không bỏ sót

        if (npcs.length === 0) {
            return { count: 0, success: true };
        }

        console.log(`[NPC] Mining cycle processing ${npcs.length} NPCs`);

        let processedCount = 0;

        // Xử lý từng NPC riêng biệt thay vì dùng transaction
        npcs.forEach(npc => {
            try {
                const miningPower = Math.max(1, npc.mining_power);
                const randomFactor = Math.random() * 0.5 + 0.75;
                const miningAmount = MINE_RATE * randomFactor * miningPower;
                const minedCoins = Math.min(100, Math.max(1, miningAmount));

                // Cập nhật ví và thống kê
                db.prepare(`
                    UPDATE mining_data 
                    SET wallet_mainnet = wallet_mainnet + ?,
                        last_mined = ?,
                        stats_mining_count = stats_mining_count + 1,
                        stats_total_mined = stats_total_mined + ?,
                        experience = experience + ?,
                        level = CASE 
                            WHEN experience + ? >= level * 1000 
                            THEN level + 1 
                            ELSE level 
                        END
                    WHERE user_id = ?
                `).run(
                    minedCoins,
                    now,
                    minedCoins,
                    minedCoins,
                    minedCoins,
                    npc.user_id
                );

                // Xử lý bán tự động
                if (Math.random() < 0.3 && npc.wallet_mainnet >= 100) {
                    const sellAmount = npc.wallet_mainnet * (Math.random() * 0.3 + 0.2);
                    try {
                        const marketData = db.prepare('SELECT * FROM market_data WHERE id = 1').get();
                        if (marketData && marketData.is_listed) {
                            // Trừ coin của NPC
                            db.prepare(
                                'UPDATE mining_data SET wallet_mainnet = wallet_mainnet - ? WHERE user_id = ?'
                            ).run(sellAmount, npc.user_id);

                            // Cập nhật giao dịch
                            db.prepare(
                                'UPDATE market_data SET total_transactions = total_transactions + 1 WHERE id = 1'
                            ).run();
                        }
                    } catch (sellErr) {
                        console.error(`[NPC] Error selling for NPC ${npc.user_id}:`, sellErr);
                    }
                }

                processedCount++;
            } catch (npcErr) {
                console.error(`[NPC] Error processing NPC ${npc.user_id}:`, npcErr);
            }
        });

        return { count: processedCount, success: true };
    } catch (err) {
        console.error('[NPC] Mining cycle error:', err);
        return { count: 0, success: false, error: err };
    }
}

function verifyNPCsCreated() {
    const count = db.prepare(`
        SELECT COUNT(*) as count 
        FROM mining_data 
        WHERE user_id LIKE '${NPC_PREFIX}_%'
    `).get().count;

    console.log(`[NPC] Verification: Found ${count} NPCs in database`);
    return count;
}

function generateTeamId() {
    return 'T' + Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).substring(2, 5).toUpperCase();
}
function hasTeamPermission(userId, teamId, requiredRole) {
    const member = db.prepare(`
        SELECT role FROM team_members 
        WHERE user_id = ? AND team_id = ?
    `).get(userId, teamId);

    if (!member) return false;

    const roles = {
        'member': 0,
        'mod': 1,
        'coleader': 2,
        'leader': 3
    };

    return roles[member.role] >= roles[requiredRole];
}

function setupDatabase() {
    try {
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true });
            console.log('[DB] Created database directory');
        }

        const database = new Database(DB_PATH);
        console.log('[DB] Successfully connected to SQLite database');

        createTablesIfNeeded(database);

        return database;
    } catch (err) {
        console.error('[DB] Critical error initializing database:', err);

        return {
            prepare: () => ({
                run: () => { },
                get: () => null,
                all: () => []
            }),
            transaction: (fn) => fn,
            pragma: () => { },
            exec: () => { },
            close: () => { }
        };
    }
}

let db = setupDatabase();

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}
function formatNumber(number, decimals = 0) {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
function initializeDatabase() {
    try {
        db = new Database(DB_PATH);
        console.log('[DB] Connected to SQLite database');

        // Bật foreign keys
        db.pragma('foreign_keys = ON');

        // Tạo các bảng cần thiết
        createTables();

        return db;
    } catch (err) {
        console.error('[DB] Error initializing database:', err);
        return null;
    }
}

// Tạo các bảng
function createTables() {
    // Bảng mining_data lưu trữ thông tin người dùng
    db.exec(`
        CREATE TABLE IF NOT EXISTS mining_data (
            user_id TEXT PRIMARY KEY,
            last_mined INTEGER,
            mining_power REAL,
            wallet_mainnet REAL,
            wallet_code TEXT UNIQUE,
            level INTEGER,
            experience INTEGER,
            stats_total_mined REAL,
            stats_mining_count INTEGER,
            stats_team_contribution REAL,
            created_at INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS user_miners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            miner_id TEXT,
            FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
        );
        
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            achievement_id TEXT,
            FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
        );
        
        CREATE TABLE IF NOT EXISTS user_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            type TEXT,
            message TEXT,
            reward REAL,
            time INTEGER,
            FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
        );
        
        CREATE TABLE IF NOT EXISTS user_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            item_id TEXT,
            quantity INTEGER,
            FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
        );
        
        CREATE TABLE IF NOT EXISTS user_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            item_id TEXT,
            name TEXT,
            effect TEXT,
            value REAL,
            expires INTEGER,
            purchased_at INTEGER,
            FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
        );
        
        CREATE TABLE IF NOT EXISTS teams (
            team_id TEXT PRIMARY KEY,
            name TEXT,
            leader_id TEXT,
            created_at INTEGER,
            stats_total_power REAL,
            stats_total_mined REAL
        );
        
        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id TEXT,
            user_id TEXT,
            FOREIGN KEY (team_id) REFERENCES teams(team_id),
            FOREIGN KEY (user_id) REFERENCES mining_data(user_id)
        );
        
        CREATE TABLE IF NOT EXISTS market_data (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            price REAL,
            supply_demand_ratio REAL,
            last_update INTEGER,
            trend TEXT,
            total_supply REAL,
            total_transactions INTEGER,
            sentiment REAL,
            is_listed INTEGER,
            progress_to_listing REAL
        );
        
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            price REAL,
            time INTEGER,
            supply REAL,
            ratio REAL,
            event TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
        CREATE INDEX IF NOT EXISTS idx_user_miners_user_id ON user_miners(user_id);
    `);

    console.log('[DB] Tables created successfully');
}

function initializeMarketData() {
    const marketData = db.prepare('SELECT * FROM market_data WHERE id = 1').get();

    if (!marketData) {
        db.prepare(`
            INSERT INTO market_data (
                id, price, supply_demand_ratio, last_update, trend, 
                total_supply, total_transactions, sentiment, is_listed, progress_to_listing
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            1, BASE_PRICE, 1.0, Date.now(), "stable",
            0, 0, 0, 0, 0
        );

        console.log('[DB] Market data initialized');
    }
}


function createBackup() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupMiningFile = path.join(BACKUP_DIR, `mining_data_${timestamp}.json`);
        const backupTeamFile = path.join(BACKUP_DIR, `mining_teams_${timestamp}.json`);
        const backupMarketFile = path.join(BACKUP_DIR, `market_data_${timestamp}.json`);

        fs.copyFileSync(MINE_DATA, backupMiningFile);
        fs.copyFileSync(MINE_TEAM, backupTeamFile);
        fs.copyFileSync(MARKET_DATA_FILE, backupMarketFile);

        console.log(`[BACKUP] Created backup at ${timestamp}`);

        lastBackupTime = Date.now();

        cleanOldBackups();

        return true;
    } catch (err) {
        console.error('[BACKUP] Error creating backup:', err);
        return false;
    }
}
function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR);

        const miningBackups = files.filter(f => f.startsWith('mining_data_'));
        const teamBackups = files.filter(f => f.startsWith('mining_teams_'));
        const marketBackups = files.filter(f => f.startsWith('market_data_'));

        const sortByDate = (a, b) => {
            return fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() -
                fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime();
        };

        miningBackups.sort(sortByDate);
        teamBackups.sort(sortByDate);
        marketBackups.sort(sortByDate);

        if (miningBackups.length > MAX_BACKUPS) {
            miningBackups.slice(MAX_BACKUPS).forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
            });
        }

        if (teamBackups.length > MAX_BACKUPS) {
            teamBackups.slice(MAX_BACKUPS).forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
            });
        }

        if (marketBackups.length > MAX_BACKUPS) {
            marketBackups.slice(MAX_BACKUPS).forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
            });
        }
    } catch (err) {
        console.error('[BACKUP] Error cleaning old backups:', err);
    }
}

function generateWalletCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;

    do {
        code = '';
        for (let i = 0; i < WALLET_CODE_LENGTH; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (walletCodeIndex[code]);

    return code;
}
function loadWalletCodeIndex() {
    walletCodeIndex = {};
    Object.entries(miningData).forEach(([userId, data]) => {
        if (data.wallet && data.wallet.code) {
            walletCodeIndex[data.wallet.code] = userId;
        }
    });
}
function getUserMiners(userId) {
    return db.prepare('SELECT miner_id FROM user_miners WHERE user_id = ?').all(userId).map(row => row.miner_id);
}

function getUserAchievements(userId) {
    return db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').all(userId).map(row => row.achievement_id);
}

function loadWalletCodeIndex() {
    walletCodeIndex = {};
    const users = db.prepare('SELECT user_id, wallet_code FROM mining_data').all();
    users.forEach(user => {
        if (user.wallet_code) {
            walletCodeIndex[user.wallet_code] = user.user_id;
        }
    });
    console.log(`[DB] Loaded ${Object.keys(walletCodeIndex).length} wallet codes`);
}
function getUserByWalletCode(code) {
    const userId = walletCodeIndex[code];
    if (!userId) return null;

    return db.prepare('SELECT * FROM mining_data WHERE user_id = ?').get(userId);
}

function transferCoins(fromUserId, toWalletCode, amount) {
    try {

        const fromUser = db.prepare(`
            SELECT * FROM mining_data 
            WHERE user_id = ?
        `).get(fromUserId);

        if (!fromUser) {
            return { success: false, message: "❌ Không tìm thấy thông tin người gửi!" };
        }

        const toUserId = db.prepare(`
            SELECT user_id FROM mining_data 
            WHERE wallet_code = ?
        `).get(toWalletCode)?.user_id;

        if (!toUserId) {
            return { success: false, message: "❌ Mã ví không tồn tại!" };
        }

        // Kiểm tra không tự gửi cho chính mình
        if (fromUserId === toUserId) {
            return { success: false, message: "❌ Không thể chuyển coin cho chính mình!" };
        }

        // Kiểm tra số dư
        if (fromUser.wallet_mainnet < amount) {
            return {
                success: false,
                message: `❌ Không đủ coin! Bạn chỉ có ${formatNumber(fromUser.wallet_mainnet, 2)} MC`
            };
        }

        // Tính phí giao dịch
        const fee = amount * 0.005; // 0.5%
        const amountAfterFee = amount - fee;
        const now = Date.now();

        const transaction = db.transaction(() => {
            // Trừ coin từ người gửi
            db.prepare(`
                UPDATE mining_data 
                SET wallet_mainnet = wallet_mainnet - ? 
                WHERE user_id = ?
            `).run(amount, fromUserId);

            // Cộng coin cho người nhận (đã trừ phí)
            db.prepare(`
                UPDATE mining_data 
                SET wallet_mainnet = wallet_mainnet + ? 
                WHERE user_id = ?
            `).run(amountAfterFee, toUserId);

            // Ghi nhận giao dịch
            db.prepare(`
                UPDATE market_data 
                SET total_transactions = total_transactions + 1
                WHERE id = 1
            `).run();

            // Ghi log giao dịch nếu có bảng transaction_history
            try {
                db.prepare(`
                    INSERT INTO transaction_history 
                    (user_id, type, amount, price, time) 
                    VALUES (?, ?, ?, ?, ?)
                `).run(
                    fromUserId,
                    "transfer_out",
                    amount,
                    0,
                    now
                );

                db.prepare(`
                    INSERT INTO transaction_history 
                    (user_id, type, amount, price, time) 
                    VALUES (?, ?, ?, ?, ?)
                `).run(
                    toUserId,
                    "transfer_in",
                    amountAfterFee,
                    0,
                    now
                );
            } catch (logErr) {
                console.error('[TRANSFER] Log error:', logErr);
        
            }
        });
        mainnetChain.addTransaction(fromUserId, toWalletCode, amount);

        if (mainnetChain.pendingTransactions.length >= 5) {
            mainnetChain.minePendingTransactions(null);
            console.log('[BLOCKCHAIN] Mined new block with 5 transactions');
        }

        transaction();
        return {
            success: true,
            message: `✅ Chuyển coin thành công!\n` +
                `💸 Số lượng: ${formatNumber(amount)} MC\n` +
                `🏦 Đến ví: ${toWalletCode}\n` +
                `🔗 Block: ${mainnetChain.chain.length}\n` +
                `📝 Hash: ${mainnetChain.getLatestBlock().hash.substr(0, 8)}...`
        };
    } catch (err) {
        console.error('[TRANSFER] Error:', err);
        return { success: false, message: "❌ Lỗi giao dịch!" };
    }
}

function initUser(userId) {
    let user = db.prepare('SELECT * FROM mining_data WHERE user_id = ?').get(userId);

    if (!user) {
        const walletCode = generateWalletCode();
        const now = Date.now();

        db.prepare(`
            INSERT INTO mining_data (
                user_id, last_mined, mining_power, wallet_mainnet, wallet_code,
                level, experience, stats_total_mined, stats_mining_count, 
                stats_team_contribution, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            userId, 0, 1, 0, walletCode,
            1, 0, 0, 0,
            0, now
        );

        db.prepare('INSERT INTO user_miners (user_id, miner_id) VALUES (?, ?)').run(userId, 'basic');

        walletCodeIndex[walletCode] = userId;

        user = db.prepare('SELECT * FROM mining_data WHERE user_id = ?').get(userId);

        console.log(`[DB] Created new user: ${userId}`);
    }

    return user;
}
function updateMarketPrice() {
    try {
        const now = Date.now();
        const marketData = db.prepare('SELECT * FROM market_data WHERE id = 1').get();

        if (!marketData) return null;

        // Nếu chưa listed thì kiểm tra điều kiện listing
        if (!marketData.is_listed) {
            const totalSupply = db.prepare('SELECT SUM(wallet_mainnet) as total FROM mining_data').get().total || 0;
            if (totalSupply >= LISTING_THRESHOLD) {
                db.prepare(`
                    UPDATE market_data 
                    SET is_listed = 1,
                        price = ?,
                        last_update = ?
                    WHERE id = 1
                `).run(INITIAL_PRICE, now);
                return INITIAL_PRICE;
            }
            return null;
        }

        // Tính toán biến động giá
        let priceChange = 0;

        // 1. Yếu tố ngẫu nhiên (luôn có)
        const randomFactor = MARKET_CONSTANTS.RANDOM.MIN +
            (Math.random() * (MARKET_CONSTANTS.RANDOM.MAX - MARKET_CONSTANTS.RANDOM.MIN));
        priceChange += randomFactor;

        // 2. Xu hướng hiện tại
        if (marketData.trend === 'up') {
            priceChange += MARKET_CONSTANTS.VOLATILITY.NORMAL;
        } else if (marketData.trend === 'down') {
            priceChange -= MARKET_CONSTANTS.VOLATILITY.NORMAL;
        }

        // 3. Áp lực thị trường
        const marketPressure = Math.random();
        if (marketPressure > 0.7) { // 30% cơ hội có áp lực thị trường
            priceChange += (Math.random() > 0.5 ? 1 : -1) * MARKET_CONSTANTS.VOLATILITY.HIGH;
        }

        // Giới hạn biến động
        priceChange = Math.max(
            -MARKET_CONSTANTS.VOLATILITY.MAX,
            Math.min(MARKET_CONSTANTS.VOLATILITY.MAX, priceChange)
        );

        // Tính giá mới
        const newPrice = Math.max(1, marketData.price * (1 + priceChange));
        const newTrend = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'stable';

        // Cập nhật vào database
        db.prepare(`
            UPDATE market_data 
            SET price = ?,
                last_update = ?,
                trend = ?,
                sentiment = ?
            WHERE id = 1
        `).run(
            newPrice,
            now,
            newTrend,
            Math.max(-1, Math.min(1, marketData.sentiment + (priceChange * 2)))
        );

        // Lưu lịch sử nếu biến động đáng kể
        if (Math.abs(priceChange) > 0.01) {
            db.prepare(`
                INSERT INTO price_history (price, time, supply, ratio, event)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                newPrice,
                now,
                marketData.total_supply,
                marketData.supply_demand_ratio,
                `Change: ${(priceChange * 100).toFixed(2)}% (${randomFactor > 0 ? '📈' : '📉'})`
            );
        }

        return newPrice;
    } catch (err) {
        console.error('[MARKET] Price update error:', err);
        return null;
    }
}

function buyWithMainnet(userId, itemId) {
    const user = miningData[userId];
    const item = MAINNET_ITEMS[itemId];
    if (!item) return { success: false, message: "Vật phẩm không tồn tại!" };
    if (user.wallet.mainnet < item.price) {
        return { success: false, message: `Không đủ mainnet coin! Bạn cần ${item.price} coin, hiện có ${user.wallet.mainnet.toFixed(2)}` };
    }
    user.wallet.mainnet -= item.price;
    if (!user.inventory) user.inventory = [];
    const expiryTime = item.duration > 0 ? Date.now() + item.duration : 0;
    user.inventory.push({ id: itemId, name: item.name, effect: item.effect, value: item.value, expires: expiryTime, purchasedAt: Date.now() });
    if (item.effect === "permanentBoost") {
        if (!user.permanentBoosts) user.permanentBoosts = {};
        user.permanentBoosts.miningRate = (user.permanentBoosts.miningRate || 1) * item.value;
    }
    saveData();
    return { success: true, message: `Mua thành công ${item.name}!\n💰 -${item.price} mainnet coin\n${item.description}` };
}

function sellItem(userId, itemId, quantity = 1) {
    const user = miningData[userId];
    if (!user.items || !user.items[itemId] || user.items[itemId] < quantity) {
        return { success: false, message: `Bạn không có đủ ${SELLABLE_ITEMS[itemId]?.name || itemId} để bán!` };
    }
    const item = SELLABLE_ITEMS[itemId];
    const totalPrice = item.basePrice * quantity;
    user.items[itemId] -= quantity;
    user.wallet.mainnet += totalPrice;
    saveData();
    return { success: true, message: `Đã bán ${quantity} ${item.name} với giá ${totalPrice.toFixed(2)} mainnet coin!` };
}

function calculateMining(userId) {
    try {
        const user = db.prepare('SELECT * FROM mining_data WHERE user_id = ?').get(userId);
        if (!user) return { success: false, message: "Người dùng không tồn tại!" };

        const now = Date.now();
        const timeSinceLastMine = now - user.last_mined;

        if (timeSinceLastMine < MINING_COOLDOWN) {
            const remainingSeconds = Math.ceil((MINING_COOLDOWN - timeSinceLastMine) / 1000);
            return {
                success: false,
                message: `⏳ Bạn cần đợi thêm ${remainingSeconds} giây để đào tiếp!`,
                cooldown: remainingSeconds
            };
        }

        const MAX_MINING_TIME = 4 * 60;
        const timeDiff = Math.min(
            MAX_MINING_TIME,
            (now - user.last_mined) / (1000 * 60)
        );
        const adjustedTimeDiff = user.stats_mining_count === 0 ? Math.max(3, timeDiff) : timeDiff;

        const teamBonus = getTeamBonus(userId);
        let boostMultiplier = 1;

        const baseAmount = BASE_MINING_AMOUNT * (1 + (user.level - 1) * 0.05);

        const powerBoost = Math.max(1, user.mining_power);

        const activeItems = db.prepare(`
        SELECT * FROM user_inventory 
        WHERE user_id = ? AND (expires = 0 OR expires > ?)
      `).all(userId, now);

        activeItems.forEach(item => {
            if (item.effect === "miningBoost") {
                boostMultiplier *= item.value;
            }
        });

        const permanentBoost = db.prepare(`
        SELECT * FROM user_inventory 
        WHERE user_id = ? AND effect = 'permanentBoost' AND expires = 0
      `).get(userId);

        if (permanentBoost) {
            boostMultiplier *= permanentBoost.value;
        }

        boostMultiplier = Math.min(3, boostMultiplier);

        const miners = getUserMiners(userId);
        let miningPower = 0;
        miners.forEach(minerId => {
            miningPower += MINERS[minerId].power;
        });

        const cappedMiningPower = Math.min(100, miningPower);
        const miningAmount = (baseAmount + (MINE_RATE * timeDiff)) *
            powerBoost * (1 + teamBonus) * boostMultiplier;

        const randomFactor = 0.85 + (Math.random() * 0.3);

        const finalAmount = Math.min(
            MAX_MINING_AMOUNT,
            Math.max(BASE_MINING_AMOUNT, miningAmount * randomFactor)
        );

        db.prepare(`
        UPDATE mining_data 
        SET stats_mining_count = stats_mining_count + 1,
            stats_total_mined = stats_total_mined + ?
        WHERE user_id = ?
      `).run(finalAmount, userId);

        checkAchievements(userId);

        return {
            success: true,
            amount: Math.floor(finalAmount)
        };
    } catch (error) {
        console.error('[MINING] Error:', error);
        return { success: false, message: "❌ Lỗi khi đào coin!" };
    }
}
function isValidTeamName(teamName) {
    return /^[a-zA-Z0-9]+$/.test(teamName) &&
        teamName.length >= 3 &&
        teamName.length <= 16;
}
function getTeamBonus(userId) {
    const teamMember = db.prepare(`
        SELECT team_id FROM team_members WHERE user_id = ?
    `).get(userId);

    if (!teamMember) return 0;

    // Đếm số thành viên của team (trừ người dùng hiện tại)
    const memberCount = db.prepare(`
        SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND user_id != ?
    `).get(teamMember.team_id, userId).count;

    return memberCount * TEAM_BONUS;
}
function createTeam(userId, teamName) {
    try {
        // Kiểm tra tên team hợp lệ
        if (!isValidTeamName(teamName)) {
            return {
                success: false,
                message: "❌ Tên team không hợp lệ!\n- Chỉ được dùng chữ và số\n- Độ dài 3-16 ký tự\n- Không dùng khoảng trắng và ký tự đặc biệt"
            };
        }

        const user = db.prepare('SELECT level FROM mining_data WHERE user_id = ?').get(userId);

        // Yêu cầu level tối thiểu để tạo team
        if (user.level < 1) {
            return {
                success: false,
                message: "❌ Bạn cần đạt level 1 để tạo team!"
            };
        }

        // Kiểm tra đã trong team chưa
        const existingTeam = db.prepare(`
            SELECT team_id FROM team_members WHERE user_id = ?
        `).get(userId);

        if (existingTeam) {
            return { success: false, message: "❌ Bạn đã tham gia một team rồi!" };
        }

        // Kiểm tra tên team đã tồn tại
        const nameExists = db.prepare(`
            SELECT team_id FROM teams WHERE LOWER(name) = LOWER(?)
        `).get(teamName);

        if (nameExists) {
            return { success: false, message: "❌ Tên team đã tồn tại!" };
        }

        const teamId = generateTeamId();
        const now = Date.now();

        const transaction = db.transaction(() => {
            // Tạo team mới
            db.prepare(`
                INSERT INTO teams (
                    team_id, name, leader_id, created_at,
                    level, exp, max_members, 
                    stats_total_power, stats_total_mined
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                teamId, teamName, userId, now,
                1, 0, 5, // Level 1, exp 0, max 5 thành viên
                0, 0 // Stats ban đầu
            );

            // Thêm leader vào team
            db.prepare(`
                INSERT INTO team_members (team_id, user_id, role, joined_at)
                VALUES (?, ?, ?, ?)
            `).run(teamId, userId, 'leader', now);

            unlockAchievement(userId, "team_leader");
        });

        transaction();

        return {
            success: true,
            message: `✅ Đã tạo team ${teamName} thành công!\n🆔 Team ID: ${teamId}`
        };
    } catch (err) {
        console.error('[TEAM] Create error:', err);
        return { success: false, message: "❌ Lỗi khi tạo team!" };
    }
}
function backupDatabase() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(DB_DIR, 'backups');

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const backupPath = path.join(backupDir, `coindb_${timestamp}.sqlite`);

        fs.copyFileSync(DB_PATH, backupPath);

        console.log(`[DB] Created backup at ${backupPath}`);

        cleanOldBackups(backupDir);

        return true;
    } catch (err) {
        console.error('[DB] Backup error:', err);
        return false;
    }
}

function cleanOldBackups(backupDir) {
    try {
        const MAX_BACKUPS = 10;
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('coindb_'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length > MAX_BACKUPS) {
            files.slice(MAX_BACKUPS).forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`[DB] Deleted old backup: ${file.name}`);
            });
        }
    } catch (err) {
        console.error('[DB] Error cleaning old backups:', err);
    }
}
function calculateTeamExp(miningAmount, memberCount) {
    return Math.floor(miningAmount * (1 + (memberCount * 0.1)));
}
function addTeamExp(teamId, exp) {
    const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(teamId);
    if (!team) return;

    const nextLevelExp = team.level * 1000;
    const newExp = team.exp + exp;

    if (newExp >= nextLevelExp) {
        // Level up
        db.prepare(`
            UPDATE teams 
            SET level = level + 1,
                exp = ?,
                max_members = max_members + 1
            WHERE team_id = ?
        `).run(newExp - nextLevelExp, teamId);

        // Thông báo level up
        const teamMembers = db.prepare(
            'SELECT user_id FROM team_members WHERE team_id = ?'
        ).all(teamId);

        teamMembers.forEach(member => {
            db.prepare(`
                INSERT INTO user_notifications (
                    user_id, type, message, time
                ) VALUES (?, ?, ?, ?)
            `).run(
                member.user_id,
                "team_levelup",
                `🎉 Team đã đạt level ${team.level + 1}!\n👥 Slot thành viên +1`,
                Date.now()
            );
        });
    } else {
        // Cập nhật exp
        db.prepare(`
            UPDATE teams 
            SET exp = exp + ? 
            WHERE team_id = ?
        `).run(exp, teamId);
    }
}
function restoreFromLatestBackup() {
    try {
        if (db) {
            db.close();
        }

        const backupDir = path.join(DB_DIR, 'backups');

        if (!fs.existsSync(backupDir)) {
            console.error('[DB] Backup directory does not exist');
            return false;
        }

        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('coindb_'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length === 0) {
            console.error('[DB] No backup files found');
            return false;
        }

        const latestBackup = files[0];

        fs.copyFileSync(latestBackup.path, DB_PATH);

        console.log(`[DB] Restored database from ${latestBackup.name}`);

        db = new Database(DB_PATH);

        loadWalletCodeIndex();

        return true;
    } catch (err) {
        console.error('[DB] Restore error:', err);
        return false;
    }
}
function joinTeam(userId, teamId) {
    try {
        const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(teamId);
        if (!team) {
            return { success: false, message: "Team không tồn tại!" };
        }

        const existingTeam = db.prepare(
            'SELECT * FROM team_members WHERE user_id = ?'
        ).get(userId);

        if (existingTeam) {
            return { success: false, message: "Bạn đã tham gia một team rồi!" };
        }

        db.prepare(
            'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)'
        ).run(teamId, userId);

        return { success: true, message: `Bạn đã tham gia team ${team.name} thành công!` };
    } catch (err) {
        console.error('[TEAM] Join error:', err);
        return { success: false, message: "Lỗi khi tham gia team!" };
    }
}
function leaveTeam(userId) {
    try {
        const member = db.prepare(`
            SELECT t.*, tm.user_id 
            FROM teams t
            JOIN team_members tm ON t.team_id = tm.team_id
            WHERE tm.user_id = ?
        `).get(userId);

        if (!member) {
            return { success: false, message: "Bạn chưa tham gia team nào!" };
        }

        if (member.leader_id === userId) {
            return { success: false, message: "Leader không thể rời team!" };
        }

        db.prepare(
            'DELETE FROM team_members WHERE user_id = ?'
        ).run(userId);

        return { success: true, message: `Bạn đã rời team ${member.name} thành công!` };
    } catch (err) {
        console.error('[TEAM] Leave error:', err);
        return { success: false, message: "Lỗi khi rời team!" };
    }
}
function disbandTeam(userId, teamId) {
    try {
        const team = db.prepare(
            'SELECT * FROM teams WHERE team_id = ? AND leader_id = ?'
        ).get(teamId, userId);

        if (!team) {
            return { success: false, message: "Team không tồn tại hoặc bạn không phải leader!" };
        }

        const transaction = db.transaction(() => {

            db.prepare('DELETE FROM team_members WHERE team_id = ?').run(teamId);

            db.prepare('DELETE FROM teams WHERE team_id = ?').run(teamId);
        });

        transaction();

        return { success: true, message: "Team đã được giải tán thành công!" };
    } catch (err) {
        console.error('[TEAM] Disband error:', err);
        return { success: false, message: "Lỗi khi giải tán team!" };
    }
}

function checkAchievements(userId) {
    try {
        const user = db.prepare('SELECT * FROM mining_data WHERE user_id = ?').get(userId);
        if (!user) return false;

        const userAchievements = getUserAchievements(userId);

        if (user.wallet_mainnet >= ACHIEVEMENTS.first_million.requirement && !userAchievements.includes("first_million")) {
            unlockAchievement(userId, "first_million");
        }

        if (user.mining_power >= ACHIEVEMENTS.power_user.requirement.value && !userAchievements.includes("power_user")) {
            unlockAchievement(userId, "power_user");
        }

        if (user.stats_mining_count >= ACHIEVEMENTS.devoted_miner.requirement.value && !userAchievements.includes("devoted_miner")) {
            unlockAchievement(userId, "devoted_miner");
        }

        // Kiểm tra thành tựu cấp độ
        if (user.level >= ACHIEVEMENTS.coin_master.requirement.value && !userAchievements.includes("coin_master")) {
            unlockAchievement(userId, "coin_master");
        }

        return true;
    } catch (err) {
        console.error('[ACHIEVEMENT] Error checking achievements:', err);
        return false;
    }
}
function unlockAchievement(userId, achievementId) {
    try {
        // Kiểm tra xem người dùng đã có thành tựu này chưa
        const hasAchievement = db.prepare(
            'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
        ).get(userId, achievementId);

        // Nếu đã có, không làm gì cả
        if (hasAchievement) return false;

        // Thêm thành tựu mới
        db.prepare(
            'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
        ).run(userId, achievementId);

        // Lấy phần thưởng
        const reward = ACHIEVEMENTS[achievementId].reward;

        // Cộng coin cho người dùng
        db.prepare(
            'UPDATE mining_data SET wallet_mainnet = wallet_mainnet + ? WHERE user_id = ?'
        ).run(reward, userId);

        // Thêm thông báo
        db.prepare(`
            INSERT INTO user_notifications (user_id, type, message, reward, time)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            userId,
            "achievement",
            `Bạn đã đạt được thành tựu: ${ACHIEVEMENTS[achievementId].name}`,
            reward,
            Date.now()
        );

        return true;
    } catch (err) {
        console.error('[ACHIEVEMENT] Error unlocking achievement:', err);
        return false;
    }
}

function buyMiner(userId, minerId) {
    try {
        const miner = MINERS[minerId];
        if (!miner) {
            return { success: false, message: "❌ Thiết bị đào không tồn tại!" };
        }

        const existingMiner = db.prepare(`
            SELECT * FROM user_miners 
            WHERE user_id = ? AND miner_id = ?
        `).get(userId, minerId);

        if (existingMiner) {
            return { success: false, message: "❌ Bạn đã sở hữu thiết bị đào này rồi!" };
        }

        const userWallet = db.prepare(`
            SELECT wallet_mainnet 
            FROM mining_data 
            WHERE user_id = ?
        `).get(userId);

        if (!userWallet || userWallet.wallet_mainnet < miner.price) {
            return {
                success: false,
                message: `❌ Không đủ coin! Cần ${miner.price.toLocaleString()} MC, bạn có ${(userWallet?.wallet_mainnet || 0).toFixed(2)} MC`
            };
        }

        const transaction = db.transaction(() => {

            db.prepare(`
                UPDATE mining_data 
                SET wallet_mainnet = wallet_mainnet - ? 
                WHERE user_id = ?
            `).run(miner.price, userId);

            db.prepare(`
                INSERT INTO user_miners (user_id, miner_id) 
                VALUES (?, ?)
            `).run(userId, minerId);

            db.prepare(`
                UPDATE mining_data 
                SET mining_power = mining_power + ? 
                WHERE user_id = ?
            `).run(miner.power, userId);
        });

        transaction();

        return {
            success: true,
            message: `✅ Mua thành công ${miner.name}!\n💰 -${miner.price.toLocaleString()} MC\n⚡ +${miner.power}x Mining Power`
        };
    } catch (err) {
        console.error('[SHOP] Buy miner error:', err);
        return { success: false, message: "❌ Lỗi giao dịch!" };
    }
}

function updateMiningPower(userId) {
    const user = miningData[userId];
    let power = 0;

    user.miners.forEach(minerId => {
        power += MINERS[minerId].power;
    });

    user.miningPower = power;

    const team = Object.values(teamData).find(t => t.members.includes(userId));
    if (team) {
        team.stats.totalPower = team.members.reduce((sum, memberId) =>
            sum + (miningData[memberId]?.miningPower || 1), 0
        );
    }

    saveData();
}
function getUserInfo(userId) {
    try {
        // Lấy thông tin cơ bản từ database
        const user = db.prepare(`
            SELECT md.*, GROUP_CONCAT(um.miner_id) as miners
            FROM mining_data md
            LEFT JOIN user_miners um ON md.user_id = um.user_id
            WHERE md.user_id = ?
            GROUP BY md.user_id
        `).get(userId);

        if (!user) return null;

        // Lấy thông tin team
        const team = db.prepare(`
            SELECT t.*, tm.user_id
            FROM teams t
            JOIN team_members tm ON t.team_id = tm.team_id
            WHERE tm.user_id = ?
        `).get(userId);

        // Lấy danh sách thành tựu
        const achievements = db.prepare(`
            SELECT achievement_id 
            FROM user_achievements 
            WHERE user_id = ?
        `).all(userId);

        const activeTime = Math.floor((Date.now() - user.created_at) / (24 * 60 * 60 * 1000));

        return {
            mainnet: user.wallet_mainnet || 0,
            walletCode: user.wallet_code,
            miningPower: user.mining_power || 1,
            level: user.level || 1,
            experience: user.experience || 0,
            nextLevel: (user.level || 1) * 1000,
            miners: (user.miners ? user.miners.split(',') : ['basic']).map(id => MINERS[id]),
            team: team ? {
                id: team.team_id,
                name: team.name,
                isLeader: team.leader_id === userId,
                memberCount: db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?')
                    .get(team.team_id).count,
                bonus: getTeamBonus(userId) * 100
            } : null,
            achievements: achievements.map(a => ACHIEVEMENTS[a.achievement_id]),
            stats: {
                totalMined: user.stats_total_mined || 0,
                miningCount: user.stats_mining_count || 0,
                teamContribution: user.stats_team_contribution || 0,
                daysActive: activeTime
            }
        };
    } catch (err) {
        console.error('[INFO] Error getting user info:', err);
        return null;
    }
}
function buyMainnet(userId, amount) {
    try {
        const marketData = db.prepare('SELECT * FROM market_data WHERE id = 1').get();
        if (!marketData) {
            return { success: false, message: "❌ Lỗi: Không thể lấy dữ liệu thị trường!" };
        }

        // Kiểm tra listing
        if (!marketData.is_listed) {
            const totalSupply = db.prepare('SELECT SUM(wallet_mainnet) as total FROM mining_data').get().total || 0;
            return {
                success: false,
                message: `❌ Chưa thể giao dịch! Cần đạt ${LISTING_THRESHOLD.toLocaleString()} MC.\n` +
                    `📊 Tiến độ: ${((totalSupply / LISTING_THRESHOLD) * 100).toFixed(2)}%`
            };
        }

        const circulatingSupply = db.prepare(`
            SELECT SUM(wallet_mainnet) as total 
            FROM mining_data 
            WHERE user_id NOT LIKE '${NPC_PREFIX}_%'
        `).get().total || 0;

        const availableForSale = db.prepare(`
            SELECT SUM(wallet_mainnet) as total 
            FROM mining_data 
            WHERE user_id LIKE '${NPC_PREFIX}_%'
        `).get().total || 0;

        if (amount > availableForSale) {
            return {
                success: false,
                message: `❌ Không đủ coin trong thị trường!\n` +
                    `Bạn muốn mua: ${amount} MC\n` +
                    `Có sẵn: ${formatNumber(availableForSale)} MC\n` +
                    `Vui lòng chờ thêm coin được đào hoặc giảm số lượng.`
            };
        }

        const maxBuyAmount = circulatingSupply * MAX_BUY_PERCENT;
        if (amount > maxBuyAmount) {
            return {
                success: false,
                message: `❌ Vượt quá giới hạn mua!\n` +
                    `Tối đa có thể mua: ${maxBuyAmount.toFixed(2)} MC\n` +
                    `(${(MAX_BUY_PERCENT * 100)}% tổng coin lưu hành)`
            };
        }

        const userWallet = db.prepare('SELECT wallet_mainnet FROM mining_data WHERE user_id = ?').get(userId);
        const currentHolding = userWallet?.wallet_mainnet || 0;
        const maxHoldAmount = circulatingSupply * MAX_HOLD_PERCENT;

        if (currentHolding + amount > maxHoldAmount) {
            return {
                success: false,
                message: `❌ Vượt quá giới hạn nắm giữ!\n` +
                    `Bạn đang có: ${currentHolding.toFixed(2)} MC\n` +
                    `Tối đa có thể nắm giữ: ${maxHoldAmount.toFixed(2)} MC\n` +
                    `(${(MAX_HOLD_PERCENT * 100)}% tổng coin lưu hành)`
            };
        }

        const costInDollars = amount * (marketData.price || 0);
        const balance = getBalance(userId);

        if (balance < costInDollars) {
            return {
                success: false,
                message: `❌ Không đủ tiền! Cần ${costInDollars.toLocaleString()}$, bạn chỉ có ${balance.toLocaleString()}$`
            };
        }

        const transaction = db.transaction(() => {
            updateBalance(userId, -costInDollars);

            db.prepare(`
                UPDATE mining_data 
                SET wallet_mainnet = wallet_mainnet + ? 
                WHERE user_id = ?
            `).run(amount, userId);

            db.prepare(`
                UPDATE market_data 
                SET total_transactions = total_transactions + 1,
                    supply_demand_ratio = supply_demand_ratio + 0.01
                WHERE id = 1
            `).run();
        });

        transaction();

        return {
            success: true,
            message: `Mua thành công ${amount} mainnet coins!\n` +
                `💵 Đã trả: ${formatNumber(costInDollars)}$\n` +
                `📊 Tỷ giá: 1 MC = ${formatNumber(marketData.price || 0)}$\n` +
                `💼 Số dư MC: ${formatNumber(currentHolding + amount)}\n` +
                `📈 Tỷ lệ nắm giữ: ${((currentHolding + amount) / circulatingSupply * 100).toFixed(2)}%`
        };

    } catch (err) {
        console.error('[BUY] Error:', err);
        return { success: false, message: "❌ Lỗi giao dịch!" };
    }
}
function addItemToUser(userId, itemId, quantity = 1) {
    try {
        const existingItem = db.prepare(
            'SELECT * FROM user_items WHERE user_id = ? AND item_id = ?'
        ).get(userId, itemId);

        if (existingItem) {
            db.prepare(
                'UPDATE user_items SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?'
            ).run(quantity, userId, itemId);
        } else {
            db.prepare(
                'INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, ?)'
            ).run(userId, itemId, quantity);
        }

        return true;
    } catch (err) {
        console.error('[ITEMS] Add item error:', err);
        return false;
    }
}
function cleanupDatabase() {
    try {
        db.prepare(`
            DELETE FROM teams 
            WHERE team_id NOT IN (SELECT DISTINCT team_id FROM team_members)
        `).run();

        const now = Date.now();
        db.prepare(`
            DELETE FROM user_inventory 
            WHERE expires > 0 AND expires < ?
        `).run(now);

        console.log('[DB] Cleanup completed');
        return true;
    } catch (err) {
        console.error('[DB] Cleanup error:', err);
        return false;
    }
}
function withdrawMainnet(userId, amount) {
    try {
        const marketData = db.prepare('SELECT * FROM market_data WHERE id = 1').get();
        const userWallet = db.prepare(
            'SELECT wallet_mainnet FROM mining_data WHERE user_id = ?'
        ).get(userId);

        if (!userWallet || userWallet.wallet_mainnet < amount) {
            return { success: false, message: "Bạn không đủ mainnet coins!" };
        }

        if (!marketData.is_listed) {
            const totalSupply = db.prepare(
                'SELECT SUM(wallet_mainnet) as total FROM mining_data'
            ).get().total || 0;

            return {
                success: true,
                message: `Rút thành công ${amount} mainnet coins!\n` +
                    `💵 Đã thêm ${formatNumber(dollarsReceived)}$ vào tài khoản\n` +
                    `📊 Tỷ giá: 1 MC = ${formatNumber(marketData.price)}$`
            };
        }

        const dollarsReceived = amount * marketData.price;

        const transaction = db.transaction(() => {

            db.prepare(
                'UPDATE mining_data SET wallet_mainnet = wallet_mainnet - ? WHERE user_id = ?'
            ).run(amount, userId);

            db.prepare(
                'UPDATE market_data SET total_transactions = total_transactions + 1 WHERE id = 1'
            ).run();

            updateBalance(userId, dollarsReceived);
        });

        transaction();

        return {
            success: true,
            message: `Rút thành công ${amount} mainnet coins!\n` +
                `💵 Đã thêm ${formatNumber(dollarsReceived)}$ vào tài khoản\n` +
                `📊 Tỷ giá: 1 MC = ${formatNumber(marketData.price)}$`
        };
    } catch (err) {
        console.error('[WITHDRAW] Error:', err);
        return { success: false, message: "❌ Lỗi giao dịch!" };
    }
}
module.exports = {
    name: "coin",
    info: "Hệ thống đào coin",
    category: "Games",
    dev: "HNT",
    usages: `.coin mine`,
    onPrefix: true,
    cooldowns: 1,
    usedby: 0,

    onLoad: function () {
        try {
            console.log('[COIN] Initializing database...');

            if (!db) {
                console.log('[COIN] Database not initialized, setting up...');
                db = setupDatabase();
            }
            if (global.marketInterval) {
                clearInterval(global.marketInterval);
            }

            global.marketInterval = setInterval(() => {
                try {
                    const oldPrice = db.prepare('SELECT price FROM market_data WHERE id = 1').get()?.price;
                    const newPrice = updateMarketPrice();
                    if (newPrice && oldPrice !== newPrice) {
                        console.log(`[MARKET] Price updated: ${oldPrice} -> ${newPrice}`);
                    }
                } catch (err) {
                    console.error('[MARKET] Update error:', err);
                }
            }, MARKET_CONSTANTS.RECOVERY.TIME);

            console.log('[MARKET] Price update interval set to 5 seconds');

            try {
                createTablesIfNeeded(db);
                console.log('[COIN] Tables created/verified');
            } catch (tableError) {
                console.error('[COIN] Error creating tables:', tableError);
            }

            try {
                initializeMarketData();
                console.log('[COIN] Market data initialized');
            } catch (marketError) {
                console.error('[COIN] Error initializing market data:', marketError);
            }

            try {
                loadWalletCodeIndex();
            } catch (walletError) {
                console.error('[COIN] Error loading wallet codes:', walletError);
            }

            try {
                backupDatabase();
            } catch (backupError) {
                console.error('[COIN] Error creating backup:', backupError);
            }

            try {
                initializeNPCs();
            } catch (npcError) {
                console.error('[COIN] Error initializing NPCs:', npcError);
            }

            setInterval(() => {
                try {
                    backupDatabase();
                } catch (err) {
                    console.error('[COIN] Backup error:', err);
                }
            }, 60 * 60 * 1000);
            console.log('[COIN] Scheduling NPC initialization in 3 seconds...');
            setTimeout(() => {
                try {
                    initializeNPCs();
                } catch (npcError) {
                    console.error('[COIN] Critical NPC initialization error:', npcError);
                }
            }, 3000);
            setInterval(() => {
                try {
                    updateMarketPrice();
                } catch (err) {
                    console.error('[COIN] Market update error:', err);
                }
            }, 30 * 1000);

            console.log('[COIN] System initialized successfully');
        } catch (err) {
            console.error('[COIN] Initialization error:', err);
        }
    },
    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const action = target[0]?.toLowerCase();
        const user = initUser(senderID);

        try {
            switch (action) {
                case "mine":
                case "đào":
                    updateMarketPrice();
                    const miningResult = calculateMining(senderID);

                    if (!miningResult.success) {
                        return api.sendMessage(miningResult.message, threadID, messageID);
                    }

                    const mined = miningResult.amount;

                    // Cập nhật dữ liệu trong database
                    db.prepare(`
                        UPDATE mining_data 
                        SET last_mined = ?,
                            experience = experience + ?,
                            wallet_mainnet = wallet_mainnet + ?
                        WHERE user_id = ?
                      `).run(Date.now(), mined, mined, senderID);

                    // Lấy thông tin người dùng sau khi cập nhật
                    const updatedUser = db.prepare(`
                        SELECT * FROM mining_data WHERE user_id = ?
                      `).get(senderID);

                    // Kiểm tra level up với công thức mới
                    let leveledUp = false;
                    let newLevel = updatedUser.level;

                    // Tính XP cần cho cấp tiếp theo
                    const requiredXP = calculateRequiredXP(updatedUser.level);

                    if (updatedUser.experience >= requiredXP) {
                        // Tăng level và mining power
                        leveledUp = true;
                        newLevel = updatedUser.level + 1;

                        db.prepare(`
                          UPDATE mining_data 
                          SET level = ?,
                              experience = experience - ?,
                              mining_power = mining_power + 0.1
                          WHERE user_id = ?
                        `).run(newLevel, requiredXP, senderID);

                        // Gửi thông báo lên cấp
                        api.sendMessage(
                            `🎉 LEVEL UP! 🎉\n` +
                            `Bạn đã đạt level ${newLevel}!\n` +
                            `Mining Power +0.1`,
                            threadID
                        );
                    }

                    // Lấy lại thông tin sau khi lên cấp (nếu có)
                    const finalUser = leveledUp ?
                        db.prepare(`SELECT * FROM mining_data WHERE user_id = ?`).get(senderID) :
                        updatedUser;

                    const marketData = db.prepare('SELECT * FROM market_data WHERE id = 1').get();
                    const totalSupply = db.prepare('SELECT SUM(wallet_mainnet) as total FROM mining_data').get().total || 0;

                    const priceDisplay = marketData.is_listed
                        ? `🌐 Giá hiện tại: 1 MC = ${formatNumber(marketData.price || 0)}$`
                        : `📢 Coin chưa được list! Cần đạt ${formatNumber(LISTING_THRESHOLD).toLocaleString()} MC để listing\n` +
                        `📊 Tiến độ: ${formatNumber(totalSupply / LISTING_THRESHOLD * 100, 2)}% (${formatNumber(totalSupply)}/
                              ${formatNumber(LISTING_THRESHOLD).toLocaleString()} MC)`;

                    // Tính XP cần cho cấp tiếp theo sau khi đã lên cấp (nếu có)
                    const nextLevelXP = calculateRequiredXP(finalUser.level);

                    return api.sendMessage(
                        "⛏️ BÁO CÁO ĐÀO COIN ⛏️\n" +
                        "━━━━━━━━━━━━━━━━━━\n" +
                        `💰 Đã đào được: ${formatNumber(mined)} coins\n` +
                        `⚡ Sức Mạnh Đào: ${formatNumber(finalUser.mining_power || 0, 1)}x\n` +
                        `📊 Cấp Độ: ${finalUser.level} (${finalUser.experience}/${nextLevelXP} XP)\n` +
                        `💎 Mainnet Coins: ${formatNumber(finalUser.wallet_mainnet || 0)}\n\n` +
                        `💎 Tổng cung hiện tại: ${formatNumber(totalSupply)} MC\n` +
                        priceDisplay,
                        threadID, messageID
                    );
                    break;
                case "chain":
                case "blockchain": {
                    const page = parseInt(target[1]) || 1;
                    const blocksPerPage = 5;
                    const start = (page - 1) * blocksPerPage;
                    const end = start + blocksPerPage;

                    const blocks = mainnetChain.chain.slice(start, end);

                    let msg = "🔗 BLOCKCHAIN EXPLORER 🔗\n";
                    msg += "━━━━━━━━━━━━━━━━━━\n\n";

                    blocks.forEach((block, index) => {
                        const blockIndex = start + index;
                        msg += `Block #${blockIndex}\n`;
                        msg += `⏰ Time: ${new Date(block.timestamp).toLocaleString()}\n`;
                        msg += `📝 Transactions: ${block.transactions.length}\n`;
                        msg += `🔒 Hash: ${block.hash.substr(0, 8)}...\n\n`;
                    });

                    msg += `Trang ${page}/${Math.ceil(mainnetChain.chain.length / blocksPerPage)}\n`;
                    msg += "• Xem trang khác: .coin chain [số trang]";

                    return api.sendMessage(msg, threadID, messageID);
                }
                case "check":
                case "thịtrường": {
                    const marketData = db.prepare('SELECT * FROM market_data WHERE id = 1').get();
                    if (!marketData) {
                        return api.sendMessage("❌ Lỗi: Không thể lấy dữ liệu thị trường!", threadID, messageID);
                    }

                    const supplyResult = db.prepare('SELECT SUM(wallet_mainnet) as total FROM mining_data').get();
                    const totalSupply = supplyResult?.total || 0;

                    if (!marketData.is_listed) {
                        let preListingMsg = `📣 COIN CHƯA ĐƯỢC LIST 📣\n`;
                        preListingMsg += "━━━━━━━━━━━━━━━━━━\n\n";
                        preListingMsg += `⏳ Coin sẽ được list khi đạt ${LISTING_THRESHOLD.toLocaleString()} MC\n`;
                        preListingMsg += `📊 Tiến độ listing: ${formatNumber(totalSupply / LISTING_THRESHOLD * 100, 2)}%\n`;
                        preListingMsg += `💎 Tổng cung hiện tại: ${formatNumber(totalSupply)} MC\n`;
                        preListingMsg += `💰 Giá khởi điểm dự kiến: ${formatNumber(INITIAL_PRICE)}$\n\n`;

                        const userWallet = db.prepare('SELECT wallet_mainnet FROM mining_data WHERE user_id = ?').get(senderID);
                        preListingMsg += `💼 MC của bạn: ${formatNumber(userWallet?.wallet_mainnet || 0, 2)}\n\n`;
                        preListingMsg += `💡 LƯU Ý: Chưa thể mua/bán coin cho đến khi listed\n`;
                        preListingMsg += `⛏️ Hãy tiếp tục đào để đạt ngưỡng listing!`;

                        return api.sendMessage(preListingMsg, threadID, messageID);
                    }

                    const trendIcon = marketData.trend === "up" ? "📈" :
                        (marketData.trend === "down" ? "📉" : "📊");

                    let sentimentMsg = "";
                    const sentiment = marketData.sentiment || 0;
                    if (sentiment > 0.5) sentimentMsg = "Rất lạc quan 🌟";
                    else if (sentiment > 0.2) sentimentMsg = "Lạc quan 🔆";
                    else if (sentiment > -0.2) sentimentMsg = "Trung lập ⚖️";
                    else if (sentiment > -0.5) sentimentMsg = "Bi quan 🌧️";
                    else sentimentMsg = "Rất bi quan ⛈️";

                    const priceHistory = db.prepare(`
                                            SELECT price, time 
                                            FROM price_history 
                                            ORDER BY time DESC 
                                            LIMIT 7
                                        `).all();

                    // Tính phần trăm thay đổi
                    let changePercent = 0;
                    if (priceHistory.length >= 2) {
                        const currentPrice = marketData.price || 0;
                        const previousPrice = priceHistory[1]?.price || currentPrice;
                        changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
                    }

                    let marketMsg = `${trendIcon} THỊ TRƯỜNG MAINNET COIN ${trendIcon}\n`;
                    marketMsg += "━━━━━━━━━━━━━━━━━━\n\n";
                    marketMsg += `💰 Giá hiện tại: 1 MC = ${formatNumber(marketData.price || 0)}$\n`;
                    marketMsg += `${changePercent >= 0 ? "🟢" : "🔴"} Biến động: ${formatNumber(changePercent, 2)}%\n`;
                    marketMsg += `⚖️ Cung/Cầu: ${formatNumber(marketData.supply_demand_ratio || 1, 2)}\n`;
                    marketMsg += `🧠 Tâm lý thị trường: ${sentimentMsg}\n`;
                    marketMsg += `💎 Tổng cung: ${formatNumber(totalSupply)} MC\n\n`;
                    const userWallet = db.prepare('SELECT wallet_mainnet FROM mining_data WHERE user_id = ?').get(senderID);
                    const userCoins = userWallet?.wallet_mainnet || 0;
                    marketMsg += `\n💼 MC của bạn: ${formatNumber(userCoins, 2)}\n`;
                    marketMsg += `💵 Giá trị: ${formatNumber(userCoins * (marketData.price || 0))} $\n\n`;

                    marketMsg += "💡 GIAO DỊCH:\n";
                    marketMsg += ".coin sell [số lượng] - Bán MC lấy $\n";

                    return api.sendMessage(marketMsg, threadID, messageID);
                    break;
                }
                case "force": {


                    try {
                        console.log('[NPC] Force creating NPCs...');

                        db.prepare(`DELETE FROM mining_data WHERE user_id LIKE '${NPC_PREFIX}_%'`).run();

                        let createdCount = 0;

                        for (let i = 1; i <= NPC_COUNT; i++) {
                            const npcId = `${NPC_PREFIX}_${i}`;
                            const miningPower = NPC_MIN_POWER + (Math.random() * (NPC_MAX_POWER - NPC_MIN_POWER));
                            const walletCode = generateWalletCode();

                            try {
                                db.prepare(`
                                    INSERT OR IGNORE INTO mining_data (
                                        user_id, mining_power, wallet_mainnet, wallet_code,
                                        level, experience, last_mined,
                                        stats_total_mined, stats_mining_count, stats_team_contribution, created_at
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `).run(
                                    npcId,
                                    miningPower,
                                    Math.floor(Math.random() * 10), // starting with random amount
                                    walletCode,
                                    1,
                                    0,
                                    Date.now() - (Math.random() * 3600000), // random last_mined
                                    0,
                                    0,
                                    0,
                                    Date.now()
                                );

                                // Thêm vào wallet index
                                walletCodeIndex[walletCode] = npcId;
                                createdCount++;
                            } catch (npcErr) {
                                console.error(`[NPC] Error creating NPC ${npcId}:`, npcErr);
                            }
                        }

                        // Verify creation
                        const npcsAfterForce = db.prepare(`SELECT COUNT(*) as count FROM mining_data WHERE user_id LIKE '${NPC_PREFIX}_%'`).get();

                        return api.sendMessage(
                            `✅ Force created ${createdCount} NPCs!\n` +
                            `📊 Total NPCs now: ${npcsAfterForce.count}\n\n` +
                            `💡 Run ".coin npc" to see NPC statistics`,
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('[NPC] Force creation error:', err);
                        return api.sendMessage("❌ Lỗi khi tạo NPC: " + err.message, threadID, messageID);
                    }
                }
                case "admin": {

                    const adminAction = target[1]?.toLowerCase();

                    switch (adminAction) {
                        case "setcoin": {
                            const targetId = target[2];
                            const amount = parseFloat(target[3]);

                            if (!targetId || isNaN(amount)) {
                                return api.sendMessage(
                                    "❌ Vui lòng nhập đúng cú pháp:\n.coin admin setcoin [ID người dùng] [số lượng]",
                                    threadID, messageID
                                );
                            }

                            // Kiểm tra người dùng tồn tại
                            const user = db.prepare('SELECT * FROM mining_data WHERE user_id = ?').get(targetId);
                            if (!user) {
                                return api.sendMessage("❌ Người dùng không tồn tại!", threadID, messageID);
                            }

                            // Cập nhật số coin
                            db.prepare(`
                                UPDATE mining_data 
                                SET wallet_mainnet = ? 
                                WHERE user_id = ?
                            `).run(amount, targetId);

                            return api.sendMessage(
                                `✅ Đã set số coin của người dùng ${targetId} thành ${amount.toFixed(2)} MC`,
                                threadID, messageID
                            );
                        }

                        case "reducecoin": {
                            const reducePercent = parseFloat(target[2]);
                            if (isNaN(reducePercent) || reducePercent <= 0 || reducePercent > 100) {
                                return api.sendMessage(
                                    "❌ Vui lòng nhập phần trăm giảm hợp lệ (1-100):\n.coin admin reducecoin [phần trăm]",
                                    threadID, messageID
                                );
                            }

                            const transaction = db.transaction(() => {
                                // Lấy danh sách người dùng có coin > 1000
                                const richUsers = db.prepare(`
                                    SELECT user_id, wallet_mainnet 
                                    FROM mining_data 
                                    WHERE wallet_mainnet > 1000
                                    AND user_id NOT LIKE '${NPC_PREFIX}_%'
                                `).all();

                                let totalReduced = 0;
                                richUsers.forEach(user => {
                                    const reduction = user.wallet_mainnet * (reducePercent / 100);
                                    const newBalance = user.wallet_mainnet - reduction;

                                    db.prepare(`
                                        UPDATE mining_data 
                                        SET wallet_mainnet = ? 
                                        WHERE user_id = ?
                                    `).run(newBalance, user.user_id);

                                    totalReduced += reduction;
                                });

                                return {
                                    count: richUsers.length,
                                    total: totalReduced
                                };
                            });

                            const result = transaction();

                            return api.sendMessage(
                                `✅ Đã giảm ${reducePercent}% coin của ${result.count} người dùng\n` +
                                `📊 Tổng coin đã giảm: ${result.total.toFixed(2)} MC`,
                                threadID, messageID
                            );
                        }

                        case "status": {
                            const stats = db.prepare(`
                                SELECT 
                                    COUNT(*) as total_users,
                                    SUM(wallet_mainnet) as total_coins,
                                    SUM(CASE WHEN wallet_mainnet > 1000 THEN 1 ELSE 0 END) as rich_users
                                FROM mining_data
                                WHERE user_id NOT LIKE '${NPC_PREFIX}_%'
                            `).get();

                            return api.sendMessage(
                                "📊 THỐNG KÊ HỆ THỐNG 📊\n" +
                                "━━━━━━━━━━━━━━━━━━\n\n" +
                                `👥 Tổng người dùng: ${stats.total_users}\n` +
                                `💰 Tổng coin: ${stats.total_coins.toFixed(2)} MC\n` +
                                `🔶 Số người có trên 1000 MC: ${stats.rich_users}\n`,
                                threadID, messageID
                            );
                        }

                        default:
                            return api.sendMessage(
                                "💻 ADMIN COMMANDS 💻\n" +
                                "━━━━━━━━━━━━━━━━━━\n\n" +
                                "1. .coin admin setcoin [ID] [số lượng] - Set coin cho user\n" +
                                "2. .coin admin reducecoin [%] - Giảm coin của người dùng giàu\n" +
                                "3. .coin admin status - Xem thống kê hệ thống",
                                threadID, messageID
                            );
                    }
                    break;
                }
                case "team":
                case "nhóm": {
                    try {
                        const user = db.prepare('SELECT * FROM mining_data WHERE user_id = ?').get(senderID);
                        if (!user) {
                            return api.sendMessage("❌ Không tìm thấy thông tin người dùng!", threadID, messageID);
                        }
                        const teamAction = target[1]?.toLowerCase();

                        if (!teamAction) {
                            const team = db.prepare(`
                            SELECT t.*, tm.role
                            FROM teams t
                            JOIN team_members tm ON t.team_id = tm.team_id
                            WHERE tm.user_id = ?
                        `).get(senderID);

                            if (!team) {
                                return api.sendMessage(
                                    "🏰 TEAM MENU 🏰\n" +
                                    "━━━━━━━━━━━━━━━━━━\n" +
                                    "1. .coin team create [tên] - Tạo team\n" +
                                    "2. .coin team join [ID] - Tham gia team\n" +
                                    "3. .coin team list - Xem danh sách team\n",
                                    threadID, messageID
                                );
                            }

                            const teamStats = db.prepare(`
                            SELECT 
                                COUNT(tm.user_id) as member_count,
                                SUM(md.mining_power) as total_power
                            FROM team_members tm
                            JOIN mining_data md ON tm.user_id = md.user_id
                            WHERE tm.team_id = ?
                        `).get(team.team_id);

                            return api.sendMessage(
                                "🏰 THÔNG TIN TEAM 🏰\n" +
                                "━━━━━━━━━━━━━━━━━━\n" +
                                `📝 Tên: ${team.name}\n` +
                                `🆔 ID: ${team.team_id}\n` +
                                `👑 Chức vụ: ${team.role}\n` +
                                `👥 Thành viên: ${teamStats.member_count}/${team.max_members}\n` +
                                `⚡ Tổng Power: ${(teamStats.total_power || 0).toFixed(2)}x\n` +
                                `📊 Level: ${team.level} (${team.exp}/${team.level * 1000} EXP)\n\n` +
                                "💡 LỆNH:\n" +
                                ".coin team info - Xem chi tiết\n" +
                                (team.role === 'leader' ? ".coin team manage - Quản lý team\n" : "") +
                                ".coin team leave - Rời team",
                                threadID, messageID
                            );
                        }
                        switch (teamAction) {
                            case "create": {
                                const teamName = target.slice(2).join("");
                                if (!teamName) {
                                    return api.sendMessage("❌ Vui lòng nhập tên team!", threadID, messageID);
                                }
                                const result = createTeam(senderID, teamName);
                                return api.sendMessage(result.message, threadID, messageID);
                            }
                            case "join":
                                const teamId = target[2];
                                if (!teamId) {
                                    return api.sendMessage("Vui lòng nhập ID team!", threadID, messageID);
                                }

                                const joinResult = joinTeam(senderID, teamId);
                                return api.sendMessage(joinResult.message, threadID, messageID);
                            case "promote":
                            case "demote": {
                                if (!hasTeamPermission(senderID, teamId, 'leader')) {
                                    return api.sendMessage("❌ Chỉ leader mới có quyền này!", threadID, messageID);
                                }

                                const targetId = target[2];
                                const newRole = action === "promote" ? "mod" : "member";

                                db.prepare(`
                                        UPDATE team_members 
                                        SET role = ? 
                                        WHERE user_id = ? AND team_id = ?
                                    `).run(newRole, targetId, teamId);

                                return api.sendMessage(
                                    `✅ Đã ${action === "promote" ? "thăng chức" : "hạ chức"} thành viên thành ${newRole}`,
                                    threadID, messageID
                                );
                            }
                            case "leave":
                                const leaveResult = leaveTeam(senderID);
                                return api.sendMessage(leaveResult.message, threadID, messageID);
                            case "list": {
                                const page = parseInt(target[2]) || 1;
                                const teamsPerPage = 5;
                                const offset = (page - 1) * teamsPerPage;

                                const totalTeams = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
                                const totalPages = Math.ceil(totalTeams / teamsPerPage);

                                const teams = db.prepare(`
                                    SELECT t.*,
                                           COUNT(tm.user_id) as member_count,
                                           SUM(md.mining_power) as total_power
                                    FROM teams t
                                    LEFT JOIN team_members tm ON t.team_id = tm.team_id
                                    LEFT JOIN mining_data md ON tm.user_id = md.user_id
                                    GROUP BY t.team_id
                                    ORDER BY t.level DESC, total_power DESC
                                    LIMIT ? OFFSET ?
                                `).all(teamsPerPage, offset);

                                let msg = "📊 DANH SÁCH TEAM 📊\n";
                                msg += "━━━━━━━━━━━━━━━━━━\n\n";

                                teams.forEach((team, index) => {
                                    msg += `${index + 1}. ${team.name}\n`;
                                    msg += `🆔 ID: ${team.team_id}\n`;
                                    msg += `👑 Level: ${team.level}\n`;
                                    msg += `👥 Thành viên: ${team.member_count}/${team.max_members}\n`;
                                    msg += `⚡ Tổng Power: ${(team.total_power || 0).toFixed(2)}x\n\n`;
                                });

                                msg += `Trang ${page}/${totalPages}\n`;
                                msg += "• Xem trang khác: .coin team list [số trang]\n";
                                msg += "• Tham gia: .coin team join [ID]";

                                return api.sendMessage(msg, threadID, messageID);
                            }
                            case "disband":
                                const teamToDisband = target[2];
                                if (!teamToDisband) {
                                    return api.sendMessage("Vui lòng nhập ID team cần giải tán!", threadID, messageID);
                                }

                                const disbandResult = disbandTeam(senderID, teamToDisband);
                                return api.sendMessage(disbandResult.message, threadID, messageID);
                            default:
                                return api.sendMessage("❌ Lệnh team không hợp lệ!", threadID, messageID);
                        }
                    } catch (err) {
                        console.error('[TEAM] Error:', err);
                        return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
                    }
                }
                    break;
                case "npc": {

                    const npcAction = target[1]?.toLowerCase();

                    if (!npcAction) {
                        const npcStats = db.prepare(`
            SELECT 
                COUNT(*) as total_npcs,
                SUM(mining_power) as total_power,
                SUM(wallet_mainnet) as total_coins,
                SUM(stats_mining_count) as total_mines
            FROM mining_data 
            WHERE user_id LIKE '${NPC_PREFIX}_%'
        `).get();

                        const topNPCs = db.prepare(`
            SELECT user_id, wallet_mainnet, mining_power, stats_mining_count
            FROM mining_data 
            WHERE user_id LIKE '${NPC_PREFIX}_%'
            ORDER BY wallet_mainnet DESC
            LIMIT 5
        `).all();

                        let msg = "🤖 THỐNG KÊ NPC 🤖\n";
                        msg += "━━━━━━━━━━━━━━━━━━\n\n";
                        msg += `📊 Tổng số NPC: ${npcStats.total_npcs}\n`;
                        msg += `⚡ Tổng Mining Power: ${(npcStats.total_power || 0).toFixed(2)}x\n`;
                        msg += `💰 Tổng Coins: ${(npcStats.total_coins || 0).toFixed(2)} MC\n`;
                        msg += `⛏️ Tổng lần đào: ${npcStats.total_mines || 0}\n\n`;

                        msg += "🏆 TOP 5 NPC GIÀU NHẤT:\n";
                        topNPCs.forEach((npc, index) => {
                            msg += `${index + 1}. ${npc.user_id}\n`;
                            msg += `💎 Coins: ${npc.wallet_mainnet.toFixed(2)} MC\n`;
                            msg += `⚡ Power: ${npc.mining_power.toFixed(2)}x\n`;
                            msg += `📊 Đã đào: ${npc.stats_mining_count} lần\n\n`;
                        });

                        msg += "💡 LỆNH:\n";
                        msg += ".coin npc info [ID] - Xem chi tiết NPC\n";
                        msg += ".coin npc list [trang] - Xem danh sách NPC\n";
                        msg += ".coin npc stats - Xem thống kê chi tiết";

                        return api.sendMessage(msg, threadID, messageID);
                    }

                    switch (npcAction) {
                        case "info": {
                            const npcId = target[2];
                            if (!npcId || !npcId.startsWith(NPC_PREFIX)) {
                                return api.sendMessage("❌ Vui lòng nhập ID NPC hợp lệ!", threadID, messageID);
                            }

                            const npc = db.prepare(`
                SELECT *
                FROM mining_data 
                WHERE user_id = ?
            `).get(npcId);

                            if (!npc) {
                                return api.sendMessage("❌ NPC không tồn tại!", threadID, messageID);
                            }

                            return api.sendMessage(
                                "🤖 THÔNG TIN NPC 🤖\n" +
                                "━━━━━━━━━━━━━━━━━━\n\n" +
                                `🆔 ID: ${npc.user_id}\n` +
                                `⚡ Mining Power: ${npc.mining_power.toFixed(2)}x\n` +
                                `💰 Coins: ${npc.wallet_mainnet.toFixed(2)} MC\n` +
                                `📊 Số lần đào: ${npc.stats_mining_count}\n` +
                                `💎 Tổng đã đào: ${npc.stats_total_mined.toFixed(2)} MC\n` +
                                `⏰ Lần cuối đào: ${new Date(npc.last_mined).toLocaleString()}\n`,
                                threadID, messageID
                            );
                        }

                        case "list": {
                            const page = parseInt(target[2]) || 1;
                            const npcsPerPage = 10;
                            const offset = (page - 1) * npcsPerPage;

                            const totalNPCs = db.prepare(
                                `SELECT COUNT(*) as count FROM mining_data WHERE user_id LIKE '${NPC_PREFIX}_%'`
                            ).get().count;

                            const totalPages = Math.ceil(totalNPCs / npcsPerPage);

                            const npcs = db.prepare(`
                SELECT user_id, mining_power, wallet_mainnet, stats_mining_count
                FROM mining_data 
                WHERE user_id LIKE '${NPC_PREFIX}_%'
                ORDER BY wallet_mainnet DESC
                LIMIT ? OFFSET ?
            `).all(npcsPerPage, offset);

                            let msg = "📋 DANH SÁCH NPC 📋\n";
                            msg += "━━━━━━━━━━━━━━━━━━\n\n";

                            npcs.forEach((npc, index) => {
                                msg += `${index + 1}. ${npc.user_id}\n`;
                                msg += `⚡ Power: ${npc.mining_power.toFixed(2)}x\n`;
                                msg += `💰 Coins: ${npc.wallet_mainnet.toFixed(2)} MC\n`;
                                msg += `📊 Đã đào: ${npc.stats_mining_count} lần\n\n`;
                            });

                            msg += `Trang ${page}/${totalPages}\n`;
                            msg += "• Xem trang khác: .coin npc list [số trang]";

                            return api.sendMessage(msg, threadID, messageID);
                        }

                        case "stats": {

                            const hourlyStats = db.prepare(`
                SELECT 
                    SUM(stats_total_mined) as mined_coins,
                    COUNT(DISTINCT CASE WHEN last_mined > ? THEN user_id END) as active_npcs
                FROM mining_data 
                WHERE user_id LIKE '${NPC_PREFIX}_%'
            `).get(Date.now() - 3600000);

                            const powerDistribution = db.prepare(`
                SELECT 
                    CASE 
                        WHEN mining_power <= 1 THEN 'Yếu (<= 1x)'
                        WHEN mining_power <= 2 THEN 'Trung bình (1-2x)'
                        ELSE 'Mạnh (> 2x)'
                    END as power_level,
                    COUNT(*) as count
                FROM mining_data 
                WHERE user_id LIKE '${NPC_PREFIX}_%'
                GROUP BY power_level
            `).all();

                            return api.sendMessage(
                                "📊 THỐNG KÊ NPC CHI TIẾT 📊\n" +
                                "━━━━━━━━━━━━━━━━━━\n\n" +
                                `🕐 NPC hoạt động trong 1h qua: ${hourlyStats.active_npcs}\n` +
                                `💎 Coins đào được trong 1h: ${hourlyStats.mined_coins?.toFixed(2) || 0} MC\n\n` +
                                "⚡ PHÂN BỐ SỨC MẠNH:\n" +
                                powerDistribution.map(p => `• ${p.power_level}: ${p.count} NPC`).join('\n'),
                                threadID, messageID
                            );
                        }

                        default:
                            return api.sendMessage("❌ Lệnh NPC không hợp lệ!", threadID, messageID);
                    }
                }
                case "wallet":
                case "ví": {
                    const walletAction = target[1]?.toLowerCase();

                    if (!walletAction) {
                        const userWallet = db.prepare(`
                                SELECT wallet_mainnet, wallet_code
                                FROM mining_data 
                                WHERE user_id = ?
                            `).get(senderID);

                        if (!userWallet) {
                            return api.sendMessage("❌ Không tìm thấy thông tin ví!", threadID, messageID);
                        }

                        return api.sendMessage(
                            "💎 COIN WALLET 💎\n" +
                            "━━━━━━━━━━━━━━━━━━\n" +
                            `💰 Mainnet Coins: ${formatNumber(userWallet.wallet_mainnet || 0, 2)}\n` +
                            `🔑 Mã ví: ${userWallet.wallet_code}\n\n` +
                            "📱 GIAO DỊCH P2P:\n" +
                            ".coin wallet send [mã ví] [số lượng] - Chuyển coin\n" +
                            ".coin wallet check [mã ví] - Kiểm tra thông tin ví\n\n" +
                            "💡 LƯU Ý: Phí giao dịch P2P: 0.5%",
                            threadID, messageID
                        );
                    }

                    switch (walletAction) {
                        case "send":
                        case "chuyển": {
                            const toWalletCode = target[2]?.toUpperCase();
                            const transferAmount = parseFloat(target[3]);

                            if (!toWalletCode || !transferAmount || isNaN(transferAmount) || transferAmount <= 0) {
                                return api.sendMessage(
                                    "❌ Vui lòng nhập đúng cú pháp:\n.coin wallet send [mã ví] [số lượng]",
                                    threadID, messageID
                                );
                            }

                            const transferResult = transferCoins(senderID, toWalletCode, transferAmount);
                            return api.sendMessage(transferResult.message, threadID, messageID);
                        }

                        case "check":
                        case "kiểm_tra": {
                            const checkWalletCode = target[2]?.toUpperCase();

                            if (!checkWalletCode) {
                                return api.sendMessage("❌ Vui lòng nhập mã ví cần kiểm tra!", threadID, messageID);
                            }

                            const walletOwner = getUserByWalletCode(checkWalletCode);
                            if (!walletOwner) {
                                return api.sendMessage("❌ Mã ví không tồn tại!", threadID, messageID);
                            }

                            return api.sendMessage(
                                "🔍 THÔNG TIN VÍ 🔍\n" +
                                "━━━━━━━━━━━━━━━━━━\n" +
                                `🔑 Mã ví: ${checkWalletCode}\n` +
                                `👤 Level: ${walletOwner.level}\n` +
                                `⚡ Mining Power: ${walletOwner.mining_power.toFixed(2)}x\n` +
                                `📅 Ngày tạo: ${new Date(walletOwner.created_at).toLocaleDateString()}\n`,
                                threadID, messageID
                            );
                        }

                        default:
                            return api.sendMessage("❌ Lệnh không hợp lệ! Dùng `.coin wallet` để xem hướng dẫn.", threadID, messageID);
                    }
                    break;
                }
                case "info": {
                    const userInfo = getUserInfo(senderID);
                    if (!userInfo) {
                        return api.sendMessage("❌ Không tìm thấy thông tin người dùng!", threadID, messageID);
                    }

                    // Tạo message trong scope của case
                    let infoMessage = "📊 THÔNG TIN CÁ NHÂN 📊\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `👤 Cấp độ: ${userInfo.level} (${userInfo.experience}/${userInfo.nextLevel} XP)\n` +
                        `⚡ Sức mạnh đào: ${userInfo.miningPower.toFixed(2)}x\n` +
                        `💎 Mainnet Coins: ${userInfo.mainnet.toFixed(2)}\n` +
                        `🔑 Mã ví: ${userInfo.walletCode}\n\n`;

                    if (userInfo.team) {
                        infoMessage += "🏰 THÔNG TIN TEAM\n" +
                            `Tên team: ${userInfo.team.name}\n` +
                            `Chức vụ: ${userInfo.team.isLeader ? "Đội Trưởng 👑" : "Thành Viên 👥"}\n` +
                            `Thưởng team: +${userInfo.team.bonus.toFixed(0)}%\n\n`;
                    }

                    infoMessage += "🛠️ MINING EQUIPMENT\n";
                    userInfo.miners.forEach(miner => {
                        infoMessage += `• ${miner.name} (+${miner.power}x)\n`;
                    });

                    if (userInfo.achievements.length > 0) {
                        infoMessage += "\n🏆 ACHIEVEMENTS\n";
                        userInfo.achievements.forEach(achievement => {
                            infoMessage += `• ${achievement.name}\n`;
                        });
                    }

                    infoMessage += "\n📈 STATS\n" +
                        `Total Mined: ${userInfo.stats.totalMined.toFixed(2)}\n` +
                        `Mining Sessions: ${userInfo.stats.miningCount}\n` +
                        `Days Active: ${userInfo.stats.daysActive}`;

                    return api.sendMessage(infoMessage, threadID, messageID);
                    break;
                }
                case "shop": {
                    const userMiners = db.prepare(`
                            SELECT miner_id 
                            FROM user_miners 
                            WHERE user_id = ?
                        `).all(senderID).map(m => m.miner_id);

                    const userWallet = db.prepare(`
                            SELECT wallet_mainnet 
                            FROM mining_data 
                            WHERE user_id = ?
                        `).get(senderID);

                    if (!userWallet) {
                        return api.sendMessage("❌ Không tìm thấy thông tin ví!", threadID, messageID);
                    }

                    let shopMessage = "🛒 CỬA HÀNG THIẾT BỊ ĐÀO 🛒\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n";

                    Object.entries(MINERS).forEach(([id, miner]) => {
                        const owned = userMiners.includes(id);
                        shopMessage += `${owned ? "✅" : "🔹"} ${miner.name}\n`;
                        shopMessage += `⚡ Power: +${miner.power}x\n`;
                        shopMessage += `💰 Price: ${miner.price.toLocaleString()} coins\n`;
                        shopMessage += `${owned ? "Đã sở hữu" : `.coin shop buy ${id} - Mua ngay`}\n\n`;
                    });

                    shopMessage += `💎 Mainnet Coins hiện có: ${(userWallet.wallet_mainnet || 0).toFixed(2)}`;

                    if (target[1]?.toLowerCase() === "buy") {
                        const minerId = target[2]?.toLowerCase();
                        if (!minerId) {
                            return api.sendMessage("❌ Vui lòng chọn thiết bị cần mua!", threadID, messageID);
                        }

                        const buyResult = buyMiner(senderID, minerId);
                        return api.sendMessage(buyResult.message, threadID, messageID);
                    }

                    return api.sendMessage(shopMessage, threadID, messageID);
                    break;
                }
                case "sell":
                    const sellAmount = parseFloat(target[1]);
                    if (!sellAmount || isNaN(sellAmount) || sellAmount <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập số lượng hợp lệ!\nVD: .coin sell 10", threadID, messageID);
                    }

                    const sellResult = withdrawMainnet(senderID, sellAmount);
                    return api.sendMessage(
                        sellResult.success ?
                            `💰 BÁN COIN THÀNH CÔNG 💰\n` + sellResult.message :
                            sellResult.message,
                        threadID, messageID
                    );
                    break;
                case "buy":
                    const buyAmount = parseFloat(target[1]);
                    if (!buyAmount || isNaN(buyAmount) || buyAmount <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập số lượng hợp lệ!\nVD: .coin buy 10", threadID, messageID);
                    }

                    const buyResult = buyMainnet(senderID, buyAmount);
                    return api.sendMessage(
                        buyResult.success ?
                            `💎 MUA COIN THÀNH CÔNG 💎\n` + buyResult.message :
                            buyResult.message,
                        threadID, messageID
                    );
                    break;
                case "market":
                case "chợ": {
                    const userWallet = db.prepare('SELECT wallet_mainnet FROM mining_data WHERE user_id = ?').get(senderID);
                    const userItems = db.prepare('SELECT item_id, quantity FROM user_items WHERE user_id = ?').all(senderID);
                    const userItemsMap = Object.fromEntries(userItems.map(item => [item.item_id, item.quantity]));

                    if (!target[1]) {
                        let msg = "🏪 CHỢ MAINNET 🏪\n━━━━━━━━━━\n";
                        msg += `💰 Số dư: ${(userWallet?.wallet_mainnet || 0).toFixed(2)} MC\n\n`;

                        msg += "1️⃣ .coin market buy - Xem vật phẩm bán\n";
                        msg += "2️⃣ .coin market sell - Xem vật phẩm có thể bán\n";
                        msg += "3️⃣ .coin market inventory - Xem túi đồ\n";

                        return api.sendMessage(msg, threadID, messageID);
                    }

                    switch (target[1]) {
                        case "buy": {
                            let msg = "🛒 MUA VẬT PHẨM\n━━━━━━━━━━\n\n";
                            Object.entries(MAINNET_ITEMS).forEach(([id, item]) => {
                                msg += `${item.name}\n`;
                                msg += `💰 Giá: ${item.price} MC\n`;
                                msg += `📝 ${item.description}\n`;
                                msg += `➡️ .coin market buy ${id}\n\n`;
                            });
                            return api.sendMessage(msg, threadID, messageID);
                        }

                        case "sell": {
                            let msg = "💎 BÁN VẬT PHẨM\n━━━━━━━━━━\n\n";
                            Object.entries(SELLABLE_ITEMS).forEach(([id, item]) => {
                                const owned = userItemsMap[id] || 0;
                                if (owned > 0) {
                                    msg += `${item.name} (${owned})\n`;
                                    msg += `💰 Giá: ${item.basePrice} MC/cái\n`;
                                    msg += `➡️ .coin market sell ${id} <số lượng>\n\n`;
                                }
                            });
                            return api.sendMessage(msg, threadID, messageID);
                        }
                    }

                    switch (marketAction) {
                        case "buy": {
                            const buyItemId = target[2];
                            if (!buyItemId) {
                                return api.sendMessage("❌ Vui lòng chọn vật phẩm cần mua!", threadID, messageID);
                            }

                            const item = MAINNET_ITEMS[buyItemId];
                            if (!item) {
                                return api.sendMessage("❌ Vật phẩm không tồn tại!", threadID, messageID);
                            }

                            if (!userWallet || userWallet.wallet_mainnet < item.price) {
                                return api.sendMessage(
                                    `❌ Không đủ mainnet coin! Bạn cần ${item.price} coin, ` +
                                    `hiện có ${(userWallet?.wallet_mainnet || 0).toFixed(2)}`,
                                    threadID, messageID
                                );
                            }

                            const transaction = db.transaction(() => {
                                // Trừ tiền
                                db.prepare(`
                                            UPDATE mining_data 
                                            SET wallet_mainnet = wallet_mainnet - ? 
                                            WHERE user_id = ?
                                        `).run(item.price, senderID);

                                // Thêm vật phẩm vào inventory
                                const expiryTime = item.duration > 0 ? Date.now() + item.duration : 0;
                                db.prepare(`
                                            INSERT INTO user_inventory (
                                                user_id, item_id, name, effect, value, 
                                                expires, purchased_at
                                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                                        `).run(
                                    senderID, buyItemId, item.name, item.effect,
                                    item.value, expiryTime, Date.now()
                                );
                            });

                            transaction();

                            return api.sendMessage(
                                `✅ Mua thành công ${item.name}!\n` +
                                `💰 -${item.price} mainnet coin\n` +
                                `${item.description}`,
                                threadID, messageID
                            );
                        }

                        case "sell": {
                            const sellItemId = target[2];
                            const sellQuantity = parseInt(target[3]) || 1;

                            if (!sellItemId) {
                                return api.sendMessage("❌ Vui lòng chọn vật phẩm cần bán!", threadID, messageID);
                            }

                            const item = SELLABLE_ITEMS[sellItemId];
                            if (!item) {
                                return api.sendMessage("❌ Vật phẩm không tồn tại!", threadID, messageID);
                            }

                            const ownedQuantity = userItemsMap[sellItemId] || 0;
                            if (ownedQuantity < sellQuantity) {
                                return api.sendMessage(
                                    `❌ Bạn không có đủ ${item.name} để bán!\n` +
                                    `Hiện có: ${ownedQuantity}, cần bán: ${sellQuantity}`,
                                    threadID, messageID
                                );
                            }

                            const totalPrice = item.basePrice * sellQuantity;

                            const transaction = db.transaction(() => {
                                // Trừ vật phẩm
                                if (ownedQuantity - sellQuantity <= 0) {
                                    db.prepare(
                                        'DELETE FROM user_items WHERE user_id = ? AND item_id = ?'
                                    ).run(senderID, sellItemId);
                                } else {
                                    db.prepare(
                                        'UPDATE user_items SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?'
                                    ).run(sellQuantity, senderID, sellItemId);
                                }

                                // Cộng tiền
                                db.prepare(
                                    'UPDATE mining_data SET wallet_mainnet = wallet_mainnet + ? WHERE user_id = ?'
                                ).run(totalPrice, senderID);
                            });

                            transaction();

                            return api.sendMessage(
                                `✅ Đã bán ${sellQuantity} ${item.name} với giá ${totalPrice.toFixed(2)} mainnet coin!`,
                                threadID, messageID
                            );
                        }

                        default:
                            return api.sendMessage(
                                "❌ Lệnh không hợp lệ! Dùng `.coin market` để xem danh sách vật phẩm.",
                                threadID, messageID
                            );
                    }
                }
                default:
                    updateMarketPrice();

                    const marketInfo = db.prepare('SELECT * FROM market_data WHERE id = 1').get();
                    const currentPrice = marketInfo && marketInfo.is_listed
                        ? `${formatNumber(marketInfo.price || 0)}$`
                        : "Chưa listed";

                    return api.sendMessage(
                        "⛏️ HỆ THỐNG ĐÀO COIN ⛏️\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "💰 LỆNH CƠ BẢN:\n" +
                        "• .coin mine - Đào coin\n" +
                        "• .coin info - Thông tin cá nhân\n" +

                        "🏪 GIAO DỊCH:\n" +
                        "• .coin buy [số lượng] - Mua coin\n" +
                        "• .coin sell [số lượng] - Bán coin\n" +
                        "• .coin market - Xem thị trường\n" +
                        `• Tỷ giá hiện tại: 1 MC = ${currentPrice}$\n\n` +

                        "💼 VÍ ĐIỆN TỬ:\n" +
                        "• .coin wallet - Xem thông tin ví\n" +
                        "• .coin wallet send [mã ví] [số lượng] - Chuyển coin\n" +
                        "• .coin wallet check [mã ví] - Kiểm tra ví\n\n" +

                        "👥 ĐỘI NHÓM:\n" +
                        "• .coin team - Quản lý đội nhóm\n" +
                        "• .coin team create [tên] - Tạo đội\n" +
                        "• .coin team join [ID] - Tham gia đội\n\n" +

                        "🛒 MUA SẮM:\n" +
                        "• .coin shop - Cửa hàng thiết bị đào\n" +
                        "• .coin chợ - Mua bán vật phẩm\n" +

                        "💡 MẸO:\n" +
                        "• Tham gia team để nhận +5% sức mạnh mỗi thành viên\n" +
                        "• Mua thiết bị để tăng tốc độ đào coin\n" +
                        "• Bán coin khi giá cao, mua vào khi giá thấp\n" +
                        "• Đào đều đặn để nâng cấp level",
                        threadID, messageID
                    );
            }
        } catch (err) {
            console.error('Mining error:', err);
            return api.sendMessage("❌ Có lỗi xảy ra!", threadID, messageID);
        }
    }
};
