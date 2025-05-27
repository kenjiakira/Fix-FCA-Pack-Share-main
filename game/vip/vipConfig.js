const VIP_PACKAGES = {
    GOLD: {
        id: 3,
        name: "VIP Gold",
        price: {
            original: "59,000",
            sale: "49,000" // Tăng từ 30k lên 49k
        },
        benefits: {
            miningBonus: 0.8, // +80% mining bonus
            stolenProtection: 1.0,
            withdrawalBonusLimit: 2.0, // +100% withdrawal limit
            dailyMiningLimit: 50, // 50 lượt đào/ngày
            autoMiningDiscount: 0.05, // Giảm 5% phí auto mining
            teamBonusMultiplier: 1.2 // +20% team bonus
        },
        color: "#FFD700",
        description: "Gói VIP Gold cao cấp với nhiều ưu đãi độc quyền cho Mining Game",
        longTermOptions: {
            3: { discount: 10, label: "3 tháng (-10%)" },
            6: { discount: 15, label: "6 tháng (-15%)" },
            12: { discount: 20, label: "1 năm (-20%)" }
        }
    },
    SILVER: {
        id: 2,
        icon: "🥈",
        stars: "⭐⭐",
        name: "VIP SILVER",
        price: { original: "60,000", sale: "30,000" },
        duration: "30 ngày +5",
        longTermOptions: {
            "3": { months: 3, discount: 5, duration: "90 ngày +15" },
            "6": { months: 6, discount: 15, duration: "180 ngày +30" }
        },
        perks: {
            fishing: {
                cooldown: "4p", exp: "x2 EXP", rare: "+20% Cá hiếm",
                protect: "80% chống mất cá"
            },
            money: {
                farm: "Tăng lợi nhuận/giảm thời gian", daily: "+30%",
                quest: "+50%", event: "+50%", protection: "80% chống cướp",
                transferLimit: "500 triệu xu/ngày"
            },
            bank: {
                loan: "Vay tối đa 80% tài sản", interest: "-20% lãi vay",
                bonus: "+10% lãi tiết kiệm", fee: "-40% phí giao dịch"
            },
            pet: {
                maxPets: "Nuôi tối đa 3 thú cưng",
                statDecay: "-20% giảm suy giảm chỉ số",
                expBonus: "+20% EXP",
                cooldown: "-20% thời gian chờ hoạt động"
            },
            security: { protect: "80% bảo vệ cho Stolen" },
            gacha: {
                limitedBonus: "+10% tỉ lệ Limited",
                description: "Tăng 10% tỉ lệ ra thẻ Limited"
            }
        },
        benefits: {
            cooldownReduction: 20, dailyBonus: true, fishingCooldown: 240000,
            fishExpMultiplier: 2, rareBonus: 0.2, trashReduction: 0.4,
            stolenProtection: 0.8, stolenCooldown: 900000,
            dailyTransferLimit: 500000000,
            gachaBonus: {
                limitedRateBonus: 0.1
            },
            petBenefits: {
                statDecayReduction: 0.2,
                itemDiscounts: 0.1,
                expBonus: 0.2,
                exclusivePets: false,
                maxPets: 3
            }
        }
    },
    BRONZE: {
        id: 1,
        icon: "🥉",
        stars: "⭐",
        name: "VIP BRONZE",
        price: { original: "40,000", sale: "20,000" },
        duration: "30 ngày",
        perks: {
            fishing: {
                cooldown: "5p", exp: "x1.5 EXP", rare: "+10% Cá hiếm",
                protect: "50% chống mất cá"
            },
            money: {
                farm: "Tăng nhẹ lợi nhuận/giảm thời gian", daily: "+15%",
                quest: "+25%", event: "+25%", protection: "50% chống cướp",
                transferLimit: "100 triệu xu/ngày"
            },
            bank: {
                loan: "Vay tối đa 50% tài sản", interest: "-10% lãi vay",
                bonus: "+5% lãi tiết kiệm", fee: "-20% phí giao dịch"
            },
            pet: {
                maxPets: "Nuôi tối đa 2 thú cưng",
                statDecay: "-10% giảm suy giảm chỉ số",
                expBonus: "+10% EXP",
                cooldown: "-10% thời gian chờ hoạt động"
            }
        },
        benefits: {
            cooldownReduction: 10, dailyBonus: true, fishingCooldown: 300000,
            fishExpMultiplier: 1.5, rareBonus: 0.1, trashReduction: 0.2,
            stolenProtection: 0.5, stolenCooldown: 900000,
            dailyTransferLimit: 100000000,
            petBenefits: {
                statDecayReduction: 0.1,
                itemDiscounts: 0.05,
                expBonus: 0.1,
                exclusivePets: false,
                maxPets: 2
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
    dailyTransferLimit: 50000000,
    petBenefits: {
        statDecayReduction: 0,
        itemDiscounts: 0,
        expBonus: 0,
        exclusivePets: false,
        maxPets: 1
    }
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