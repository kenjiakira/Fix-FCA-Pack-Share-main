const { getBalance, updateBalance } = require('../utils/currencies');
const { DEGREES, STUDY_TIME, LEARNING_SPEED, DEGREE_CATEGORIES } = require('../config/family/educationConfig');
const fs = require('fs');
const path = require('path');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
    name: "study",
    dev: "HNT",
    usedby: 0,
    info: "Hệ thống học tập",
    onPrefix: true,
    usages: ".study [list/enroll/info]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const command = target[0]?.toLowerCase();

        try {
            const education = this.loadEducation(senderID);

            if (!command) {
                await api.sendMessage(
                    "┏━━『 HỆ THỐNG HỌC TẬP 』━━┓\n\n" +
                    "🎯 HƯỚNG DẪN SỬ DỤNG:\n\n" +
                    "⭐ .study list\n└ Xem danh sách bằng cấp\n\n" +
                    "📝 .study enroll <mã>\n└ Đăng ký học bằng cấp\n\n" +
                    "ℹ️ .study info\n└ Xem thông tin học vấn\n\n" +
                    "💡 Ghi chú: Trình độ học vấn càng\ncao thì cơ hội việc làm càng tốt\n" +
                    "\n┗━━━━━━━━━━━━━━━━━┛",
                    threadID
                );
                return;
            }

            switch (command) {
                case "list": {
                    let msg = "┏━━『 DANH SÁCH BẰNG CẤP 』━━┓\n\n";
                    
                    for (const [categoryId, category] of Object.entries(DEGREE_CATEGORIES)) {
                        msg += `🎓 ${category.name}\n`;
                        msg += "┏━━━━━━━━━━━━━━━┓\n";
                        
                        for (const degreeId of category.degrees) {
                            const degree = DEGREES[degreeId];
                            if (!degree) continue;

                            msg += `📋 ${degree.name}\n`;
                            msg += `├ Mã: ${degreeId}\n`;
                            msg += `├ Chi phí: ${degree.instantGrant ? '🆓 Miễn phí' : '💰 ' + formatNumber(degree.cost) + ' Xu'}\n`;
                            msg += `├ Thời gian: ${degree.instantGrant ? '⚡ Cấp ngay' : '⏳ ' + degree.timeNeeded + ' ngày'}\n`;
                            
                            if (degree.requirements.length > 0) {
                                msg += `└ Yêu cầu: ${degree.requirements.map(req => DEGREES[req].name).join(", ")}\n`;
                            }
                            msg += '\n';
                        }
                        msg += "┗━━━━━━━━━━━━━━━┛\n\n";
                    }

                    msg += "💡 HƯỚNG DẪN:\n";
                    msg += "➤ Đăng ký: .study enroll <mã>\n";
                    msg += "➤ Tiến độ: .study info\n\n";
                    msg += "💵 Số dư: " + formatNumber(await getBalance(senderID)) + " Xu";
                    
                    const listMsg = await api.sendMessage(msg, threadID);
                    return;
                }

                case "enroll": {
                    const degreeId = target[1]?.toLowerCase();
                    if (!degreeId || !DEGREES[degreeId]) {
                        return api.sendMessage("❌ Vui lòng nhập mã bằng cấp hợp lệ!", threadID);
                    }

                    const degree = DEGREES[degreeId];
                    if (education.currentDegree) {
                        return api.sendMessage("❌ Bạn đang theo học một chương trình khác!", threadID);
                    }
                    
                    for (const req of degree.requirements) {
                        if (!education.degrees.includes(req)) {
                            return api.sendMessage(
                                `❌ Bạn cần có bằng ${DEGREES[req].name} trước!`,
                                threadID
                            );
                        }
                    }

                    if (degree.instantGrant) {
                        education.degrees = education.degrees || []; // Thêm dòng này
                        education.degrees.push(degreeId);
                        this.saveEducation(senderID, education);
                        return api.sendMessage(
                            "🎓 CHÚC MỪNG BẠN ĐÃ TỐT NGHIỆP THPT!\n\n" +
                            `Bằng cấp: ${degree.name}\n` +
                            "💡 Bây giờ bạn có thể học lên Cao đẳng hoặc Đại học",
                            threadID
                        );
                    }

                    const balance = await getBalance(senderID);
                    if (balance < degree.cost) {
                        return api.sendMessage(
                            `❌ Bạn cần ${formatNumber(degree.cost)} Xu để đăng ký học!`,
                            threadID
                        );
                    }

                    await updateBalance(senderID, -degree.cost);
                    education.currentDegree = {
                        id: degreeId,
                        startTime: Date.now(),
                        progress: 0
                    };
                    this.saveEducation(senderID, education);

                    return api.sendMessage(
                        "🎓 ĐĂNG KÝ THÀNH CÔNG!\n\n" +
                        `Bằng cấp: ${degree.name}\n` +
                        `Thời gian học: ${degree.timeNeeded} ngày\n` +
                        `Chi phí: ${formatNumber(degree.cost)} Xu\n\n` +
                        "💡 Dùng .study info để xem tiến độ",
                        threadID
                    );
                }

                case "info": {
                    let msg = "┏━━『 THÔNG TIN HỌC VẤN 』━━┓\n\n";
                    
                    if (education.degrees.length === 0) {
                        msg += "📚 Trình độ: Chưa tốt nghiệp\n";
                    } else {
                        const highestDegree = education.degrees[education.degrees.length - 1];
                        msg += `🎓 Trình độ cao nhất:\n└ ${DEGREES[highestDegree].name}\n\n`;
                        msg += "📚 Bằng cấp đã có:\n";
                        education.degrees.forEach(degreeId => {
                            msg += `├ ${DEGREES[degreeId].name}\n`;
                        });
                    }

                    if (education.currentDegree) {
                        const degree = DEGREES[education.currentDegree.id];
                        const daysPassed = (Date.now() - education.currentDegree.startTime) / STUDY_TIME;
                        const progress = Math.min(100, (daysPassed / degree.timeNeeded) * 100);
                        
                        msg += "\n📝 Đang theo học:\n";
                        msg += `├ ${degree.name}\n`;
                        const progressBar = "▰".repeat(Math.floor(progress/10)) + "▱".repeat(10-Math.floor(progress/10));
                        msg += `└ Tiến độ: ${progressBar} ${Math.floor(progress)}%\n`;
                        
                        if (progress >= 100) {
                            education.degrees.push(education.currentDegree.id);
                            education.currentDegree = null;
                            this.saveEducation(senderID, education);
                            msg += "\n🎊 CHÚC MỪNG TỐT NGHIỆP!";
                        }
                    }

                    msg += "\n┗━━━━━━━━━━━━━━━━━┛";
                    return api.sendMessage(msg, threadID);
                }
            }
        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã có lỗi xảy ra!", threadID);
        }
    },

    loadEducation: function(userID) {
        const educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        try {
            if (!fs.existsSync(educationPath)) {
                fs.writeFileSync(educationPath, '{}');
            }
            const data = JSON.parse(fs.readFileSync(educationPath));
            let education = data[userID] || { degrees: [], currentDegree: null };

            if (education.degrees) {
                education.degrees = education.degrees.map(degree => {
                 
                    if (degree === "highschool") return "e1";
                    return degree;
                });
            }

            return education;
        } catch (error) {
            console.error(error);
            return { degrees: [], currentDegree: null };
        }
    },

    saveEducation: function(userID, data) {
        const educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        try {
            let eduData = {};
            if (fs.existsSync(educationPath)) {
                eduData = JSON.parse(fs.readFileSync(educationPath));
            }
            eduData[userID] = data;
            fs.writeFileSync(educationPath, JSON.stringify(eduData, null, 2));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
};
