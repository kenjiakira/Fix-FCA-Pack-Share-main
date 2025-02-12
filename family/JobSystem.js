const fs = require('fs');
const path = require('path');
const { JOBS } = require('../config/jobConfig');

class JobSystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/job.json');
        this.data = this.loadData();
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
            totalEarned: 0,
            workCount: 0
        };
    }

    saveData() {
        try {
            if (!this.data || typeof this.data !== 'object') {
                this.data = {};
            }
            for (const userId in this.data) {
                if (!this.data[userId] || !this.data[userId].currentJob) {
                    this.data[userId] = {
                        currentJob: null,
                        jobHistory: [],
                        lastWorked: 0,
                        totalEarned: 0,
                        workCount: 0
                    };
                }
            }
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Error saving job data:', error);
            return false;
        }
    }

    getJob(userID) {
        if (!this.data[userID]) {
            this.data[userID] = {
                currentJob: null,
                jobHistory: [],
                lastWorked: 0,
                totalEarned: 0,
                workCount: 0
            };
        }
        if (!this.data[userID].jobHistory) this.data[userID].jobHistory = [];
        this.saveData();
        return this.data[userID];
    }

    async checkQualification(userID, jobId) {
        const eduPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        try {
            const eduData = JSON.parse(fs.readFileSync(eduPath));
            const education = eduData[userID] || { degrees: [] };
            const job = JOBS[jobId];
            const DEGREES = require('../config/educationConfig').DEGREES;

            if (!job) return { qualified: false, reason: "Công việc không tồn tại" };
            if (!job.requirements || job.requirements.length === 0) return { qualified: true };

            console.log('User degrees:', education.degrees);
            console.log('Job requirements:', job.requirements);

            const userDegrees = education.degrees.map(d => d === "highschool" ? "e1" : d);
            console.log('Mapped degrees:', userDegrees);

            const hasQualification = job.requirements.some(req => {
                const requiredLevel = DEGREES[req].level;
                return userDegrees.some(degree => {
                    const userDegreeLevel = DEGREES[degree]?.level || 0;
                    return userDegreeLevel >= requiredLevel;
                });
            });

            console.log('Has qualification:', hasQualification);

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
        jobData.jobHistory.push({
            ...oldJob,
            endDate: Date.now()
        });

        jobData.currentJob = null;
        this.saveData();
        return JOBS[oldJob.id];
    }

    canWork(userID) {
        const jobData = this.getJob(userID);
        if (!jobData.currentJob) return false;
        
        const COOLDOWN = 10 * 60 * 1000; 
        const timeSinceLastWork = Date.now() - jobData.lastWorked;
        return timeSinceLastWork >= COOLDOWN;
    }

    work(userID) {
        try {
            this.data = this.loadData();
            
            if (!this.data[userID]) {
                throw new Error("Không tìm thấy thông tin người dùng!");
            }

            const jobData = this.data[userID];
            
            if (!jobData.currentJob || !jobData.currentJob.id) {
                throw new Error("Bạn chưa có việc làm!");
            }

            if (!JOBS[jobData.currentJob.id]) {
                jobData.currentJob = null;
                this.saveData();
                throw new Error("Công việc không hợp lệ! Vui lòng xin việc lại.");
            }

            if (!this.canWork(userID)) {
                const cooldown = this.getWorkCooldown(userID);
                throw new Error(`Bạn cần nghỉ ngơi ${Math.ceil(cooldown/1000)} giây nữa!`);
            }

            const job = JOBS[jobData.currentJob.id];
            jobData.lastWorked = Date.now();
            jobData.workCount++;
            jobData.totalEarned += job.salary;

            const saved = this.saveData();
            if (!saved) {
                throw new Error("Không thể lưu thông tin làm việc!");
            }

            return job;
        } catch (error) {
            console.error('Work error:', error);
            throw error;
        }
    }

    getWorkCooldown(userID) {
        const jobData = this.getJob(userID);
        if (!jobData.lastWorked) return 0;
        
        const COOLDOWN = 10 * 60 * 1000; 
        const timeLeft = COOLDOWN - (Date.now() - jobData.lastWorked);
        return Math.max(0, timeLeft);
    }
}

module.exports = JobSystem;
