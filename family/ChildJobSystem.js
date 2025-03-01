const fs = require('fs-extra');
const path = require('path');

class ChildJobSystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/childJobs.json');
        this.data = this.loadData();
        
        if (!this.data || typeof this.data !== 'object') {
            this.data = {};
            this.saveData();
        }
    }

    loadData() {
        try {
            if (!fs.existsSync(this.path)) {
                const defaultData = {};
                fs.writeJsonSync(this.path, defaultData);
                return defaultData;
            }
            return fs.readJsonSync(this.path);
        } catch (error) {
            console.error('Error loading child jobs data:', error);
            return {};
        }
    }

    saveData() {
        try {
            fs.writeJsonSync(this.path, this.data);
            return true;
        } catch (error) {
            console.error('Error saving child jobs data:', error);
            return false;
        }
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

    calculateAge(birthDate) {
        if (!birthDate) return 0;
        const hours = Math.floor((Date.now() - birthDate) / (1000 * 60 * 60));
        return Math.floor(hours / 12); 
    }


    saveJobData() {
        fs.writeJsonSync(this.jobDataPath, this.jobData);
    }

    calculateBaseIncome(child) {

        let baseIncome = 0;
        if (child.age >= 6 && child.age < 11) {
            baseIncome = 1000;
        } else if (child.age >= 11 && child.age < 15) { 
            baseIncome = 2000;
        } else if (child.age >= 15 && child.age <= 18) {
            baseIncome = 3000;
        }

        if (child.education) {
            const gradeBonus = (child.education.averageGrade - 5) * 0.1;
            baseIncome *= (1 + Math.max(0, gradeBonus));

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
           
            if (now - data.lastUpdate > 24 * 60 * 60 * 1000) return;

            const income = Math.floor(data.baseIncome * hoursSinceLastUpdate / 6); // Income per 6 hours
            data.totalEarnings += income;
            data.lastUpdate = now;

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
        if (!childId) return null;
        
        try {
            if (!this.data[childId]) {
                this.data[childId] = {
                    currentJob: null,
                    lastUpdate: null,
                    pendingIncome: 0,
                    totalIncome: 0
                };
                this.saveData();
            }
    
            const jobData = this.data[childId];
            if (!jobData || !jobData.currentJob) return null;
    
            const jobs = this.getAllJobs(); // Use internal jobs list
            const job = jobs[jobData.currentJob];
            if (!job) return null;
    
            const now = Date.now();
            const timeSinceUpdate = now - (jobData.lastUpdate || 0);
            const hoursWorked = Math.floor(timeSinceUpdate / (6 * 60 * 60 * 1000));
            
            if (hoursWorked > 0) {
                jobData.pendingIncome = hoursWorked * job.baseIncome;
                jobData.nextUpdate = Math.ceil((6 - ((timeSinceUpdate / (60 * 60 * 1000)) % 6)) * 60);
            }
    
            return {
                name: job.name,
                baseIncome: job.baseIncome,
                pendingIncome: jobData.pendingIncome || 0,
                nextUpdate: jobData.nextUpdate || 360,
                totalIncome: jobData.totalIncome || 0
            };
        } catch (error) {
            console.error("Error getting child job info:", error);
            return null;
        }
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
            'factory': {
                name: 'Công nhân',
                baseIncome: 2000000,
                description: 'Làm việc tại nhà máy sản xuất',
                minAge: 14,
                maxAge: 100,
                education: 'secondary'
            },
            'tutor': {
                name: 'Gia sư',
                baseIncome: 2000000,
                description: 'Dạy kèm học sinh các cấp',
                minAge: 20,
                maxAge: 70,
                education: 'university' 
            },
            'office': {
                name: 'Phụ việc văn phòng',
                baseIncome: 3000000,
                description: 'Làm việc bán thời gian tại văn phòng',
                minAge: 18,
                maxAge: 70,
                education: 'highschool'
            }
        };
    }
    

    collectIncome(childId) {
        if (!this.data[childId]) {
            throw new Error("Chưa đăng ký làm việc");
        }

        const jobData = this.data[childId];
        if (!jobData.currentJob) {
            throw new Error("Chưa có công việc");
        }

        if (!jobData.pendingIncome || jobData.pendingIncome <= 0) {
            const now = Date.now();
            const timeSinceUpdate = now - (jobData.lastUpdate || 0);
            const minutesUntilNext = Math.ceil((6 - ((timeSinceUpdate / (60 * 60 * 1000)) % 6)) * 60);
            throw new Error(`Chưa đến giờ nhận tiền (còn ${minutesUntilNext} phút)`);
        }

        const collected = jobData.pendingIncome;
        jobData.totalIncome = (jobData.totalIncome || 0) + collected;
        jobData.pendingIncome = 0;
        jobData.lastUpdate = Date.now();
        this.saveData();

        return {
            collected: collected,
            total: jobData.totalIncome,
            nextUpdate: 360
        };
    }

    assignJob(childId, jobInput) {
        if (!childId || !jobInput) {
            throw new Error("Thiếu thông tin con hoặc công việc");
        }
    
        let jobId;
        if (typeof jobInput === 'object') {
            const jobs = this.getAllJobs();
            for (const [id, job] of Object.entries(jobs)) {
                if (job.name === jobInput.name) {
                    jobId = id;
                    break;
                }
            }
        } else {
            jobId = jobInput;
        }
    
        const jobs = this.getAllJobs();
        const job = jobs[jobId];
        
        if (!job) {
            throw new Error("Công việc không tồn tại");
        }

        if (!this.data[childId]) {
            this.data[childId] = {
                currentJob: jobId,
                lastUpdate: Date.now(),
                pendingIncome: 0,
                totalIncome: 0
            };
        } else {
            this.data[childId].currentJob = jobId;
            this.data[childId].lastUpdate = Date.now();
            this.data[childId].pendingIncome = 0;
        }
    
        this.saveData();
        return true;
    }

    getAvailableJobs(child) {
        if (!child || !child.birthDate) return [];
        
        const age = this.calculateAge(child.birthDate);
        console.log(`Debug - Child ${child.name} age: ${age}`);
    
        let graduatedSchools = [];
        if (this.familySystem && this.familySystem.educationSystem) {
            const educationHistory = this.familySystem.educationSystem.getEducationHistory(child.id) || [];
            graduatedSchools = educationHistory
                .filter(edu => edu.status === "graduated")
                .map(edu => edu.schoolType);
        }
    
        const jobs = this.getAllJobs();
        return Object.values(jobs).filter(job => {
     
            const meetsAge = age >= job.minAge && age <= (job.maxAge || Infinity);
            
            const meetsEducation = !job.education || graduatedSchools.includes(job.education);
            
            console.log(`Debug - Job ${job.name}: min=${job.minAge}, max=${job.maxAge}, education=${job.education || 'none'}, meets=${meetsAge && meetsEducation}`);
            
            return meetsAge && meetsEducation;
        });
    }
    
}

module.exports = ChildJobSystem;
