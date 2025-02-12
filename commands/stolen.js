const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const { getVIPBenefits } = require('../utils/vipCheck');
const FamilySystem = require('../family/FamilySystem');

const MIN_STEAL_PERCENT = 0.08;
const MAX_STEAL_PERCENT = 0.20;
const MAX_STEAL = 35000;
const MIN_VICTIM_BALANCE = 15000;
const STEAL_COOLDOWN = 900000;
const MAX_PENALTY = 25000;

const stealCooldowns = new Map();
const familySystem = new FamilySystem();

module.exports = {
    name: "stolen",
    dev: "HNT", 
    info: "Trộm tiền từ người khác",
    onPrefix: true,
    dmUser: false,
    usedby: 0,
    usages: "stolen Reply hoặc stolen @Tag\n- Có thể trộm 8-20% số dư của nạn nhân\n- Tối đa 35,000đ\n- Cooldown: 15 phút",
    cooldowns: 5, 

    onLaunch: async ({ api, event }) => {
        const { threadID, senderID } = event;

        try {
            let victimID;
            if (event.type === 'message_reply') {
                victimID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                victimID = Object.keys(event.mentions)[0];
            } else {
                return api.sendMessage("Reply tin nhắn hoặc tag người cần trộm!", event.threadID);
            }

            const victimVipBenefits = getVIPBenefits(victimID);
            if (victimVipBenefits?.stolenProtection >= 1.0) {
                return api.sendMessage(
                    `❌ Không thể trộm từ người này!\n` +
                    `👑 Họ được bảo vệ hoàn toàn bởi ${victimVipBenefits.name}`,
                    threadID
                );
            }

            const vipBenefits = getVIPBenefits(senderID);
            const COOLDOWN = vipBenefits?.stolenCooldown || STEAL_COOLDOWN;

            const now = Date.now();
            const lastStealTime = stealCooldowns.get(senderID) || 0;
            const timeLeft = COOLDOWN - (now - lastStealTime);

            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / 60000);
                return api.sendMessage(
                    `⏳ Vui lòng đợi ${minutes} phút nữa để có thể trộm tiếp!${vipBenefits ? `\n👑 VIP ${vipBenefits.name} giảm thời gian chờ` : ''}`,
                    threadID
                );
            }

            const victimFamily = familySystem.getFamily(victimID);
            const thiefFamily = familySystem.getFamily(senderID);

            const currentHour = new Date().getHours();
            const isNightTime = (currentHour >= 23 || currentHour < 5);
            const longInactive = !victimFamily.lastWorked || (now - victimFamily.lastWorked > 2 * 60 * 60 * 1000);
            const isSleeping = isNightTime && longInactive;

            if (!thiefFamily.home) {
                if (isSleeping) {
                    successChance = 0.7;
                    MAX_STEAL = 15000; 
                } else {
                    return api.sendMessage(
                        "❌ Bạn cần có nhà để thực hiện vụ trộm!\nNếu vô gia cư, bạn chỉ có thể móc túi người đang ngủ (không hoạt động trong 2h và vào khung giờ 23h-5h).",
                        threadID
                    );
                }
            }

            if (!victimFamily.home) {
                if (thiefFamily.home) {
                    return api.sendMessage(
                        "❌ Không thể trộm từ người vô gia cư!",
                        threadID
                    );
                }
            }

            if (victimFamily.home?.upgrades?.includes('security')) {
                return api.sendMessage(
                    "❌ Không thể trộm! Nhà này có hệ thống an ninh.",
                    threadID
                );
            }

            const userBalance = getBalance(event.senderID);
            const victimBalance = getBalance(victimID);
            
            if (victimBalance < MIN_VICTIM_BALANCE) {
                return api.sendMessage(
                    "❌ Đối phương cần ít nhất 15,000đ để có thể trộm!",
                    threadID
                );
            }

            stealCooldowns.set(senderID, now);

            let successChance = 0.5; 
          
            const wealthRatio = userBalance / victimBalance;
            if (wealthRatio < 0.5) successChance += 0.2;
            else if (wealthRatio > 2) successChance -= 0.1;

            if (victimFamily.home.upgrades?.includes('safe')) {
                successChance *= 0.5;
            }

            successChance += (Math.random() * 0.2) - 0.1;

            const success = Math.random() < successChance;

            if (success) {
                const stealPercent = MIN_STEAL_PERCENT + (Math.random() * (MAX_STEAL_PERCENT - MIN_STEAL_PERCENT));
                let stealAmount = Math.min(
                    Math.floor(victimBalance * stealPercent * (1 - (victimVipBenefits?.stolenProtection || 0))),
                    MAX_STEAL
                );

                let stealMessage = "";
                if (!thiefFamily.home) {
                    stealMessage = "Đã lén lục túi lúc nạn nhân đang ngủ! 🤫";
                } else if (victimFamily.home.upgrades?.includes('safe')) {
                    stealMessage = "Đã phá két sắt thành công! 💰";
                } else {
                    stealMessage = "Đã trộm được tiền trong nhà! 💸";
                }

                if (victimVipBenefits?.stolenProtection > 0) {
                    const protectedAmount = Math.floor(victimBalance * stealPercent * victimVipBenefits.stolenProtection);
                    await api.sendMessage(
                        `🛡️ VIP ${victimVipBenefits.name} đã bảo vệ ${protectedAmount.toLocaleString()}đ!`,
                        threadID
                    );
                }

                updateBalance(victimID, -stealAmount);
                updateBalance(event.senderID, stealAmount);
                
                updateQuestProgress(senderID, 'successful_steals', 1);

                const messages = [
                    `🦹‍♂️ ${!thiefFamily.home ? 'Móc túi' : 'Trộm'} thành công!\n${stealMessage}\n└─ Chiếm được: ${stealAmount.toLocaleString()}đ (${Math.floor(stealPercent * 100)}% số dư)`,
                    `💰 ${!thiefFamily.home ? 'Móc túi' : 'Ăn trộm'} thành công!\n${stealMessage}\n└─ Lấy được: ${stealAmount.toLocaleString()}đ (${Math.floor(stealPercent * 100)}% số dư)`,
                    `🎭 ${!thiefFamily.home ? 'Phi vụ móc túi' : 'Phi vụ trộm'} thành công!\n${stealMessage}\n└─ Thu về: ${stealAmount.toLocaleString()}đ (${Math.floor(stealPercent * 100)}% số dư)`
                ];

                return api.sendMessage(messages[Math.floor(Math.random() * messages.length)], threadID);
            } else {
                const penaltyPercent = 0.1 + (Math.random() * 0.1); 
                const calculatedPenalty = Math.floor(victimBalance * penaltyPercent);
                const penalty = Math.min(
                    calculatedPenalty,
                    MAX_PENALTY,
                    userBalance 
                );
                
                if (penalty > 0) {
                    updateBalance(event.senderID, -penalty);
                }

                const messages = [
                    `👮 Bị bắt quả tang!\n└─ Phạt: ${penalty.toLocaleString()}đ`,
                    `🚔 Thất bại và bị phạt!\n└─ Mất: ${penalty.toLocaleString()}đ`,
                    `⚠️ Trộm hụt!\n└─ Bị phạt: ${penalty.toLocaleString()}đ`
                ];

                return api.sendMessage(messages[Math.floor(Math.random() * messages.length)], threadID);
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    }
};
