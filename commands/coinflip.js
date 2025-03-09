const {
  getBalance,
  updateBalance,
  updateQuestProgress,
  loadQuy,
  saveQuy,
} = require("../utils/currencies");
const gameLogic = require("../utils/gameLogic");

function formatNumber(number) {
  return number.toLocaleString("vi-VN");
}

module.exports = {
  name: "coinflip",
  dev: "HNT",
  category: "Games",
  info: "Tung đồng xu.",
  onPrefix: true,
  usages: "coinflip",
  cooldowns: 0,
  lastPlayed: {},

  generateResult: function (senderID, playerChoice, betType, balance) {
    const winChance = gameLogic.calculateWinChance(senderID, {
      isAllIn: betType === "allin",
      balance: balance,
      gameType: "coinflip",
    });

    const shouldWin = Math.random() < winChance;
    const result = shouldWin
      ? playerChoice
      : playerChoice === "up"
      ? "ngửa"
      : "up";

    const specialRoll = Math.random();
    let multiplier = 1.8;
    if (specialRoll < 0.05) {
      multiplier = 3.0;
    } else if (specialRoll < 0.15) {
      multiplier = 2.2;
    }

    return { result, multiplier };
  },

  onLaunch: async function ({ api, event, target = [] }) {
    try {
      const { threadID, messageID, senderID } = event;
      const balance = getBalance(senderID);

      if (target.length < 2) {
        return api.sendMessage(
          "COINFLIP - TUNG ĐỒNG XU\n━━━━━━━━━━━━━━━━━━\n\n" +
            "Hướng dẫn: .coinflip <up/ngửa> <số tiền> hoặc\n" +
            ".coinflip <up/ngửa> allin",
          threadID,
          messageID
        );
      }

      const choice = target[0].toLowerCase();
      if (!["up", "ngửa"].includes(choice)) {
        return api.sendMessage(
          "Vui lòng chọn 'up' hoặc 'ngửa'.",
          threadID,
          messageID
        );
      }

      let betAmount =
        target[1].toLowerCase() === "allin" ? balance : parseInt(target[1]);
      if (!betAmount || betAmount < 100 || betAmount > balance) {
        return api.sendMessage(
          `Số tiền cược không hợp lệ (tối thiểu 100 $${
            betAmount > balance ? ", số dư không đủ" : ""
          }).`,
          threadID,
          messageID
        );
      }

      const currentTime = Date.now();
      if (
        this.lastPlayed[senderID] &&
        currentTime - this.lastPlayed[senderID] < 90000
      ) {
        return api.sendMessage(
          `Vui lòng đợi ${Math.ceil(
            (90000 - (currentTime - this.lastPlayed[senderID])) / 1000
          )} giây nữa.`,
          threadID,
          messageID
        );
      }
      this.lastPlayed[senderID] = currentTime;

      updateBalance(senderID, -betAmount);
      await api.sendMessage(
        "🎲 Đang tung đồng xu... Đợi 4 giây...",
        threadID,
        messageID
      );

      setTimeout(async () => {
        try {
          const { result, multiplier } = this.generateResult(
            senderID,
            choice,
            target[1].toLowerCase(),
            balance
          );

          const COIN_FACES = { up: "👆", ngửa: "⭕" };
          let message = `Kết quả: ${
            COIN_FACES[result]
          } (${result.toUpperCase()})\n`;

          if (choice === result) {
            const rewardInfo = gameLogic.calculateReward(betAmount, multiplier);
            updateBalance(senderID, rewardInfo.finalReward);

            message += `🎉 Thắng: ${formatNumber(rewardInfo.finalReward)} $\n`;
            message += `💹 Hệ số: x${multiplier}\n`;
            message += `💸 Phí: ${(
              (rewardInfo.fee / rewardInfo.rawReward) *
              100
            ).toFixed(1)}%\n`;

            gameLogic.updatePlayerStats(senderID, {
              won: true,
              betAmount,
              winAmount: rewardInfo.finalReward,
              gameType: "coinflip",
            });

            updateQuestProgress(senderID, "win_games");
            updateQuestProgress(senderID, "win_coinflip");
          } else {
            message += `💔 Thua: ${formatNumber(betAmount)} $\n`;
            gameLogic.updatePlayerStats(senderID, {
              won: false,
              betAmount,
              gameType: "coinflip",
            });
          }

          message += `\n💰 Số dư: ${formatNumber(getBalance(senderID))} $`;
          updateQuestProgress(senderID, "play_games");
          updateQuestProgress(senderID, "play_coinflip");

          await api.sendMessage(message, threadID, messageID);
        } catch (error) {
          console.error("Game processing error:", error);
          updateBalance(senderID, betAmount);
          await api.sendMessage(
            "Có lỗi xảy ra, đã hoàn tiền cược.",
            threadID,
            messageID
          );
        }
      }, 4000);
    } catch (error) {
      console.error("Main error:", error);
      await api.sendMessage("Có lỗi xảy ra.", threadID, messageID);
    }
  },
};
