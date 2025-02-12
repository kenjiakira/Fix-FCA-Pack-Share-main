const fs = require('fs');
const path = require('path');
const HomeSystem = require('./HomeSystem');

class FamilySystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/family.json');
        this.data = this.loadData();
        this.homeSystem = new HomeSystem();
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
                home: null,
                happiness: 50,
                lastChecked: Date.now(),
                lastBaby: 0,  // Thêm thời gian sinh con gần nhất
                lastIntimate: 0 // Thêm thời gian động phòng gần nhất
            };
            this.saveData();
        }

        // Thêm phần đồng bộ thông tin con cái giữa vợ chồng
        const family = this.data[userID];
        if (family.spouse && this.data[family.spouse]) {
            const spouseFamily = this.data[family.spouse];
            // Đồng bộ con cái giữa 2 vợ chồng
            if (spouseFamily.children.length > family.children.length) {
                family.children = [...spouseFamily.children];
            } else if (family.children.length > spouseFamily.children.length) {
                spouseFamily.children = [...family.children];
            }
            // Đồng bộ thời gian sinh con
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
        family1.proposedBy = null
        
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

    getSharedHome(userID) {
        let home = this.homeSystem.getHome(userID);
        if (home) return home;
        
        const family = this.getFamily(userID);
        if (family.spouse) {
            home = this.homeSystem.getHome(family.spouse);
            if (home) return home;
        }
        return null;
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

            console.log('Vehicles found for', userID, ':', vehicles);
            
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
        
        family.spouse = null;
        family.happiness = 50;
        
        spouseFamily.spouse = null;
        spouseFamily.happiness = 50;

        this.saveData();
        return true;
    }

    addChild(userID, childName) {
        const family = this.getFamily(userID);
        if (!family.spouse) throw new Error("Bạn cần kết hôn trước!");
        
        const child = {
            name: childName,
            birthDate: Date.now(),
            happiness: 100,
            gender: Math.random() < 0.5 ? "👦" : "👧", // Random giới tính
            nickname: this.generateNickname(childName) // Tạo biệt danh ngẫu nhiên
        };

        // Thêm con cho cả 2 vợ chồng
        family.children.push(child);
        family.lastBaby = Date.now();
        
        const spouseFamily = this.getFamily(family.spouse);
        spouseFamily.children = [...family.children]; // Sử dụng spread operator để copy mảng
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
        const timePassed = (Date.now() - family.lastChecked) / (1000 * 60 * 60 * 24); // Days
        
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

    buyHome(userID, type) {
        const family = this.getFamily(userID);
        const homeConfig = require('../config/familyConfig').HOME_PRICES[type];

        if (!homeConfig) {
            throw new Error("Loại nhà không hợp lệ!");
        }

        if (family.home) {
            throw new Error("Bạn đã có nhà rồi! Hãy bán nhà cũ trước.");
        }

        family.home = {
            type: type,
            name: homeConfig.name,
            purchaseDate: Date.now(),
            condition: 100,
            lastMaintenance: Date.now(),
            upgrades: [],
            stats: {
                security: 0,
                comfort: 0,
                environment: 0,
                luxury: 0
            }
        };

        if (homeConfig.isRental) {
            family.home.rentEndDate = Date.now() + (homeConfig.rentPeriod * 24 * 60 * 60 * 1000);
        }

        this.saveData();
        return family.home;
    }

    sellHome(userID) {
        const family = this.getFamily(userID);
        if (!family.home) {
            throw new Error("Bạn chưa có nhà!");
        }

        const homeConfig = require('../config/familyConfig').HOME_PRICES[family.home.type];
        const sellPrice = Math.floor(homeConfig.xu * (family.home.condition / 100) * 0.7);

        family.home = null;
        this.saveData();

        return sellPrice;
    }

    maintainHome(userID) {
        const family = this.getFamily(userID);
        if (!family.home) {
            throw new Error("Bạn chưa có nhà!");
        }

        const maintenanceCost = Math.floor(
            require('../config/familyConfig').HOME_PRICES[family.home.type].xu * 0.05
        );

        family.home.condition = 100;
        family.home.lastMaintenance = Date.now();
        this.saveData();

        return maintenanceCost;
    }

    upgradeHome(userID, upgradeType) {
        const family = this.getFamily(userID);
        const upgrades = require('../config/familyConfig').HOME_UPGRADES;

        if (!family.home) {
            throw new Error("Bạn chưa có nhà!");
        }

        if (!upgrades[upgradeType]) {
            throw new Error("Gói nâng cấp không hợp lệ!");
        }

        if (family.home.upgrades.includes(upgradeType)) {
            throw new Error("Bạn đã có gói nâng cấp này rồi!");
        }

        const upgrade = upgrades[upgradeType];
        family.home.upgrades.push(upgradeType);

        // Cập nhật thông số nhà
        Object.entries(upgrade.effects).forEach(([stat, value]) => {
            if (family.home.stats[stat] !== undefined) {
                family.home.stats[stat] = Math.min(100, (family.home.stats[stat] || 0) + value);
            }
        });

        this.saveData();
        return upgrade;
    }

    getHomeStats(home) {
        if (!home) return null;
        return home.stats;
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
            const degreeConfig = require('../config/educationConfig').DEGREES;
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
            
            const { JOBS } = require('../config/jobConfig');
            const currentJob = JOBS[job.currentJob.id];
            return `${currentJob.name}`;
        } catch (error) {
            console.error("Error reading job info:", error);
            return "Thất nghiệp";
        }
    }
}

module.exports = FamilySystem;
