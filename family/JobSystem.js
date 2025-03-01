const fs = require('fs');
const path = require('path');
const { JOBS, JOB_RANKS } = require('../config/family/jobConfig');

class JobSystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/job.json');
        this.educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        this.data = this.loadData();
        this.TAX_BRACKETS = [
            { threshold: 1000000, rate: 0.01 },  
            { threshold: 5000000, rate: 0.03 }, 
            { threshold: 10000000, rate: 0.05 },
            { threshold: Infinity, rate: 0.10 }  
        ];

        this.QUIT_COOLDOWN = 60 * 60 * 1000; 
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

            let missingDegrees = [];
            
            for (const req of job.requirements) {
                const requiredLevel = DEGREES[req].level;
                const requiredCategory = this.getDegreeCategory(req);
                
                const hasDegree = userDegrees.some(degree => {
                    const userDegreeLevel = DEGREES[degree]?.level || 0;
                    const userDegreeCategory = this.getDegreeCategory(degree);
                    return userDegreeCategory === requiredCategory && userDegreeLevel >= requiredLevel;
                });
                
                if (!hasDegree) {
                    missingDegrees.push(DEGREES[req].name);
                }
            }

            if (missingDegrees.length > 0) {
                return { 
                    qualified: false, 
                    reason: `Bạn cần có ${missingDegrees.join(", ")} để đủ điều kiện làm công việc này`
                };
            }

            return { qualified: true };
        } catch (error) {
            console.error('Error checking qualification:', error);
            return { qualified: false, reason: "Lỗi kiểm tra bằng cấp" };
        }
    }

    getDegreeCategory(degreeId) {
        const DEGREE_CATEGORIES = require('../config/family/educationConfig').DEGREE_CATEGORIES;
        
        for (const [categoryId, category] of Object.entries(DEGREE_CATEGORIES)) {
            if (category.degrees.includes(degreeId)) {
                return categoryId;
            }
        }
        return null;
    }

    async applyForJob(userID, jobId) {
        try {
            if (!JOBS[jobId]) {
                throw new ExpectedError("Công việc không tồn tại!");
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
            if (!error.isExpected) {
                console.error('Apply job error:', error);
            }
            throw error;
        }
    }

    quitJob(userID) {
        const jobData = this.getJob(userID);
        if (!jobData.currentJob) {
            throw new ExpectedError("❌ Bạn chưa có việc làm!\n vui lòng apply job trước bằng cách gõ\njob apply [mã job]");
        }

        const oldJob = {...jobData.currentJob};
        const quitTime = Date.now();
        
        jobData.jobHistory.push({
            ...oldJob,
            endDate: quitTime
        });
        
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
            
            class ExpectedError extends Error {
                constructor(message) {
                    super(message);
                    this.isExpected = true;
                }
            }
    
            if (!jobData.currentJob || !jobData.currentJob.id) {
                throw new ExpectedError("❌ Bạn chưa có việc làm!\n vui lòng apply job trước bằng cách gõ\njob apply [mã job]");
            }
    
            const cooldown = this.getWorkCooldown(userID, vipBenefits);
            if (cooldown > 0) {
                const minutes = Math.floor(cooldown / 60000);
                const seconds = Math.ceil((cooldown % 60000) / 1000);
                throw new ExpectedError(`Bạn cần nghỉ ngơi ${minutes > 0 ? `${minutes} phút ` : ''}${seconds} giây nữa!`);
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
            if (!error.isExpected) {
                console.error('Work error:', error);
            }
            throw error;
        }
    }

    getWorkCooldown(userID, vipBenefits = null) {
        const jobData = this.getJob(userID);
        let cooldown = 0;

        if (jobData.lastWorked) {
            const timeSinceLastWork = Date.now() - jobData.lastWorked;
            const workTimeLeft = Math.max(0, this.WORK_COOLDOWN - timeSinceLastWork);
            cooldown = Math.max(cooldown, workTimeLeft);
        }

        if (jobData.lastQuit) {
            const timeSinceQuit = Date.now() - jobData.lastQuit;
            const quitTimeLeft = Math.max(0, this.QUIT_COOLDOWN - timeSinceQuit);
            cooldown = Math.max(cooldown, quitTimeLeft);
        }

        if (vipBenefits && vipBenefits.cooldownReduction) {
            cooldown = cooldown * (100 - vipBenefits.cooldownReduction) / 100;
        }

        return Math.max(0, cooldown);
    }

    checkRequirements(requirements, degrees) {
        if (!requirements || requirements.length === 0) return true;

        const DEGREES = require('../config/family/educationConfig').DEGREES;
        
        for (const req of requirements) {
            const requiredLevel = DEGREES[req]?.level || 0;
            const requiredCategory = this.getDegreeCategory(req);

            const hasDegree = degrees.some(degreeId => {
                const userDegreeLevel = DEGREES[degreeId]?.level || 0;
                const userDegreeCategory = this.getDegreeCategory(degreeId);
                return userDegreeCategory === requiredCategory && userDegreeLevel >= requiredLevel;
            });
            
            if (!hasDegree) return false;
        }
        
        return true;
    }

    calculateTax(amount) {
        for (const bracket of this.TAX_BRACKETS) {
            if (amount <= bracket.threshold) {
                return Math.floor(amount * bracket.rate);
            }
        }
        return Math.floor(amount * this.TAX_BRACKETS[this.TAX_BRACKETS.length - 1].rate);
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
