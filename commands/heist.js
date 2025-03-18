const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const GameManager = require('../utils/GameManager');
const ERROR_MESSAGES = require('../config/errorMessages');
const gameManager = new GameManager();

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Thêm hàm lấy tên người dùng
function getUserName(userId) {
    try {
        const userDataPath = path.join(__dirname, '../events/cache/userData.json');
        if (fs.existsSync(userDataPath)) {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            if (userData && userData[userId] && userData[userId].name) {
                return userData[userId].name;
            }
        }
        return `Người dùng ${userId}`;
    } catch (err) {
        console.error('Lỗi đọc userData:', err);
        return `Người dùng ${userId}`;
    }
}

const HEIST_CONFIG = {
    minPlayers: 2,
    maxPlayers: 10,
    joinDuration: 60000, // 60 seconds to join
    prepDuration: 30000, // 30 seconds to prepare
    heistDuration: 120000, // 2 minutes for heist
    cooldown: 300000, // 5 minutes between heists
    roles: {
        robber: {
            name: "💰 Cướp",
            weapons: {
                pistol: { name: "🔫 Súng lục", damage: 25, accuracy: 0.7, price: 5000 },
                shotgun: { name: "🔫 Súng ngắn", damage: 40, accuracy: 0.5, price: 10000 },
                rifle: { name: "🔫 Súng trường", damage: 60, accuracy: 0.8, price: 20000 }
            },
            equipment: {
                armor: { name: "🛡️ Giáp", defense: 30, price: 8000 },
                mask: { name: "🎭 Mặt nạ", stealth: 20, price: 3000 },
                medkit: { name: "💊 Bộ cứu thương", healing: 50, price: 5000 }
            }
        },
        police: {
            name: "👮 Cảnh sát",
            weapons: {
                taser: { name: "⚡ Súng điện", damage: 20, accuracy: 0.9, price: 4000 },
                pistol: { name: "🔫 Súng lục", damage: 25, accuracy: 0.7, price: 5000 },
                rifle: { name: "🔫 Súng trường", damage: 60, accuracy: 0.8, price: 20000 }
            },
            equipment: {
                armor: { name: "🛡️ Giáp", defense: 30, price: 8000 },
                shield: { name: "🛡️ Khiên", defense: 40, price: 12000 },
                handcuffs: { name: "⛓️ Còng", capture: true, price: 3000 }
            }
        }
    },
    banks: {
        local: {
            name: "🏦 Ngân hàng địa phương",
            minPlayers: 2,
            maxMoney: 100000,
            difficulty: 1,
            police: 2
        },
        state: {
            name: "🏦 Ngân hàng Quốc gia",
            minPlayers: 4,
            maxMoney: 500000,
            difficulty: 2,
            police: 3
        },
        federal: {
            name: "🏦 Ngân hàng Trung ương",
            minPlayers: 6,
            maxMoney: 2000000,
            difficulty: 3,
            police: 4
        }
    }
};

const HEIST_DATA_FILE = path.join(__dirname, './json/heist_data.json');

function loadHeistData() {
    try {
        if (!fs.existsSync(path.dirname(HEIST_DATA_FILE))) {
            fs.mkdirSync(path.dirname(HEIST_DATA_FILE), { recursive: true });
        }
        
        if (!fs.existsSync(HEIST_DATA_FILE)) {
            const defaultData = {
                players: {},
                activeHeists: {},
                cooldowns: {},
                stats: {}
            };
            fs.writeFileSync(HEIST_DATA_FILE, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(HEIST_DATA_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc dữ liệu heist:', err);
        return {
            players: {},
            activeHeists: {},
            cooldowns: {},
            stats: {}
        };
    }
}

function saveHeistData(data) {
    try {
        if (!fs.existsSync(path.dirname(HEIST_DATA_FILE))) {
            fs.mkdirSync(path.dirname(HEIST_DATA_FILE), { recursive: true });
        }
        fs.writeFileSync(HEIST_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Lỗi lưu dữ liệu heist:', err);
    }
}

function initializePlayer(userId) {
    return {
        equipment: {},
        weapons: {},
        stats: {
            heistsJoined: 0,
            heistsWon: 0,
            moneyStolen: 0,
            arrests: 0
        },
        inventory: {
            weapons: {},
            equipment: {}
        }
    };
}

class HeistManager {
    constructor() {
        this.activeHeists = new Map();
        this.data = loadHeistData();
        if (!this.data.players) this.data.players = {};
    }

    canStartHeist(threadId) {
        return !this.activeHeists.has(threadId);
    }

    async startHeist(api, event, bankType) {
        try {
            const { threadID, senderID } = event;
            const bank = HEIST_CONFIG.banks[bankType];

            if (!this.canStartHeist(threadID)) {
                return api.sendMessage("❌ Đã có vụ cướp đang diễn ra!", threadID);
            }

            // Khởi tạo dữ liệu người chơi nếu chưa có
            if (!this.data.players[senderID]) {
                this.data.players[senderID] = initializePlayer(senderID);
                saveHeistData(this.data);
            }

            const heist = {
                id: Date.now(),
                bank: bankType,
                status: 'joining',
                startTime: Date.now(),
                joinDeadline: Date.now() + HEIST_CONFIG.joinDuration,
                players: new Map(),
                roles: new Map(),
                leader: senderID
            };

            this.activeHeists.set(threadID, heist);

            // Thêm người tạo vào danh sách
            const joinResult = this.joinHeist(threadID, senderID, 'robber');
            if (!joinResult) {
                this.activeHeists.delete(threadID);
                return api.sendMessage("❌ Có lỗi khi tạo vụ cướp!", threadID);
            }

            const message = 
                "🚔 VỤ CƯỚP MỚI 🚔\n" +
                "━━━━━━━━━━━━━━━━━━\n" +
                `🏦 Mục tiêu: ${bank.name}\n` +
                `👥 Yêu cầu: ${bank.minPlayers} người\n` +
                `💰 Tiền thưởng: ${formatNumber(bank.maxMoney)}$\n` +
                `👮 Cảnh sát: ${bank.police} người\n\n` +
                "📝 Hướng dẫn tham gia:\n" +
                "• .heist join robber (Cướp)\n" +
                "• .heist join police (Cảnh sát)\n\n" +
                `⏳ Thời gian tham gia: ${HEIST_CONFIG.joinDuration/1000}s\n\n` +
                `👤 Người tạo: ${getUserName(senderID)}`;

            api.sendMessage(message, threadID);

            setTimeout(() => this.startPrepPhase(api, threadID), HEIST_CONFIG.joinDuration);
        } catch (err) {
            console.error('Lỗi khi tạo heist:', err);
            return api.sendMessage("❌ Đã xảy ra lỗi khi tạo vụ cướp!", threadID);
        }
    }

    joinHeist(threadId, userId, role) {
        try {
            const heist = this.activeHeists.get(threadId);
            if (!heist || heist.status !== 'joining') return false;

            // Khởi tạo dữ liệu người chơi nếu chưa có
            if (!this.data.players[userId]) {
                this.data.players[userId] = initializePlayer(userId);
            }

            // Lưu role hiện tại của người chơi
            this.data.players[userId].currentRole = role;
            saveHeistData(this.data);

            heist.players.set(userId, {
                role: role,
                health: 100,
                equipment: {},
                ready: false
            });

            heist.roles.set(role, (heist.roles.get(role) || 0) + 1);
            return true;
        } catch (err) {
            console.error('Lỗi khi tham gia heist:', err);
            return false;
        }
    }

    async startPrepPhase(api, threadId) {
        const heist = this.activeHeists.get(threadId);
        if (!heist) return;

        const bank = HEIST_CONFIG.banks[heist.bank];
        const totalPlayers = heist.players.size;

        if (totalPlayers < bank.minPlayers) {
            api.sendMessage(
                "❌ Không đủ người tham gia, vụ cướp bị hủy!\n" +
                `👥 Cần ít nhất ${bank.minPlayers} người chơi.`,
                threadId
            );
            this.activeHeists.delete(threadId);
            return;
        }

        heist.status = 'preparing';
        heist.prepEndTime = Date.now() + HEIST_CONFIG.prepDuration;

        const robbers = Array.from(heist.players.entries())
            .filter(([_, data]) => data.role === 'robber')
            .map(([id]) => `• ${getUserName(id)}`);
        
        const police = Array.from(heist.players.entries())
            .filter(([_, data]) => data.role === 'police')
            .map(([id]) => `• ${getUserName(id)}`);

        const message = 
            "🎮 CHUẨN BỊ VỤ CƯỚP 🎮\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            `🏦 Ngân hàng: ${bank.name}\n` +
            `💰 Tiền trong kho: ${formatNumber(bank.maxMoney)}$\n\n` +
            `👥 Những tên cướp (${robbers.length}):\n${robbers.join('\n')}\n\n` +
            `👮 Lực lượng cảnh sát (${police.length}):\n${police.join('\n')}\n\n` +
            "📝 Lệnh chuẩn bị:\n" +
            "• .heist buy weapon [tên] - Chọn vũ khí\n" +
            "• .heist buy equip [tên] - Chọn trang bị\n\n" +
            "⚠️ Lưu ý:\n" +
            "• Không có vũ khí: -50% sát thương\n" +
            "• Không có trang bị: -30% phòng thủ\n\n" +
            `⏳ Thời gian chuẩn bị: ${HEIST_CONFIG.prepDuration/1000}s`;

        api.sendMessage(message, threadId);

        setTimeout(() => this.startHeistPhase(api, threadId), HEIST_CONFIG.prepDuration);
    }

    async startHeistPhase(api, threadId) {
        const heist = this.activeHeists.get(threadId);
        if (!heist) return;

        heist.status = 'inProgress';
        heist.heistEndTime = Date.now() + HEIST_CONFIG.heistDuration;

        const bank = HEIST_CONFIG.banks[heist.bank];

        // Thông báo về trang bị của từng người chơi
        let equipmentStatus = "\n📋 TRANG BỊ NGƯỜI CHƠI:\n";
        heist.players.forEach((player, id) => {
            const name = getUserName(id);
            const hasWeapon = player.weapon ? `✅ ${player.weapon.name}` : "❌ Không có vũ khí";
            const hasEquip = player.equipment && Object.keys(player.equipment).length > 0 ? 
                `✅ ${Object.values(player.equipment).map(e => e.name).join(", ")}` : 
                "❌ Không có trang bị";
            
            // Tính toán bất lợi
            let disadvantages = [];
            if (!player.weapon) disadvantages.push("⚠️ -50% sát thương");
            if (!player.equipment || Object.keys(player.equipment).length === 0) disadvantages.push("⚠️ -30% phòng thủ");
            
            equipmentStatus += `\n${player.role === 'robber' ? '💰' : '👮'} ${name}:\n`;
            equipmentStatus += `• ${hasWeapon}\n`;
            equipmentStatus += `• ${hasEquip}\n`;
            if (disadvantages.length > 0) {
                equipmentStatus += `• ${disadvantages.join(", ")}\n`;
            }
        });

        const message = 
            "🚨 VỤ CƯỚP BẮT ĐẦU 🚨\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            `🏦 Mục tiêu: ${bank.name}\n` +
            `💰 Tiền trong kho: ${formatNumber(bank.maxMoney)}$\n` +
            equipmentStatus + "\n" +
            "📝 Lệnh trong game:\n" +
            "• .heist attack [@tag] - Tấn công\n" +
            "• .heist heal - Hồi máu\n" +
            "• .heist status - Xem trạng thái\n\n" +
            `⏳ Thời gian: ${HEIST_CONFIG.heistDuration/1000}s`;

        api.sendMessage(message, threadId);

        // Hẹn giờ kết thúc vụ cướp
        setTimeout(() => this.endHeist(api, threadId), HEIST_CONFIG.heistDuration);
    }

    async endHeist(api, threadId) {
        const heist = this.activeHeists.get(threadId);
        if (!heist) return;

        const bank = HEIST_CONFIG.banks[heist.bank];
        const robbers = Array.from(heist.players.entries())
            .filter(([_, data]) => data.role === 'robber' && data.health > 0);
        
        const police = Array.from(heist.players.entries())
            .filter(([_, data]) => data.role === 'police' && data.health > 0);

        let message = "🏁 KẾT THÚC VỤ CƯỚP 🏁\n━━━━━━━━━━━━━━━━━━\n\n";

        if (robbers.length > 0) {
            const moneyPerRobber = Math.floor(bank.maxMoney / robbers.length);
            message += "💰 CƯỚP THÀNH CÔNG 💰\n\n";
            
            robbers.forEach(([id, _]) => {
                updateBalance(id, moneyPerRobber);
                this.data.players[id].stats.heistsWon++;
                this.data.players[id].stats.moneyStolen += moneyPerRobber;
            });

            message += `👥 Những tên cướp (${robbers.length}):\n`;
            message += robbers.map(([id, _]) => 
                `• ${getUserName(id)}: +${formatNumber(moneyPerRobber)}$`
            ).join('\n');
        } else {
            const reward = Math.floor(bank.maxMoney * 0.1);
            message += "👮 CẢNH SÁT CHIẾN THẮNG 👮\n\n";
            
            police.forEach(([id, _]) => {
                updateBalance(id, reward);
                this.data.players[id].stats.arrests++;
            });

            message += `👥 Cảnh sát (${police.length}):\n`;
            message += police.map(([id, _]) => 
                `• ${getUserName(id)}: +${formatNumber(reward)}$`
            ).join('\n');
        }

        heist.players.forEach((data, id) => {
            this.data.players[id].stats.heistsJoined++;
        });

        saveHeistData(this.data);
        this.activeHeists.delete(threadId);

        api.sendMessage(message, threadId);
    }

    getPlayerStats(userId) {
        const player = this.data.players[userId];
        if (!player) return null;

        return {
            heistsJoined: player.stats.heistsJoined,
            heistsWon: player.stats.heistsWon,
            moneyStolen: player.stats.moneyStolen,
            arrests: player.stats.arrests,
            winRate: player.stats.heistsJoined > 0 ? 
                ((player.stats.heistsWon / player.stats.heistsJoined) * 100).toFixed(1) : 0
        };
    }

    buyWeapon(userId, weaponName) {
        try {
            const player = this.data.players[userId];
            if (!player) return { success: false, message: "❌ Không tìm thấy thông tin người chơi!" };

            const balance = getBalance(userId);
            const role = player.currentRole || 'robber';
            const weapons = HEIST_CONFIG.roles[role].weapons;

            if (!weapons[weaponName]) {
                return { success: false, message: "❌ Vũ khí không tồn tại!" };
            }

            const weapon = weapons[weaponName];
            if (balance < weapon.price) {
                return { 
                    success: false, 
                    message: `❌ Không đủ tiền! Cần ${formatNumber(weapon.price)}$` 
                };
            }

            if (!player.inventory.weapons) player.inventory.weapons = {};
            player.inventory.weapons[weaponName] = weapon;
            updateBalance(userId, -weapon.price);
            saveHeistData(this.data);

            return {
                success: true,
                message: `✅ Đã mua ${weapon.name} với giá ${formatNumber(weapon.price)}$`
            };
        } catch (err) {
            console.error('Lỗi mua vũ khí:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi mua vũ khí!" };
        }
    }

    buyEquipment(userId, equipName) {
        try {
            const player = this.data.players[userId];
            if (!player) return { success: false, message: "❌ Không tìm thấy thông tin người chơi!" };

            const balance = getBalance(userId);
            const role = player.currentRole || 'robber';
            const equipments = HEIST_CONFIG.roles[role].equipment;

            if (!equipments[equipName]) {
                return { success: false, message: "❌ Trang bị không tồn tại!" };
            }

            const equipment = equipments[equipName];
            if (balance < equipment.price) {
                return { 
                    success: false, 
                    message: `❌ Không đủ tiền! Cần ${formatNumber(equipment.price)}$` 
                };
            }

            if (!player.inventory.equipment) player.inventory.equipment = {};
            player.inventory.equipment[equipName] = equipment;
            updateBalance(userId, -equipment.price);
            saveHeistData(this.data);

            return {
                success: true,
                message: `✅ Đã mua ${equipment.name} với giá ${formatNumber(equipment.price)}$`
            };
        } catch (err) {
            console.error('Lỗi mua trang bị:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi mua trang bị!" };
        }
    }

    equipWeapon(threadId, userId, weaponName) {
        try {
            const heist = this.activeHeists.get(threadId);
            if (!heist || heist.status !== 'preparing') {
                return { success: false, message: "❌ Không thể trang bị vũ khí lúc này!" };
            }

            const player = heist.players.get(userId);
            if (!player) {
                return { success: false, message: "❌ Bạn không tham gia vụ cướp này!" };
            }

            const inventory = this.data.players[userId].inventory;
            if (!inventory.weapons || !inventory.weapons[weaponName]) {
                return { success: false, message: "❌ Bạn không sở hữu vũ khí này!" };
            }

            player.weapon = inventory.weapons[weaponName];
            return {
                success: true,
                message: `✅ Đã trang bị ${player.weapon.name}!`
            };
        } catch (err) {
            console.error('Lỗi trang bị vũ khí:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi trang bị vũ khí!" };
        }
    }

    equipItem(threadId, userId, equipName) {
        try {
            const heist = this.activeHeists.get(threadId);
            if (!heist || heist.status !== 'preparing') {
                return { success: false, message: "❌ Không thể trang bị vật phẩm lúc này!" };
            }

            const player = heist.players.get(userId);
            if (!player) {
                return { success: false, message: "❌ Bạn không tham gia vụ cướp này!" };
            }

            const inventory = this.data.players[userId].inventory;
            if (!inventory.equipment || !inventory.equipment[equipName]) {
                return { success: false, message: "❌ Bạn không sở hữu trang bị này!" };
            }

            if (!player.equipment) player.equipment = {};
            player.equipment[equipName] = inventory.equipment[equipName];
            return {
                success: true,
                message: `✅ Đã trang bị ${player.equipment[equipName].name}!`
            };
        } catch (err) {
            console.error('Lỗi trang bị vật phẩm:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi trang bị vật phẩm!" };
        }
    }

    showShop(userId) {
        try {
            const player = this.data.players[userId];
            if (!player) return "❌ Không tìm thấy thông tin người chơi!";

            const role = player.currentRole || 'robber';
            const roleConfig = HEIST_CONFIG.roles[role];
            const balance = getBalance(userId);

            let message = "🏪 CỬA HÀNG TRANG BỊ 🏪\n━━━━━━━━━━━━━━━━━━\n\n";
            
            message += "🔫 VŨ KHÍ:\n";
            Object.entries(roleConfig.weapons).forEach(([id, weapon], index) => {
                const owned = player.inventory.weapons && player.inventory.weapons[id] ? "✓ " : "";
                message += `${index + 1}. ${owned}${weapon.name}\n`;
                message += `💰 Giá: ${formatNumber(weapon.price)}$\n`;
                message += `💥 Sát thương: ${weapon.damage}\n`;
                message += `🎯 Độ chính xác: ${weapon.accuracy * 100}%\n\n`;
            });

            message += "🛡️ TRANG BỊ:\n";
            Object.entries(roleConfig.equipment).forEach(([id, equip], index) => {
                const owned = player.inventory.equipment && player.inventory.equipment[id] ? "✓ " : "";
                message += `${index + 1}. ${owned}${equip.name}\n`;
                message += `💰 Giá: ${formatNumber(equip.price)}$\n`;
                if (equip.defense) message += `🛡️ Phòng thủ: ${equip.defense}\n`;
                if (equip.stealth) message += `🕵️ Ẩn nấp: ${equip.stealth}\n`;
                if (equip.healing) message += `💊 Hồi máu: ${equip.healing}\n`;
                message += "\n";
            });

            message += `\n💵 Số dư: ${formatNumber(balance)}$\n`;
            message += "\n📝 Cách mua:\n";
            message += "• .heist buy weapon [số thứ tự]\n";
            message += "• .heist buy equip [số thứ tự]";

            return message;
        } catch (err) {
            console.error('Lỗi hiển thị cửa hàng:', err);
            return "❌ Đã xảy ra lỗi khi hiển thị cửa hàng!";
        }
    }

    buyWeaponByIndex(userId, index) {
        try {
            const player = this.data.players[userId];
            if (!player) return { success: false, message: "❌ Không tìm thấy thông tin người chơi!" };

            const role = player.currentRole || 'robber';
            const weapons = Object.entries(HEIST_CONFIG.roles[role].weapons);

            if (index < 1 || index > weapons.length) {
                return { success: false, message: "❌ Số thứ tự vũ khí không hợp lệ!" };
            }

            const [weaponId, weapon] = weapons[index - 1];
            const balance = getBalance(userId);

            if (balance < weapon.price) {
                return { 
                    success: false, 
                    message: `❌ Không đủ tiền! Cần ${formatNumber(weapon.price)}$` 
                };
            }

            if (!player.inventory.weapons) player.inventory.weapons = {};
            player.inventory.weapons[weaponId] = weapon;
            updateBalance(userId, -weapon.price);
            saveHeistData(this.data);

            return {
                success: true,
                message: `✅ Đã mua ${weapon.name} với giá ${formatNumber(weapon.price)}$`
            };
        } catch (err) {
            console.error('Lỗi mua vũ khí:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi mua vũ khí!" };
        }
    }

    buyEquipmentByIndex(userId, index) {
        try {
            const player = this.data.players[userId];
            if (!player) return { success: false, message: "❌ Không tìm thấy thông tin người chơi!" };

            const role = player.currentRole || 'robber';
            const equipments = Object.entries(HEIST_CONFIG.roles[role].equipment);

            if (index < 1 || index > equipments.length) {
                return { success: false, message: "❌ Số thứ tự trang bị không hợp lệ!" };
            }

            const [equipId, equipment] = equipments[index - 1];
            const balance = getBalance(userId);

            if (balance < equipment.price) {
                return { 
                    success: false, 
                    message: `❌ Không đủ tiền! Cần ${formatNumber(equipment.price)}$` 
                };
            }

            if (!player.inventory.equipment) player.inventory.equipment = {};
            player.inventory.equipment[equipId] = equipment;
            updateBalance(userId, -equipment.price);
            saveHeistData(this.data);

            return {
                success: true,
                message: `✅ Đã mua ${equipment.name} với giá ${formatNumber(equipment.price)}$`
            };
        } catch (err) {
            console.error('Lỗi mua trang bị:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi mua trang bị!" };
        }
    }

    equipWeaponByIndex(threadId, userId, index) {
        try {
            const heist = this.activeHeists.get(threadId);
            if (!heist || heist.status !== 'preparing') {
                return { success: false, message: "❌ Không thể trang bị vũ khí lúc này!" };
            }

            const player = heist.players.get(userId);
            if (!player) {
                return { success: false, message: "❌ Bạn không tham gia vụ cướp này!" };
            }

            // Lấy role từ dữ liệu đã lưu
            const role = this.data.players[userId].currentRole || player.role;
            const weapons = Object.entries(HEIST_CONFIG.roles[role].weapons);

            if (index < 1 || index > weapons.length) {
                return { success: false, message: "❌ Số thứ tự vũ khí không hợp lệ!" };
            }

            const [weaponId, weapon] = weapons[index - 1];
            const inventory = this.data.players[userId].inventory;

            if (!inventory.weapons || !inventory.weapons[weaponId]) {
                return { success: false, message: "❌ Bạn không sở hữu vũ khí này!" };
            }

            player.weapon = inventory.weapons[weaponId];

            // Tự động ready nếu đã có cả vũ khí và trang bị
            if (player.weapon && player.equipment && Object.keys(player.equipment).length > 0) {
                player.ready = true;
                return {
                    success: true,
                    message: `✅ Đã trang bị ${player.weapon.name}!\n👍 Bạn đã sẵn sàng cho vụ cướp!`
                };
            }

            return {
                success: true,
                message: `✅ Đã trang bị ${player.weapon.name}!\n💡 Hãy trang bị thêm vật phẩm để sẵn sàng.`
            };
        } catch (err) {
            console.error('Lỗi trang bị vũ khí:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi trang bị vũ khí!" };
        }
    }

    equipItemByIndex(threadId, userId, index) {
        try {
            const heist = this.activeHeists.get(threadId);
            if (!heist || heist.status !== 'preparing') {
                return { success: false, message: "❌ Không thể trang bị vật phẩm lúc này!" };
            }

            const player = heist.players.get(userId);
            if (!player) {
                return { success: false, message: "❌ Bạn không tham gia vụ cướp này!" };
            }

            // Lấy role từ dữ liệu đã lưu
            const role = this.data.players[userId].currentRole || player.role;
            const equipments = Object.entries(HEIST_CONFIG.roles[role].equipment);

            if (index < 1 || index > equipments.length) {
                return { success: false, message: "❌ Số thứ tự trang bị không hợp lệ!" };
            }

            const [equipId, equipment] = equipments[index - 1];
            const inventory = this.data.players[userId].inventory;

            if (!inventory.equipment || !inventory.equipment[equipId]) {
                return { success: false, message: "❌ Bạn không sở hữu trang bị này!" };
            }

            if (!player.equipment) player.equipment = {};
            player.equipment[equipId] = inventory.equipment[equipId];

            // Tự động ready nếu đã có cả vũ khí và trang bị
            if (player.weapon && player.equipment && Object.keys(player.equipment).length > 0) {
                player.ready = true;
                return {
                    success: true,
                    message: `✅ Đã trang bị ${player.equipment[equipId].name}!\n👍 Bạn đã sẵn sàng cho vụ cướp!`
                };
            }

            return {
                success: true,
                message: `✅ Đã trang bị ${player.equipment[equipId].name}!\n💡 Hãy trang bị thêm vũ khí để sẵn sàng.`
            };
        } catch (err) {
            console.error('Lỗi trang bị vật phẩm:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi trang bị vật phẩm!" };
        }
    }

    attack(threadId, userId, targetId) {
        try {
            const heist = this.activeHeists.get(threadId);
            if (!heist || heist.status !== 'inProgress') {
                return { success: false, message: "❌ Không thể tấn công lúc này!" };
            }

            const attacker = heist.players.get(userId);
            if (!attacker) {
                return { success: false, message: "❌ Bạn không tham gia vụ cướp này!" };
            }

            if (attacker.health <= 0) {
                return { success: false, message: "❌ Bạn đã bị hạ gục!" };
            }

            const target = heist.players.get(targetId);
            if (!target) {
                return { success: false, message: "❌ Không tìm thấy mục tiêu!" };
            }

            if (target.health <= 0) {
                return { success: false, message: "❌ Mục tiêu đã bị hạ gục!" };
            }

            if (attacker.role === target.role) {
                return { success: false, message: "❌ Không thể tấn công đồng đội!" };
            }

            // Tính toán sát thương
            let damage = attacker.weapon ? attacker.weapon.damage : 10; // Sát thương cơ bản nếu không có vũ khí
            let accuracy = attacker.weapon ? attacker.weapon.accuracy : 0.5;

            // Áp dụng bất lợi nếu không có vũ khí
            if (!attacker.weapon) {
                damage *= 0.5; // -50% sát thương
            }

            // Tính toán phòng thủ của mục tiêu
            let defense = 0;
            if (target.equipment) {
                Object.values(target.equipment).forEach(item => {
                    if (item.defense) defense += item.defense;
                });
            }

            // Áp dụng bất lợi nếu không có trang bị
            if (!target.equipment || Object.keys(target.equipment).length === 0) {
                defense *= 0.7; // -30% phòng thủ
            }

            // Kiểm tra độ chính xác
            if (Math.random() > accuracy) {
                return { success: false, message: "💨 Tấn công hụt!" };
            }

            // Tính toán sát thương cuối cùng
            const finalDamage = Math.max(1, Math.floor(damage * (1 - defense/100)));
            target.health = Math.max(0, target.health - finalDamage);

            let message = `🎯 ${getUserName(userId)} tấn công ${getUserName(targetId)}!\n`;
            message += `💥 Sát thương: ${finalDamage}\n`;
            message += `❤️ Máu còn lại: ${target.health}/100`;

            if (target.health <= 0) {
                message += `\n☠️ ${getUserName(targetId)} đã bị hạ gục!`;
            }

            return { success: true, message };
        } catch (err) {
            console.error('Lỗi khi tấn công:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi tấn công!" };
        }
    }

    heal(threadId, userId) {
        try {
            const heist = this.activeHeists.get(threadId);
            if (!heist || heist.status !== 'inProgress') {
                return { success: false, message: "❌ Không thể hồi máu lúc này!" };
            }

            const player = heist.players.get(userId);
            if (!player) {
                return { success: false, message: "❌ Bạn không tham gia vụ cướp này!" };
            }

            if (player.health <= 0) {
                return { success: false, message: "❌ Bạn đã bị hạ gục!" };
            }

            if (player.health >= 100) {
                return { success: false, message: "❌ Máu của bạn đã đầy!" };
            }

            // Kiểm tra có bộ cứu thương không
            let healAmount = 20; // Hồi máu cơ bản
            if (player.equipment) {
                Object.values(player.equipment).forEach(item => {
                    if (item.healing) healAmount = item.healing;
                });
            }

            player.health = Math.min(100, player.health + healAmount);
            return {
                success: true,
                message: `💊 Đã hồi ${healAmount} máu!\n❤️ Máu hiện tại: ${player.health}/100`
            };
        } catch (err) {
            console.error('Lỗi khi hồi máu:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi hồi máu!" };
        }
    }

    getStatus(threadId, userId) {
        try {
            const heist = this.activeHeists.get(threadId);
            if (!heist) {
                return { success: false, message: "❌ Không có vụ cướp nào đang diễn ra!" };
            }

            let message = "📊 TRẠNG THÁI VỤ CƯỚP 📊\n━━━━━━━━━━━━━━━━━━\n\n";

            const robbers = Array.from(heist.players.entries())
                .filter(([_, data]) => data.role === 'robber');
            
            const police = Array.from(heist.players.entries())
                .filter(([_, data]) => data.role === 'police');

            message += "💰 NHỮNG TÊN CƯỚP:\n";
            robbers.forEach(([id, data]) => {
                const status = data.health <= 0 ? "☠️ Đã bị hạ gục" : `❤️ ${data.health}/100`;
                message += `• ${getUserName(id)}: ${status}\n`;
            });

            message += "\n👮 LỰC LƯỢNG CẢNH SÁT:\n";
            police.forEach(([id, data]) => {
                const status = data.health <= 0 ? "☠️ Đã bị hạ gục" : `❤️ ${data.health}/100`;
                message += `• ${getUserName(id)}: ${status}\n`;
            });

            return { success: true, message };
        } catch (err) {
            console.error('Lỗi khi xem trạng thái:', err);
            return { success: false, message: "❌ Đã xảy ra lỗi khi xem trạng thái!" };
        }
    }
}

const heistManager = new HeistManager();

module.exports = {
    name: "heist",
    onPrefix: true,
    dev: "HNT",
    category: "Games",
    info: "Chơi game cướp ngân hàng multiplayer với nhiều tính năng mới",
    usages: ".heist [lệnh]",
    cooldowns: 0,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🎮 CƯỚP NGÂN HÀNG 2.0 🎮\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                ERROR_MESSAGES.SYNTAX_GUIDE.BASIC.join("\n") + "\n\n" +
                "💡 Gõ .heist help [chức năng] để xem hướng dẫn chi tiết\n" +
                "📝 Các chức năng: basic, pet, vehicle, gang, tournament, market",
                threadID, messageID
            );
        }

        const command = target[0].toLowerCase();
        const args = target.slice(1);

        // Xử lý lệnh help
        if (command === "help") {
            const feature = args[0]?.toLowerCase();
            if (!feature) {
                return api.sendMessage(
                    "📖 HƯỚNG DẪN SỬ DỤNG 📖\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "💡 Gõ .heist help [chức năng] để xem chi tiết\n\n" +
                    "📝 DANH SÁCH CHỨC NĂNG:\n" +
                    "• basic - Lệnh cơ bản\n" +
                    "• pet - Hệ thống thú cưng\n" +
                    "• vehicle - Hệ thống phương tiện\n" +
                    "• gang - Hệ thống bang hội\n" +
                    "• tournament - Hệ thống giải đấu\n" +
                    "• market - Chợ đen",
                    threadID
                );
            }

            switch (feature) {
                case "basic":
                    return api.sendMessage(ERROR_MESSAGES.SYNTAX_GUIDE.BASIC.join("\n"), threadID);
                case "pet":
                    return api.sendMessage(ERROR_MESSAGES.SYNTAX_GUIDE.PET.join("\n"), threadID);
                case "vehicle":
                    return api.sendMessage(ERROR_MESSAGES.SYNTAX_GUIDE.VEHICLE.join("\n"), threadID);
                case "gang":
                    return api.sendMessage(ERROR_MESSAGES.SYNTAX_GUIDE.GANG.join("\n"), threadID);
                case "tournament":
                    return api.sendMessage(ERROR_MESSAGES.SYNTAX_GUIDE.TOURNAMENT.join("\n"), threadID);
                case "market":
                    return api.sendMessage(ERROR_MESSAGES.SYNTAX_GUIDE.MARKET.join("\n"), threadID);
                default:
                    return api.sendMessage(ERROR_MESSAGES.GENERAL.INVALID_COMMAND, threadID);
            }
        }

        // Xử lý các lệnh thú cưng
        if (command === "pet") {
            if (!args[0]) return api.sendMessage(ERROR_MESSAGES.PET.SYNTAX.INFO, threadID);
            
            const action = args[0].toLowerCase();
            switch (action) {
                case "buy":
                    if (!args[1]) return api.sendMessage(ERROR_MESSAGES.PET.SYNTAX.BUY, threadID);
                    const petResult = gameManager.handleCommand("pet", senderID, args);
                    return api.sendMessage(petResult.message, threadID);
                case "train":
                    const trainResult = gameManager.handleCommand("pet", senderID, ["train"]);
                    return api.sendMessage(trainResult.message, threadID);
                case "info":
                    const infoResult = gameManager.handleCommand("pet", senderID, ["info"]);
                    return api.sendMessage(infoResult.message, threadID);
                default:
                    return api.sendMessage(ERROR_MESSAGES.PET.SYNTAX.INFO, threadID);
            }
        }

        // Xử lý các lệnh phương tiện
        if (command === "vehicle") {
            if (!args[0]) return api.sendMessage(ERROR_MESSAGES.VEHICLE.SYNTAX.INFO, threadID);
            
            const action = args[0].toLowerCase();
            switch (action) {
                case "buy":
                    if (!args[1]) return api.sendMessage(ERROR_MESSAGES.VEHICLE.SYNTAX.BUY, threadID);
                    const buyResult = gameManager.handleCommand("vehicle", senderID, args);
                    return api.sendMessage(buyResult.message, threadID);
                case "upgrade":
                    if (!args[1] || !args[2]) return api.sendMessage(ERROR_MESSAGES.VEHICLE.SYNTAX.UPGRADE, threadID);
                    const upgradeResult = gameManager.handleCommand("vehicle", senderID, args);
                    return api.sendMessage(upgradeResult.message, threadID);
                case "info":
                    const infoResult = gameManager.handleCommand("vehicle", senderID, ["info"]);
                    return api.sendMessage(infoResult.message, threadID);
                default:
                    return api.sendMessage(ERROR_MESSAGES.VEHICLE.SYNTAX.INFO, threadID);
            }
        }

        // Xử lý các lệnh bang hội
        if (command === "gang") {
            if (!args[0]) return api.sendMessage(ERROR_MESSAGES.GANG.SYNTAX.INFO, threadID);
            
            const action = args[0].toLowerCase();
            switch (action) {
                case "create": {
                    if (!args[1]) return api.sendMessage(ERROR_MESSAGES.GANG.SYNTAX.CREATE, threadID);
                    
                    const gangName = args[1];
                    if (gangName.includes(" ")) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.INVALID_NAME, threadID);
                    }

                    // Kiểm tra xem người chơi đã tạo gang chưa
                    const gangs = gameManager.data.gangs || {};
                    const hasCreatedGang = Object.values(gangs).some(gang => gang.leader === senderID);
                    if (hasCreatedGang) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.ALREADY_CREATED, threadID);
                    }

                    // Kiểm tra tên gang đã tồn tại chưa
                    if (gangs[gangName]) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.NAME_TAKEN, threadID);
                    }

                    // Kiểm tra số dư
                    const balance = getBalance(senderID);
                    if (balance < GANG_CONFIG.createCost) {
                        return api.sendMessage(
                            `❌ Không đủ tiền để tạo bang hội!\n💰 Cần: ${formatNumber(GANG_CONFIG.createCost)}$`,
                            threadID
                        );
                    }

                    // Tạo gang mới
                    if (!gameManager.data.gangs) gameManager.data.gangs = {};
                    gameManager.data.gangs[gangName] = {
                        name: gangName,
                        leader: senderID,
                        members: [senderID],
                        features: {
                            base: { level: 1 },
                            training: { level: 1 }
                        },
                        createdAt: Date.now()
                    };

                    // Trừ tiền
                    updateBalance(senderID, -GANG_CONFIG.createCost);
                    saveHeistData(gameManager.data);

                    return api.sendMessage(
                        "🎉 TẠO BANG HỘI THÀNH CÔNG 🎉\n" +
                        "━━━━━━━━━━━━━━━━━━\n" +
                        `🏰 Tên bang: ${gangName}\n` +
                        `👑 Trưởng bang: ${getUserName(senderID)}\n` +
                        `💰 Chi phí: ${formatNumber(GANG_CONFIG.createCost)}$\n\n` +
                        "📝 Lệnh quản lý:\n" +
                        "• .heist gang info - Xem thông tin\n" +
                        "• .heist gang upgrade - Nâng cấp tính năng",
                        threadID
                    );
                }

                case "info": {
                    const gangs = gameManager.data.gangs || {};
                    let userGang = null;
                    let gangName = null;

                    // Tìm gang của người chơi
                    for (const [name, gang] of Object.entries(gangs)) {
                        if (gang.members.includes(senderID)) {
                            userGang = gang;
                            gangName = name;
                            break;
                        }
                    }

                    if (!userGang) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.NOT_IN_GANG, threadID);
                    }

                    const baseLevel = userGang.features.base.level;
                    const trainingLevel = userGang.features.training.level;
                    const memberList = userGang.members.map(id => 
                        `${id === userGang.leader ? "👑" : "👤"} ${getUserName(id)}`
                    ).join("\n");

                    return api.sendMessage(
                        "�� THÔNG TIN BANG HỘI 📋\n" +
                        "━━━━━━━━━━━━━━━━━━\n" +
                        `🏰 Tên bang: ${gangName}\n` +
                        `👑 Trưởng bang: ${getUserName(userGang.leader)}\n` +
                        `👥 Thành viên (${userGang.members.length}/${GANG_CONFIG.maxMembers}):\n${memberList}\n\n` +
                        "🏗️ TÍNH NĂNG:\n" +
                        `• ${GANG_CONFIG.features.base.name}: Cấp ${baseLevel}\n` +
                        `  └ ${GANG_CONFIG.features.base.levels[baseLevel-1].bonus}\n` +
                        `• ${GANG_CONFIG.features.training.name}: Cấp ${trainingLevel}\n` +
                        `  └ ${GANG_CONFIG.features.training.levels[trainingLevel-1].bonus}\n\n` +
                        `📅 Ngày thành lập: ${new Date(userGang.createdAt).toLocaleDateString()}`,
                        threadID
                    );
                }

                case "list": {
                    const gangs = gameManager.data.gangs || {};
                    if (Object.keys(gangs).length === 0) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.NO_GANGS, threadID);
                    }

                    let message = "📋 DANH SÁCH BANG HỘI 📋\n━━━━━━━━━━━━━━━━━━\n\n";
                    Object.entries(gangs).forEach(([name, gang]) => {
                        message += `🏰 ${name}\n`;
                        message += `👑 Trưởng bang: ${getUserName(gang.leader)}\n`;
                        message += `👥 Thành viên: ${gang.members.length}/${GANG_CONFIG.maxMembers}\n`;
                        message += `🏗️ Cơ sở: Cấp ${gang.features.base.level}\n`;
                        message += `🎯 Huấn luyện: Cấp ${gang.features.training.level}\n`;
                        message += "━━━━━━━━━━━━━━━━━━\n";
                    });

                    return api.sendMessage(message, threadID);
                }

                case "join": {
                    if (!args[1]) return api.sendMessage(ERROR_MESSAGES.GANG.SYNTAX.JOIN, threadID);
                    
                    const gangName = args[1];
                    const gangs = gameManager.data.gangs || {};

                    // Kiểm tra gang có tồn tại không
                    if (!gangs[gangName]) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.NOT_FOUND, threadID);
                    }

                    // Kiểm tra người chơi đã trong gang khác chưa
                    for (const gang of Object.values(gangs)) {
                        if (gang.members.includes(senderID)) {
                            return api.sendMessage(ERROR_MESSAGES.GANG.ALREADY_IN_GANG, threadID);
                        }
                    }

                    // Kiểm tra gang đã đủ thành viên chưa
                    if (gangs[gangName].members.length >= GANG_CONFIG.maxMembers) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.FULL_MEMBERS, threadID);
                    }

                    // Thêm người chơi vào gang
                    gangs[gangName].members.push(senderID);
                    saveHeistData(gameManager.data);

                    return api.sendMessage(
                        "✅ THAM GIA BANG HỘI THÀNH CÔNG\n" +
                        "━━━━━━━━━━━━━━━━━━\n" +
                        `🏰 Tên bang: ${gangName}\n` +
                        `👑 Trưởng bang: ${getUserName(gangs[gangName].leader)}\n` +
                        `👥 Số thành viên: ${gangs[gangName].members.length}/${GANG_CONFIG.maxMembers}`,
                        threadID
                    );
                }

                case "upgrade": {
                    if (!args[1] || !args[2]) return api.sendMessage(ERROR_MESSAGES.GANG.SYNTAX.UPGRADE, threadID);
                    
                    const feature = args[1].toLowerCase();
                    const level = parseInt(args[2]);
                    const gangs = gameManager.data.gangs || {};

                    // Tìm gang của người chơi
                    let userGang = null;
                    let gangName = null;
                    for (const [name, gang] of Object.entries(gangs)) {
                        if (gang.members.includes(senderID)) {
                            userGang = gang;
                            gangName = name;
                            break;
                        }
                    }

                    if (!userGang) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.NOT_IN_GANG, threadID);
                    }

                    // Kiểm tra quyền trưởng bang
                    if (userGang.leader !== senderID) {
                        return api.sendMessage(ERROR_MESSAGES.GANG.NOT_LEADER, threadID);
                    }

                    // Kiểm tra tính năng hợp lệ
                    if (!GANG_CONFIG.features[feature]) {
                        return api.sendMessage(
                            "❌ Tính năng không hợp lệ!\n💡 Chọn: base (Căn cứ) hoặc training (Phòng tập)",
                            threadID
                        );
                    }

                    // Kiểm tra cấp độ hợp lệ
                    if (isNaN(level) || level < 1 || level > 5) {
                        return api.sendMessage("❌ Cấp độ phải từ 1 đến 5!", threadID);
                    }

                    const currentLevel = userGang.features[feature].level;
                    if (level <= currentLevel) {
                        return api.sendMessage("❌ Không thể nâng cấp xuống cấp thấp hơn!", threadID);
                    }

                    // Tính tổng chi phí nâng cấp
                    let totalCost = 0;
                    for (let i = currentLevel; i < level; i++) {
                        totalCost += GANG_CONFIG.features[feature].levels[i].cost;
                    }

                    // Kiểm tra số dư
                    const balance = getBalance(senderID);
                    if (balance < totalCost) {
                        return api.sendMessage(
                            `❌ Không đủ tiền để nâng cấp!\n💰 Cần: ${formatNumber(totalCost)}$`,
                            threadID
                        );
                    }

                    // Thực hiện nâng cấp
                    userGang.features[feature].level = level;
                    updateBalance(senderID, -totalCost);
                    saveHeistData(gameManager.data);

                    return api.sendMessage(
                        "🎉 NÂNG CẤP THÀNH CÔNG 🎉\n" +
                        "━━━━━━━━━━━━━━━━━━\n" +
                        `🏰 Bang hội: ${gangName}\n` +
                        `🏗️ Tính năng: ${GANG_CONFIG.features[feature].name}\n` +
                        `📈 Cấp độ: ${currentLevel} → ${level}\n` +
                        `💰 Chi phí: ${formatNumber(totalCost)}$\n` +
                        `✨ Hiệu ứng: ${GANG_CONFIG.features[feature].levels[level-1].bonus}`,
                        threadID
                    );
                }

                default:
                    return api.sendMessage(ERROR_MESSAGES.GANG.SYNTAX.INFO, threadID);
            }
        }

        // Xử lý các lệnh giải đấu
        if (command === "tournament") {
            if (!args[0]) return api.sendMessage(ERROR_MESSAGES.TOURNAMENT.SYNTAX.LIST, threadID);
            
            const action = args[0].toLowerCase();
            switch (action) {
                case "list":
                    const listResult = gameManager.handleCommand("tournament", senderID, ["list"]);
                    return api.sendMessage(listResult.message, threadID);
                case "join":
                    if (!args[1]) return api.sendMessage(ERROR_MESSAGES.TOURNAMENT.SYNTAX.JOIN, threadID);
                    const joinResult = gameManager.handleCommand("tournament", senderID, args);
                    return api.sendMessage(joinResult.message, threadID);
                case "ranking":
                    const rankResult = gameManager.handleCommand("tournament", senderID, ["ranking"]);
                    return api.sendMessage(rankResult.message, threadID);
                default:
                    return api.sendMessage(ERROR_MESSAGES.TOURNAMENT.SYNTAX.LIST, threadID);
            }
        }

        // Xử lý các lệnh chợ đen
        if (command === "market") {
            if (!args[0]) return api.sendMessage(ERROR_MESSAGES.MARKET.SYNTAX.LIST, threadID);
            
            const action = args[0].toLowerCase();
            switch (action) {
                case "list":
                    const listResult = gameManager.handleCommand("market", senderID, ["list"]);
                    return api.sendMessage(listResult.message, threadID);
                case "buy":
                    if (!args[1]) return api.sendMessage(ERROR_MESSAGES.MARKET.SYNTAX.BUY, threadID);
                    const buyResult = gameManager.handleCommand("market", senderID, args);
                    return api.sendMessage(buyResult.message, threadID);
                case "refresh":
                    const refreshResult = gameManager.handleCommand("market", senderID, ["refresh"]);
                    return api.sendMessage(refreshResult.message, threadID);
                default:
                    return api.sendMessage(ERROR_MESSAGES.MARKET.SYNTAX.LIST, threadID);
            }
        }

        // Xử lý các lệnh cơ bản
        switch (command) {
            case "start":
                if (!args[0] || !["local", "state", "federal"].includes(args[0].toLowerCase())) {
                    return api.sendMessage(
                        "❌ Vui lòng chọn loại ngân hàng:\n" +
                        "• local - Ngân hàng địa phương\n" +
                        "• state - Ngân hàng Quốc gia\n" +
                        "• federal - Ngân hàng Trung ương",
                        threadID
                    );
                }
                await heistManager.startHeist(api, event, args[0].toLowerCase());
                break;

            case "join":
                if (!args[0] || !["robber", "police"].includes(args[0].toLowerCase())) {
                    return api.sendMessage(ERROR_MESSAGES.HEIST.INVALID_ROLE, threadID);
                }
                
                const joinResult = heistManager.joinHeist(threadID, senderID, args[0].toLowerCase());
                if (joinResult) {
                    api.sendMessage(`✅ Đã tham gia với vai trò ${args[0].toLowerCase() === "robber" ? "💰 Cướp" : "👮 Cảnh sát"}!`, threadID);
                } else {
                    api.sendMessage(ERROR_MESSAGES.HEIST.ALREADY_ACTIVE, threadID);
                }
                break;

            case "attack":
                if (!event.mentions || Object.keys(event.mentions).length === 0) {
                    return api.sendMessage(ERROR_MESSAGES.GENERAL.INVALID_TARGET, threadID);
                }
                const targetId = Object.keys(event.mentions)[0];
                const attackResult = heistManager.attack(threadID, senderID, targetId);
                api.sendMessage(attackResult.message, threadID);
                break;

            case "heal":
                const healResult = heistManager.heal(threadID, senderID);
                api.sendMessage(healResult.message, threadID);
                break;

            case "status":
                const statusResult = heistManager.getStatus(threadID, senderID);
                api.sendMessage(statusResult.message, threadID);
                break;

            case "shop":
                const shopMessage = heistManager.showShop(senderID);
                api.sendMessage(shopMessage, threadID);
                break;

            case "buy":
                if (!args[0] || !args[1]) {
                    return api.sendMessage("❌ Thiếu thông tin mua hàng!\n💡 Cú pháp: .heist buy [weapon/equip] [số]", threadID);
                }

                const type = args[0].toLowerCase();
                const itemIndex = parseInt(args[1]);
                
                if (isNaN(itemIndex)) {
                    return api.sendMessage(ERROR_MESSAGES.GENERAL.INVALID_AMOUNT, threadID);
                }

                let result;
                if (type === "weapon") {
                    result = heistManager.buyWeaponByIndex(senderID, itemIndex);
                    if (result.success) {
                        const equipResult = heistManager.equipWeaponByIndex(threadID, senderID, itemIndex);
                        result.message += "\n" + equipResult.message;
                    }
                } else if (type === "equip") {
                    result = heistManager.buyEquipmentByIndex(senderID, itemIndex);
                    if (result.success) {
                        const equipResult = heistManager.equipItemByIndex(threadID, senderID, itemIndex);
                        result.message += "\n" + equipResult.message;
                    }
                } else {
                    return api.sendMessage("❌ Loại vật phẩm không hợp lệ!\n💡 Chọn: weapon (Vũ khí) hoặc equip (Trang bị)", threadID);
                }

                api.sendMessage(result.message, threadID);
                break;

            default:
                return api.sendMessage(ERROR_MESSAGES.GENERAL.INVALID_COMMAND, threadID);
        }
    }
}; 