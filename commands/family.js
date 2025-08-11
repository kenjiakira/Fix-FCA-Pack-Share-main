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
  usages: ".family [info/marry/divorce/child/temple]",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target }) {
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
            "6. temple [số thứ tự] - Gửi con vào chùa tu hành\n" +
            "7. shop - Mua thuốc, BHYT và BCS\n" +
            "8. buy [id] - Mua vật phẩm\n" +
            "9. health - Xem tình trạng sức khỏe\n" +
            "10. home - Quản lý nhà cửa\n" +
            "11. travel - Du lịch cùng gia đình\n" +
            "12. collect [số thứ tự] - Thu tiền cho con\n" +
            "13. study - Học hành cho con cái\n" +
            "14. work [số thứ tự] - Xin việc cho con\n" +
            "15. marry-child [số thứ tự] [tên] - Tổ chức hôn lễ cho con\n" +
            "16. marry-child - Xem thông tin gia đình con cái\n" +
            "17. family tree - Xem cây gia phả\n" +
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
            const incomeLevel = familySystem.getFamilyIncomeLevel(senderID); 
        

            let childrenDisplay = "";
            if (Array.isArray(childrenInfo) && childrenInfo.length > 0) {
                childrenDisplay = "╠═ 👶CON CÁI\n" +
                    childrenInfo
                        .map((child, index) => {
                            if (!child) return "";
                            
                            const jobInfo = familySystem.childJobSystem.getChildJobInfo(child.id);
                            let display =
                                `║  ▸ ${index + 1}. ${child.gender} ${child.name}\n` +
                                `║    └ Tuổi: ${child.age}\n` +
                                `║    └ Hạnh phúc: ${child.happiness}%`;
            
                            if (jobInfo) {
                                display += `\n║    └ Công việc: ${jobInfo.name}`;
                                display += `\n║    └ Thu nhập: ${formatNumber(jobInfo.baseIncome)} $/6h`;
                                if (jobInfo.pendingIncome > 0) {
                                    display += `\n║    └ Đang chờ: ${formatNumber(jobInfo.pendingIncome)} $`;
                                    display += `\n║    └ Cập nhật sau: ${jobInfo.nextUpdate} phút`;
                                }
                            }
            
                            return display;
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
              `║  ▸ Sức khỏe: ${familySystem.getHealth(senderID)}%\n` +
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
              "╚═══════════════╝",
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

        case "temple": {
          const index = parseInt(subCommand) - 1;
          const TEMPLE_COST = 10000000;

          if (isNaN(index)) {
            return api.sendMessage(
              "❌ Vui lòng nhập đúng cú pháp:\n.family temple [số thứ tự]",
              threadID
            );
          }

          try {
            const balance = await getBalance(senderID);
            if (balance < TEMPLE_COST) {
              return api.sendMessage(
                `❌ Bạn cần ${formatNumber(
                  TEMPLE_COST
                )} $ để gửi con vào chùa!\n` +
                  `💰 Hiện có: ${formatNumber(balance)} $`,
                threadID
              );
            }

            const result = await familySystem.sendChildToTemple(
              senderID,
              index
            );
            await updateBalance(senderID, -TEMPLE_COST);

            return api.sendMessage(
              `🙏 Đã gửi ${result.gender} ${result.name} vào chùa tu hành\n` +
                `💰 Chi phí: ${formatNumber(TEMPLE_COST)} $\n` +
                `💝 Cầu mong ${result.name} sẽ có một tương lai tốt đẹp trên con đường tu tập`,
              threadID
            );
          } catch (error) {
            return api.sendMessage(`❌ ${error.message}`, threadID);
          }
        }

        case "study": {
          if (!subCommand) {
            return api.sendMessage(
              "📚 GIÁO DỤC CON CÁI 📚\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "1. .family study list - Xem danh sách trường\n" +
                "2. .family study enroll [số thứ tự] [trường] - Đăng ký học\n" +
                "3. .family study learn [số thứ tự] - Cho con học bài\n" +
                "4. .family study report [số thứ tự] - Xem học bạ\n" +
                "5. .family study graduate [số thứ tự] - Xét tốt nghiệp\n\n" +
                "💡 Các cấp học:\n" +
                "• kindergarten - Mẫu giáo (3-6 tuổi)\n" +
                "• primary - Tiểu học (6-11 tuổi)\n" +
                "• secondary - THCS (11-15 tuổi)\n" +
                "• highschool - THPT (15-18 tuổi)\n" +
                "• university - Đại học (18+ tuổi)",
                
              threadID
            );
          }     

          const childIndex = parseInt(target[2]) - 1;
          const children = familySystem.getChildInfo(senderID);

          if (
            ["enroll", "learn", "report", "graduate"].includes(subCommand) &&
            (isNaN(childIndex) ||
              !children ||
              childIndex < 0 ||
              childIndex >= children.length)
          ) {
            return api.sendMessage(
              "❌ Số thứ tự con không hợp lệ!\n" +
                "💡 Xem danh sách: .family info",
              threadID
            );
          }

          switch (subCommand) {
            case "list": {
              const schools = familySystem.educationSystem.schools;
              let message =
                "🏫 DANH SÁCH TRƯỜNG HỌC 🏫\n━━━━━━━━━━━━━━━━━━\n\n";

              Object.entries(schools).forEach(([type, school]) => {
                message += `${school.name}\n`;
                message += `📝 Độ tuổi: ${school.minAge}-${school.maxAge}\n`;
                message += `⏰ Thời gian học: ${school.duration} năm\n`;
                message += `💰 Học phí: ${formatNumber(school.cost)} $/năm\n`;
                message += `📚 Môn học: ${school.subjects.join(", ")}\n`;
                message += `💡 Đăng ký: .family study enroll [số thứ tự] ${type}\n\n`;
              });

              return api.sendMessage(message, threadID);
            }

        
            case "enroll": {
              const schoolType = target[3]?.toLowerCase();
              if (!schoolType) {
                  return api.sendMessage(
                      "❌ Vui lòng chọn trường!\n" +
                      "💡 Xem danh sách: .family study list",
                      threadID
                  );
              }
          
              try {
                  const childDisplay = children[childIndex];
                  if (!childDisplay) {
                      return api.sendMessage("❌ Dữ liệu con không hợp lệ!", threadID);
                  }
                  
                  console.log("Child display object:", JSON.stringify(childDisplay, null, 2));
                  console.log("Child age string:", childDisplay.age);
                  
                  const hours = Math.floor((Date.now() - childDisplay.birthDate) / (1000 * 60 * 60));
                  const months = hours;
                  const ageInYears = Math.floor(months / 12);
                  
                  console.log("Calculated age in years:", ageInYears);
                  
                  const childWithAge = {
                      ...childDisplay,
                      age: ageInYears
                  };
                  
                  const school = familySystem.educationSystem.schools[schoolType];
                  if (!school) {
                      return api.sendMessage(
                          "❌ Trường học không hợp lệ!",
                          threadID
                      );
                  }
          
                  if (ageInYears < school.minAge) {
                      return api.sendMessage(
                          `❌ ${childDisplay.gender} ${childDisplay.name} cần đủ ${school.minAge} tuổi để vào ${school.name}!\n` +
                          `🧒 Hiện tại: ${ageInYears} tuổi\n` +
                          `⏳ Cần đợi thêm ${school.minAge - ageInYears} năm nữa`,
                          threadID
                      );
                  }
          
                  if (ageInYears > school.maxAge) {
                      return api.sendMessage(
                          `❌ ${childDisplay.gender} ${childDisplay.name} đã quá tuổi để vào ${school.name}!\n` +
                          `🧒 Hiện tại: ${ageInYears} tuổi\n` +
                          `🎓 Độ tuổi tối đa: ${school.maxAge} tuổi`,
                          threadID
                      );
                  }
          
                  const balance = await getBalance(senderID);
                  if (balance < school.cost) {
                      return api.sendMessage(
                          `❌ Bạn cần ${formatNumber(
                              school.cost
                          )} $ để đóng học phí!\n` +
                          `💰 Hiện có: ${formatNumber(balance)} $`,
                          threadID
                      );
                  }
          
                  await familySystem.educationSystem.enrollInSchool(childWithAge, schoolType);
                  await updateBalance(senderID, -school.cost);
                  
                  return api.sendMessage(
                      `📚 Đã đăng ký cho ${childDisplay.gender} ${childDisplay.name} vào ${school.name}!\n` +
                      `💰 Học phí: ${formatNumber(school.cost)} $/năm\n` +
                      `⏰ Thời gian học: ${school.duration} năm\n` +
                      `📝 Các môn học: ${school.subjects.join(", ")}\n\n` +
                      `💡 Kiểm tra: .family study report ${childIndex + 1}`,
                      threadID
                  );
              } catch (error) {
                  console.error("Family study enroll error:", error);
                  return api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, threadID);
              }
          }
          
          
            case "learn": {
                try {
                    const child = children[childIndex];
                    if (!child || !child.id) {
                        return api.sendMessage("❌ Dữ liệu con không hợp lệ!", threadID);
                    }
                    
                    const result = await familySystem.educationSystem.study(child);
                    
                    let message = `📚 ${child.gender} ${child.name} đã học bài!\n\n`;
                    
                    if (result.grades) {
                        const subject = Object.values(result.grades)[0];
                        if (subject) {
                            message += `📖 Môn ${subject.name}: +${subject.improvement} điểm\n`;
                            message += `🔥 Chuỗi học tập: ${subject.streak} ngày (${subject.streakBonus})\n`;
                            
                            const education = familySystem.educationSystem.getChildEducation(child.id);
                            if (education && education.grades && education.grades[subject.name]) {
                                message += `📊 Điểm hiện tại: ${education.grades[subject.name].score.toFixed(1)}/10\n\n`;
                            } else {
                                message += `📊 Điểm đang được cập nhật...\n\n`;
                            }
                        }
                    }
                    
                    message += `🧠 Trí tuệ: +${result.intelligence.toFixed(1)}%\n`;
                    message += `💕 Hạnh phúc: +${result.happiness.toFixed(1)}%\n\n`;
                    message += `💡 Mẹo tăng điểm:\n`;
                    message += `• Học đều đặn mỗi ngày để tăng chuỗi học tập\n`;
                    message += `• Giữ độ hạnh phúc cao để học tốt hơn\n`;
                    message += `• Tập trung vào môn có điểm thấp nhất`;
                    
                    return api.sendMessage(message, threadID);
                } catch (error) {
                    console.error("Family study learn error:", error);
                    return api.sendMessage(`❌ ${error.message}`, threadID);
                }
            }
            
            case "children-family": {
              const marriedChildren = familySystem.getMarriedChildrenInfo(senderID);
              
              if (!marriedChildren || marriedChildren.length === 0) {
                  return api.sendMessage("❌ Bạn chưa có con nào đã kết hôn!", threadID);
              }
          
              let message = "👨‍👩‍👧‍👦 GIA ĐÌNH CỦA CON CÁI 👨‍👩‍👧‍👦\n";
              message += "━━━━━━━━━━━━━━━━━━\n\n";
          
              marriedChildren.forEach((child, index) => {
                  message += `${index + 1}. ${child.gender} ${child.name}\n`;
                  message += `💑 Kết hôn với: ${child.spouseName}\n`;
                  message += `📅 Ngày cưới: ${new Date(child.marriageDate).toLocaleDateString()}\n`;
                  if (child.children && child.children.length > 0) {
                      message += `👶 Các cháu:\n`;
                      child.children.forEach(grandchild => {
                          message += `  • ${grandchild.gender} ${grandchild.name} (${grandchild.age} tuổi)\n`;
                      });
                  }
                  message += `💕 Hạnh phúc: ${child.happiness}%\n`;
                  message += `🏠 Nơi ở: ${child.residence || "Chưa có thông tin"}\n\n`;
              });
          
              return api.sendMessage(message, threadID);
          }

            case "report": {
              try {
                const child = children[childIndex];
                const report = familySystem.educationSystem.getReport(child);

                if (!report) {
                  return api.sendMessage(
                    `❌ ${child.gender} ${child.name} chưa đi học!`,
                    threadID
                  );
                }

                let message = `📚 HỌC BẠ 📚\n`;
                message += `👶 ${child.gender} ${child.name}\n`;
                message += `🏫 ${report.schoolName}\n`;
                message += `📖 Năm học thứ ${report.year}\n\n`;
                message += "╔═ BẢNG ĐIỂM ═╗\n";

                Object.entries(report.grades).forEach(([subject, grade]) => {
                  message += `║ ${subject}: ${grade.score.toFixed(1)}\n`;
                });

                message += "╠═════════════╣\n";
                message += `║ Trung bình: ${report.averageGrade}\n`;
                message += `║ Xếp loại: ${report.ranking}\n`;
                message += `║ Chuyên cần: ${report.attendance}%\n`;
                message += `║ Hạnh kiểm: ${report.behavior}\n`;
                message += "╚═════════════╝";

                return api.sendMessage(message, threadID);
              } catch (error) {
                return api.sendMessage(`❌ ${error.message}`, threadID);
              }
            }

            case "graduate": {
              try {
                const child = children[childIndex];
                const result = await familySystem.educationSystem.graduate(
                  child
                );

                return api.sendMessage(
                  `🎓 CHÚC MỪNG TỐT NGHIỆP! 🎓\n\n` +
                    `👶 ${child.gender} ${child.name}\n` +
                    `🏫 ${result.schoolName}\n` +
                    `📖 Thời gian học: ${result.duration} năm\n` +
                    `📊 Điểm trung bình: ${result.averageGrade}\n\n` +
                    `💝 Chúc mừng con đã hoàn thành chương trình học!`,
                  threadID
                );
              } catch (error) {
                return api.sendMessage(`❌ ${error.message}`, threadID);
              }
            }

            default:
              return api.sendMessage(
                "❌ Lệnh không hợp lệ!\n" +
                  "💡 Sử dụng: .family study [list/enroll/learn/report/graduate]",
                threadID
              );
          }
        }

        case "shop": {
          const {
            CONTRACEPTIVES,
            MEDICINES,
            INSURANCE,
          } = require("../game/config/family/familyConfig");

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
          const incomeLevel = familySystem.getFamilyIncomeLevel(senderID);
          const hasChildrenUnder6 = familySystem.hasChildrenUnderSix(senderID);

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

          if (
            subCommand === "ins" &&
            (incomeLevel.level === "Hộ nghèo" ||
              incomeLevel.level === "Hộ cận nghèo")
          ) {
            message += `💝 QUYỀN LỢI ĐẶC BIỆT:\n`;
            if (incomeLevel.level === "Hộ nghèo") {
              message += `• Miễn phí 100% BHYT cho hộ nghèo\n`;
            } else if (incomeLevel.level === "Hộ cận nghèo") {
              message += `• Giảm 70% chi phí BHYT cho hộ cận nghèo\n`;
            }
            message += `\n`;
          } else if (subCommand === "med") {
            if (hasChildrenUnder6) {
              message += `💝 QUYỀN LỢI ĐẶC BIỆT:\n`;
              message += `• Miễn phí 100% thuốc men cho trẻ em dưới 6 tuổi\n\n`;
            } else if (
              incomeLevel.level === "Hộ nghèo" ||
              incomeLevel.level === "Hộ cận nghèo"
            ) {
              message += `💝 QUYỀN LỢI ĐẶC BIỆT:\n`;
              message += `• Giảm 50% chi phí thuốc men cho ${incomeLevel.level.toLowerCase()}\n\n`;
            }
          }

          Object.entries(items).forEach(([id, item], index) => {
            let discountPercent = 0;
            let discountReason = "";

            if (subCommand === "ins" && item.type === "health") {
              if (incomeLevel.level === "Hộ nghèo") {
                discountPercent = 100;
                discountReason = "miễn phí cho hộ nghèo";
              } else if (incomeLevel.level === "Hộ cận nghèo") {
                discountPercent = 70;
                discountReason = "giảm 70% cho hộ cận nghèo";
              }
            } else if (subCommand === "med") {
              if (hasChildrenUnder6) {
                discountPercent = 100;
                discountReason = "miễn phí cho trẻ em dưới 6 tuổi";
              } else if (
                incomeLevel.level === "Hộ nghèo" ||
                incomeLevel.level === "Hộ cận nghèo"
              ) {
                discountPercent = 50;
                discountReason = `giảm 50% cho ${incomeLevel.level.toLowerCase()}`;
              }
            }

            const finalPrice = Math.floor(
              item.price * (1 - discountPercent / 100)
            );

            message += `${index + 1}. ${item.name}\n`;
            if (discountPercent > 0) {
              message += `💰 Giá: ${formatNumber(finalPrice)} $ `;
              message += `(${discountReason}, giảm ${discountPercent}% từ ${formatNumber(
                item.price
              )} $)\n`;
            } else {
              message += `💰 Giá: ${formatNumber(item.price)} $\n`;
            }
            message += `📝 ${item.description}\n`;
            if (item.duration) {
              message += `⏰ Thời hạn: ${item.duration} ${
                item.type === "health" ? "ngày" : "phút"
              }\n`;
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
          const incomeLevel = familySystem.getFamilyIncomeLevel(senderID);

          let message =
            "╔═ 『 TÌNH TRẠNG SỨC KHỎE & BẢO HIỂM 』 ═╗\n" +
            "║\n" +
            `║ ❤️ Sức khỏe: ${health}%\n` +
            "║\n" +
            "╠═ 🏥 BẢO HIỂM Y TẾ\n";

          if (insuranceStatus.health) {
            message +=
              `║  ▸ Trạng thái: Đang có hiệu lực\n` +
              `║  ▸ Giảm giá: ${insuranceStatus.health.discount}% chi phí khám chữa bệnh\n` +
              `║  ▸ Còn lại: ${insuranceStatus.health.daysLeft} ngày\n`;
          } else {
            message +=
              "║  ▸ Trạng thái: Chưa có bảo hiểm\n" +
              "║  ▸ Mua BHYT để được giảm chi phí khám chữa bệnh\n";
          }

          message += "║\n╠═ 🚗 BẢO HIỂM Ô TÔ\n";
          if (insuranceStatus.car) {
            message +=
              `║  ▸ Trạng thái: Đang có hiệu lực\n` +
              `║  ▸ Giảm giá: ${insuranceStatus.car.discount}% chi phí sửa chữa\n` +
              `║  ▸ Còn lại: ${insuranceStatus.car.daysLeft} ngày\n`;
          } else {
            message += "║  ▸ Trạng thái: Chưa có bảo hiểm\n";
          }

          message += "║\n╠═ 🛵 BẢO HIỂM XE MÁY\n";
          if (insuranceStatus.bike) {
            message +=
              `║  ▸ Trạng thái: Đang có hiệu lực\n` +
              `║  ▸ Giảm giá: ${insuranceStatus.bike.discount}% chi phí sửa chữa\n` +
              `║  ▸ Còn lại: ${insuranceStatus.bike.daysLeft} ngày\n`;
          } else {
            message += "║  ▸ Trạng thái: Chưa có bảo hiểm\n";
          }

          if (incomeLevel.benefits && incomeLevel.benefits.length > 0) {
            message += "║\n╠═ 💝 QUYỀN LỢI ĐẶC BIỆT\n";
            incomeLevel.benefits.forEach((benefit) => {
              message += `║  ▸ ${benefit}\n`;
            });
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

          const {
            CONTRACEPTIVES,
            MEDICINES,
            INSURANCE,
          } = require("../game/config/family/familyConfig");
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

          const incomeLevel = familySystem.getFamilyIncomeLevel(senderID);
          let discountPercent = 0;
          let discountReason = "";

          if (category === "INSURANCE" && item.type === "health") {
            if (incomeLevel.level === "Hộ nghèo") {
              discountPercent = 100;
              discountReason = "miễn phí cho hộ nghèo";
            } else if (incomeLevel.level === "Hộ cận nghèo") {
              discountPercent = 70;
              discountReason = "giảm 70% cho hộ cận nghèo";
            }
          } else if (category === "MEDICINES") {
            const family = familySystem.getFamily(senderID);
            const hasChildren = family.children && family.children.length > 0;
            const hasYoungChildren =
              hasChildren &&
              family.children.some((child) => {
                const ageInYears =
                  (Date.now() - child.birthDate) / (1000 * 60 * 60 * 24 * 365);
                return ageInYears < 6;
              });

            if (hasYoungChildren) {
              discountPercent = 100;
              discountReason = "miễn phí thuốc cho trẻ em dưới 6 tuổi";
            } else if (
              incomeLevel.level === "Hộ nghèo" ||
              incomeLevel.level === "Hộ cận nghèo"
            ) {
              discountPercent = 50;
              discountReason = `giảm 50% cho ${incomeLevel.level.toLowerCase()}`;
            }
          }

          const originalPrice = item.price;
          const finalPrice = Math.floor(
            originalPrice * (1 - discountPercent / 100)
          );

          const balance = await getBalance(senderID);
          if (balance < finalPrice) {
            return api.sendMessage(
              `❌ Bạn cần ${formatNumber(finalPrice)} $ để mua ${item.name}!`,
              threadID
            );
          }

          await updateBalance(senderID, -finalPrice);

          switch (category) {
            case "CONTRACEPTIVES":
              familySystem.useContraceptive(senderID);
              return api.sendMessage(
                `✅ Đã mua ${item.name} thành công!\n` +
                  `💰 Chi phí: ${formatNumber(finalPrice)} $` +
                  (discountPercent > 0
                    ? ` (${discountReason}, giảm ${discountPercent}% từ ${formatNumber(
                        originalPrice
                      )} $)`
                    : "") +
                  `\n⏰ Có tác dụng trong ${item.duration} phút`,
                threadID
              );
            case "MEDICINES":
              const healthIncrease = item.healthBoost || 20;
              await familySystem.increaseHealth(senderID, healthIncrease);
              return api.sendMessage(
                `✅ Đã sử dụng ${item.name} thành công!\n` +
                  `💰 Chi phí: ${formatNumber(finalPrice)} $` +
                  (discountPercent > 0
                    ? ` (${discountReason}, giảm ${discountPercent}% từ ${formatNumber(
                        originalPrice
                      )} $)`
                    : "") +
                  `\n❤️ Sức khỏe +${healthIncrease}%`,
                threadID
              );
            case "INSURANCE":
              await familySystem.activateInsurance(
                senderID,
                item.type,
                item.duration,
                item.discount
              );
              let message =
                `✅ Đã mua ${item.name} thành công!\n` +
                `💰 Chi phí: ${formatNumber(finalPrice)} $` +
                (discountPercent > 0
                  ? ` (${discountReason}, giảm ${discountPercent}% từ ${formatNumber(
                      originalPrice
                    )} $)`
                  : "") +
                `\n⏰ Có hiệu lực trong ${item.duration} ngày\n`;

              switch (item.type) {
                case "health":
                  message += `🏥 Giảm ${item.discount}% chi phí khám chữa bệnh`;
                  break;
                case "car":
                  message += `🚗 Giảm ${item.discount}% chi phí sửa chữa ô tô`;
                  break;
                case "bike":
                  message += `🛵 Giảm ${item.discount}% chi phí sửa chữa xe máy`;
                  break;
              }

              return api.sendMessage(message, threadID);
          }
        }

case "tree": {
  try {
    const familyData = familySystem.getFamily(senderID);
    if (!familyData) {
        return api.sendMessage("❌ Không tìm thấy thông tin gia đình!", threadID);
    }

    let treeMessage = "🌳 CÂY GIA PHẢ 🌳\n";
    treeMessage += "━━━━━━━━━━━━━━━━━━\n\n";

      treeMessage += "👤 Chủ hộ: " + familySystem.getUserName(senderID) + "\n";
      if (familyData.spouse) {
          treeMessage += "├─💑 Bạn đời: " + familySystem.getUserName(familyData.spouse) + "\n";
      }

      if (familyData.children && familyData.children.length > 0) {
          treeMessage += "│\n├─👶 Con cái:\n";
          familyData.children.forEach((child, index) => {
              const prefix = index === familyData.children.length - 1 ? "└──" : "├──";
              treeMessage += `│  ${prefix} ${child.gender} ${child.name}`;
              
              if (child.isMarried) {
                  treeMessage += ` 💑 ∞ ${child.spouseName}`;
              }
              treeMessage += `\n`;

              if (child.children && child.children.length > 0) {
                  const lastChildPrefix = index === familyData.children.length - 1 ? "    " : "│   ";
                  child.children.forEach((grandchild, gIndex) => {
                      const gPrefix = gIndex === child.children.length - 1 ? "└───" : "├───";
                      treeMessage += `│  ${lastChildPrefix}${gPrefix} ${grandchild.gender} ${grandchild.name} (${grandchild.age} tuổi)\n`;
                  });
              }
          });
      }
      treeMessage += "\n📊 THỐNG KÊ GIA ĐÌNH:\n";
      treeMessage += `💑 Tình trạng: ${familyData.spouse ? "Đã kết hôn" : "Độc thân"}\n`;
      treeMessage += `👶 Số con: ${familyData.children ? familyData.children.length : 0}\n`;
      
      let grandChildCount = 0;
      if (familyData.children) {
          familyData.children.forEach(child => {
              if (child.children) {
                  grandChildCount += child.children.length;
              }
          });
      }
      treeMessage += `🍼 Số cháu: ${grandChildCount}\n`;
      treeMessage += `💝 Độ hạnh phúc: ${Math.round(familyData.happiness * 100) / 100}%\n`;
      
      return api.sendMessage(treeMessage, threadID);
  } catch (error) {
      console.error("Family tree error:", error);
      return api.sendMessage("❌ Đã xảy ra lỗi khi tạo cây gia phả!", threadID);
  }
}
        case "marry-child": {
          const childIndex = parseInt(subCommand) - 1;
          const targetParentId = Object.keys(event.mentions)[0];
          const targetChildIndex = parseInt(target[2]) - 1;
      
          if (isNaN(childIndex) || !targetParentId || isNaN(targetChildIndex)) {
              return api.sendMessage(
                  "❌ Vui lòng nhập đúng cú pháp:\n" +
                  ".family marry-child [số thứ tự con] [số thứ tự con người được tag] [@tag người là bố/mẹ]",
                  threadID
              );
          }
      
          try {
              const proposal = await familySystem.arrangeMarriage(
                  childIndex,
                  senderID,
                  targetChildIndex,
                  targetParentId
              );
      
              const confirmMsg = await api.sendMessage(
                  `💒 ĐỀ NGHỊ KẾT HÔN 💒\n\n` +
                  `👨‍👩‍👧‍👦 Nhà trai: ${proposal.child1.name} (${proposal.child1.age} tuổi)\n` +
                  `👨‍👩‍👧‍👦 Nhà gái: ${proposal.child2.name} (${proposal.child2.age} tuổi)\n\n` +
                  `⏳ Chờ phản hồi từ phía nhà gái...\n` +
                  `💌 Reply "yes" để đồng ý, "no" để từ chối`,
                  threadID
              );
      
              global.client.onReply.push({
                  name: this.name,
                  messageID: confirmMsg.messageID,
                  author: targetParentId,
                  type: "child-marriage-confirmation",
                  data: {
                      childIndex1: childIndex,
                      parentId1: senderID,
                      targetChildIndex: targetChildIndex,
                      targetParentId: targetParentId
                  }
              });
      
          } catch (error) {
              return api.sendMessage(`❌ ${error.message}`, threadID);
          }
      }

        case "work": {
          if (!subCommand) {
            return api.sendMessage(
              "💼 VIỆC LÀM CHO CON 💼\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "1. .family work list - Xem danh sách việc làm\n" +
                "2. .family work [số thứ tự] - Xem việc làm cho con\n" +
                "3. .family work [số thứ tự] [id việc] - Nhận việc cho con\n\n" +
                "💡 Lưu ý:\n" +
                "• Con cần đủ 13 tuổi để đi làm\n" +
                "• Thu nhập được trả mỗi 6 giờ\n" +
                "• Thu tiền bằng lệnh .family collect",
              threadID
            );
          }

          const children = familySystem.getChildInfo(senderID);
          if (!children || children.length === 0) {
              return api.sendMessage(
                  "❌ Bạn chưa có con!\n" +
                  "💡 Hãy kết hôn và sinh con trước khi cho con đi làm",
                  threadID
              );
          }
      

          if (subCommand === "list") {
            const jobs = familySystem.childJobSystem.getAllJobs();
            let message = "💼 DANH SÁCH VIỆC LÀM 💼\n━━━━━━━━━━━━━━━━━━\n\n";

            Object.entries(jobs).forEach(([id, job], idx) => {
              message += `${idx + 1}. ${job.name}\n`;
              message += `💰 Thu nhập: ${formatNumber(job.baseIncome)} $/6h\n`;
              message += `📝 ${job.description}\n`;
              message += `⏰ Độ tuổi: ${job.minAge}-${job.maxAge}\n`;
              message += `💡 ID: ${id}\n\n`;
            });
            message += "• Xem việc: .family work [số thứ tự con]\n";
            message += "• Nhận việc: .family work [số thứ tự con] [id việc]";

            return api.sendMessage(message, threadID);
          }

          const index = parseInt(subCommand) - 1;
          if (isNaN(index) || index < 0 || index >= children.length) {
              return api.sendMessage(
                  "❌ Số thứ tự con không hợp lệ!\n" +
                  "💡 Xem danh sách con: .family info",
                  threadID
              );
          }

          try {
            const child = children[index];
            const jobs = familySystem.childJobSystem.getAvailableJobs(child);

            if (!jobs || jobs.length === 0) {
              return api.sendMessage(
                `❌ ${child.gender} ${child.name} chưa đủ tuổi để đi làm!\n` +
                  `💡 Con cần đủ 13 tuổi để đi làm`,
                threadID
              );
            }

            let message = `💼 DANH SÁCH CÔNG VIỆC 💼\n`;
            message += `👶 ${child.gender} ${child.name} (${child.age} tuổi)\n\n`;

            jobs.forEach((job, idx) => {
              message += `${idx + 1}. ${job.name}\n`;
              message += `💰 Thu nhập: ${formatNumber(job.baseIncome)} $/6h\n`;
              message += `📝 ${job.description}\n`;
              message += `⏰ Độ tuổi: ${job.minAge}-${job.maxAge}\n`;
                
              if (job.education) {
                  const educationName = {
                      'primary': 'Tiểu học',
                      'secondary': 'THCS',
                      'highschool': 'THPT',
                      'university': 'Đại học'
                  }[job.education] || job.education;
                  message += `🎓 Yêu cầu học vấn: Tốt nghiệp ${educationName}\n`;
              }
              
              message += `💡 Nhận việc: .family work ${index + 1} ${idx + 1}\n\n`;
            });
            
          

            if (target[2]) {
              const jobIndex = parseInt(target[2]) - 1;
              if (isNaN(jobIndex) || jobIndex < 0 || jobIndex >= jobs.length) {
                  return api.sendMessage(
                      "❌ Công việc không hợp lệ!\n" +
                      "💡 Vui lòng chọn công việc từ danh sách",
                      threadID
                  );
              }
          
              const job = jobs[jobIndex];
              const jobId = Object.keys(familySystem.childJobSystem.getAllJobs()).find(id => 
                  familySystem.childJobSystem.getAllJobs()[id].name === job.name
              );
              
              if (!child.id) {
                  child.id = Date.now().toString() + "_" + Math.floor(Math.random() * 1000000);
                  
                  const family = familySystem.getFamily(senderID);
                  if (family.children && family.children[index]) {
                      family.children[index].id = child.id;
                      familySystem.saveData();
                      console.log("Đã tạo ID mới cho con:", child.id);
                  }
              }
              
              await familySystem.childJobSystem.assignJob(child.id, jobId);
              
              return api.sendMessage(
                  `✨ ${child.gender} ${child.name} đã nhận việc ${job.name}!\n` +
                  `💰 Thu nhập: ${formatNumber(job.baseIncome)} $/6h\n` +
                  `⏰ Thu nhập đầu tiên sau: 6 giờ\n` +
                  `💡 Thu tiền: .family collect ${index + 1}`,
                  threadID
              );
          }
          

            return api.sendMessage(message, threadID);
          } catch (error) {
            return api.sendMessage(`❌ ${error.message}`, threadID);
          }
        }

        case "collect": {
          const index = parseInt(subCommand) - 1;
          const children = familySystem.getChildInfo(senderID);

          if (
            isNaN(index) ||
            !children ||
            index < 0 ||
            index >= children.length
          ) {
            return api.sendMessage(
              "❌ Số thứ tự con không hợp lệ!\n" +
                "💡 Xem danh sách: .family info",
              threadID
            );
          }

          try {
            const child = children[index];
            const jobInfo = familySystem.childJobSystem.getChildJobInfo(
              child.id
            );

            if (!jobInfo || !jobInfo.pendingIncome) {
              return api.sendMessage(
                `❌ ${child.gender} ${child.name} chưa có thu nhập để thu!\n` +
                  `💡 Thu nhập sẽ được cập nhật mỗi 6 giờ`,
                threadID
              );
            }

            const result = await familySystem.childJobSystem.collectIncome(
              child.id
            );
            await updateBalance(senderID, result.collected);

            return api.sendMessage(
              `💰 Thu thành công ${formatNumber(result.collected)} $ từ ${
                child.gender
              } ${child.name}!\n` +
                `⏰ Thu nhập tiếp theo sau: ${result.nextUpdate} phút\n` +
                `💵 Tổng thu nhập: ${formatNumber(result.total)} $`,
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
              "💡 Sử dụng: .family [info/marry/divorce/child/temple/shop/buy/health/home/travel]",
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
          
          case "child-marriage-confirmation":
         
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

        case "child-marriage-confirmation": {
          try {
              const response = body.toLowerCase().trim();
       
              if (["yes", "y", "ok", "đồng ý", "ừ", "accept"].includes(response)) {
                  const result = await familySystem.confirmChildMarriage(
                      reply.data.childIndex1,
                      reply.data.parentId1,
                      reply.data.targetChildIndex,
                      reply.data.targetParentId
                  );

                  return api.sendMessage(
                      `💒 CHÚC MỪNG ĐÁM CƯỚI 💒\n\n` +
                      `${result.couple.spouse1.gender} ${result.couple.spouse1.name} ` +
                      `(con của ${result.couple.spouse1.parentName})\n` +
                      `💝 đã kết hôn với 💝\n` +
                      `${result.couple.spouse2.gender} ${result.couple.spouse2.name} ` +
                      `(con của ${result.couple.spouse2.parentName})\n\n` +
                      `🏠 Hai con đã dọn ra ở riêng và lập gia đình mới.`,
                      threadID
                  );
              } else {
                  return api.sendMessage(
                      "💔 Đề nghị kết hôn đã bị từ chối!\n" +
                      "💌 Có thể thử lại sau khi hai bên gia đình đồng thuận.",
                      threadID
                  );
              }
          } catch (error) {
              console.error("Child marriage confirmation error:", error);
              return api.sendMessage(
                  `❌ Đã xảy ra lỗi: ${error.message}`,
                  threadID
              );
          }
      }

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
              const healthIncrease = Math.floor(Math.random() * 3) + 3; // Random 3-5%
              await familySystem.increaseHappiness(requesterID, happinessIncrease);
              await familySystem.increaseHappiness(senderID, happinessIncrease);
              await familySystem.increaseHealth(requesterID, healthIncrease);
              await familySystem.increaseHealth(senderID, healthIncrease);
              
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
                      `💕 Độ hạnh phúc tăng ${happinessIncrease}%\n` +
                      `❤️ Sức khỏe tăng ${healthIncrease}%`,
                      threadID
                  );
              
                  global.client.onReply.push({
                      name: reply.name,
                      messageID: confirmMsg.messageID,
                      author: requesterID,
                      type: "baby-naming",
                      spouseName: spouseName,
                      isSpouse: senderID
                  });getUserName
              } else {
                return api.sendMessage(
                  `${randomMsg}\n\n` +
                    (hasContraceptive
                      ? "🎈 Đã sử dụng BCS nên không có tin vui..."
                      : "😔 Tiếc quá! Chưa có tin vui lần này...") +
                    `\n💕 Độ hạnh phúc tăng ${happinessIncrease}%\n` +
                    `❤️ Sức khỏe tăng ${healthIncrease}%`,
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
