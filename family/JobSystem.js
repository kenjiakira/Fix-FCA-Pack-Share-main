const fs = require('fs');
const path = require('path');
const { JOBS, JOB_RANKS } = require('../config/family/jobConfig');
const WorkCountTracker = require('./WorkCountTracker');

class JobSystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/job.json');
        this.educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        this.data = this.loadData();
        this.workCountTracker = new WorkCountTracker();
        this.TAX_BRACKETS = [
            { threshold: 1, rate: 0.01 },  
            { threshold: 50, rate: 0.03 }, 
            { threshold: 100, rate: 0.05 },
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

                // Synchronize work count from tracker on load
                if (this.workCountTracker) {
                    data[userId].workCount = this.workCountTracker.getCount(userId);
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
        
        // Always sync with work count tracker when getting job data
        if (this.workCountTracker) {
            this.data[userID].workCount = this.workCountTracker.getCount(userID);
        }
        
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
            // Reload data to ensure we have the latest
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
                // Auto-assign a basic job for new users
                try {
                    const basicJobId = "j1"; // Shipper - basic job that requires no qualifications
                    const autoJob = this.applyForJob(userID, basicJobId);
                    jobData.currentJob = {
                        id: basicJobId,
                        startDate: Date.now(),
                        performance: 100
                    };
                    this.saveData();
                    
                    // Return special flag to indicate auto-assignment
                    return { 
                        autoAssigned: true,
                        job: JOBS[basicJobId]
                    };
                } catch (autoError) {
                    throw new ExpectedError("❌ Bạn chưa có việc làm!\n vui lòng apply job trước bằng cách gõ\njob apply [mã job]");
                }
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
            
            // Get the current work count from the tracker - single source of truth
            const oldWorkCount = this.workCountTracker.getCount(userID);
            const previousLevel = this.getJobLevel(jobType, oldWorkCount);
            
            let salary = job.salary;
            if (previousLevel && previousLevel.bonus) {
                salary = Math.floor(salary * previousLevel.bonus);
            }

            if (vipBenefits && vipBenefits.workBonus) {
                const bonusAmount = Math.floor(salary * (vipBenefits.workBonus / 100));
                salary += bonusAmount;
            }
            
            const taxAmount = this.calculateTax(salary);
            const taxRate = (taxAmount / salary) * 100;
            
            jobData.lastWorked = Date.now();
            jobData.totalEarned = (jobData.totalEarned || 0) + salary;
            
            // Add net earnings calculation (after tax) for easier reference
            const netEarnings = salary - taxAmount;
            jobData.lastEarnings = netEarnings;
            
            const newWorkCount = this.workCountTracker.incrementCount(userID);
    
            jobData.workCount = newWorkCount;
            const saved = this.saveData();
            if (!saved) {
                throw new Error("Không thể lưu thông tin làm việc!");
            }
            
            const newLevel = this.getJobLevel(jobType, newWorkCount);
            const leveledUp = previousLevel && newLevel && (newLevel.name !== previousLevel.name);

            return {
                ...job,
                id: jobData.currentJob.id,
                salary,
                tax: taxRate,  
                workCount: newWorkCount,
                levelName: newLevel?.name || job.name, 
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
            
            const jobCooldown = this.getJobBasedCooldown(userID);
            const workTimeLeft = Math.max(0, jobCooldown - timeSinceLastWork);
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

    getJobBasedCooldown(userID) {
        const jobData = this.getJob(userID);
        if (!jobData.currentJob) return this.WORK_COOLDOWN;
        
        const jobId = jobData.currentJob.id;
        const job = JOBS[jobId];
        if (!job) return this.WORK_COOLDOWN;

        const baseSalary = 50; 
        const baseCooldown = this.WORK_COOLDOWN;
        
        let salaryRatio = job.salary / baseSalary;
        
        if (salaryRatio > 1) {
         
            salaryRatio = Math.pow(salaryRatio, 0.6);
        }
        
        salaryRatio = Math.min(Math.max(salaryRatio, 1), 12); 
        
        const jobType = job.type || 'shipper';
        const currentLevel = this.getJobLevel(jobType, jobData.workCount || 0);
        let rankAdjustment = 1.0;
        
        if (currentLevel && currentLevel.bonus > 1) {
       
            const reductionFactor = Math.min((currentLevel.bonus - 1) * 0.6, 0.3);
            rankAdjustment = 1 - reductionFactor;
        }
        
        const jobBasedCooldown = Math.floor(baseCooldown * salaryRatio * rankAdjustment);

        return jobBasedCooldown;
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
        workCount = parseInt(workCount) || 0;
        
        const ranks = JOB_RANKS[jobType] || [];
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (workCount >= ranks[i].minWork) {
                return ranks[i];
            }
        }
        return ranks[0] || null;
    }

    // Add new helper method to suggest jobs based on education
    suggestJobsByEducation(userID) {
        try {
            const education = this.loadEducation(userID);
            const suggestedJobs = [];
            
            // Check all jobs for qualification
            for (const [jobId, jobData] of Object.entries(JOBS)) {
                const isQualified = this.checkRequirements(jobData.requirements, education.degrees || []);
                if (isQualified) {
                    suggestedJobs.push({
                        id: jobId,
                        name: jobData.name,
                        salary: jobData.salary
                    });
                }
            }
            
            // Sort by salary (descending) and limit to 5 jobs
            suggestedJobs.sort((a, b) => b.salary - a.salary);
            return suggestedJobs.slice(0, 5);
        } catch (error) {
            console.error('Error suggesting jobs:', error);
            return [];
        }
    }

    // Add fast-track job application method
    quickApply(userID) {
        // Get all suggested jobs based on education
        const suggestedJobs = this.suggestJobsByEducation(userID);
        
        if (suggestedJobs.length === 0) {
            // Return the basic job if no matches
            return this.applyForJob(userID, "j1");
        }
        
        // Apply for the best job available
        return this.applyForJob(userID, suggestedJobs[0].id);
    }
}

module.exports = JobSystem;
