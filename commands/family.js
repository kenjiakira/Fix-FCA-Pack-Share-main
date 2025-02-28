const { updateBalance, getBalance } = require('../utils/currencies');
const FamilySystem = require('../family/FamilySystem');
const { MARRIAGE_COST, DIVORCE_COST } = require('../config/family/familyConfig');
const { SINGLE_TAX_RATE, TAX_INTERVAL } = require('../config/family/taxConfig');
const fs = require('fs');
const path = require('path');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const familySystem = new FamilySystem();

module.exports = {
    name: "family",
    dev: "HNT",
    usedby: 0,
    info: "Hệ thống gia đình",
    onPrefix: true,
    usages: ".family [info/marry/divorce/child/temple]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const command = target[0]?.toLowerCase();
        const subCommand = target[1]?.toLowerCase();

        try {
            if (!command) {
                return api.sendMessage(
                    "👨‍👩‍👧‍👦 GIA ĐÌNH NHỎ 👨‍👩‍👧‍👦\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "1. info - Xem thông tin gia đình\n" +
                    "2. marry [@tag] - Kết hôn\n" +
                    "3. divorce - Ly hôn\n" +
                    "4. love - Động phòng\n" +
                    "5. rename [số thứ tự] [tên mới] - Đổi tên con\n" +
                    "6. temple [số thứ tự] - Gửi con vào chùa tu hành\n\n" +
                    "7. shop - Mua thuốc, BHYT và BCS\n" +
                    "8. buy [id] - Mua vật phẩm\n" +
                    "9. health - Xem tình trạng sức khỏe\n" +
                    "10. home - Quản lý nhà cửa\n" +
                    "11. travel - Du lịch cùng gia đình\n\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "📝 CÁC LỆNH LIÊN QUAN:\n" +
                    "• .garage - Quản lý xe cộ\n" +
                    "• .job - Xin việc làm\n" +
                    "• .study - Học hành, bằng cấp\n" +
                    "• .work - Làm việc kiếm tiền\n\n" +
                    "💡 Các lệnh trên đã được tách riêng,\n" + 
                    "vui lòng sử dụng đúng cú pháp để truy cập",
                    threadID
                );
            }

            const family = familySystem.getFamily(senderID);
            familySystem.updateHappiness(senderID);

            switch (command) {
                case "info": {
                    const marriageInfo = familySystem.getMarriageInfo(senderID);
                    const sharedVehicles = familySystem.getSharedVehicles(senderID);
                    const childrenInfo = familySystem.getChildInfo(senderID);
                    const balance = await getBalance(senderID);

                    let taxInfo = "";
                    if (!family.spouse) {
                        const dailyTax = Math.floor(balance * SINGLE_TAX_RATE);
                        const taxData = JSON.parse(fs.readFileSync(path.join(__dirname, 'json/tax.json'), 'utf8'));
                        const lastCollection = taxData.lastCollection[senderID] || 0;
                        const nextCollection = lastCollection + TAX_INTERVAL;
                        const hoursUntilTax = Math.max(0, Math.ceil((nextCollection - Date.now()) / (1000 * 60 * 60)));

                        taxInfo = "╠═ 💸THUẾ ĐỘC THÂN\n" +
                                `║  ▸ Mức thuế: ${SINGLE_TAX_RATE * 100}%/ngày\n` +
                                `║  ▸ Số tiền: ${formatNumber(dailyTax)} Xu/ngày\n` +
                                `║  ▸ Thu sau: ${hoursUntilTax} giờ\n` +
                                "║\n";
                    }

                    let childrenDisplay = "";
                    if (Array.isArray(childrenInfo) && childrenInfo.length > 0) {
                        childrenDisplay = "╠═ 👶CON CÁI\n" +
                            childrenInfo.map((child, index) => 
                                `║  ▸ ${index + 1}. ${child.gender} ${child.name}\n` +
                                `║    └ Tuổi: ${child.age}\n` +
                                `║    └ Hạnh phúc: ${child.happiness}%`
                            ).join("\n") + "\n║\n";
                    }

                    return api.sendMessage(
                        "╔═ 『 THÔNG TIN 』 ═╗\n" +
                        "║║\n" +
                        "╠═ 👤CÁ NHÂN\n" +
                        `║  ▸ Tên: ${familySystem.getUserName(senderID)}\n` +
                        `║  ▸ ID: ${senderID}\n` +
                        `║  ▸ Học vấn: ${familySystem.getEducationInfo(senderID)}\n` +
                        `║  ▸ Nghề nghiệp: ${familySystem.getJobInfo(senderID)}\n` +
                        `║  ▸ Sức khỏe: ${familySystem.getHealth(senderID)}%\n` +
                        "║\n" +
                        "╠═ 💑HÔN NHÂN\n" +
                        `║  ▸ Bạn đời: ${marriageInfo.spouse}\n` +
                        `║  ▸ Độ hạnh phúc: ${marriageInfo.happiness}%\n` +
                        `║  ▸ Số con: ${marriageInfo.childCount} đứa\n` +
                        "║\n" +
                        "╠═ 🚗 PHƯƠNG TIỆN\n" +
                        (Object.keys(sharedVehicles || {}).length > 0 ? 
                            Object.entries(sharedVehicles).map(([carId, vehicle]) => {
                                const { CARS, BRANDS } = require('../config/family/carConfig');
                                const car = CARS[carId];
                                return `║  ▸ ${BRANDS[car.brand]} ${car.name}\n` +
                                       `║    └ Độ bền: ${vehicle.durability.toFixed(1)}%`;
                            }).join("\n") : 
                            "║  ▸ Chưa có phương tiện\n"
                        ) +
                        "║\n" +
                        childrenDisplay +
                        taxInfo +
                        "╠═ 🏠 NHÀ CỬA\n" +
                        (marriageInfo.home ? 
                            `║  ▸ Loại nhà: ${marriageInfo.home.name}\n` +
                            `║  ▸ Tình trạng: ${marriageInfo.home.condition}%\n` +
                            `║  ▸ Hạnh phúc: +${marriageInfo.home.happiness}%\n` +
                            `║  ▸ Sức chứa: ${marriageInfo.home.capacity} người\n` +
                            (marriageInfo.home.maintenanceNeeded ? 
                                `║  ▸ ⚠️ Cần bảo dưỡng! (${marriageInfo.home.daysSinceLastMaintenance} ngày)\n` : 
                                `║  ▸ 🔧 Bảo dưỡng sau: ${30 - marriageInfo.home.daysSinceLastMaintenance} ngày\n`) :
                            "║  ▸ Chưa có nhà ở\n"
                        ) +
                        "║\n" +
                        "╚═══════════════╝",
                        threadID
                    );
                }

                case "marry": {
                    const mention = Object.keys(event.mentions)[0];
                    if (!mention) {
                        return api.sendMessage("❌ Vui lòng tag người bạn muốn cưới!", threadID);
                    }

                    const proposerFamily = familySystem.getFamily(senderID);
                    if (proposerFamily.spouse) {
                        return api.sendMessage("❌ Bạn đã kết hôn rồi, không thể cầu hôn người khác!", threadID);
                    }

                    const targetFamily = familySystem.getFamily(mention);
                    if (targetFamily.spouse) {
                        return api.sendMessage("❌ Người này đã kết hôn với người khác rồi!", threadID);
                    }

                    const balance = await getBalance(senderID);
                    if (balance < MARRIAGE_COST) {
                        return api.sendMessage(
                            `❌ Bạn cần ${formatNumber(MARRIAGE_COST)} Xu để kết hôn!`,
                            threadID
                        );
                    }
                    await updateBalance(senderID, -MARRIAGE_COST);
                    const user1Name = familySystem.getUserName(senderID);
                    const user2Name = familySystem.getUserName(mention);

                    const confirmMsg = await api.sendMessage(
                        `💍 ${user1Name} muốn kết hôn với bạn.\nReply "yes" để chấp nhận, hoặc "no" để từ chối.`,
                        threadID
                    );

                    global.client.onReply.push({
                        name: this.name,
                        messageID: confirmMsg.messageID,
                        author: mention,
                        type: "marriage-confirmation",
                        proposerID: senderID,
                        proposerName: user1Name
                    });

                    api.sendMessage(
                        `💌 Đã gửi lời cầu hôn đến ${user2Name}, chờ phản hồi...`,
                        threadID
                    );
                    break;
                }
                
                case "divorce": {
                    if (!family.spouse) {
                        return api.sendMessage("❌ Bạn chưa kết hôn!", threadID);
                    }
                    const balance = await getBalance(senderID);
                    if (balance < DIVORCE_COST) {
                        return api.sendMessage(
                            `❌ Bạn cần ${formatNumber(DIVORCE_COST)} Xu để ly hôn!`,
                            threadID
                        );
                    }

                    const spouseName = familySystem.getUserName(family.spouse);
                    const userName = familySystem.getUserName(senderID);

                    const confirmMsg = await api.sendMessage(
                        `💔 ${userName} muốn ly hôn với bạn.\n` +
                        `💰 Chi phí ly hôn: ${formatNumber(DIVORCE_COST)} Xu\n` +
                        `Reply "yes" để đồng ý ly hôn, hoặc "no" để từ chối.`,
                        threadID
                    );

                    global.client.onReply.push({
                        name: this.name,
                        messageID: confirmMsg.messageID,
                        author: family.spouse,
                        type: "divorce-confirmation",
                        requesterID: senderID,
                        requesterName: userName,
                        divorceCost: DIVORCE_COST
                    });

                    return api.sendMessage(
                        `💌 Đã gửi yêu cầu ly hôn đến ${spouseName}, chờ phản hồi...`,
                        threadID
                    );
                }

                case "love": {
                    if (!family.spouse) {
                        return api.sendMessage("❌ Bạn cần kết hôn trước!", threadID);
                    }

                    try {
                        const spouseName = familySystem.getUserName(family.spouse);
                        
                        if (!familySystem.canHaveNewBaby(senderID)) {
                            return api.sendMessage(
                                "❌ Vợ chồng cần nghỉ ngơi 10 phút sau mỗi lần!",
                                threadID
                            );
                        }

                        await familySystem.intimate(senderID);
                        
                        const happinessIncrease = Math.floor(Math.random() * 5) + 5; // Random 5-10%
                        const healthIncrease = Math.floor(Math.random() * 3) + 3; // Random 3-5%
                        await familySystem.increaseHappiness(senderID, happinessIncrease);
                        await familySystem.increaseHappiness(family.spouse, happinessIncrease);
                        await familySystem.increaseHealth(senderID, healthIncrease);
                        await familySystem.increaseHealth(family.spouse, healthIncrease);
                        
                        const intimateMessages = [
                            "💕 pap pap pap👏👏 Một đêm ngọt ngào với ${spouseName}...",
                            "💝 Căn phòng ngập tràn tiếng thở dài...",
                            "💖 pap pap pap👏👏 Một đêm đáng nhớ cùng ${spouseName}...",
                            "💓 Cùng ${spouseName} tạo nên khoảnh khắc đặc biệt... pap pap pap👏👏"
                        ];
                        
                        const randomMsg = intimateMessages[Math.floor(Math.random() * intimateMessages.length)]
                            .replace("${spouseName}", spouseName);

                        const hasContraceptive = family.contraceptiveUntil && family.contraceptiveUntil > Date.now();

                        if (!hasContraceptive && Math.random() < 0.8) {
                            const babyGender = Math.random() < 0.5 ? "👶 Bé trai" : "👶 Bé gái";
                            const confirmMsg = await api.sendMessage(
                                `${randomMsg}\n\n` +
                                `🎊 CHÚC MỪNG! Gia đình có thêm ${babyGender}!\n` +
                                `💝 Hãy reply tin nhắn này để đặt tên cho bé\n` +
                                `💕 Độ hạnh phúc tăng ${happinessIncrease}%\n` +
                                `❤️ Sức khỏe tăng ${healthIncrease}%`,
                                threadID
                            );

                            global.client.onReply.push({
                                name: this.name,
                                messageID: confirmMsg.messageID,
                                author: senderID,
                                type: "baby-naming",
                                spouseName: spouseName,
                                isSpouse: family.spouse
                            });
                        } else {
                            return api.sendMessage(
                                `${randomMsg}\n\n` +
                                (hasContraceptive ? 
                                    "🎈 Đã sử dụng BCS nên không có tin vui..." :
                                    "😔 Tiếc quá! Chưa có tin vui lần này...") +
                                `\n💕 Độ hạnh phúc tăng ${happinessIncrease}%\n` +
                                `❤️ Sức khỏe tăng ${healthIncrease}%`,
                                threadID
                            );
                        }

                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID);
                    }
                    break;
                }

                case "rename": {
                    const index = parseInt(subCommand) - 1;
                    const newName = target.slice(2).join(" ");
                    
                    if (isNaN(index) || !newName) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập đúng cú pháp:\n.family rename [số thứ tự] [tên mới]",
                            threadID
                        );
                    }

                    try {
                        const child = await familySystem.renameChild(senderID, index, newName);
                        return api.sendMessage(
                            `✨ Đổi tên thành công!\n` +
                            `${child.gender} ${child.name}\n` +
                            `💝 Biệt danh: ${child.nickname}`,
                            threadID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ ${error.message}`, threadID);
                    }
                }
                
                case "temple": {
                    const index = parseInt(subCommand) - 1;
                    
                    if (isNaN(index)) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập đúng cú pháp:\n.family temple [số thứ tự]",
                            threadID
                        );
                    }

                    try {
                        const result = await familySystem.sendChildToTemple(senderID, index);
                        return api.sendMessage(
                            `🙏 Đã gửi ${result.gender} ${result.name} vào chùa tu hành\n` +
                            `💝 Cầu mong ${result.name} sẽ có một tương lai tốt đẹp trên con đường tu tập`,
                            threadID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ ${error.message}`, threadID);
                    }
                }

                case "shop": {
                    const { CONTRACEPTIVES, MEDICINES, INSURANCE } = require('../config/family/familyConfig');
                    
                    if (!subCommand) {
                        return api.sendMessage(
                            "🏪 CỬA HÀNG 🏪\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "1️⃣ .family shop med - Thuốc men\n" +
                            "2️⃣ .family shop ins - Bảo hiểm\n" +
                            "3️⃣ .family shop bcs - Bao cao su\n\n" +
                            "💡 Chọn danh mục để xem chi tiết",
                            threadID
                        );
                    }

                    let items;
                    let title;
                    let prefix;

                    switch (subCommand) {
                        case "med":
                            items = MEDICINES;
                            title = "💊 THUỐC MEN";
                            prefix = "med";
                            break;
                        case "ins":
                            items = INSURANCE;
                            title = "🏥 BẢO HIỂM";
                            prefix = "ins";
                            break;
                        case "bcs":
                            items = CONTRACEPTIVES;
                            title = "🎈 BCS";
                            prefix = "bcs";
                            break;
                        default:
                            return api.sendMessage("❌ Danh mục không hợp lệ!", threadID);
                    }

                    let message = `${title}\n━━━━━━━━━━━━━━━━━━\n\n`;
                    Object.entries(items).forEach(([id, item], index) => {
                        message += `${index + 1}. ${item.name}\n`;
                        message += `💰 Giá: ${formatNumber(item.price)} xu\n`;
                        message += `📝 ${item.description}\n`;
                        if (item.duration) {
                            message += `⏰ Thời hạn: ${item.duration} ${item.type === 'health' ? 'ngày' : 'phút'}\n`;
                        }
                        if (item.discount) {
                            message += `🎉 Giảm giá: ${item.discount}%\n`;
                        }
                        message += `🛍️ Mua: .family buy ${prefix} ${index + 1}\n\n`;
                    });

                    return api.sendMessage(message, threadID);
                }

                case "health": {
                    const health = familySystem.getHealth(senderID);
                    const insuranceStatus = familySystem.getInsuranceStatus(senderID);
                    
                    let message = "╔═ 『 TÌNH TRẠNG SỨC KHỎE & BẢO HIỂM 』 ═╗\n" +
                                "║\n" +
                                `║ ❤️ Sức khỏe: ${health}%\n` +
                                "║\n" +
                                "╠═ 🏥 BẢO HIỂM Y TẾ\n";
                    
                    if (insuranceStatus.health) {
                        message += `║  ▸ Trạng thái: Đang có hiệu lực\n` +
                                 `║  ▸ Giảm giá: ${insuranceStatus.health.discount}% chi phí khám chữa bệnh\n` +
                                 `║  ▸ Còn lại: ${insuranceStatus.health.daysLeft} ngày\n`;
                    } else {
                        message += "║  ▸ Trạng thái: Chưa có bảo hiểm\n" +
                                 "║  ▸ Mua BHYT để được giảm chi phí khám chữa bệnh\n";
                    }
                    
                    message += "║\n╠═ 🚗 BẢO HIỂM Ô TÔ\n";
                    if (insuranceStatus.car) {
                        message += `║  ▸ Trạng thái: Đang có hiệu lực\n` +
                                 `║  ▸ Giảm giá: ${insuranceStatus.car.discount}% chi phí sửa chữa\n` +
                                 `║  ▸ Còn lại: ${insuranceStatus.car.daysLeft} ngày\n`;
                    } else {
                        message += "║  ▸ Trạng thái: Chưa có bảo hiểm\n";
                    }

                    message += "║\n╠═ 🛵 BẢO HIỂM XE MÁY\n";
                    if (insuranceStatus.bike) {
                        message += `║  ▸ Trạng thái: Đang có hiệu lực\n` +
                                 `║  ▸ Giảm giá: ${insuranceStatus.bike.discount}% chi phí sửa chữa\n` +
                                 `║  ▸ Còn lại: ${insuranceStatus.bike.daysLeft} ngày\n`;
                    } else {
                        message += "║  ▸ Trạng thái: Chưa có bảo hiểm\n";
                    }
                    
                    message += "║\n╚═══════════════╝";
                    
                    return api.sendMessage(message, threadID);
                }

                case "buy": {
                    if (!subCommand || !target[2]) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập đúng cú pháp:\n" +
                            ".family buy [med/ins/bcs] [số thứ tự]",
                            threadID
                        );
                    }

                    const { CONTRACEPTIVES, MEDICINES, INSURANCE } = require('../config/family/familyConfig');
                    const index = parseInt(target[2]) - 1;
                    let items;
                    let category;

                    switch (subCommand) {
                        case "med":
                            items = Object.values(MEDICINES);
                            category = "MEDICINES";
                            break;
                        case "ins":
                            items = Object.values(INSURANCE);
                            category = "INSURANCE";
                            break;
                        case "bcs":
                            items = Object.values(CONTRACEPTIVES);
                            category = "CONTRACEPTIVES";
                            break;
                        default:
                            return api.sendMessage("❌ Danh mục không hợp lệ!", threadID);
                    }

                    if (isNaN(index) || index < 0 || index >= items.length) {
                        return api.sendMessage("❌ Số thứ tự không hợp lệ!", threadID);
                    }

                    const item = items[index];
                    const itemId = Object.keys(eval(category))[index];

                    const balance = await getBalance(senderID);
                    if (balance < item.price) {
                        return api.sendMessage(
                            `❌ Bạn cần ${formatNumber(item.price)} xu để mua ${item.name}!`,
                            threadID
                        );
                    }

                    await updateBalance(senderID, -item.price);

                    switch (category) {
                        case "CONTRACEPTIVES":
                            familySystem.useContraceptive(senderID);
                            return api.sendMessage(
                                `✅ Đã mua ${item.name} thành công!\n` +
                                `💰 Chi phí: ${formatNumber(item.price)} xu\n` +
                                `⏰ Có tác dụng trong ${item.duration} phút`,
                                threadID
                            );
                        case "MEDICINES":
                            const healthIncrease = item.healthBoost || 20;
                            await familySystem.increaseHealth(senderID, healthIncrease);
                            return api.sendMessage(
                                `✅ Đã sử dụng ${item.name} thành công!\n` +
                                `💰 Chi phí: ${formatNumber(item.price)} xu\n` +
                                `❤️ Sức khỏe +${healthIncrease}%`,
                                threadID
                            );
                        case "INSURANCE":
                            await familySystem.activateInsurance(senderID, item.type, item.duration, item.discount);
                            let message = `✅ Đã mua ${item.name} thành công!\n` +
                                        `💰 Chi phí: ${formatNumber(item.price)} xu\n` +
                                        `⏰ Có hiệu lực trong ${item.duration} ngày\n`;
                            
                            switch (item.type) {
                                case 'health':
                                    message += `🏥 Giảm ${item.discount}% chi phí khám chữa bệnh`;
                                    break;
                                case 'car':
                                    message += `🚗 Giảm ${item.discount}% chi phí sửa chữa ô tô`;
                                    break;
                                case 'bike':
                                    message += `🛵 Giảm ${item.discount}% chi phí sửa chữa xe máy`;
                                    break;
                            }
                            
                            return api.sendMessage(message, threadID);
                    }
                }

                case "travel": {
                    if (!subCommand) {
                        return api.sendMessage(
                            "🌎 DU LỊCH GIA ĐÌNH 🌎\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "1. .family travel list - Xem các điểm du lịch\n" +
                            "2. .family travel start [địa điểm] - Bắt đầu chuyến đi\n" +
                            "3. .family travel status - Xem trạng thái chuyến đi\n\n" +
                            "💡 Lưu ý:\n" +
                            "• Chi phí phụ thuộc vào số lượng thành viên\n" +
                            "• Cần nghỉ ngơi 7 ngày giữa các chuyến đi\n" +
                            "• Độ hạnh phúc tăng sau mỗi chuyến đi",
                            threadID
                        );
                    }

                    switch (subCommand) {
                        case "list": {
                            const destinations = familySystem.getAllDestinations();
                            let message = "🗺️ ĐIỂM DU LỊCH 🗺️\n━━━━━━━━━━━━━━━━━━\n\n";
                            
                            Object.entries(destinations).forEach(([id, dest]) => {
                                const cost = familySystem.calculateTravelCost(senderID, id);
                                message += `${dest.name}\n`;
                                message += `💰 Chi phí: ${formatNumber(cost)} xu\n`;
                                message += `📝 ${dest.description}\n`;
                                message += `⏰ Thời gian: ${dest.duration}\n`;
                                message += `💕 Hạnh phúc: +${dest.happiness}%\n`;
                                message += `🛫 Đi ngay: .family travel start ${id}\n\n`;
                            });

                            return api.sendMessage(message, threadID);
                        }

                        case "start": {
                            const destination = target[2]?.toLowerCase();
                            if (!destination) {
                                return api.sendMessage(
                                    "❌ Vui lòng chọn điểm đến!\n" +
                                    "💡 Xem danh sách: .family travel list",
                                    threadID
                                );
                            }

                            const destInfo = familySystem.getDestinationInfo(destination);
                            if (!destInfo) {
                                return api.sendMessage("❌ Điểm đến không hợp lệ!", threadID);
                            }

                            const travelCheck = familySystem.canTravel(senderID);
                            if (!travelCheck.canTravel) {
                                if (travelCheck.reason === 'onTrip') {
                                    const dest = familySystem.getDestinationInfo(travelCheck.destination);
                                    return api.sendMessage(
                                        `❌ Gia đình đang trong chuyến du lịch tại ${dest.name}\n` +
                                        `⏰ Còn ${travelCheck.remainingTime} giờ nữa mới về`,
                                        threadID
                                    );
                                } else if (travelCheck.reason === 'cooldown') {
                                    return api.sendMessage(
                                        `❌ Gia đình cần nghỉ ngơi thêm ${travelCheck.remainingTime} giờ nữa\n` +
                                        "💡 Mỗi chuyến đi cách nhau 7 ngày",
                                        threadID
                                    );
                                }
                            }

                            const cost = familySystem.calculateTravelCost(senderID, destination);
                            const balance = await getBalance(senderID);
                            if (balance < cost) {
                                return api.sendMessage(
                                    `❌ Bạn cần ${formatNumber(cost)} xu cho chuyến đi!\n` +
                                    `💰 Hiện có: ${formatNumber(balance)} xu`,
                                    threadID
                                );
                            }

                            try {
                                await updateBalance(senderID, -cost);
                                const dest = familySystem.startTravel(senderID, destination);
                                return api.sendMessage(
                                    `🌎 Gia đình bắt đầu chuyến du lịch tại ${dest.name}!\n` +
                                    `💰 Chi phí: ${formatNumber(cost)} xu\n` +
                                    `⏰ Thời gian: ${dest.duration}\n` +
                                    `💕 Hạnh phúc: +${dest.happiness}% khi về\n\n` +
                                    `💡 Kiểm tra: .family travel status`,
                                    threadID
                                );
                            } catch (error) {
                                return api.sendMessage(`❌ ${error.message}`, threadID);
                            }
                        }

                        case "status": {
                            const status = familySystem.getTravelStatus(senderID);
                            if (!status) {
                                return api.sendMessage(
                                    "❌ Gia đình không trong chuyến du lịch nào!",
                                    threadID
                                );
                            }

                            if (status.remainingHours <= 0) {
                                const happiness = familySystem.endTravel(senderID);
                                return api.sendMessage(
                                    `🎉 Chuyến du lịch tại ${status.destination.name} đã kết thúc!\n` +
                                    `💕 Độ hạnh phúc tăng ${happiness}%\n\n` +
                                    "💡 Gia đình cần nghỉ ngơi 7 ngày trước chuyến đi tiếp theo",
                                    threadID
                                );
                            }

                            return api.sendMessage(
                                `🌎 Đang du lịch tại ${status.destination.name}\n` +
                                `⏰ Còn ${status.remainingHours} giờ nữa mới về\n` +
                                `💕 Hạnh phúc: +${status.destination.happiness}% khi về`,
                                threadID
                            );
                        }

                        default:
                            return api.sendMessage(
                                "❌ Lệnh không hợp lệ!\n" +
                                "💡 Sử dụng: .family travel [list/start/status]",
                                threadID
                            );
                    }
                }

                case "home": {
                    const { HOMES } = require('../config/family/homeConfig');
                    
                    if (!subCommand) {
                        return api.sendMessage(
                            "🏠 QUẢN LÝ NHÀ CỬA 🏠\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "1. .family home list - Xem các loại nhà\n" +
                            "2. .family home buy [loại] - Mua nhà\n" +
                            "3. .family home sell - Bán nhà\n" +
                            "4. .family home repair - Sửa chữa nhà\n\n" +
                            "💡 Lưu ý:\n" +
                            "• Nhà cần bảo dưỡng định kỳ mỗi 30 ngày\n" +
                            "• Độ hạnh phúc phụ thuộc vào điều kiện nhà\n" +
                            "• Giá bán = 70% giá gốc (trừ khấu hao)",
                            threadID
                        );
                    }

                    switch (subCommand) {
                        case "list": {
                            let message = "🏘️ CÁC LOẠI NHÀ 🏘️\n━━━━━━━━━━━━━━━━━━\n\n";
                            Object.entries(HOMES).forEach(([type, home]) => {
                                message += `${home.name}\n`;
                                message += `💰 Giá: ${formatNumber(home.price)} xu\n`;
                                message += `📝 ${home.description}\n`;
                                message += `💕 Hạnh phúc cơ bản: +${home.happiness}%\n`;
                                message += `👥 Sức chứa: ${home.capacity} người\n`;
                                message += `🛍️ Mua: .family home buy ${type}\n\n`;
                            });
                            return api.sendMessage(message, threadID);
                        }

                        case "buy": {
                            const homeType = target[2]?.toLowerCase();
                            if (!homeType || !HOMES[homeType]) {
                                return api.sendMessage(
                                    "❌ Vui lòng chọn loại nhà hợp lệ!\n" +
                                    "💡 Xem danh sách nhà: .family home list",
                                    threadID
                                );
                            }

                            const home = HOMES[homeType];
                            const balance = await getBalance(senderID);
                            if (balance < home.price) {
                                return api.sendMessage(
                                    `❌ Bạn cần ${formatNumber(home.price)} xu để mua ${home.name}!\n` +
                                    `💰 Hiện có: ${formatNumber(balance)} xu`,
                                    threadID
                                );
                            }

                            try {
                                await familySystem.homeSystem.buyHome(senderID, homeType);
                                await updateBalance(senderID, -home.price);
                                return api.sendMessage(
                                    `🎉 Chúc mừng! Bạn đã mua ${home.name} thành công!\n` +
                                    `💰 Chi phí: ${formatNumber(home.price)} xu\n` +
                                    `💕 Hạnh phúc cơ bản: +${home.happiness}%\n` +
                                    `👥 Sức chứa: ${home.capacity} người\n\n` +
                                    `💡 Lưu ý:\n` +
                                    `• Nhà cần bảo dưỡng định kỳ mỗi 30 ngày\n` +
                                    `• Độ hạnh phúc thực tế phụ thuộc vào điều kiện nhà`,
                                    threadID
                                );
                            } catch (error) {
                                return api.sendMessage(`❌ ${error.message}`, threadID);
                            }
                        }

                        case "sell": {
                            try {
                                const sellPrice = await familySystem.homeSystem.sellHome(senderID);
                                await updateBalance(senderID, sellPrice);
                                return api.sendMessage(
                                    `🏠 Đã bán nhà thành công!\n` +
                                    `💰 Số tiền nhận được: ${formatNumber(sellPrice)} xu\n` +
                                    `💡 Giá đã trừ khấu hao theo thời gian và điều kiện nhà`,
                                    threadID
                                );
                            } catch (error) {
                                return api.sendMessage(`❌ ${error.message}`, threadID);
                            }
                        }

                        case "repair": {
                            try {
                                const repairCost = await familySystem.homeSystem.repair(senderID);
                                const balance = await getBalance(senderID);
                                
                                if (balance < repairCost) {
                                    return api.sendMessage(
                                        `❌ Bạn cần ${formatNumber(repairCost)} xu để sửa chữa nhà!\n` +
                                        `💰 Hiện có: ${formatNumber(balance)} xu`,
                                        threadID
                                    );
                                }

                                await updateBalance(senderID, -repairCost);
                                return api.sendMessage(
                                    `🔧 Đã sửa chữa và bảo dưỡng nhà thành công!\n` +
                                    `💰 Chi phí: ${formatNumber(repairCost)} xu\n` +
                                    `🏠 Tình trạng nhà: 100%\n` +
                                    `⏰ Lần bảo dưỡng tiếp theo: 30 ngày sau`,
                                    threadID
                                );
                            } catch (error) {
                                return api.sendMessage(`❌ ${error.message}`, threadID);
                            }
                        }

                        default:
                            return api.sendMessage(
                                "❌ Lệnh không hợp lệ!\n" +
                                "💡 Sử dụng: .family home [list/buy/sell/repair]",
                                threadID
                            );
                    }
                }

                default:
                    return api.sendMessage(
                        "❌ Lệnh không hợp lệ!\n" +
                        "💡 Sử dụng: .family [info/marry/divorce/child/temple/shop/buy/health/home/travel]",
                        threadID
                    );
            }
        } catch (error) {
            console.error("Family command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        
        const getUserName = (userID) => {
            const userDataPath = path.join(__dirname, '../events/cache/userData.json');
            try {
                const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
                return userData[userID]?.name || userID;
            } catch (error) {
                console.error('Error reading userData:', error);
                return userID;
            }
        };

        const reply = global.client.onReply.find(r => {
            if (r.messageID !== event.messageReply.messageID) return false;
            
            if (r.type === "marriage-confirmation" || r.type === "divorce-confirmation") {
                return r.author === senderID;
            } else if (r.type === "baby-confirmation" || r.type === "baby-naming") {
                const family = familySystem.getFamily(senderID);
                return (senderID === r.author || senderID === family.spouse);
            }
            return false;
        });

        if (!reply) return;
        
        global.client.onReply = global.client.onReply.filter(r => r.messageID !== reply.messageID);

        switch(reply.type) {
            case "marriage-confirmation":
                try {
                    const response = body.toLowerCase().trim();
                    if (response === "yes" || response === "accept" || response === "1") {
                        await familySystem.confirmMarriage(reply.proposerID, senderID);
                        const acceptorName = getUserName(senderID);
                        
                        return api.sendMessage(
                            `💕 ${acceptorName} đã đồng ý kết hôn với ${reply.proposerName}!\n` +
                            `💝 Hạnh phúc: 100%`,
                            threadID
                        );
                    } else {
                        return api.sendMessage(
                            `💔 ${getUserName(senderID)} đã từ chối lời cầu hôn của ${reply.proposerName}!`,
                            threadID
                        );
                    }
                } catch (error) {
                    console.error("Marriage confirmation error:", error);
                    return api.sendMessage(
                        `❌ Lỗi: ${error.message}`,
                        threadID
                    );
                }
                break;

            case "divorce-confirmation":
                try {
                    const response = body.toLowerCase().trim();
                    if (response === "yes" || response === "accept" || response === "1") {
                        await updateBalance(reply.requesterID, -reply.divorceCost);
                        const divorceResult = await familySystem.divorce(reply.requesterID);
                        
                        let message = `💔 Đã ly hôn thành công!\n💰 Chi phí: ${formatNumber(reply.divorceCost)} Xu`;
                        
                        if (divorceResult.custodyInfo) {
                            const custodyParentName = familySystem.getUserName(divorceResult.custodyInfo.parent);
                            message += `\n👶 Quyền nuôi ${divorceResult.custodyInfo.childCount} đứa con thuộc về ${custodyParentName}`;
                        }
                        
                        return api.sendMessage(message, threadID);
                    } else {
                        return api.sendMessage(
                            `💝 ${getUserName(senderID)} đã từ chối yêu cầu ly hôn của ${reply.requesterName}!`,
                            threadID
                        );
                    }
                } catch (error) {
                    console.error("Divorce confirmation error:", error);
                    return api.sendMessage(
                        `❌ Lỗi: ${error.message}`,
                        threadID
                    );
                }
                break;

            case "baby-confirmation":
                {
                    const response = body.toLowerCase().trim();
                    if (["yes", "1", "ok", "đồng ý"].includes(response)) {
                        try {
                            const family = familySystem.getFamily(senderID);
                            
                            if (!familySystem.canHaveNewBaby(senderID)) {
                                return api.sendMessage(
                                    "❌ Bạn cần đợi 3 ngày sau mới có thể sinh em bé tiếp!",
                                    threadID
                                );
                            }

                            const nameMsg = await api.sendMessage(
                                "💝 Hãy đặt tên cho em bé (Reply tin nhắn này)\n" +
                                "Lưu ý: Tên không được chứa số và ký tự đặc biệt",
                                threadID
                            );

                            global.client.onReply.push({
                                name: this.name,
                                messageID: nameMsg.messageID,
                                author: senderID,
                                type: "baby-naming",
                                spouseName: reply.spouseName
                            });

                        } catch (error) {
                            return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID);
                        }
                    }
                }
                break;

            case "baby-naming":
                {
                    const babyName = body.trim();
                    if (!familySystem.validateBabyName(babyName)) {
                        return api.sendMessage(
                            "❌ Tên không hợp lệ! Tên phải từ 2-20 ký tự và không chứa số hoặc ký tự đặc biệt",
                            threadID
                        );
                    }

                    try {
                        if (senderID !== reply.author && senderID !== reply.isSpouse) {
                            return api.sendMessage("❌ Chỉ vợ/chồng mới có thể đặt tên cho bé!", threadID);
                        }

                        const child = await familySystem.addChild(senderID, babyName);
                        return api.sendMessage(
                            `👶 Chúc mừng gia đình có thêm thành viên mới!\n` +
                            `${child.gender} Tên bé: ${child.name}\n` +
                            `💝 Biệt danh: ${child.nickname}\n` +
                            `💖 Chúc bé luôn khỏe mạnh và hạnh phúc!`,
                            threadID);
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID);
                    }
                }
                break;
        }
    },
};