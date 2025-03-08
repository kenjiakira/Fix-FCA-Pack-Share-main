const fs = require('fs');
const createWorkResultImage = require('../canvas/workImageGenerator');
const { getVIPBenefits } = require('../vip/vipCheck');

module.exports = {
    name: "testcanvas",
    dev: "HNT",
    usedby: 2,
    category: "Developer",
    info: "Test chức năng canvas",
    usages: "testcanvas [type]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        
        // Send processing message
        api.sendMessage("⏳ Đang tạo ảnh canvas...", threadID, messageID);
        
        try {
            // Get test type from target or default to 'normal'
            const testType = target[0]?.toLowerCase() || 'normal';
            const vipBenefits = getVIPBenefits(senderID);
            
            // Generate a mock work result based on test type
            const mockResult = getMockWorkResult(testType);
            
            // Generate the canvas image
            const imagePath = await createWorkResultImage(mockResult, vipBenefits, senderID);

            // Create description message
            let message = `🖼️ Test Canvas: ${testType.toUpperCase()}\n\n`;
            message += `💼 Công việc: ${mockResult.name}\n`;
            message += `👔 Cấp độ: ${mockResult.levelName}\n`;
            message += `💰 Lương: ${mockResult.salary.toLocaleString('vi-VN')} Xu\n`;
            message += `💵 Thuế: ${mockResult.tax}%\n`;
            
            if (mockResult.leveledUp) {
                message += `\n🎉 Thăng cấp: ${mockResult.leveledUp.name}\n`;
                message += `⬆️ Thưởng: +${((mockResult.leveledUp.bonus - 1) * 100).toFixed(0)}%\n`;
            }
            
            // Send the image
            return api.sendMessage(
                {
                    body: message,
                    attachment: fs.createReadStream(imagePath)
                },
                threadID,
                () => {
                    // Clean up the image file after sending
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
            );
        } catch (error) {
            console.error("Error in testcanvas:", error);
            return api.sendMessage(`❌ Lỗi khi tạo canvas: ${error.message}`, threadID);
        }
    }
};

// Function to generate mock work results for testing
function getMockWorkResult(type) {
    // Create base level information with required properties
    const baseLevel = {
        id: 2,
        name: "Chuyên gia",
        minWork: 100,
        maxWork: 300,
        basePay: 40000,
        bonus: 1.25,
        taxRate: 5
    };
    
    // Create next level for level-up scenario
    const nextLevel = {
        id: 3,
        name: "Giám đốc kỹ thuật",
        minWork: 300,
        maxWork: 600,
        basePay: 80000,
        bonus: 1.5,
        taxRate: 8
    };
    
    const baseResult = {
        name: "Lập trình viên",
        levelName: "Chuyên gia",
        salary: 50000,
        tax: 5,
        cooldown: 3600000, // 1 hour cooldown
        description: "Bạn đã hoàn thành công việc xuất sắc!",
        stats: {
            success: 120,
            fail: 20,
            total: 140
        },
        level: baseLevel, // Add level information
        workCount: 150    // Add work count between minWork and maxWork
    };
    
    switch(type) {
        case 'levelup':
            return {
                ...baseResult,
                level: baseLevel, // Explicitly include current level
                leveledUp: {
                    name: "Giám đốc kỹ thuật",
                    bonus: 1.5 // 50% bonus
                },
                nextLevel: nextLevel,
                workCount: 301
            };
            
        case 'vip':
            return {
                ...baseResult,
                salary: 100000,
                vipBonus: 20000, // 20% of 100000
                level: {
                    ...baseLevel,
                    basePay: 80000,  // Higher base pay for VIP
                    bonus: 1.25
                }
            };
            
        case 'lowpay':
            return {
                ...baseResult,
                name: "Nhân viên tập sự",
                levelName: "Tập sự",
                salary: 5000,
                tax: 2,
                level: {
                    id: 1,
                    name: "Tập sự",
                    minWork: 0,
                    maxWork: 100,
                    basePay: 5000,
                    bonus: 1,
                    taxRate: 2
                },
                workCount: 45
            };
            
        case 'highpay':
            return {
                ...baseResult,
                name: "CEO",
                levelName: "Cao cấp",
                salary: 1000000,
                tax: 20,
                description: "Bạn đã ký được hợp đồng lớn cho công ty!",
                level: {
                    id: 5,
                    name: "Cao cấp",
                    minWork: 1000,
                    maxWork: 2000,
                    basePay: 800000,
                    bonus: 2.5,
                    taxRate: 20
                },
                workCount: 1250
            };
            
        default: // normal
            return {
              ...baseResult,
              level: baseLevel
            };
    }
}
