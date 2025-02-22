const fs = require('fs');
const path = require('path');
const { JOBS, JOB_RANKS } = require('../config/family/jobConfig');

class JobSystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/job.json');
        this.educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        this.data = this.loadData();
        this.TAX_BRACKETS = [
            { threshold: 1000000, rate: 0.05 },  
            { threshold: 5000000, rate: 0.10 }, 
            { threshold: 10000000, rate: 0.15 },
            { threshold: Infinity, rate: 0.20 }  
        ];
        
        this.CLASSIC_JOBS = [
            {
                name: "Shipper",
                description: "Bạn đã giao {count} đơn hàng",
                minPay: 20000,
                maxPay: 45000,
                countRange: [3, 8]
            },
            {
                name: "Rửa xe",
                description: "Bạn đã rửa {count} chiếc xe",
                minPay: 25000,
                maxPay: 50000,
                countRange: [2, 5]
            },
            {
                name: "Đầu bếp",
                description: "Bạn đã nấu {count} món ăn",
                minPay: 35000,
                maxPay: 70000,
                countRange: [4, 8]
            },
            {
                name: "Bảo vệ",
                description: "Bạn đã làm việc {count} giờ",
                minPay: 20000,
                maxPay: 40000,
                countRange: [4, 8]
            },
            {
                name: "Lập trình viên",
                description: "Bạn đã fix {count} bug",
                minPay: 50000,
                maxPay: 100000,
                countRange: [2, 5]
            },
            {
                name: "Streamer",
                description: "Bạn đã stream {count} giờ",
                minPay: 40000,
                maxPay: 80000,
                countRange: [3, 6]
            }
        ];
        this.QUIT_COOLDOWN = 24 * 60 * 60 * 1000; 
        this.WORK_COOLDOWN = 10 * 60 * 1000; 
    }

    loadData() {
        try {
            const rawData = fs.readFileSync(this.path, 'utf8');
            const data = JSON.parse(rawData || '{}');
            
            for (const userId in data) {
                if (!data[userId] || typeof data[userId] !== 'object') {
                    data[userId] = this.getDefaultUserData();
                    continue;
                }

                if (!Array.isArray(data[userId].jobHistory)) {
                    data[userId].jobHistory = [];
                }
                
                if (data[userId].currentJob) {
                    if (!this.validateJob(data[userId].currentJob)) {
                        data[userId].currentJob = null;
                    }
                }
                
                const defaultData = this.getDefaultUserData();
                for (const key in defaultData) {
                    if (!(key in data[userId])) {
                        data[userId][key] = defaultData[key];
                    }
                }
            }
            
            return data;
        } catch (error) {
            console.error('Error loading job data:', error);
            return {};
        }
    }

    loadEducation(userID) {
        try {
            if (!fs.existsSync(this.educationPath)) {
                return { degrees: [] };
            }
            const data = JSON.parse(fs.readFileSync(this.educationPath));
            let education = data[userID] || { degrees: [] };
            
            education.degrees = education.degrees.map(degree => {
                return degree === "highschool" ? "e1" : degree;
            });

            return education;
        } catch (error) {
            console.error('Error loading education:', error);
            return { degrees: [] };
        }
    }

    validateJob(jobData) {
        if (!jobData) return false;
        if (!jobData.id || !JOBS[jobData.id]) return false;
        if (!jobData.startDate || typeof jobData.performance !== 'number') return false;
        return true;
    }

    getDefaultUserData() {
        return {
            currentJob: null,
            jobHistory: [],
            lastWorked: 0,
            lastQuit: 0,
            totalEarned: 0,
            workCount: 0
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf8');
            return true;

        } catch (error) {
            console.error('Error saving job data:', error);
            return false;
        }
    }

    getJob(userID) {
        if (!this.data[userID]) {
            this.data[userID] = this.getDefaultUserData();
        }
        if (!this.data[userID].jobHistory) this.data[userID].jobHistory = [];
        this.saveData();
        return this.data[userID];
    }

    async checkQualification(userID, jobId) {
        try {
            const education = this.loadEducation(userID);
            const job = JOBS[jobId];
            const DEGREES = require('../config/family/educationConfig').DEGREES;

            if (!job) return { qualified: false, reason: "Công việc không tồn tại" };
            if (!job.requirements || job.requirements.length === 0) return { qualified: true };

            const userDegrees = education.degrees.map(d => d === "highschool" ? "e1" : d);

            const hasQualification = job.requirements.some(req => {
                const requiredLevel = DEGREES[req].level;
                return userDegrees.some(degree => {
                    const userDegreeLevel = DEGREES[degree]?.level || 0;
                    return userDegreeLevel >= requiredLevel;
                });
            });

            if (!hasQualification) {
                const missingDegrees = job.requirements
                    .map(req => DEGREES[req].name)
                    .join(" hoặc ");
                return { 
                    qualified: false, 
                    reason: `Bạn cần có bằng tương đương ${missingDegrees} trở lên`
                };
            }

            return { qualified: true };
        } catch (error) {
            console.error('Error checking qualification:', error);
            return { qualified: false, reason: "Lỗi kiểm tra bằng cấp" };
        }
    }

    async applyForJob(userID, jobId) {
        try {
            if (!JOBS[jobId]) {
                throw new Error("Công việc không tồn tại!");
            }

            const jobData = this.getJob(userID);
            
            const savedData = this.loadData()[userID] || this.getDefaultUserData();
            console.log(`User ID: ${userID}, Last Quit: ${jobData.lastQuit}, Current Time: ${Date.now()}`);
            const check = await this.checkQualification(userID, jobId);
            if (!check.qualified) {
                throw new Error(check.reason);
            }

            if (!this.data[userID]) {
                this.data[userID] = this.getDefaultUserData();
            }

            if (this.data[userID].currentJob) {
                throw new Error("Bạn đang có công việc rồi!");
            }

            const newJob = {
                id: jobId,
                startDate: Date.now(),
                performance: 100
            };

            this.data[userID].currentJob = newJob;
            
            const saved = this.saveData();
            if (!saved) {
                throw new Error("Không thể lưu thông tin công việc!");
            }

            this.data = this.loadData();
            const verifyJob = this.data[userID]?.currentJob;
            
            if (!verifyJob || verifyJob.id !== jobId) {
                throw new Error("Lỗi xác thực dữ liệu công việc!");
            }

            return JOBS[jobId];
        } catch (error) {
            console.error('Apply job error:', error);
            throw error;
        }
    }

    quitJob(userID) {
        const jobData = this.getJob(userID);
        if (!jobData.currentJob) {
            throw new Error("Bạn chưa có việc làm!");
        }

        const oldJob = {...jobData.currentJob};
        const quitTime = Date.now();
        
        jobData.jobHistory.push({
            ...oldJob,
            endDate: quitTime
        });
        // Log the quit time to a JSON file
        const quitLogPath = path.join(__dirname, '../database/json/family/quitLog.json');
        const quitLog = fs.existsSync(quitLogPath) ? JSON.parse(fs.readFileSync(quitLogPath)) : {};
        quitLog[userID] = quitTime;
        fs.writeFileSync(quitLogPath, JSON.stringify(quitLog, null, 2));
        jobData.lastQuit = quitTime;
        jobData.currentJob = null;
        
        if (!this.saveData()) {
            throw new Error("Không thể lưu thông tin nghỉ việc!");
        }

        this.data = this.loadData();
        
        return JOBS[oldJob.id];
    }

    canWork(userID) {
        const jobData = this.getJob(userID);
        if (!jobData.currentJob) return false;
        
        const COOLDOWN = 10 * 60 * 1000; 
        const timeSinceLastWork = Date.now() - jobData.lastWorked;
        return timeSinceLastWork >= COOLDOWN;
    }

    work(userID, vipBenefits = null) {
        try {
            this.data = this.loadData();
            
            if (!this.data[userID]) {
                throw new Error("Không tìm thấy thông tin người dùng!");
            }

            const jobData = this.data[userID];
            
            if (!jobData.currentJob || !jobData.currentJob.id) {
                throw new Error("Bạn chưa có việc làm!");
            }

            const cooldown = this.getWorkCooldown(userID, vipBenefits);
            if (cooldown > 0) {
                const minutes = Math.floor(cooldown / 60000);
                const seconds = Math.ceil((cooldown % 60000) / 1000);
                throw new Error(`Bạn cần nghỉ ngơi ${minutes > 0 ? `${minutes} phút ` : ''}${seconds} giây nữa!`);
            }

            if (!JOBS[jobData.currentJob.id]) {
                jobData.currentJob = null;
                this.saveData();
                throw new Error("Công việc không hợp lệ! Vui lòng xin việc lại.");
            }

            const job = JOBS[jobData.currentJob.id];
            const jobType = job.type || 'shipper';
            const currentLevel = this.getJobLevel(jobType, jobData.workCount || 0);
            
            let salary = job.salary;
            if (currentLevel && currentLevel.bonus) {
                salary = Math.floor(salary * currentLevel.bonus);
            }

            if (vipBenefits && vipBenefits.workBonus) {
                const bonusAmount = Math.floor(salary * (vipBenefits.workBonus / 100));
                salary += bonusAmount;
            }

            jobData.lastWorked = Date.now();
            jobData.workCount = (jobData.workCount || 0) + 1;
            jobData.totalEarned = (jobData.totalEarned || 0) + salary;

            const newLevel = this.getJobLevel(jobType, jobData.workCount);
            const leveledUp = newLevel && currentLevel && newLevel.name !== currentLevel.name;

            const saved = this.saveData();
            if (!saved) {
                throw new Error("Không thể lưu thông tin làm việc!");
            }

            return {
                ...job,
                id: jobData.currentJob.id,
                salary,
                workCount: jobData.workCount,
                levelName: currentLevel?.name || job.name,
                leveledUp: leveledUp ? newLevel : null,
                type: jobType
            };
        } catch (error) {
            if (!error.isWaitError) {
                console.error('Work error:', error);
            }
            throw error;
        }
    }

    getWorkCooldown(userID, vipBenefits = null) {
        const jobData = this.getJob(userID);
        let cooldown = 0;

        // Calculate work cooldown
        if (jobData.lastWorked) {
            const timeSinceLastWork = Date.now() - jobData.lastWorked;
            const workTimeLeft = Math.max(0, this.WORK_COOLDOWN - timeSinceLastWork);
            cooldown = Math.max(cooldown, workTimeLeft);
        }

        // Calculate quit cooldown
        if (jobData.lastQuit) {
            const timeSinceQuit = Date.now() - jobData.lastQuit;
            const quitTimeLeft = Math.max(0, this.QUIT_COOLDOWN - timeSinceQuit);
            cooldown = Math.max(cooldown, quitTimeLeft);
        }

        // Apply VIP benefits
        if (vipBenefits && vipBenefits.cooldownReduction) {
            cooldown = cooldown * (100 - vipBenefits.cooldownReduction) / 100;
        }

        return Math.max(0, cooldown);
    }

    checkRequirements(requirements, degrees) {
        if (!requirements || requirements.length === 0) return true;
    
        console.log('Checking requirements:', requirements);
        console.log('User degrees:', degrees);
        const result = requirements.some(req => degrees.includes(req));
        console.log('Check result:', result);
        return result;
    }

    calculateTax(amount) {
        for (const bracket of this.TAX_BRACKETS) {
            if (amount <= bracket.threshold) {
                return Math.floor(amount * bracket.rate);
            }
        }
        return Math.floor(amount * this.TAX_BRACKETS[this.TAX_BRACKETS.length - 1].rate);
    }

    getRandomClassicJob() {
        const job = this.CLASSIC_JOBS[Math.floor(Math.random() * this.CLASSIC_JOBS.length)];
        const count = Math.floor(Math.random() * (job.countRange[1] - job.countRange[0] + 1)) + job.countRange[0];
        const earned = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay;
        
        return {
            ...job,
            count,
            earned,
            description: job.description.replace("{count}", count)
        };
    }

    getJobLevel(jobType, workCount) {
        const ranks = JOB_RANKS[jobType] || [];
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (workCount >= ranks[i].minWork) {
                return ranks[i];
            }
        }
        return ranks[0] || null;
    }
}

module.exports = JobSystem;
     