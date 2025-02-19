const fs = require('fs');
const path = require('path');

class FamilySystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/family.json');
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (!fs.existsSync(this.path)) {
                fs.writeFileSync(this.path, '{}');
                return {};
            }
            return JSON.parse(fs.readFileSync(this.path));
        } catch (error) {
            console.error('Error loading family data:', error);
            return {};
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving family data:', error);
            return false;
        }
    }

    getFamily(userID) {
        if (!this.data[userID]) {
            this.data[userID] = {
                name: null,
                spouse: null,
                children: [],
                happiness: 50,
                lastChecked: Date.now(),
                lastBaby: 0,
                lastIntimate: 0
            };
            this.saveData();
        }

        const family = this.data[userID];
        if (family.spouse && this.data[family.spouse]) {
            const spouseFamily = this.data[family.spouse];
            if (spouseFamily.children.length > family.children.length) {
                family.children = [...spouseFamily.children];
            } else if (family.children.length > spouseFamily.children.length) {
                spouseFamily.children = [...family.children];
            }
            if (spouseFamily.lastBaby > family.lastBaby) {
                family.lastBaby = spouseFamily.lastBaby;
            } else if (family.lastBaby > spouseFamily.lastBaby) {
                spouseFamily.lastBaby = family.lastBaby;
            }
            this.saveData();
        }

        return family;
    }

    marry(userID1, userID2) {
        if (!userID1 || !userID2) throw new Error("Invalid user IDs");

        const family1 = this.getFamily(userID1);
        const family2 = this.getFamily(userID2);

        if (family1.spouse) throw new Error("Người này đã kết hôn!");
        if (family2.spouse) throw new Error("Người kia đã kết hôn!");
        if (userID1 === userID2) throw new Error("Không thể tự kết hôn với chính mình!");

        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, '../events/cache/userData.json'), 'utf8'));
        const proposerName = userData[userID1]?.name || userID1;

        family1.spouse = userID2;
        family1.isProposer = true;
        family1.proposedBy = null;
        
        family2.spouse = userID1;
        family2.isProposer = false;
        family2.proposedBy = proposerName;
        
        family1.happiness = 100;
        family2.happiness = 100;

        this.saveData();
        return true;
    }

    confirmMarriage(proposerID, acceptorID) {
        const proposer = this.getFamily(proposerID);
        const acceptor = this.getFamily(acceptorID);

        if (proposer.spouse || acceptor.spouse) {
            throw new Error("Một trong hai người đã kết hôn!");
        }

        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, '../events/cache/userData.json'), 'utf8'));
        const proposerName = userData[proposerID]?.name || proposerID;

        proposer.spouse = acceptorID;
        proposer.isProposer = true;
        proposer.proposedBy = null;
        proposer.happiness = 100;

        acceptor.spouse = proposerID;
        acceptor.isProposer = false;
        acceptor.proposedBy = proposerName;
        acceptor.happiness = 100;

        this.saveData();
        return true;
    }

    getSharedVehicles(userID) {
        const family = this.getFamily(userID);
        const garagePath = path.join(__dirname, '../database/json/family/garage.json');
        try {
            const garageData = JSON.parse(fs.readFileSync(garagePath, 'utf8'));
            let vehicles = {};

            if (garageData[userID] && garageData[userID].vehicles) {
                vehicles = {...garageData[userID].vehicles};
            }
            
            if (family.spouse && garageData[family.spouse]) {
                const spouseVehicles = garageData[family.spouse].vehicles || {};
                vehicles = {...vehicles, ...spouseVehicles};
            }
            
            return vehicles;
        } catch (error) {
            console.error('Error loading shared vehicles:', error);
            return {};
        }
    }

    divorce(userID) {
        const family = this.getFamily(userID);
        if (!family.spouse) throw new Error("Bạn chưa kết hôn!");

        const spouseFamily = this.getFamily(family.spouse);
        const hasChildren = family.children && family.children.length > 0;

        if (hasChildren) {
            const children = [...family.children];
            if (family.happiness >= spouseFamily.happiness) {
                spouseFamily.children = [];
                family.hasCustody = true;
                spouseFamily.hasCustody = false;
            } else {
                family.children = [];
                family.hasCustody = false;
                spouseFamily.hasCustody = true;
            }
        }

        family.spouse = null;
        family.happiness = 50;
        
        spouseFamily.spouse = null;
        spouseFamily.happiness = 50;

        this.saveData();
        return {
            success: true,
            custodyInfo: hasChildren ? {
                parent: family.hasCustody ? userID : family.spouse,
                childCount: family.children.length || spouseFamily.children.length
            } : null
        };
    }

    addChild(userID, childName) {
        const family = this.getFamily(userID);
        if (!family.spouse) throw new Error("Bạn cần kết hôn trước!");
        
        const child = {
            name: childName,
            birthDate: Date.now(),
            happiness: 100,
            gender: Math.random() < 0.5 ? "👦" : "👧",
            nickname: this.generateNickname(childName)
        };

        family.children.push(child);
        family.lastBaby = Date.now();
        
        const spouseFamily = this.getFamily(family.spouse);
        spouseFamily.children = [...family.children];
        spouseFamily.lastBaby = family.lastBaby;

        this.saveData();
        return child;
    }

    generateNickname(name) {
        const nicknames = ["Bé", "Cưng", "Yêu", "Sunshine", "Angel"];
        return `${nicknames[Math.floor(Math.random() * nicknames.length)]} ${name}`;
    }

    calculateAge(birthDate) {
        const hours = Math.floor((Date.now() - birthDate) / (1000 * 60 * 60));
        const months = hours;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        
        if (years > 0) {
            return `${years} tuổi ${remainingMonths} tháng`;
        }
        return `${months} tháng`;
    }

    updateHappiness(userID) {
        const family = this.getFamily(userID);
        const timePassed = (Date.now() - family.lastChecked) / (1000 * 60 * 60 * 24);
        
        if (timePassed >= 1) {
            family.happiness = Math.max(0, family.happiness - (timePassed * 5));
            
            if (family.children.length > 0) {
                family.children = family.children.map(child => ({
                    ...child,
                    happiness: Math.max(0, child.happiness - (timePassed * 3))
                }));
            }

            family.lastChecked = Date.now();
            this.saveData();
        }

        return family;
    }

    increaseHappiness(userID, amount) {
        const family = this.getFamily(userID);
        family.happiness = Math.min(100, family.happiness + amount);

        if (family.spouse) {
            const spouseFamily = this.getFamily(family.spouse);
            spouseFamily.happiness = family.happiness;
        }

        this.saveData();
        return family.happiness;
    }

    canHaveNewBaby(userID) {
        const family = this.getFamily(userID);
        if (!family.children || family.children.length === 0 || family.lastBaby === 0) {
            return true;
        }
        
        const daysSinceLastBaby = (Date.now() - family.lastBaby) / (1000 * 60 * 60 * 24);
        return daysSinceLastBaby >= 3;
    }

    intimate(userID) {
        const family = this.getFamily(userID);
        if (!family.spouse) throw new Error("Bạn cần kết hôn trước!");
        
        family.lastIntimate = Date.now();
        const spouseFamily = this.getFamily(family.spouse);
        spouseFamily.lastIntimate = Date.now();
        
        this.saveData();
        return true;
    }

    validateBabyName(name) {
        return /^[a-zA-ZÀ-ỹ\s]{2,20}$/.test(name);
    }

    getEducationInfo(userID) {
        const educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        try {
            const eduData = JSON.parse(fs.readFileSync(educationPath));
            const education = eduData[userID] || { degrees: [] };
            
            if (!education || !education.degrees || education.degrees.length === 0) {
                return "Chưa tốt nghiệp";
            }

            const degrees = education.degrees.map(degree => {
                if (degree === "highschool") return "e1";
                return degree;
            });

            const highestDegree = degrees[degrees.length - 1];
            const degreeConfig = require('../config/family/educationConfig').DEGREES;
            return degreeConfig[highestDegree]?.name || "Chưa tốt nghiệp";

        } catch (error) {
            console.error("Error reading education info:", error);
            return "Chưa tốt nghiệp";
        }
    }

    getJobInfo(userID) {
        const jobPath = path.join(__dirname, '../database/json/family/job.json');
        try {
            const jobData = JSON.parse(fs.readFileSync(jobPath));
            const job = jobData[userID];
            if (!job || !job.currentJob) return "Thất nghiệp";
            
            const { JOBS } = require('../config/family/jobConfig');
            const currentJob = JOBS[job.currentJob.id];
            return `${currentJob.name}`;
        } catch (error) {
            console.error("Error reading job info:", error);
            return "Thất nghiệp";
        }
    }

    getUserName(userID) {
        const userDataPath = path.join(__dirname, '../events/cache/userData.json');
        try {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            return userData[userID]?.name || userID;
        } catch (error) {
            console.error('Error reading userData:', error);
            return userID;
        }
    }

    renameChild(userID, childIndex, newName) {
        const family = this.getFamily(userID);
        if (!family.children || !family.children[childIndex]) {
            throw new Error("Không tìm thấy con!");
        }

        if (!this.validateBabyName(newName)) {
            throw new Error("Tên không hợp lệ!");
        }

        const child = family.children[childIndex];
        child.name = newName;
        child.nickname = this.generateNickname(newName);

        if (family.spouse) {
            const spouseFamily = this.getFamily(family.spouse);
            if (spouseFamily.children && spouseFamily.children[childIndex]) {
                spouseFamily.children[childIndex] = {...child};
            }
        }

        this.saveData();
        return child;
    }

    getChildInfo(userID) {
        const family = this.getFamily(userID);
        if (!family.children || family.children.length === 0) {
            return "Chưa có con";
        }

        return family.children.map((child, index) => ({
            index,
            name: child.name,
            gender: child.gender,
            nickname: child.nickname,
            age: this.calculateAge(child.birthDate),
            happiness: Math.round(child.happiness)
        }));
    }

    getMarriageInfo(userID) {
        const family = this.getFamily(userID);
        if (!family) {
            return {
                spouse: "Độc thân",
                happiness: 0,
                childCount: 0,
                children: []
            };
        }

        return {
            spouse: family.spouse ? this.getUserName(family.spouse) : "Độc thân",
            happiness: Math.round(family.happiness || 0),
            childCount: (family.children || []).length,
            children: family.children || []
        };
    }

    sendChildToTemple(userID, childIndex) {
        const family = this.getFamily(userID);
        if (!family.children || !family.children[childIndex]) {
            throw new Error("Không tìm thấy con!");
        }

        const child = family.children[childIndex];
        
        family.children.splice(childIndex, 1);
        
        if (family.spouse) {
            const spouseFamily = this.getFamily(family.spouse);
            if (spouseFamily.children) {
                spouseFamily.children.splice(childIndex, 1);
            }
        }

        this.saveData();
        return {
            name: child.name,
            gender: child.gender
        };
    }
}

module.exports = FamilySystem;
