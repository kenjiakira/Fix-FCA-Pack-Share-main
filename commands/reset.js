const { setBalance, getBalance, saveData, getStats, allBalances } = require("../utils/currencies");
const fs = require("fs");

module.exports = {
    name: "reset",
    usedby: 2,
    info: "Reset tiền của người dùng về 0 với nhiều tùy chọn",
    dev: "HNT",
    onPrefix: true,
    usages: "[all/me/@tag/userID] [confirm]",
    cooldowns: 10,
    category: "Admin Commands",

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        
        try {
            if (!target[0]) {
                let msg = "💰 LỆNH RESET TIỀN 💰\n";
                msg += "━━━━━━━━━━━━━━━━━━\n\n";
                msg += "📋 CÁC TÙY CHỌN:\n\n";
                msg += "1️⃣ Reset bản thân:\n";
                msg += "• reset me\n\n";
                msg += "2️⃣ Reset người khác:\n";
                msg += "• reset @tag\n";
                msg += "• reset [userID]\n\n";
                msg += "3️⃣ Reset tất cả:\n";
                msg += "• reset all\n\n";
                msg += "4️⃣ Reset nhóm hiện tại:\n";
                msg += "• reset group\n\n";
                msg += "⚠️ LƯU Ý:\n";
                msg += "• Cần xác nhận bằng 'confirm'\n";
                msg += "• Hành động không thể hoàn tác\n";
                msg += "• Chỉ admin bot mới sử dụng được";

                return api.sendMessage(msg, threadID, messageID);
            }

            const option = target[0].toLowerCase();
            const confirm = target[1]?.toLowerCase() === "confirm";

            if (!confirm) {
                let msg = "⚠️ XÁC NHẬN RESET TIỀN ⚠️\n";
                msg += "━━━━━━━━━━━━━━━━━━\n\n";
                
                switch (option) {
                    case "me":
                        const myBalance = getBalance(senderID);
                        msg += `🎯 Reset tiền của bạn:\n`;
                        msg += `💰 Số dư hiện tại: $${myBalance.toLocaleString()}\n`;
                        msg += `🔄 Sau reset: $0\n\n`;
                        break;
                        
                    case "all":
                        const stats = getStats();
                        msg += `🌍 Reset TẤT CẢ người dùng:\n`;
                        msg += `👥 Số người dùng: ${stats.userCount.toLocaleString()}\n`;
                        msg += `💰 Tổng tiền hiện tại: $${stats.totalMoney.toLocaleString()}\n`;
                        msg += `🔄 Sau reset: $0\n\n`;
                        break;
                        
                    case "group":
                        const groupUsers = await this.getGroupUsers(api, threadID);
                        let groupTotal = 0;
                        groupUsers.forEach(uid => {
                            groupTotal += getBalance(uid);
                        });
                        msg += `👥 Reset người dùng trong nhóm:\n`;
                        msg += `📊 Số thành viên có tiền: ${groupUsers.length}\n`;
                        msg += `💰 Tổng tiền nhóm: $${groupTotal.toLocaleString()}\n`;
                        msg += `🔄 Sau reset: $0\n\n`;
                        break;
                        
                    default:
                        let targetID = this.extractUserID(option);
                        if (!targetID) {
                            return api.sendMessage("❌ Không tìm thấy người dùng!", threadID, messageID);
                        }
                        const targetBalance = getBalance(targetID);
                        msg += `🎯 Reset tiền người dùng:\n`;
                        msg += `👤 ID: ${targetID}\n`;
                        msg += `💰 Số dư hiện tại: $${targetBalance.toLocaleString()}\n`;
                        msg += `🔄 Sau reset: $0\n\n`;
                        break;
                }

                msg += "🔥 NGUY HIỂM: Hành động không thể hoàn tác!\n\n";
                msg += "✅ Để xác nhận, gõ lại lệnh kèm 'confirm':\n";
                msg += `• reset ${target[0]} confirm`;

                return api.sendMessage(msg, threadID, messageID);
            }

            let resetCount = 0;
            let totalReset = 0;
            let msg = "";

            switch (option) {
                case "me":
                    const myBalance = getBalance(senderID);
                    setBalance(senderID, 0);
                    totalReset = myBalance;
                    resetCount = 1;
                    msg = `✅ ĐÃ RESET TIỀN CỦA BẠN\n`;
                    msg += `💰 Số tiền đã xóa: $${myBalance.toLocaleString()}`;
                    break;

                case "all":
                    const allUsers = allBalances();
                    for (const userID in allUsers) {
                        if (allUsers[userID] !== 0) {
                            totalReset += allUsers[userID];
                            setBalance(userID, 0);
                            resetCount++;
                        }
                    }
                    msg = `✅ ĐÃ RESET TẤT CẢ NGƯỜI DÙNG\n`;
                    msg += `👥 Số người đã reset: ${resetCount.toLocaleString()}\n`;
                    msg += `💰 Tổng tiền đã xóa: $${totalReset.toLocaleString()}`;
                    break;

                case "group":
                    const groupUsers = await this.getGroupUsers(api, threadID);
                    for (const userID of groupUsers) {
                        const balance = getBalance(userID);
                        if (balance !== 0) {
                            totalReset += balance;
                            setBalance(userID, 0);
                            resetCount++;
                        }
                    }
                    msg = `✅ ĐÃ RESET TIỀN NHÓM\n`;
                    msg += `👥 Số người đã reset: ${resetCount}\n`;
                    msg += `💰 Tổng tiền đã xóa: $${totalReset.toLocaleString()}`;
                    break;

                default:
                    let targetID = this.extractUserID(option);
                    if (!targetID) {
                        return api.sendMessage("❌ Không tìm thấy người dùng!", threadID, messageID);
                    }
                    const targetBalance = getBalance(targetID);
                    setBalance(targetID, 0);
                    totalReset = targetBalance;
                    resetCount = 1;
                    msg = `✅ ĐÃ RESET TIỀN NGƯỜI DÙNG\n`;
                    msg += `👤 ID: ${targetID}\n`;
                    msg += `💰 Số tiền đã xóa: $${targetBalance.toLocaleString()}`;
                    break;
            }

            await saveData();

            msg += `\n\n📅 Thời gian: ${new Date().toLocaleString('vi-VN')}\n`;
            msg += `🔧 Thực hiện bởi: ${senderID}`;

            console.log(`[RESET] ${senderID} reset ${option} - ${resetCount} users - $${totalReset}`);

            return api.sendMessage(msg, threadID, messageID);

        } catch (error) {
            console.error("Reset command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi reset tiền!", threadID, messageID);
        }
    },

    extractUserID(input) {
        if (input.includes('@')) {
            const match = input.match(/@(\d+)/);
            return match ? match[1] : null;
        }
        
        if (/^\d+$/.test(input)) {
            return input;
        }
        
        return null;
    },

    async getGroupUsers(api, threadID) {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const participantIDs = threadInfo.participantIDs;
            
            const usersWithMoney = participantIDs.filter(uid => getBalance(uid) !== 0);
            return usersWithMoney;
        } catch (error) {
            console.error("Error getting group users:", error);
            return [];
        }
    }
};