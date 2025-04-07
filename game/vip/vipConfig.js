const VIP_PACKAGES = {
    GOLD: {
        id: 3,
        icon: "👑",
        stars: "⭐⭐⭐",
        name: "VIP GOLD",
        price: { original: "95,000", sale: "50,000" },
        duration: "30 ngày +7",
        longTermOptions: {
            "3": { months: 3, discount: 10, duration: "90 ngày +21" },
            "6": { months: 6, discount: 20, duration: "180 ngày +42" },
            "12": { months: 12, discount: 30, duration: "360 ngày +84" }
        },
        perks: {
            fishing: {
                cooldown: "2p", exp: "x4 EXP", rare: "+40% Cá hiếm",
                protect: "100% chống mất cá",
                special: "Mở Khu vực VIP"
            },
            money: {
                farm: "Tăng lợi nhuận/giảm thời gian", daily: "+60%",
                quest: "+100%", event: "+100%", protection: "100% chống cướp",
                platform: "Tải Video toàn bộ nền tảng",
                transferLimit: "5 tỉ xu/ngày"
            },
            bank: {
                loan: "Vay tối đa 150% tài sản", interest: "-30% lãi vay",
                bonus: "+15% lãi tiết kiệm", fee: "-60% phí giao dịch"
            },
            security: { protect: "Miễn nhiễm cướp cho Stolen" },
            gacha: {
                limitedBonus: "+15% tỉ lệ Limited",
                description: "Tăng 15% tỉ lệ ra thẻ Limited"
            },
            ghep: {
                fullProfile: "Xem thông tin đầy đủ",
                boxMatch: "Ghép đôi trong nhóm",
                analysis: "Phân tích tính cách và dự đoán"
            }
        },
        benefits: {
            cooldownReduction: 30, dailyBonus: true, fishingCooldown: 120000, 
            fishExpMultiplier: 4, rareBonus: 0.3, trashReduction: 0.6,
            stolenProtection: 1.0, stolenCooldown: 900000, fullPlatformAccess: true,
            dailyTransferLimit: 5000000000, 
            gachaBonus: {
                limitedRateBonus: 0.15
            }
        }
    }
};

const GROUP_PACKAGES = {
    GOLD: {
        id: "GROUP_GOLD", minMembers: 3, discount: 15,
        description: "Mua chung VIP GOLD cho 3+ thành viên, mỗi người được giảm 15%"
    }
};

const defaultBenefits = {
    workBonus: 0, cooldownReduction: 0, dailyBonus: false,
    fishingCooldown: 360000, fishExpMultiplier: 1, packageId: 0,
    name: "No VIP", rareBonus: 0, trashReduction: 0,
    stolenProtection: 0, stolenCooldown: 900000,
    dailyTransferLimit: 50000000 
};

module.exports = {
    VIP_PACKAGES,
    GROUP_PACKAGES,
    defaultBenefits,
    getPackageById: (packageId) => {
        return Object.values(VIP_PACKAGES).find(pkg => pkg.id === packageId) || null;
    },
    getBenefitsForPackage: (packageId) => {
        const pkg = Object.values(VIP_PACKAGES).find(pkg => pkg.id === packageId);
        if (!pkg) return defaultBenefits;
        
        return {
            ...pkg.benefits,
            packageId: pkg.id,
            name: pkg.name
        };
    }
};