const fs = require('fs');
const path = require('path');

module.exports = {
    name: "finance",
    nickName: ["fin", "money"],
    dev: "HNT",
    category: "Tiện Ích",
    info: "Quản lý chi tiêu cá nhân",
    usages: "finance [command] [options]",
    usedby: 0,
    cooldowns: 0,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) { 
        const { threadID, messageID } = event;
        
        if (!target[0]) { 
            return api.sendMessage(
                "🏦 QUẢN LÝ TÀI CHÍNH CÁ NHÂN\n" +
                "━━━━━━━━━━━━━━━━━━━\n" +
                "1. Thêm giao dịch:\n" +
                "   !finance add <số tiền> <thu/chi> <mô tả>\n\n" +
                "2. Xem báo cáo:\n" +
                "   !finance report - Báo cáo tổng\n" +
                "   !finance report MM/YYYY - Báo cáo tháng\n" +
                "   !finance report DD/MM/YYYY - Báo cáo tuần\n\n" +
                "3. Hủy giao dịch:\n" +
                "   !finance undo - Xóa giao dịch gần nhất\n\n" +
                "4. Xóa dữ liệu:\n" +
                "   !finance reset - Xóa toàn bộ dữ liệu",
                threadID
            );
        }

        const command = target[0].toLowerCase();  
        const commandArgs = target.slice(1); 

        switch (command) {
            case "add":
                await this.handleTransaction(api, event, commandArgs);
                break;
            case "report":
                await this.handleReport(api, event, commandArgs);
                break;
            case "undo":
                await this.undoLast(api, event);
                break;
            case "reset":
                await this.resetData(api, event);
                break;
            default:
                api.sendMessage("❌ Lệnh không hợp lệ!", threadID);
        }
    },

    handleTransaction: async function(api, event, target) {
        if (target.length < 3) {
            return api.sendMessage("❌ Thiếu thông tin! Format: !finance add <số tiền> <thu/chi> <mô tả>", event.threadID);
        }

        const [amount, type, ...desc] = target;
        if (!this.isValidAmount(amount) || !["thu", "chi"].includes(type.toLowerCase())) {
            return api.sendMessage("❌ Số tiền hoặc loại giao dịch không hợp lệ!", event.threadID);
        }

        const transaction = {
            date: new Date(),
            type: type.toLowerCase(),
            amount: this.parseAmount(amount),
            description: desc.join(" ")
        };

        const data = this.loadData(event.senderID);
        data.transactions.push(transaction);
        this.saveData(event.senderID, data);

        api.sendMessage(
            `✅ Đã thêm giao dịch:\n` +
            `💰 Số tiền: ${this.formatCurrency(transaction.amount)}\n` +
            `📝 Loại: ${type}\n` +
            `💬 Mô tả: ${transaction.description}`,
            event.threadID
        );
    },

    handleReport: async function(api, event, target) {
        const data = this.loadData(event.senderID);
        if (!data.transactions.length) {
            return api.sendMessage("❌ Chưa có giao dịch nào!", event.threadID);
        }

        let dateFilter = null;
        if (target[0]) {
            dateFilter = this.parseDateFilter(target[0]);
        }

        const filteredTransactions = this.filterTransactions(data.transactions, dateFilter);
        const report = this.generateReport(filteredTransactions, dateFilter);
        
        api.sendMessage(report, event.threadID);
    },

    undoLast: async function(api, event) {
        const data = this.loadData(event.senderID);
        if (!data.transactions.length) {
            return api.sendMessage("❌ Không có giao dịch nào để xóa!", event.threadID);
        }

        const removed = data.transactions.pop();
        this.saveData(event.senderID, data);

        api.sendMessage(
            `✅ Đã xóa giao dịch gần nhất:\n` +
            `💰 Số tiền: ${this.formatCurrency(removed.amount)}\n` +
            `📝 Loại: ${removed.type}\n` +
            `💬 Mô tả: ${removed.description}`,
            event.threadID
        );
    },

    resetData: async function(api, event) {
        const data = { transactions: [] };
        this.saveData(event.senderID, data);
        api.sendMessage("✅ Đã xóa toàn bộ dữ liệu!", event.threadID);
    },

    loadData: function(userID) {
        const dataPath = path.join(__dirname, '../database/json/finance.json');
        let data = {};
        
        try {
            if (fs.existsSync(dataPath)) {
                const fileData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                data = fileData[userID] || { transactions: [] };
            }
        } catch (err) {
            console.error("Error loading finance data:", err);
            data = { transactions: [] };
        }

        return data;
    },

    saveData: function(userID, data) {
        const dataPath = path.join(__dirname, '../database/json/finance.json');
        try {
            let fileData = {};
            if (fs.existsSync(dataPath)) {
                fileData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            }
            fileData[userID] = data;
            fs.writeFileSync(dataPath, JSON.stringify(fileData, null, 2));
        } catch (err) {
            console.error("Error saving finance data:", err);
        }
    },

    isValidAmount: function(amount) {
        return /^[0-9]+(k|tr)?$/.test(amount);
    },

    parseAmount: function(amount) {
        return parseFloat(amount.replace("tr", "000000").replace("k", "000")) || 0;
    },

    formatCurrency: function(amount) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND"
        }).format(amount);
    },

    generateReport: function(transactions, dateFilter) {
        let income = 0;
        let expense = 0;
        const incomeList = [];
        const expenseList = [];

        transactions.forEach(t => {
            const amount = t.amount;
            const formattedDate = new Date(t.date).toLocaleString("vi-VN");
            const line = `${this.formatCurrency(amount)} - ${t.description} (${formattedDate})`;

            if (t.type === "thu") {
                income += amount;
                incomeList.push(`+ ${line}`);
            } else {
                expense += amount;
                expenseList.push(`- ${line}`);
            }
        });

        return [
            "📊 BÁO CÁO TÀI CHÍNH",
            "━━━━━━━━━━━━━━━━━━━",
            `💰 Tổng thu: ${this.formatCurrency(income)}`,
            `💸 Tổng chi: ${this.formatCurrency(expense)}`,
            `💵 Số dư: ${this.formatCurrency(income - expense)}`,
            "",
            "📥 GIAO DỊCH THU:",
            ...incomeList,
            "",
            "📤 GIAO DỊCH CHI:",
            ...expenseList
        ].join("\n");
    },

    parseDateFilter: function(dateStr) {
        const parts = dateStr.split("/");
        if (parts.length === 2) {
            return {
                type: "month",
                date: new Date(parts[1], parts[0] - 1)
            };
        } else if (parts.length === 3) {
            const date = new Date(parts[2], parts[1] - 1, parts[0]);
            const dayOfWeek = date.getDay() || 7;
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - dayOfWeek + 1);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            return {
                type: "week",
                date: date,
                startOfWeek: startOfWeek,
                endOfWeek: endOfWeek
            };
        }
        return null;
    },

    filterTransactions: function(transactions, dateFilter) {
        if (!dateFilter) return transactions;

        return transactions.filter(t => {
            const transDate = new Date(t.date);
            if (dateFilter.type === "month") {
                return transDate.getMonth() === dateFilter.date.getMonth() &&
                       transDate.getFullYear() === dateFilter.date.getFullYear();
            } else if (dateFilter.type === "week") {
                return transDate >= dateFilter.startOfWeek && 
                       transDate <= dateFilter.endOfWeek;
            }
            return true;
        });
    }
};
