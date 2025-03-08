const VIP_PACKAGES = {
    BRONZE: {
        id: 1,
        icon: "🥉",
        stars: "⭐",
        name: "VIP BRONZE",
        price: { original: "45,000", sale: "30,000" },
        duration: "30 ngày",
        perks: {
            fishing: {
                cooldown: "5p",
                exp: "x2 EXP",
                rare: "+15% hiếm",
                protect: "50% chống mất cá",
                buff: "+20% chỉ số"
            },
            money: {
                farm: "Tăng lợi nhuận/giảm thời gian",
                work: "+60% thu nhập/-5% thời gian",
                daily: "+20%", 
                quest: "+20%",
                event: "+30%",
                protection: "30% chống cướp"
            },
            bank: {
                loan: "Vay tối đa 80% tài sản",
                interest: "-10% lãi vay",
                bonus: "+5% lãi tiết kiệm",
                fee: "-20% phí giao dịch"
            },
            security: {
                protect: "30% bảo vệ xu"
            }
        },
        benefits: {
            workBonus: 10,
            cooldownReduction: 10,
            dailyBonus: true,
            fishingCooldown: 300000,
            fishExpMultiplier: 2, 
            rareBonus: 0.1,
            trashReduction: 0.2,
            stolenProtection: 0.3,
            stolenCooldown: 900000
        }
    },
    SILVER: {
        id: 2,
        icon: "🥈",
        stars: "⭐⭐", 
        name: "VIP SILVER",
        price: { original: "55,000", sale: "40,000" },
        duration: "30 ngày",
        perks: {
            fishing: {
                cooldown: "4p",
                exp: "x3 EXP",
                rare: "+25% hiếm",
                protect: "75% chống mất cá",
                buff: "+40% chỉ số"
            },
            money: {
                farm: "Tăng lợi nhuận/giảm thời gian",
                work: "+60% thu nhập/-15% thời gian",
                daily: "+40%",
                quest: "+50%", 
                event: "+60%",
                protection: "60% chống cướp"
            },
            bank: {
                loan: "Vay tối đa 120% tài sản",
                interest: "-20% lãi vay",
                bonus: "+10% lãi tiết kiệm",
                fee: "-40% phí giao dịch"
            },
            security: {
                protect: "60% bảo vệ xu"
            }
        },
        benefits: {
            workBonus: 20,
            cooldownReduction: 20,
            dailyBonus: true,
            fishingCooldown: 240000, 
            fishExpMultiplier: 3, 
            rareBonus: 0.2,
            trashReduction: 0.4,
            stolenProtection: 0.6,
            stolenCooldown: 900000
        }
    },
    GOLD: {
        id: 3,
        icon: "👑",
        stars: "⭐⭐⭐",
        name: "VIP GOLD",
        price: { original: "95,000", sale: "50,000" },
        duration: "30 ngày +7",
        perks: {
            fishing: {
                cooldown: "2p",
                exp: "x4 EXP",
                rare: "+40% hiếm",
                protect: "100% chống mất cá",
                buff: "+60% chỉ số",
                special: "Khu vực đặc biệt"
            },
            money: {
                farm: "Tăng lợi nhuận/giảm thời gian",
                work: "+60% thu nhập/-30% thời gian",
                daily: "+60%",
                quest: "+100%",
                event: "+100%",
                protection: "100% chống cướp"
            },
            bank: {
                loan: "Vay tối đa 150% tài sản",
                interest: "-30% lãi vay",
                bonus: "+15% lãi tiết kiệm",
                fee: "-60% phí giao dịch"
            },
            security: {
                protect: "Miễn nhiễm cướp"
            }
        },
        benefits: {
            workBonus: 40,
            cooldownReduction: 30,
            dailyBonus: true,
            fishingCooldown: 120000, 
            fishExpMultiplier: 4, 
            rareBonus: 0.3,
            trashReduction: 0.6,
            stolenProtection: 1.0,
            stolenCooldown: 900000
        }
    }
};

const defaultBenefits = {
    workBonus: 0,
    cooldownReduction: 0,
    dailyBonus: false,
    fishingCooldown: 360000,
    fishExpMultiplier: 1,
    packageId: 0,
    name: "No VIP",
    rareBonus: 0,
    trashReduction: 0,
    stolenProtection: 0,
    stolenCooldown: 900000 
};

module.exports = {
    VIP_PACKAGES,
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
