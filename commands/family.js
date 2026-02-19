const { updateBalance, getBalance } = require("../utils/currencies");
const FamilySystem = require("../game/family/FamilySystem");
const {
  MARRIAGE_COST,
  DIVORCE_COST,
} = require("../game/config/family/familyConfig");
const fs = require("fs");
const path = require("path");

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
const { getUserName } = require('../utils/userUtils');
const familySystem = new FamilySystem();

module.exports = {
  name: "family",
  dev: "HNT",
  usedby: 0,
  info: "Hệ thống gia đình",
  onPrefix: true,
  category: "Games",
  usages: ".family [info/marry/divorce/child/home/travel]",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, senderID } = event;
    const command = target[0]?.toLowerCase();
    const subCommand = target[1]?.toLowerCase();

    try {
      if (!command) {
        return api.sendMessage(
          "👨‍👩‍👧‍👦 GIA ĐÌNH NHỎ 👨‍👩‍👧‍👦\n" +
            "━━━━━━━━━━━━\n\n" +
            "1. info - Xem thông tin gia đình\n" +
            "2. marry [@tag] - Kết hôn\n" +
            "3. divorce - Ly hôn\n" +
            "4. love - Động phòng\n" +
            "5. rename [số thứ tự] [tên mới] - Đổi tên con\n" +
            "6. home - Quản lý nhà cửa\n" +
            "7. travel - Du lịch cùng gia đình\n" +
            "━━━━━━━━━━━━\n" +
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
            const incomeLevel = familySystem.getFamilyIncomeLevel(senderID); 
        

            let childrenDisplay = "";
            if (Array.isArray(childrenInfo) && childrenInfo.length > 0) {
                childrenDisplay = "╠═ 👶CON CÁI\n" +
                    childrenInfo
                        .map((child, index) => {
                            if (!child) return "";
                            return (
                                `║  ▸ ${index + 1}. ${child.gender} ${child.name}\n` +
                                `║    └ Tuổi: ${child.age}\n` +
                                `║    └ Hạnh phúc: ${child.happiness}%`
                            );
                        })
                        .filter(display => display)
                        .join("\n") +
                    "\n║\n";
            }
        
            let benefitsInfo = "";
            if (incomeLevel.benefits && incomeLevel.benefits.length > 0) {
                benefitsInfo = "╠═ 💝 QUYỀN LỢI ĐẶC BIỆT\n";
                incomeLevel.benefits.forEach(benefit => {
                    benefitsInfo += `║  ▸ ${benefit}\n`;
                });
                benefitsInfo += "║\n";
            }

          return api.sendMessage(
            "╔═ 『 THÔNG TIN 』 ═╗\n" +
              "║║\n" +
              "╠═ 👤CÁ NHÂN\n" +
              `║  ▸ Tên: ${familySystem.getUserName(senderID)}\n` +
              `║  ▸ ID: ${senderID}\n` +
              `║  ▸ Học vấn: ${familySystem.getEducationInfo(senderID)}\n` +
              `║  ▸ Nghề nghiệp: ${familySystem.getJobInfo(senderID)}\n` +
              `║  ▸ Cấp bậc: ${marriageInfo.incomeLevel.level}\n` +
              `║  ▸ Thu nhập: ${formatNumber(
                marriageInfo.incomeLevel.income
              )} $/ngày\n` +
              `║  ▸ Mô tả: ${marriageInfo.incomeLevel.description}\n` +
              "║\n" +
              "╠═ 💑HÔN NHÂN\n" +
              `║  ▸ Bạn đời: ${marriageInfo.spouse}\n` +
              `║  ▸ Độ hạnh phúc: ${marriageInfo.happiness}%\n` +
              `║  ▸ Số con: ${marriageInfo.childCount} đứa\n` +
              "║\n" +
              "╠═ 🚗 PHƯƠNG TIỆN\n" +
              (Object.keys(sharedVehicles || {}).length > 0
                ? Object.entries(sharedVehicles)
                    .map(([carId, vehicle]) => {
                      const {
                        CARS,
                        BRANDS,
                      } = require("../game/config/family/carConfig");
                      const car = CARS[carId];
                      return (
                        `║  ▸ ${BRANDS[car.brand]} ${car.name}\n` +
                        `║    └ Độ bền: ${vehicle.durability.toFixed(1)}%`
                      );
                    })
                    .join("\n")
                : "║  ▸ Chưa có phương tiện\n") +
              "║\n" +
              childrenDisplay +
              "╠═ 🏠 NHÀ CỬA\n" +
              (marriageInfo.home
                ? `║  ▸ Loại nhà: ${marriageInfo.home.name}\n` +
                  `║  ▸ Tình trạng: ${marriageInfo.home.condition}%\n` +
                  `║  ▸ Hạnh phúc: +${marriageInfo.home.happiness}%\n` +
                  `║  ▸ Sức chứa: ${marriageInfo.home.capacity} người\n` +
                  (marriageInfo.home.maintenanceNeeded
                    ? `║  ▸ ⚠️ Cần bảo dưỡng! (${marriageInfo.home.daysSinceLastMaintenance} ngày)\n`
                    : `║  ▸ 🔧 Bảo dưỡng sau: ${
                        30 - marriageInfo.home.daysSinceLastMaintenance
                      } ngày\n`)
                : "║  ▸ Chưa có nhà ở\n") +
              "║\n" +
              "╚══════════╝",
            threadID
          );
        }

        case "marry": {
          const mention = Object.keys(event.mentions)[0];
          if (!mention) {
            return api.sendMessage(
              "❌ Vui lòng tag người bạn muốn cưới!",
              threadID
            );
          }

          const proposerFamily = familySystem.getFamily(senderID);
          if (proposerFamily.spouse) {
            return api.sendMessage(
              "❌ Bạn đã kết hôn rồi, không thể cầu hôn người khác!",
              threadID
            );
          }

          const targetFamily = familySystem.getFamily(mention);
          if (targetFamily.spouse) {
            return api.sendMessage(
              "❌ Người này đã kết hôn với người khác rồi!",
              threadID
            );
          }

          const balance = await getBalance(senderID);
          if (balance < MARRIAGE_COST) {
            return api.sendMessage(
              `❌ Bạn cần ${formatNumber(MARRIAGE_COST)} $ để kết hôn!`,
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
            proposerName: user1Name,
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
              `❌ Bạn cần ${formatNumber(DIVORCE_COST)} $ để ly hôn!`,
              threadID
            );
          }

          const spouseName = familySystem.getUserName(family.spouse);
          const userName = familySystem.getUserName(senderID);

          const confirmMsg = await api.sendMessage(
            `💔 ${userName} muốn ly hôn với bạn.\n` +
              `💰 Chi phí ly hôn: ${formatNumber(DIVORCE_COST)} $\n` +
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
            divorceCost: DIVORCE_COST,
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
            const userName = familySystem.getUserName(senderID);
        
            if (!familySystem.canHaveNewBaby(senderID)) {
              return api.sendMessage(
                "❌ Vợ chồng cần nghỉ ngơi 10 phút sau mỗi lần!",
                threadID
              );
            }
            
            if (family.children && family.children.length >= 7) {
              return api.sendMessage(
                "❌ Gia đình đã có đủ 7 con, không thể sinh thêm!",
                threadID
              );
            }
        
            const intimateMessages = [
              "💕 ${userName} muốn có một khoảnh khắc riêng tư với bạn...",
              "💝 ${userName} đang chờ đợi một đêm lãng mạn cùng bạn...",
              "💖 ${userName} muốn tạo nên khoảnh khắc đặc biệt cùng bạn...",
              "💓 ${userName} đang mong chờ một buổi tối ngọt ngào với bạn..."
            ];
        
            const randomMsg = intimateMessages[
              Math.floor(Math.random() * intimateMessages.length)
            ].replace("${userName}", userName);
        
            const confirmMsg = await api.sendMessage(
              `${randomMsg}\nReply "yes" để đồng ý, hoặc "no" để từ chối.`,
              threadID
            );
        
            global.client.onReply.push({
              name: this.name,
              messageID: confirmMsg.messageID,
              author: family.spouse,
              type: "intimate-confirmation",
              requesterID: senderID,
              requesterName: userName
            });
        
            return api.sendMessage(
              `💌 Đã gửi lời mời đến ${spouseName}, chờ phản hồi...`,
              threadID
            );
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
            const child = await familySystem.renameChild(
              senderID,
              index,
              newName
            );
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
                message += `💰 Chi phí: ${formatNumber(cost)} $\n`;
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
                if (travelCheck.reason === "onTrip") {
                  const dest = familySystem.getDestinationInfo(
                    travelCheck.destination
                  );
                  return api.sendMessage(
                    `❌ Gia đình đang trong chuyến du lịch tại ${dest.name}\n` +
                      `⏰ Còn ${travelCheck.remainingTime} giờ nữa mới về`,
                    threadID
                  );
                } else if (travelCheck.reason === "cooldown") {
                  return api.sendMessage(
                    `❌ Gia đình cần nghỉ ngơi thêm ${travelCheck.remainingTime} giờ nữa\n` +
                      "💡 Mỗi chuyến đi cách nhau 7 ngày",
                    threadID
                  );
                }
              }

              const cost = familySystem.calculateTravelCost(
                senderID,
                destination
              );
              const balance = await getBalance(senderID);
              if (balance < cost) {
                return api.sendMessage(
                  `❌ Bạn cần ${formatNumber(cost)} $ cho chuyến đi!\n` +
                    `💰 Hiện có: ${formatNumber(balance)} $`,
                  threadID
                );
              }

              try {
                await updateBalance(senderID, -cost);
                const dest = familySystem.startTravel(senderID, destination);
                return api.sendMessage(
                  `🌎 Gia đình bắt đầu chuyến du lịch tại ${dest.name}!\n` +
                    `💰 Chi phí: ${formatNumber(cost)} $\n` +
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
          const { HOMES } = require("../game/config/family/homeConfig");

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
                message += `💰 Giá: ${formatNumber(home.price)} $\n`;
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
                  `❌ Bạn cần ${formatNumber(home.price)} $ để mua ${
                    home.name
                  }!\n` + `💰 Hiện có: ${formatNumber(balance)} $`,
                  threadID
                );
              }

              try {
                await familySystem.homeSystem.buyHome(senderID, homeType);
                await updateBalance(senderID, -home.price);
                return api.sendMessage(
                  `🎉 Chúc mừng! Bạn đã mua ${home.name} thành công!\n` +
                    `💰 Chi phí: ${formatNumber(home.price)} $\n` +
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
                const sellPrice = await familySystem.homeSystem.sellHome(
                  senderID
                );
                await updateBalance(senderID, sellPrice);
                return api.sendMessage(
                  `🏠 Đã bán nhà thành công!\n` +
                    `💰 Số tiền nhận được: ${formatNumber(sellPrice)} $\n` +
                    `💡 Giá đã trừ khấu hao theo thời gian và điều kiện nhà`,
                  threadID
                );
              } catch (error) {
                return api.sendMessage(`❌ ${error.message}`, threadID);
              }
            }

            case "repair": {
              try {
                const repairCost = await familySystem.homeSystem.repair(
                  senderID
                );
                const balance = await getBalance(senderID);

                if (balance < repairCost) {
                  return api.sendMessage(
                    `❌ Bạn cần ${formatNumber(
                      repairCost
                    )} $ để sửa chữa nhà!\n` +
                      `💰 Hiện có: ${formatNumber(balance)} $`,
                    threadID
                  );
                }

                await updateBalance(senderID, -repairCost);
                return api.sendMessage(
                  `🔧 Đã sửa chữa và bảo dưỡng nhà thành công!\n` +
                    `💰 Chi phí: ${formatNumber(repairCost)} $\n` +
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
              "💡 Sử dụng: .family [info/marry/divorce/child/home/travel]",
            threadID
          );
      }
    } catch (error) {
      console.error("Family command error:", error);
      return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
    }
  },

  onReply: async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;

    const reply = global.client.onReply.find((r) => {
      if (r.messageID !== event.messageReply.messageID) return false;
  
      switch (r.type) {
          case "marriage-confirmation":
              return r.author === senderID;
          
          case "divorce-confirmation":
              return r.author === senderID;
              
          case "intimate-confirmation":
  
              return senderID === r.author;
              
          case "baby-naming":
              const family = familySystem.getFamily(r.author);
     
              return senderID === r.author || senderID === family.spouse;
              
          default:
              return false;
      }
  });

    if (!reply) return;

    global.client.onReply = global.client.onReply.filter(
      (r) => r.messageID !== reply.messageID
    );

    switch (reply.type) {
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
              `💔 ${getUserName(senderID)} đã từ chối lời cầu hôn của ${
                reply.proposerName
              }!`,
              threadID
            );
          }
        } catch (error) {
          console.error("Marriage confirmation error:", error);
          return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID);
        }

        break;

      case "divorce-confirmation":
        try {
          const response = body.toLowerCase().trim();
          if (response === "yes" || response === "accept" || response === "1") {
            await updateBalance(reply.requesterID, -reply.divorceCost);
            const divorceResult = await familySystem.divorce(reply.requesterID);

            let message = `💔 Đã ly hôn thành công!\n💰 Chi phí: ${formatNumber(
              reply.divorceCost
            )} $`;

            if (divorceResult.custodyInfo) {
              const custodyParentName = familySystem.getUserName(
                divorceResult.custodyInfo.parent
              );
              message += `\n👶 Quyền nuôi ${divorceResult.custodyInfo.childCount} đứa con thuộc về ${custodyParentName}`;
            }

            return api.sendMessage(message, threadID);
          } else {
            return api.sendMessage(
              `💝 ${getUserName(senderID)} đã từ chối yêu cầu ly hôn của ${
                reply.requesterName
              }!`,
              threadID
            );
          }
        } catch (error) {
          console.error("Divorce confirmation error:", error);
          return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID);
        }
        break;
        case "intimate-confirmation": {
          try {
              const response = body.toLowerCase().trim();
         
              if (["yes", "y", "ok", "đồng ý", "ừ", "accept", "1", "ok"].includes(response)) {
                  const requesterID = reply.requesterID;
                  const family = familySystem.getFamily(requesterID);
                  
                  if (!family || !family.spouse) {
                      return api.sendMessage("❌ Có lỗi xảy ra với thông tin gia đình!", threadID);
                  }
      
                  if (!familySystem.canHaveNewBaby(requesterID)) {
                      return api.sendMessage(
                          "❌ Vợ chồng cần nghỉ ngơi 10 phút sau mỗi lần!",
                          threadID
                      );
                  }
      
                  await familySystem.intimate(requesterID);
                  
              const happinessIncrease = Math.floor(Math.random() * 5) + 5; // Random 5-10%
              await familySystem.increaseHappiness(requesterID, happinessIncrease);
              await familySystem.increaseHappiness(senderID, happinessIncrease);
              
              const spouseName = familySystem.getUserName(senderID);
              const intimateMessages = [
                "💕 pap pap pap👏👏 Một đêm ngọt ngào với ${spouseName}...",
                "💝 Căn phòng ngập tràn tiếng thở dài...",
                "💖 pap pap pap👏👏 Một đêm đáng nhớ cùng ${spouseName}...",
                "💓 Cùng ${spouseName} tạo nên khoảnh khắc đặc biệt... pap pap pap👏👏"
              ];
              
              const randomMsg = intimateMessages[
                Math.floor(Math.random() * intimateMessages.length)
              ].replace("${spouseName}", spouseName);
              
              const hasContraceptive =
                family.contraceptiveUntil &&
                family.contraceptiveUntil > Date.now();
              
                if (!hasContraceptive && Math.random() < 0.8) {
                  const babyGender = Math.random() < 0.5 ? "👶 Bé trai" : "👶 Bé gái";
                  const confirmMsg = await api.sendMessage(
                      `${randomMsg}\n\n` +
                      `🎊 CHÚC MỪNG! Gia đình có thêm ${babyGender}!\n` +
                      `💝 Hãy đặt tên cho bé (không được dùng yes/no/ok...)\n` + // Thêm cảnh báo
                      `💕 Độ hạnh phúc tăng ${happinessIncrease}%`,
                      threadID
                  );
              
                  global.client.onReply.push({
                      name: reply.name,
                      messageID: confirmMsg.messageID,
                      author: requesterID,
                      type: "baby-naming",
                      spouseName: spouseName,
                      isSpouse: senderID
                  });
              } else {
                return api.sendMessage(
                  `${randomMsg}\n\n` +
                    (hasContraceptive
                      ? "🎈 Đã sử dụng BCS nên không có tin vui..."
                      : "😔 Tiếc quá! Chưa có tin vui lần này...") +
                    `\n💕 Độ hạnh phúc tăng ${happinessIncrease}%`,
                  threadID
                );
              }
            } else {
              return api.sendMessage(
                  `💔 ${getUserName(senderID)} đã từ chối lời mời của ${reply.requesterName}!`,
                  threadID
              );
          }
      } catch (error) {
          console.error("Intimate confirmation error:", error);
          return api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, threadID);
      }
  }

  case "baby-naming": {
    try {
        const babyName = body.trim();
        
        const commonReplies = ["yes", "no", "ok", "đồng ý", "ừ", "accept", "1"];
        if (commonReplies.includes(babyName.toLowerCase())) {
            return api.sendMessage(
                "❌ Không thể đặt tên con là từ phản hồi đơn giản!\n" +
                "💝 Vui lòng đặt một cái tên ý nghĩa cho bé",
                threadID
            );
        }

        if (!familySystem.validateBabyName(babyName)) {
            return api.sendMessage(
                "❌ Tên không hợp lệ!\n" +
                "• Tên phải từ 2-20 ký tự\n" +
                "• Không chứa số hoặc ký tự đặc biệt\n" +
                "• Không được dùng yes/no/ok...",
                threadID
            );
        }

        const parentId = reply.author;
        const family = familySystem.getFamily(parentId);
        
        if (!family) {
            throw new Error("Không tìm thấy thông tin gia đình!");
        }

        if (senderID !== parentId && senderID !== family.spouse) {
            return api.sendMessage(
                "❌ Chỉ vợ/chồng mới có thể đặt tên cho bé!",
                threadID
            );
        }

        const child = await familySystem.addChild(parentId, babyName);
        
        return api.sendMessage(
            `👶 Chúc mừng gia đình có thêm thành viên mới!\n` +
            `${child.gender} Tên bé: ${child.name}\n` +
            `💝 Biệt danh: ${child.nickname}\n` +
            `💖 Chúc bé luôn khỏe mạnh và hạnh phúc!`,
            threadID
        );
    } catch (error) {
        console.error("Baby naming error:", error);
        return api.sendMessage(
            `❌ Đã xảy ra lỗi khi đặt tên cho bé: ${error.message}`,
            threadID
        );
    }
}
        break;
    }
  },
};
