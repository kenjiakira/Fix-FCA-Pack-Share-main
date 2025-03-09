const fs = require('fs');
const path = require('path');

// Hunt cooldown in milliseconds (default: 1 hour)
const HUNT_COOLDOWN = 60 * 1000;

const VOUCHER_TYPES = {
    BRONZE: { color: "#CD7F32", emoji: "🥉", discount: 10, chance: 0.5, durationDays: 7 },
    SILVER: { color: "#C0C0C0", emoji: "🥈", discount: 15, chance: 0.3, durationDays: 7 },
    GOLD: { color: "#FFD700", emoji: "🎖️", discount: 20, chance: 0.15, durationDays: 7 },
    PLATINUM: { color: "#E5E4E2", emoji: "💎", discount: 25, chance: 0.05, durationDays: 7 },
    EVENT: { color: "#FF4500", emoji: "🎊", discount: "Đặc biệt", chance: 0 }
};

// Generate a random voucher code
function generateVoucherCode(type) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = `${type}_`;
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Check if user can hunt (cooldown)
function canHunt(userId) {
    const voucherData = loadVouchers();
    
    if (!voucherData.hunts || !voucherData.hunts[userId]) {
        return { canHunt: true };
    }
    
    const lastHunt = voucherData.hunts[userId].lastHunt;
    const now = Date.now();
    
    if (now - lastHunt < HUNT_COOLDOWN) {
        const timeLeft = HUNT_COOLDOWN - (now - lastHunt);
        const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
        return { 
            canHunt: false, 
            timeLeft: minutesLeft,
            message: `⏳ Bạn cần chờ ${minutesLeft} phút nữa để tiếp tục săn voucher.`
        };
    }
    
    return { canHunt: true };
}

// Hunt for a voucher
function huntVoucher(userId) {
    // Check cooldown
    const huntStatus = canHunt(userId);
    if (!huntStatus.canHunt) {
        return huntStatus;
    }
    
    // Update hunt timestamp
    const voucherData = loadVouchers();
    if (!voucherData.hunts) voucherData.hunts = {};
    if (!voucherData.hunts[userId]) {
        voucherData.hunts[userId] = { lastHunt: 0, totalHunts: 0, foundVouchers: 0 };
    }
    
    voucherData.hunts[userId].lastHunt = Date.now();
    voucherData.hunts[userId].totalHunts++;
    
    // Random chance to find nothing (25%)
    if (Math.random() < 0.25) {
        saveVouchers(voucherData);
        return { 
            success: false, 
            message: "😔 Thật tiếc! Bạn đã tìm kiếm trong rừng nhưng không tìm thấy voucher nào." 
        };
    }
    
    // Determine voucher type based on chance
    const rand = Math.random();
    let cumulativeChance = 0;
    let selectedType = null;
    
    for (const [type, config] of Object.entries(VOUCHER_TYPES)) {
        if (config.chance && config.chance > 0) {
            cumulativeChance += config.chance;
            if (rand <= cumulativeChance) {
                selectedType = type;
                break;
            }
        }
    }
    
    // If somehow we didn't select a type, default to BRONZE
    if (!selectedType) selectedType = "BRONZE";
    
    // Generate voucher
    const voucherConfig = VOUCHER_TYPES[selectedType];
    const voucher = {
        type: selectedType,
        code: generateVoucherCode(selectedType),
        discount: voucherConfig.discount,
        expires: Date.now() + (voucherConfig.durationDays * 24 * 60 * 60 * 1000),
        used: false,
        source: "hunting",
        foundAt: Date.now()
    };
    
    // Add voucher to user's collection
    if (!voucherData.users) voucherData.users = {};
    if (!voucherData.users[userId]) {
        voucherData.users[userId] = [];
    }
    
    voucherData.users[userId].push(voucher);
    voucherData.hunts[userId].foundVouchers++;
    
    saveVouchers(voucherData);
    
    return {
        success: true,
        voucher: voucher,
        message: `🎉 CHÚC MỪNG! Bạn đã tìm thấy ${voucherConfig.emoji} VOUCHER ${selectedType}!`
    };
}

// Get hunt stats for a user
function getHuntStats(userId) {
    const voucherData = loadVouchers();
    
    if (!voucherData.hunts || !voucherData.hunts[userId]) {
        return {
            totalHunts: 0,
            foundVouchers: 0,
            successRate: "0%"
        };
    }
    
    const stats = voucherData.hunts[userId];
    const successRate = stats.totalHunts > 0 ? 
        Math.round((stats.foundVouchers / stats.totalHunts) * 100) + "%" : 
        "0%";
        
    return {
        totalHunts: stats.totalHunts,
        foundVouchers: stats.foundVouchers,
        successRate: successRate
    };
}

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTimeLeft(timestamp) {
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff <= 0) return "Đã hết hạn";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} ngày ${hours} giờ`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    
    return `${minutes} phút`;
}

function getVoucherIcon(type) {
    return VOUCHER_TYPES[type]?.emoji || "🎫";
}

function loadVouchers() {
    const voucherPath = path.join(__dirname, 'json', 'voucher.json');
    if (!fs.existsSync(voucherPath)) {
        fs.writeFileSync(voucherPath, JSON.stringify({users: {}, hunts: {}}, null, 2));
        return {users: {}, hunts: {}};
    }
    return JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
}

function saveVouchers(voucherData) {
    const voucherPath = path.join(__dirname, 'json', 'voucher.json');
    fs.writeFileSync(voucherPath, JSON.stringify(voucherData, null, 2));
}

function getUserVouchers(userId) {
    const voucherData = loadVouchers();
    return (voucherData.users[userId] || []).sort((a, b) => {
        // Sort by: unused first, then by expiration (closest first), then by discount (highest first)
        if (a.used !== b.used) return a.used ? 1 : -1;
        if (a.expires !== b.expires) return a.expires - b.expires;
        return b.discount - a.discount;
    });
}

function checkExpiringVouchers(userId) {
    const vouchers = getUserVouchers(userId);
    const now = Date.now();
    const dayInMillis = 24 * 60 * 60 * 1000;
    
    // Find vouchers expiring within 3 days
    return vouchers.filter(v => !v.used && 
        v.expires > now && 
        v.expires < now + (3 * dayInMillis));
}

function transferVoucher(fromUserId, toUserId, voucherCode) {
    if (fromUserId === toUserId) return { success: false, message: "Không thể tự chuyển voucher cho bản thân" };
    
    const voucherData = loadVouchers();
    const fromUserVouchers = voucherData.users[fromUserId] || [];
    
    const voucherIndex = fromUserVouchers.findIndex(v => v.code === voucherCode && !v.used);
    if (voucherIndex === -1) {
        return { success: false, message: "Không tìm thấy voucher có thể chuyển" };
    }
    
    const voucher = {...fromUserVouchers[voucherIndex]};
    
    // Remove from sender
    fromUserVouchers.splice(voucherIndex, 1);
    voucherData.users[fromUserId] = fromUserVouchers;
    
    // Add to receiver
    if (!voucherData.users[toUserId]) voucherData.users[toUserId] = [];
    voucherData.users[toUserId].push(voucher);
    
    saveVouchers(voucherData);
    
    return { 
        success: true, 
        message: "Chuyển voucher thành công",
        voucher
    };
}

function useVoucher(userId, voucherCode) {
    const voucherData = loadVouchers();
    const userVouchers = voucherData.users[userId] || [];
    
    const voucherIndex = userVouchers.findIndex(v => v.code === voucherCode && !v.used);
    if (voucherIndex === -1) {
        return { success: false, message: "Không tìm thấy voucher hoặc đã được sử dụng" };
    }
    
    if (userVouchers[voucherIndex].expires < Date.now()) {
        return { success: false, message: "Voucher đã hết hạn" };
    }
    
    userVouchers[voucherIndex].used = true;
    voucherData.users[userId] = userVouchers;
    saveVouchers(voucherData);
    
    return { 
        success: true, 
        message: "Đã sử dụng voucher thành công",
        voucher: userVouchers[voucherIndex]
    };
}

function renderVouchers(vouchers, showExpired = false) {
    if (vouchers.length === 0) {
        return "Bạn không có voucher nào";
    }

    const now = Date.now();
    let vouchersForDisplay = vouchers;
    
    if (!showExpired) {
        vouchersForDisplay = vouchers.filter(v => !v.used && v.expires > now);
    }
    
    if (vouchersForDisplay.length === 0) {
        return "Bạn không có voucher hợp lệ nào";
    }

    let message = "";
    
    vouchersForDisplay.forEach((v, index) => {
        const isExpired = v.expires < now;
        const isUsed = v.used;
        const icon = getVoucherIcon(v.type);
        const status = isUsed ? "⚠️ĐÃ DÙNG" : (isExpired ? "⌛HẾT HẠN" : "✅CÒN HẠN");
        const timeLeft = formatTimeLeft(v.expires);
        
        message += `${index + 1}. ${icon} VOUCHER ${v.type} [${status}]\n`;
        message += `   ├ Mã: ${v.code}\n`;
        message += `   ├ Giảm giá: ${v.discount}%\n`;
        message += `   └ ${isExpired ? "Hết hạn từ: " : "Còn lại: "} ${timeLeft}\n\n`;
    });
    
    return message;
}

module.exports = {
    name: "voucher",
    aliases: ["vch", "coupon", "hunt"],
    dev: "HNT",
    category: "Economy",
    info: "Quản lý voucher giảm giá",
    usages: [
        ".voucher - Xem danh sách voucher",
        ".voucher all - Xem tất cả voucher (bao gồm đã dùng/hết hạn)",
        ".voucher use <mã> - Sử dụng voucher",
        ".voucher transfer <@tag> <mã> - Chuyển voucher cho người khác",
        ".voucher hunt - Săn tìm voucher mới",
        ".voucher stats - Xem thống kê săn voucher"
    ].join('\n'),
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, senderID, mentions } = event;
        
        const action = target[0]?.toLowerCase();
        
        // Check for expiring vouchers and notify if needed
        const expiringVouchers = checkExpiringVouchers(senderID);
        if (expiringVouchers.length > 0 && !action) {
            setTimeout(() => {
                const warningMsg = `⚠️ CẢNH BÁO: Bạn có ${expiringVouchers.length} voucher sắp hết hạn!\nHãy dùng '.voucher' để kiểm tra.`;
                api.sendMessage(warningMsg, senderID);
            }, 1000);
        }

        switch (action) {
            case "all": {
                const userVouchers = getUserVouchers(senderID);
                const message = `📋 TẤT CẢ VOUCHER CỦA BẠN\n\n${renderVouchers(userVouchers, true)}`;
                return api.sendMessage(message, threadID, messageID);
            }
            
            case "use": {
                const voucherCode = target[1];
                if (!voucherCode) {
                    return api.sendMessage("❌ Vui lòng nhập mã voucher cần sử dụng", threadID, messageID);
                }
                
                const result = useVoucher(senderID, voucherCode);
                if (!result.success) {
                    return api.sendMessage(`❌ ${result.message}`, threadID, messageID);
                }
                
                const icon = getVoucherIcon(result.voucher.type);
                return api.sendMessage(
                    `✅ SỬ DỤNG VOUCHER THÀNH CÔNG\n\n` +
                    `${icon} Voucher ${result.voucher.type}\n` +
                    `💰 Giảm giá: ${result.voucher.discount}%\n` +
                    `🔖 Mã: ${result.voucher.code}\n\n` +
                    `Voucher đã được áp dụng!`,
                    threadID, messageID
                );
            }
            
            case "transfer": {
                const mentionedIds = Object.keys(mentions);
                const targetUserId = mentionedIds.length > 0 ? mentionedIds[0] : target[1];
                const voucherCode = mentionedIds.length > 0 ? target[target.length - 1] : target[2];
                
                if (!targetUserId || !voucherCode) {
                    return api.sendMessage(
                        "❌ Vui lòng tag người nhận và cung cấp mã voucher\n" +
                        "Ví dụ: .voucher transfer @user SILVER_ABC123", 
                        threadID, messageID
                    );
                }
                
                const result = transferVoucher(senderID, targetUserId, voucherCode);
                if (!result.success) {
                    return api.sendMessage(`❌ ${result.message}`, threadID, messageID);
                }
                
                const icon = getVoucherIcon(result.voucher.type);
                return api.sendMessage(
                    `✅ CHUYỂN VOUCHER THÀNH CÔNG\n\n` +
                    `👤 Người nhận: ${targetUserId}\n` +
                    `${icon} Voucher ${result.voucher.type}\n` +
                    `💰 Giảm giá: ${result.voucher.discount}%\n` +
                    `🔖 Mã: ${result.voucher.code}`,
                    threadID, messageID
                );
            }
            
            case "hunt": {
                // Hunt for voucher
                const result = huntVoucher(senderID);
                
                if (!result.canHunt) {
                    return api.sendMessage(result.message, threadID, messageID);
                }
                
                if (!result.success) {
                    return api.sendMessage(
                        `${result.message}\n\n` +
                        "🔄 Hãy thử lại sau 1 phút nữa.\n" +
                        "💡 Gõ '.voucher stats' để xem thống kê săn voucher của bạn.",
                        threadID, messageID
                    );
                }
                
                const voucher = result.voucher;
                const voucherConfig = VOUCHER_TYPES[voucher.type];
                const expiresDate = new Date(voucher.expires).toLocaleDateString('vi-VN');
                
                return api.sendMessage(
                    `${result.message}\n\n` +
                    `${voucherConfig.emoji} Mã voucher: ${voucher.code}\n` +
                    `💰 Giảm giá: ${voucher.discount}%\n` +
                    `⏳ Hết hạn: ${expiresDate}\n\n` +
                    "📌 Cách sử dụng voucher:\n" +
                    "1. Gõ '.voucher' để xem danh sách voucher\n" +
                    "2. Khi mua VIP, voucher sẽ tự động áp dụng",
                    threadID, messageID
                );
            }
            
            case "stats": {
                // Show hunting statistics
                const stats = getHuntStats(senderID);
                
                return api.sendMessage(
                    "📊 THỐNG KÊ SĂN VOUCHER\n\n" +
                    `🔍 Số lần săn tìm: ${stats.totalHunts}\n` +
                    `🎫 Voucher đã tìm thấy: ${stats.foundVouchers}\n` +
                    `⭐ Tỉ lệ thành công: ${stats.successRate}\n\n` +
                    "💡 Hãy sử dụng '.voucher hunt' để tiếp tục săn voucher.",
                    threadID, messageID
                );
            }
            
            default: {
                const userVouchers = getUserVouchers(senderID);
                const activeVouchers = userVouchers.filter(v => !v.used && v.expires > Date.now());
                
                let message = `📋 VOUCHER CỦA BẠN (${activeVouchers.length})\n\n`;
                message += renderVouchers(userVouchers);
                message += "\n📌 HƯỚNG DẪN SỬ DỤNG:\n";
                message += "- Xem tất cả voucher: .voucher all\n";
                message += "- Sử dụng voucher: .voucher use <mã>\n";
                message += "- Chuyển voucher: .voucher transfer @tag <mã>\n";
                message += "- Săn voucher mới: .voucher hunt\n";
                message += "- Xem thống kê săn: .voucher stats";
                
                return api.sendMessage(message, threadID, messageID);
            }
        }
    }
};
