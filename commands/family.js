const { updateBalance, getBalance } = require('../utils/currencies');
const FamilySystem = require('../family/FamilySystem');
const { MARRIAGE_COST, DIVORCE_COST } = require('../config/family/familyConfig');
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
                    "7. shop - Mua BCS\n" +
                    "8. buy [id] - Mua vật phẩm\n\n" +
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
                    await updateBalance(senderID, -DIVORCE_COST);
                    const divorceResult = await familySystem.divorce(senderID);
                    
                    let message = `💔 Đã ly hôn thành công!\n💰 Chi phí: ${formatNumber(DIVORCE_COST)} Xu`;
                    
                    if (divorceResult.custodyInfo) {
                        const custodyParentName = familySystem.getUserName(divorceResult.custodyInfo.parent);
                        message += `\n👶 Quyền nuôi ${divorceResult.custodyInfo.childCount} đứa con thuộc về ${custodyParentName}`;
                    }
                    
                    return api.sendMessage(message, threadID);
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
                                `💝 Hãy reply tin nhắn này để đặt tên cho bé`,
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
                                    "😔 Tiếc quá! Chưa có tin vui lần này..."),
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
                    const { CONTRACEPTIVES } = require('../config/family/familyConfig');
                    return api.sendMessage(
                        "🏪 CỬA HÀNG BCS 🏪\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        Object.entries(CONTRACEPTIVES).map(([id, item]) =>
                            `${item.name} - ${formatNumber(item.price)}đ\n` +
                            `└ ${item.description}\n` +
                            `└ Để mua, dùng: .family buy ${id}`
                        ).join("\n"),
                        threadID
                    );
                }

                case "buy": {
                    if (!subCommand) {
                        return api.sendMessage("❌ Vui lòng chọn vật phẩm cần mua!", threadID);
                    }

                    const { CONTRACEPTIVES } = require('../config/family/familyConfig');
                    const item = CONTRACEPTIVES[subCommand];

                    if (!item) {
                        return api.sendMessage("❌ Vật phẩm không tồn tại!", threadID);
                    }

                    const balance = await getBalance(senderID);
                    if (balance < item.price) {
                        return api.sendMessage(
                            `❌ Bạn cần ${formatNumber(item.price)}đ để mua ${item.name}!`,
                            threadID
                        );
                    }

                    await updateBalance(senderID, -item.price);
                    familySystem.useContraceptive(senderID);

                    return api.sendMessage(
                        `✅ Đã mua ${item.name} thành công!\n` +
                        `💰 Chi phí: ${formatNumber(item.price)}đ\n` +
                        `⏰ Có tác dụng trong ${item.duration} phút`,
                        threadID
                    );
                }

                default:
                    return api.sendMessage(
                        "❌ Lệnh không hợp lệ!\n" +
                        "💡 Sử dụng: .family [info/marry/divorce/child/temple]",
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
            
            if (r.type === "marriage-confirmation") {
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
