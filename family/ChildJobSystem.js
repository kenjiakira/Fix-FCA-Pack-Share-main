const fs = require('fs-extra');
const path = require('path');

class ChildJobSystem {
    constructor() {
        this.jobDataPath = path.join(__dirname, '..', 'database', 'json', 'family', 'childjobs.json');
        this.jobData = this.loadJobData();
        this.lastUpdate = Date.now();
        
        // Auto income every 6 hours
        setInterval(() => this.generatePassiveIncome(), 6 * 60 * 60 * 1000);
    }

    loadJobData() {
        try {
            return fs.readJsonSync(this.jobDataPath);
        } catch (error) {
            const defaultData = {
                children: {},
                lastUpdate: Date.now()
            };
            fs.writeJsonSync(this.jobDataPath, defaultData);
            return defaultData;
        }
    }

    saveJobData() {
        fs.writeJsonSync(this.jobDataPath, this.jobData);
    }

    calculateBaseIncome(child) {
        // Base income based on age
        let baseIncome = 0;
        if (child.age >= 6 && child.age < 11) { // Primary school age
            baseIncome = 1000; // Base income for young children
        } else if (child.age >= 11 && child.age < 15) { // Secondary school age
            baseIncome = 2000; // More income for teens
        } else if (child.age >= 15 && child.age <= 18) { // High school age
            baseIncome = 3000; // Highest income for older teens
        }

        // Education bonus
        if (child.education) {
            const gradeBonus = (child.education.averageGrade - 5) * 0.1; // 10% bonus per grade point above 5
            baseIncome *= (1 + Math.max(0, gradeBonus));

            // Additional bonus based on education level
            switch (child.education.level) {
                case 'primary':
                    baseIncome *= 1.2;
                    break;
                case 'secondary':
                    baseIncome *= 1.5;
                    break;
                case 'highschool':
                    baseIncome *= 2.0;
                    break;
            }
        }

        return Math.floor(baseIncome);
    }

    generatePassiveIncome() {
        const now = Date.now();
        const hoursSinceLastUpdate = (now - this.lastUpdate) / (60 * 60 * 1000);
        
        Object.entries(this.jobData.children).forEach(([childId, data]) => {
            // Skip if child hasn't been updated in over 24 hours (inactive)
            if (now - data.lastUpdate > 24 * 60 * 60 * 1000) return;

            const income = Math.floor(data.baseIncome * hoursSinceLastUpdate / 6); // Income per 6 hours
            data.totalEarnings += income;
            data.lastUpdate = now;

            // Add happiness bonus
            if (data.happiness) {
                data.happiness = Math.min(100, data.happiness + 1);
            }
        });

        this.lastUpdate = now;
        this.saveJobData();
    }

    registerChild(child) {
        if (!this.jobData.children[child.id]) {
            this.jobData.children[child.id] = {
                baseIncome: this.calculateBaseIncome(child),
                totalEarnings: 0,
                lastUpdate: Date.now(),
                happiness: 50
            };
            this.saveJobData();
        }
        return this.jobData.children[child.id];
    }

    updateChildIncome(child) {
        const data = this.jobData.children[child.id];
        if (data) {
            data.baseIncome = this.calculateBaseIncome(child);
            this.saveJobData();
        }
        return data;
    }

    getChildJobInfo(childId) {
        const data = this.jobData.children[childId];
        if (!data) return null;

        const hoursSinceUpdate = (Date.now() - data.lastUpdate) / (60 * 60 * 1000);
        const pendingIncome = Math.floor(data.baseIncome * hoursSinceUpdate / 6);

        return {
            baseIncome: data.baseIncome,
            totalEarnings: data.totalEarnings,
            pendingIncome,
            happiness: data.happiness,
            nextUpdate: Math.ceil((6 - (hoursSinceUpdate % 6)) * 60), 
            incomePerDay: data.baseIncome * 4
        };
    }

    getAllJobs() {
        return {
            'store': {
                name: 'Phụ bán hàng',
                baseIncome: 100000,
                description: 'Phụ giúp tại cửa hàng tạp hóa',
                minAge: 13,
                maxAge: 100
            },
            'house': {
                name: 'Phụ việc nhà',
                baseIncome: 150000,
                description: 'Giúp việc nhà cho các gia đình',
                minAge: 13,
                maxAge: 100
            },
            'tutor': {
                name: 'Gia sư',
                baseIncome: 2500000,
                description: 'Dạy kèm học sinh cấp 1-2',
                minAge: 20,
                maxAge: 70
            },
            'office': {
                name: 'Phụ việc văn phòng',
                baseIncome: 3000000,
                description: 'Làm việc bán thời gian tại văn phòng',
                minAge: 18,
                maxAge: 70
            }
        };
    }

    collectIncome(childId) {
        const data = this.jobData.children[childId];
        if (!data) throw new Error("Chưa đăng ký làm việc");

        const now = Date.now();
        const hoursSinceUpdate = (now - data.lastUpdate) / (60 * 60 * 1000);
        const income = Math.floor(data.baseIncome * hoursSinceUpdate / 6);

        if (income <= 0) {
            const minutesUntilNext = Math.ceil((6 - (hoursSinceUpdate % 6)) * 60);
            throw new Error(`Chưa đến giờ nhận tiền (còn ${minutesUntilNext} phút)`);
        }

        data.totalEarnings += income;
        data.lastUpdate = now;
        this.saveJobData();

        return {
            collected: income,
            total: data.totalEarnings,
            nextUpdate: 360 // 6 hours in minutes
        };
    }
}

module.exports = ChildJobSystem;
