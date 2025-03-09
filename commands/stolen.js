const fs = require("fs");
const path = require("path");
const { getBalance, updateBalance } = require("../utils/currencies");
const { getVIPBenefits } = require("../vip/vipCheck");
const cooldowns = new Map();

module.exports = {
  name: "stolen",
  dev: "HNT",
  usedby: 0,
  category: "Games",
  info: "Ăn trộm tiền từ người khác",
  onPrefix: true,
  usages: "stolen @tag hoặc reply tin nhắn",
  cooldowns: 0,

  onLaunch: async function ({ api, event }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    const cooldownTime = 300000;
    const currentTime = Date.now();
    const userCooldown = cooldowns.get(senderID) || 0;

    if (currentTime - userCooldown < cooldownTime) {
      const remainingTime = Math.ceil(
        (userCooldown + cooldownTime - currentTime) / 60000
      );
      return api.sendMessage(
        `🕒 Bạn cần đợi ${remainingTime} phút nữa mới có thể tiếp tục trộm cắp!`,
        threadID,
        messageID
      );
    }

    let victimID;
    if (messageReply) {
      victimID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      victimID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage(
        "❌ Bạn cần tag hoặc reply tin nhắn của người mà bạn muốn trộm tiền!",
        threadID,
        messageID
      );
    }

    if (victimID === senderID) {
      return api.sendMessage(
        "❓ Bạn không thể trộm tiền của chính mình!",
        threadID,
        messageID
      );
    }

    let thiefName, victimName;
    try {
      const userInfo = await api.getUserInfo([senderID, victimID]);
      thiefName = userInfo[senderID].name || "Bạn";
      victimName = userInfo[victimID].name || "Nạn nhân";
    } catch (e) {
      thiefName = "bạn";
      victimName = "Nạn nhân";
    }

    const victimVipBenefits = getVIPBenefits(victimID);
    console.log(
      `[STOLEN DEBUG] Victim ${victimID} VIP benefits:`,
      victimVipBenefits
        ? `Package: ${victimVipBenefits.name}, Protection: ${victimVipBenefits.stolenProtection}`
        : "No VIP"
    );

    if (
      victimVipBenefits &&
      (victimVipBenefits.stolenProtection >= 1.0 ||
        victimVipBenefits.packageId === 3 ||
        victimVipBenefits.name === "VIP GOLD")
    ) {
      console.log(
        `[STOLEN DEBUG] Gold VIP protection activated for ${victimID}`
      );

      const penaltyPercent = Math.random() * 15 + 5;
      const thiefBalance = await getBalance(senderID);
      const penalty = Math.floor(thiefBalance * (penaltyPercent / 100));

      await updateBalance(senderID, -penalty);

      const vipFailureMessages = [
        `⛔ ${thiefName} không thể trộm từ ${victimName} vì họ có VIP GOLD bảo vệ!\nHệ thống bảo vệ đã phạt bạn ${formatNumber(
          penalty
        )} $!`,
        `🔐 ${victimName} được bảo vệ bởi khiên VIP GOLD! ${thiefName} bị phát hiện và bị phạt ${formatNumber(
          penalty
        )} $!`,
        `🛡️ VIP SHIELD của ${victimName} đã kích hoạt! ${thiefName} bị hệ thống bảo vệ phạt ${formatNumber(
          penalty
        )} $!`,
        `👑 Không thể trộm từ người dùng VIP GOLD! ${thiefName} đã bị phạt ${formatNumber(
          penalty
        )} $!`,
      ];

      const randomMessage =
        vipFailureMessages[
          Math.floor(Math.random() * vipFailureMessages.length)
        ];
      cooldowns.set(senderID, currentTime);
      return api.sendMessage(randomMessage, threadID, messageID);
    }

    if (victimVipBenefits && victimVipBenefits.stolenProtection > 0) {
      const protectionRoll = Math.random();
      console.log(
        `[STOLEN DEBUG] VIP protection roll for ${victimID}: ${protectionRoll} vs ${victimVipBenefits.stolenProtection}`
      );

      if (protectionRoll < victimVipBenefits.stolenProtection) {
        const vipTierName =
          victimVipBenefits.name ||
          (victimVipBenefits.stolenProtection >= 0.6 ? "SILVER" : "BRONZE");

        const protectionMessages = [
          `🛡️ ${victimName} được bảo vệ bởi VIP ${vipTierName}! Bạn không thể trộm tiền của họ lần này.`,
          `🔰 Hệ thống bảo vệ VIP của ${victimName} đã phát hiện bạn! Nỗ lực trộm cắp thất bại.`,
          `⚔️ VIP ${vipTierName} của ${victimName} đã chặn được nỗ lực trộm cắp của ${thiefName}!`,
        ];

        const randomProtectionMessage =
          protectionMessages[
            Math.floor(Math.random() * protectionMessages.length)
          ];
        cooldowns.set(senderID, currentTime);
        return api.sendMessage(randomProtectionMessage, threadID, messageID);
      }

      api.sendMessage(
        `⚠️ ${thiefName} đã vượt qua được một phần bảo vệ VIP ${
          victimVipBenefits.name || ""
        } của ${victimName} và đang cố gắng trộm cắp...`,
        threadID
      );
    }

    try {
      const thiefBalance = await getBalance(senderID);
      const victimBalance = await getBalance(victimID);

      if (victimBalance < 1000) {
        return api.sendMessage(
          "❌ Nạn nhân quá nghèo, không có gì để trộm cả!",
          threadID,
          messageID
        );
      }

      let successChance = 40;
      if (thiefBalance < 50) successChance += 10;
      if (victimBalance > 1000) successChance += 5;

      const isSuccessful = Math.random() * 100 <= successChance;

      cooldowns.set(senderID, currentTime);

      if (isSuccessful) {
        const stolenPercent = Math.random() * 15 + 5;
        const maxStealable = Math.min(victimBalance * 0.2, 2000);
        let stolenAmount = Math.floor(victimBalance * (stolenPercent / 100));
        stolenAmount = Math.min(stolenAmount, maxStealable);
        stolenAmount = Math.max(stolenAmount, 100);

        await updateBalance(senderID, stolenAmount);
        await updateBalance(victimID, -stolenAmount);

        const successScenarios = [
          `🥷 ${thiefName} đã lẻn vào túi quần của ${victimName} và lấy đi ${formatNumber(
            stolenAmount
          )} $!`,
          `🕵️ ${thiefName} giả làm nhân viên ngân hàng và lừa ${victimName} mất ${formatNumber(
            stolenAmount
          )} $!`,
          `🦹 ${thiefName} đã hack tài khoản của ${victimName} và chuyển đi ${formatNumber(
            stolenAmount
          )} $!`,
          `🎭 ${thiefName} đeo mặt nạ, đe dọa và cướp đi ${formatNumber(
            stolenAmount
          )} $ từ ${victimName}!`,
          `🧙 ${thiefName} dùng phép thuật và làm biến mất ${formatNumber(
            stolenAmount
          )} $ từ ví của ${victimName}!`,
          `🍌 ${thiefName} đặt chuối trên đường đi, ${victimName} trượt ngã và đánh rơi ${formatNumber(
            stolenAmount
          )} $!`,
          `🥱 ${thiefName} đã ru ${victimName} ngủ bằng bài hát ru con và cuỗm mất ${formatNumber(
            stolenAmount
          )} $!`,
          `🤡 ${thiefName} giả làm chú hề tặng bóng bay, nhưng thực chất là đánh tráo ví của ${victimName} lấy ${formatNumber(
            stolenAmount
          )} $!`,
          `🧠 ${thiefName} dùng thuật thôi miên khiến ${victimName} tự nguyện chuyển ${formatNumber(
            stolenAmount
          )} $!`,
          `👻 ${thiefName} giả làm hồn ma dọa ${victimName} bỏ chạy, bỏ lại ${formatNumber(
            stolenAmount
          )} $!`,
          `🎣 ${thiefName} câu được ví tiền của ${victimName} từ cửa sổ và lấy ${formatNumber(
            stolenAmount
          )} $!`,
          `🎁 ${thiefName} tặng hộp quà có gắn nam châm, hút luôn ${formatNumber(
            stolenAmount
          )} $ từ túi ${victimName}!`,
          `📱 ${thiefName} gửi virus qua điện thoại của ${victimName} và chuyển ${formatNumber(
            stolenAmount
          )} $ về tài khoản của mình!`,
          `🐒 ${thiefName} huấn luyện khỉ đột móc túi ${victimName} và lấy cắp ${formatNumber(
            stolenAmount
          )} $!`,
          `🌪️ ${thiefName} tạo cơn lốc mini thổi bay ${formatNumber(
            stolenAmount
          )} $ từ ${victimName} vào túi mình!`,
        ];

        const randomSuccess =
          successScenarios[Math.floor(Math.random() * successScenarios.length)];
        return api.sendMessage(randomSuccess, threadID, messageID);
      } else {
        const baseStealAmount = Math.min(victimBalance * 0.2, 2000);
        const maxPenalty = Math.min(baseStealAmount * 1.5, 1000);

        const penaltyPercent = Math.random() * 10 + 5;
        let penalty = Math.floor(thiefBalance * (penaltyPercent / 100));
        penalty = Math.min(penalty, maxPenalty);

        await updateBalance(senderID, -penalty);

        const failScenarios = [
          `🚨 ${thiefName} bị cảnh sát bắt quả tang khi đang trộm từ ${victimName}! Bị phạt ${formatNumber(
            penalty
          )} $!`,
          `😱 ${victimName} đã phát hiện ${thiefName} đang mò tay vào túi! Bị đánh cho một trận và mất ${formatNumber(
            penalty
          )} $!`,
          `🐕 Chú chó cảnh giới đã sủa om sòm khi ${thiefName} đến gần ${victimName}! Bị bắt và phạt ${formatNumber(
            penalty
          )} $!`,
          `🔒 ${victimName} đã cài đặt hệ thống chống trộm! ${thiefName} bị điện giật và mất ${formatNumber(
            penalty
          )} $!`,
          `👮 Cảnh sát mật phục đã theo dõi ${thiefName} cả ngày! Bị bắt và phạt ${formatNumber(
            penalty
          )} $!`,
        ];

        const randomFailure =
          failScenarios[Math.floor(Math.random() * failScenarios.length)];
        return api.sendMessage(randomFailure, threadID, messageID);
      }
    } catch (error) {
      console.error("Error in stolen command:", error);
      return api.sendMessage(
        "❌ Đã xảy ra lỗi trong quá trình trộm cắp!",
        threadID,
        messageID
      );
    }
  },
};

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
