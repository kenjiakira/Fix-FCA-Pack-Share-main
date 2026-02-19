const fs = require('fs');
const path = require('path');
const HomeSystem = require('./HomeSystem');
const TravelSystem = require('./TravelSystem');

class FamilySystem {
    constructor() {
        if (FamilySystem.instance) {
            return FamilySystem.instance;
        }
        FamilySystem.instance = this;
        this.homeSystem = new HomeSystem();
        this.travelSystem = new TravelSystem();
        this.path = path.join(__dirname, '../../database/json/family/family.json');
        this.data = this.loadData();
    }
    static getInstance() {
        if (!FamilySystem.instance) {
            FamilySystem.instance = new FamilySystem();
        }
        return FamilySystem.instance;
    }
    
    getChildById(childId) {
        for (const family of Object.values(this.data)) {
            if (family.children) {
                const child = family.children.find(c => c.id === childId);
                if (child) return child;
            }
        }
        return null;
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
        if (!userID) return this.createDefaultFamily();

        if (!this.data[userID]) {
            this.data[userID] = this.createDefaultFamily();
            this.saveData();
        }
        
        return this.data[userID];
    }

    createDefaultFamily() {
        return {
            name: null,
            spouse: null,
            children: [],
            home: null,
            happiness: 50,
            health: 90,
            lastChecked: Date.now(),
            lastBaby: 0,
            lastIntimate: 0,
            insurance: {
                active: false,
                expiresAt: 0,
                discount: 0
            }
        };
    }

    marry(userID1, userID2) {
        if (!userID1 || !userID2) throw new Error("Invalid user IDs");

        const family1 = this.getFamily(userID1);
        const family2 = this.getFamily(userID2);

        if (family1.spouse) throw new Error("Người này đã kết hôn!");
        if (family2.spouse) throw new Error("Người kia đã kết hôn!");
        if (userID1 === userID2) throw new Error("Không thể tự kết hôn với chính mình!");

        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../database/rankData.json'), 'utf8'));
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

hasChildrenUnderSix(userID) {
    const family = this.getFamily(userID);
    if (!family.children || family.children.length === 0) {
        return false;
    }
    
    return family.children.some(child => {
        const ageInYears = (Date.now() - child.birthDate) / (1000 * 60 * 60 * 24 * 365);
        return ageInYears < 6;
    });
}

getFamilyIncomeLevel(userID) {
    try {
        const jobPath = path.join(__dirname, '../../database/json/family/job.json');
        let totalIncome = 0;
        
        const jobData = JSON.parse(fs.readFileSync(jobPath));
        const userJob = jobData[userID];
        
        if (userJob && userJob.currentJob) {
            const { JOBS } = require('../config/family/jobConfig');
            const job = JOBS[userJob.currentJob.id];
            totalIncome += job.salary || 0;
        }
        
        const family = this.getFamily(userID);
        
        if (family.spouse) {
            const spouseJob = jobData[family.spouse];
            if (spouseJob && spouseJob.currentJob) {
                const { JOBS } = require('../config/family/jobConfig');
                const job = JOBS[spouseJob.currentJob.id];
                totalIncome += job.salary || 0;
            }
        }
        
        let assetPoints = 0;
        const homeInfo = this.homeSystem.getHomeInfo(userID);
        if (homeInfo) {
            const { HOMES } = require('../config/family/homeConfig');
            const homeType = Object.keys(HOMES).find(type => HOMES[type].name === homeInfo.name);
            if (homeType) {
                const homeValue = HOMES[homeType].price;
     
                if (homeValue >= 500000000) assetPoints += 5;
                else if (homeValue >= 200000000) assetPoints += 3;
                else if (homeValue >= 100000000) assetPoints += 2;
                else assetPoints += 1;
            }
        }
        
        const sharedVehicles = this.getSharedVehicles(userID);
        if (Object.keys(sharedVehicles).length > 0) {
            const { CARS } = require('../config/family/carConfig');
            Object.keys(sharedVehicles).forEach(carId => {
                const car = CARS[carId];
                if (car) {
                    if (car.price >= 1000000000) assetPoints += 5;
                    else if (car.price >= 500000000) assetPoints += 3;
                    else if (car.price >= 200000000) assetPoints += 2;
                    else assetPoints += 1;
                }
            });
        }
        
        let level, description;
        let benefits = [];
        
        if (totalIncome <= 5000000 && assetPoints <= 1) {
            level = "Hộ nghèo";
            description = "Thu nhập thấp, cần hỗ trợ";
            benefits = [
                "Miễn phí BHYT 100%",
                "Miễn phí thuốc men 50%",
                "Miễn học phí cho con cái",
                "Giảm 50% chi phí sửa chữa nhà"
            ];
        } else if (totalIncome <= 10000000 && assetPoints <= 2) {
            level = "Hộ cận nghèo";
            description = "Thu nhập trung bình thấp";
            benefits = [
                "Giảm 70% chi phí BHYT",
                "Miễn phí thuốc men 50%",
                "Giảm 50% học phí cho con cái"
            ];
        } else if (totalIncome <= 20000000 && assetPoints <= 3) {
            level = "Hộ trung bình";
            description = "Thu nhập ổn định";
            benefits = [];
        } else if (totalIncome <= 50000000 || assetPoints <= 5) {
            level = "Hộ khá giả";
            description = "Thu nhập cao";
            benefits = [];
        } else {
            level = "Hộ giàu có";
            description = "Thu nhập rất cao, nhiều tài sản";
            benefits = [];
        }
        
        if (assetPoints >= 8) {
            level = "Hộ giàu có";
            description = "Sở hữu nhiều tài sản giá trị";
            benefits = [];
        } else if (assetPoints >= 5 && level !== "Hộ giàu có") {
            level = "Hộ khá giả";
            description = "Thu nhập ổn định, có tài sản";
            benefits = [];
        }
        
        const hasChildrenUnder6 = this.hasChildrenUnderSix(userID);
        if (hasChildrenUnder6) {
            benefits.push("Miễn phí thuốc men cho trẻ em dưới 6 tuổi");
            benefits.push("Miễn phí khám chữa bệnh cho trẻ em dưới 6 tuổi");
        }
        
        return {
            level: level,
            income: totalIncome,
            description: description,
            assetPoints: assetPoints,
            benefits: benefits,
            hasChildrenUnder6: hasChildrenUnder6
        };
    } catch (error) {
        console.error("Error calculating family income level:", error);
        return {
            level: "Không xác định",
            income: 0,
            description: "Không thể xác định thu nhập",
            assetPoints: 0,
            benefits: []
        };
    }
}

getMarriageInfo(userID) {
    const family = this.getFamily(userID);
    const incomeLevel = this.getFamilyIncomeLevel(userID);
    const home = this.getHomeInfo(userID);

    let spouseName = "Chưa kết hôn";
    if (family.spouse) {
        spouseName = this.getUserName(family.spouse);
    }

    return {
        spouse: spouseName,
        happiness: Math.round(family.happiness),
        childCount: family.children ? family.children.length : 0,
        home: home,
        incomeLevel: {
            level: incomeLevel.level,
            income: incomeLevel.income,
            description: incomeLevel.description,
            benefits: incomeLevel.benefits || []
        },
        isMarried: !!family.spouse,
        lastIntimate: family.lastIntimate || 0,
        insurance: family.insurance || {
            active: false,
            expiresAt: 0,
            discount: 0
        }
    };
}

confirmMarriage(proposerID, acceptorID) {
        const proposer = this.getFamily(proposerID);
        const acceptor = this.getFamily(acceptorID);

        if (proposer.spouse || acceptor.spouse) {
            throw new Error("Một trong hai người đã kết hôn!");
        }

        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../database/rankData.json'), 'utf8'));
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
        const garagePath = path.join(__dirname, '../../database/json/family/garage.json');
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
    
    async addChild(parentId, babyName) {
        try {
            const family = this.getFamily(parentId);
            if (!family) {
                throw new Error("Không tìm thấy thông tin gia đình!");
            }

            if (!family.children) {
                family.children = [];
            }

            const child = {
                id: Date.now().toString(),
                name: babyName,
                gender: Math.random() < 0.5 ? "👦" : "👧",
                birthDate: Date.now(),
                happiness: 100,
                nickname: this.generateNickname(babyName),
                isMarried: false,
                movedOut: false
            };

            family.children.push(child);

            this.saveData();

            return child;
        } catch (error) {
            console.error("Add child error:", error);
            throw error;
        }
    }


    generateNickname(name) {
        const nicknames = ["Bé", "Cưng", "Yêu", "Pin", "Bo", "Tí"];
        return `${nicknames[Math.floor(Math.random() * nicknames.length)]} ${name}`;
    }

    calculateAge(birthDate) {
        const hours = Math.floor((Date.now() - birthDate) / (1000 * 60 * 60));
        const years = Math.floor(hours / 12); 
        const remainingMonths = hours % 12;
        
        if (years > 0) {
            return `${years} tuổi ${remainingMonths} tháng`;
        }
        return `${remainingMonths} tháng`;
    }
    
    
    getAgeInYears(birthDate) {
        const hours = Math.floor((Date.now() - birthDate) / (1000 * 60 * 60));
        return Math.floor(hours / 12);
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
        
        const { COOLDOWNS } = require('../config/family/familyConfig');
        const minutesSinceLastBaby = (Date.now() - family.lastBaby) / (1000 * 60);
        
        if (family.contraceptiveUntil && family.contraceptiveUntil > Date.now()) {
            return false;
        }

        return minutesSinceLastBaby >= (family.contraceptiveUntil ? COOLDOWNS.protected : COOLDOWNS.normal);
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
        const educationPath = path.join(__dirname, '../../database/json/family/familyeducation.json');
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
        const jobPath = path.join(__dirname, '../../database/json/family/job.json');
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
        if (!userID) return "Người dùng không xác định";
        
        const userDataPath = path.join(__dirname, '../../database/rankData.json');
        try {
            if (!fs.existsSync(userDataPath)) {
                return userID.toString();
            }
            
            const rawData = fs.readFileSync(userDataPath, 'utf8');
            if (!rawData || rawData.trim() === '') {
                return userID.toString();
            }
            
            const userData = JSON.parse(rawData);
            
            if (!userData || !userData[userID] || !userData[userID].name) {
                return userID.toString();
            }
            
            return userData[userID].name;
        } catch (error) {
            console.error('Error reading userData:', error);
            return userID.toString();
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
    
        return family.children.map((child, index) => {
       
            const ageInYears = Math.floor((Date.now() - child.birthDate) / (1000 * 60 * 60 * 24 * 365));
            
            return {
                index,
                id: child.id,
                name: child.name,
                gender: child.gender,
                nickname: child.nickname,
                age: this.calculateAge(child.birthDate),
                ageInYears: ageInYears, 
                birthDate: child.birthDate,
                happiness: Math.round(child.happiness)
            };
        });
    }
    
    useContraceptive(userID) {
        const family = this.getFamily(userID);
        const { COOLDOWNS } = require('../config/family/familyConfig');
        
        family.contraceptiveUntil = Date.now() + (COOLDOWNS.protected * 60 * 1000);
        
        if (family.spouse) {
            const spouseFamily = this.getFamily(family.spouse);
            spouseFamily.contraceptiveUntil = family.contraceptiveUntil;
        }
        
        this.saveData();
        return true;
    }

    getAllFamilies() {
        return this.data;
    }

    getHomeInfo(userID) {
        return this.homeSystem.getHomeInfo(userID);
    }

    buyHome(userID, homeType) {
        return this.homeSystem.buyHome(userID, homeType);
    }

    sellHome(userID) {
        return this.homeSystem.sellHome(userID);
    }

    repairHome(userID) {
        return this.homeSystem.repair(userID);
    }

    // Travel System Methods
    calculateTravelCost(userID, destination) {
        const family = this.getFamily(userID);
        const familySize = {
            type: family.spouse ? 'couple' : 'single',
            children: family.children ? family.children.length : 0
        };
        return this.travelSystem.calculateTravelCost(userID, destination, familySize);
    }

    canTravel(userID) {
        return this.travelSystem.canTravel(userID);
    }

    startTravel(userID, destination) {
        return this.travelSystem.startTravel(userID, destination);
    }

    endTravel(userID) {
        const happinessIncrease = this.travelSystem.endTravel(userID);
        this.increaseHappiness(userID, happinessIncrease);
        return happinessIncrease;
    }

    getTravelStatus(userID) {
        return this.travelSystem.getTravelStatus(userID);
    }

    getDestinationInfo(destination) {
        return this.travelSystem.getDestinationInfo(destination);
    }

    getAllDestinations() {
        return this.travelSystem.getAllDestinations();
    }
}
FamilySystem.instance = null;

module.exports = FamilySystem;
