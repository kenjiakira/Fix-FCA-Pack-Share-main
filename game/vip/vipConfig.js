const VIP_PACKAGES = {
    GOLD: {
        id: 3,
        name: "VIP Gold",
        price: {
            original: "59,000",
            sale: "49,000"
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
    }
};

const GROUP_PACKAGES = {};

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