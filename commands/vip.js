module.exports = {
    name: "vip",
    dev: "HNT",
    info: "Hiển thị và mua gói VIP",
    onPrefix: true,
    usages: "vip",
    cooldowns: 10,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;

        const vipPackages = [
            {
                name: "VIP BRONZE ⭐",
                originalPrice: "50,000",
                salePrice: "20,000",
                duration: "30 ngày",
                benefits: [
                    "💰 +20% xu từ mọi hoạt động",
                    "⏰ Thời gian chờ giảm 20%",
                    "🎣 Câu cá mỗi 5 phút",
                    "⚜️ Giảm Cooldown tăng Bonus Work",
                    "✨ EXP câu cá x2",
                    "🎁 Bonus Daily mỗi ngày" ,
                    "💳 Được vay 80% tổng tài sản",
                    "🎯 +15% tỷ lệ cá hiếm",
                ],
                deals: [
                    "🎁 Tặng ngay 500,000 xu",
                ]
            },
            {
                name: "VIP SILVER ⭐⭐",
                originalPrice: "75,000",
                salePrice: "35,000",
                duration: "30 ngày",
                benefits: [
                    "💰 +40% xu từ mọi hoạt động",
                    "⏰ Thời gian chờ giảm 40%", 
                    "🎣 Câu cá mỗi 4 phút",
                    "✨ EXP câu cá x3",
                    "⚜️ Giảm Cooldown tăng Bonus Work",
                    "🎁 Bonus Daily mỗi ngày" ,
                    "💳 Được vay 120% tổng tài sản",
                    "🎯 +25% tỷ lệ cá hiếm"
                ],
                deals: [
                    "🎁 Tặng ngay 1,500,000 xu"
                ]
            },
            {
                name: "VIP GOLD ⭐⭐⭐",
                originalPrice: "100,000",
                salePrice: "50,000",
                duration: "30 ngày + Tặng 7 ngày",
                benefits: [
                    "💰 +60% xu từ mọi hoạt động",
                    "⏰ Thời gian chờ giảm 60%",
                    "🎣 Câu cá mỗi 2 phút",
                    "✨ EXP câu cá x4",
                    "🎁 Bonus Daily mỗi ngày" ,
                    "⚜️ Giảm Cooldown tăng Bonus Work",
                    "💳 Được vay 150% tổng tài sản",
                    "🎯 +40% tỷ lệ cá hiếm",
                    "👑 Phù hiệu VIP GOLD đặc biệt",
                    "🌟 Ưu tiên hỗ trợ từ ADMIN"
                ],
                deals: [
                    "🎁 Tặng ngay 5,000,000 xu"
                ]
            }
        ];

        let message = "🎊 KHUYẾN MÃI GÓI VIP SIÊU HẤP DẪN 🎊\n";
        message += "⏰ Chỉ còn 3 ngày nữa! Nhanh tay lên!\n";
        message += "━━━━━━━━━━━━━━━━━━\n\n";
        
        for (const pkg of vipPackages) {
            message += `${pkg.name}\n`;
            message += `💵 Giá gốc: ${pkg.originalPrice}đ\n`;
            message += `🏷️ Giá KM: ${pkg.salePrice}đ\n`;
            message += `⏳ Thời hạn: ${pkg.duration}\n\n`;
            message += "📋 Quyền lợi:\n";
            pkg.benefits.forEach(benefit => {
                message += `${benefit}\n`;
            });
            message += "\n🎁 Ưu đãi đặc biệt:\n";
            pkg.deals.forEach(deal => {
                message += `${deal}\n`;
            });
            message += "\n";
        }

        message += "━━━━━━━━━━━━━━━━━━\n";
        message += "📌 HƯỚNG DẪN MUA VIP:\n";
        message += "1. Chuyển khoản qua:\n";
        message += "   - MoMo: 0354683398\n";
        message += "   - Banking VIETINBANK: 0354683398\n";
        message += `2. Nội dung: VIP_[loại]_${senderID}\n`;
        message += "   VD: VIP_GOLD_100xxxx\n\n";
        message += "☎️ LIÊN HỆ ADMIN KHI CẦN HỖ TRỢ\n";
        message += "⚠️ Chỉ chấp nhận thanh toán qua STK trên";
        
        return api.sendMessage(message, threadID, messageID);
    }
};
