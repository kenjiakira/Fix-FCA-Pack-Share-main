const fs = require('fs');
const path = require('path');
const HomeSystem = require('./HomeSystem');
const EducationSystem = require('./EducationSystem');
const ChildJobSystem = require('./ChildJobSystem');
const TravelSystem = require('./TravelSystem');

class FamilySystem {
    constructor() {
        this.homeSystem = new HomeSystem();
        this.educationSystem = new EducationSystem();
        this.childJobSystem = new ChildJobSystem();
        this.travelSystem = new TravelSystem();
        this.childJobSystem.familySystem = this; 
        this.healthDecayInterval = 24 * 60 * 60 * 1000; 
        this.healthDecayAmount = 5;
        this.path = path.join(__dirname, '../database/json/family/family.json');
        this.data = this.loadData();
        this.startHealthMonitoring();
        this.startInsuranceMonitoring();
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
        if (!this.data[userID]) {
            this.data[userID] = {
                name: null,
                spouse: null,
                children: [],
                happiness: 50,
                health: 100,
                lastChecked: Date.now(),
                lastBaby: 0,
                lastIntimate: 0,
                insurance: {
                    active: false,
                    expiresAt: 0,
                    discount: 0
                }
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
        const jobPath = path.join(__dirname, '../database/json/family/job.json');
        let totalIncome = 0;
        
        const jobData = JSON.parse(fs.readFileSync(jobPath));
        const userJob = jobData[userID];
        
        if (userJob && userJob.currentJob) {
            const { JOBS } = require('../config/family/jobConfig');
            const job = JOBS[userJob.currentJob.id];
            totalIncome += job.salary || 0;
        }
        
        const family = this.getFamily(userID);
        
        if (family.children && family.children.length > 0) {
            family.children.forEach(child => {
                const childJobInfo = this.childJobSystem.getChildJobInfo(child.id);
                if (childJobInfo) {
                    totalIncome += childJobInfo.baseIncome || 0;
                }
            });
        }
        
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

async arrangeMarriage(childIndex1, parentId1, targetChildIndex, targetParentId) {
    const family1 = this.getFamily(parentId1);
    const family2 = this.getFamily(targetParentId);

    if (!family1.children?.[childIndex1] || !family2.children?.[targetChildIndex]) {
        throw new Error("❌ Không tìm thấy thông tin của một trong hai đứa con!");
    }

    const child1 = family1.children[childIndex1];
    const child2 = family2.children[targetChildIndex];

    if (child1.isMarried) {
        throw new Error(`❌ ${child1.name} đã kết hôn rồi!`);
    }
    if (child2.isMarried) {
        throw new Error(`❌ ${child2.name} đã kết hôn rồi!`);
    }

    const getMarriageAge = (birthDate) => {
        const hours = Math.floor((Date.now() - birthDate) / (1000 * 60 * 60));
        return Math.floor(hours / 12);
    };

    const age1 = getMarriageAge(child1.birthDate);
    const age2 = getMarriageAge(child2.birthDate);

    const minMarriageAge = {
        "👦": 20, 
        "👧": 18 
    };

    if (age1 < minMarriageAge[child1.gender]) {
        throw new Error(
            `❌ ${child1.name} chưa đủ tuổi kết hôn! ` +
            `(${age1}/${minMarriageAge[child1.gender]} tuổi)`
        );
    }

    if (age2 < minMarriageAge[child2.gender]) {
        throw new Error(
            `❌ ${child2.name} chưa đủ tuổi kết hôn! ` +
            `(${age2}/${minMarriageAge[child2.gender]} tuổi)`
        );
    }

    if (child1.gender === child2.gender) {
        throw new Error("❌ Gay à !");
    }

    return {
        child1: {
            name: child1.name,
            gender: child1.gender,
            age: age1,
            parent: parentId1
        },
        child2: {
            name: child2.name,
            gender: child2.gender,
            age: age2,
            parent: targetParentId
        }
    };
}

canWorkByAge(birthDate) {
    const hours = Math.floor((Date.now() - birthDate) / (1000 * 60 * 60));
    const age = Math.floor(hours / 12);
    return age >= 13; 
}

async confirmChildMarriage(childIndex1, parentId1, targetChildIndex, targetParentId) {
    const marriage = await this.arrangeMarriage(childIndex1, parentId1, targetChildIndex, targetParentId);
    const family1 = this.getFamily(parentId1);
    const family2 = this.getFamily(targetParentId);

    const child1 = family1.children[childIndex1];
    const child2 = family2.children[targetChildIndex];

    child1.isMarried = true;
    child1.spouseName = child2.name;
    child1.spouseParentId = targetParentId;
    child1.marriageDate = Date.now();
    child1.movedOut = true;

    child2.isMarried = true;
    child2.spouseName = child1.name;
    child2.spouseParentId = parentId1;
    child2.marriageDate = Date.now();
    child2.movedOut = true;

    this.saveData();

    return {
        success: true,
        couple: {
            spouse1: {
                name: child1.name,
                gender: child1.gender,
                parentName: this.getUserName(parentId1)
            },
            spouse2: {
                name: child2.name,
                gender: child2.gender,
                parentName: this.getUserName(targetParentId)
            }
        }
    };
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

            this.childJobSystem.registerChild(child);

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
        if (!userID) return "Người dùng không xác định";
        
        const userDataPath = path.join(__dirname, '../events/cache/userData.json');
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

    startHealthMonitoring() {
        setInterval(() => {
            for (const [userId, family] of Object.entries(this.data)) {
                if (!family.health) family.health = 100;
                family.health = Math.max(0, family.health - this.healthDecayAmount);
            }
            this.saveData();
        }, this.healthDecayInterval);
    }

    startInsuranceMonitoring() {
        setInterval(() => {
            const now = Date.now();
            for (const [userId, family] of Object.entries(this.data)) {
                if (family.insurance && family.insurance.active && now > family.insurance.expiresAt) {
                    family.insurance.active = false;
                    family.insurance.discount = 0;
                }
            }
            this.saveData();
        }, 60 * 60 * 1000);
    }

    activateInsurance(userID, insuranceType, duration, discount) {
        const family = this.getFamily(userID);
        const expiresAt = Date.now() + (duration * 24 * 60 * 60 * 1000);
        
        if (!family.insurances) {
            family.insurances = {};
        }

        family.insurances[insuranceType] = {
            active: true,
            expiresAt: expiresAt,
            discount: discount
        };

        if (insuranceType === 'health') {
            family.insurance = family.insurances[insuranceType];
        }
        
        this.saveData();
        return family.insurances[insuranceType];
    }

    hasActiveInsurance(userID, type = 'health') {
        const family = this.getFamily(userID);
        if (!family.insurances || !family.insurances[type]) return false;
        
        const now = Date.now();
        if (family.insurances[type].expiresAt < now) {
            family.insurances[type].active = false;
            this.saveData();
            return false;
        }
        
        return family.insurances[type].active;
    }

    getInsuranceDiscount(userID, type = 'health') {
        const family = this.getFamily(userID);
        if (!this.hasActiveInsurance(userID, type)) return 0;
        return family.insurances[type]?.discount || 0;
    }

    getVehicleInsuranceInfo(userID) {
        const family = this.getFamily(userID);
        if (!family.insurances) return {};

        return {
            car: family.insurances.car || null,
            bike: family.insurances.bike || null
        };
    }

    getInsuranceStatus(userID) {
        const family = this.getFamily(userID);
        if (!family.insurances) return {};

        const now = Date.now();
        const status = {};

        for (const [type, insurance] of Object.entries(family.insurances)) {
            if (insurance.active && insurance.expiresAt > now) {
                const daysLeft = Math.ceil((insurance.expiresAt - now) / (24 * 60 * 60 * 1000));
                status[type] = {
                    active: true,
                    discount: insurance.discount,
                    daysLeft: daysLeft
                };
            }
        }

        return status;
    }

    getHealth(userId) {
        const family = this.getFamily(userId);
        if (!family.health) family.health = 100;
        return Math.round(family.health);
    }

    increaseHealth(userId, amount) {
        const family = this.getFamily(userId);
        if (!family.health) family.health = 100;
        family.health = Math.min(100, family.health + amount);
        this.saveData();
        return Math.round(family.health);
    }

    decreaseHealth(userId, amount) {
        const family = this.getFamily(userId);
        if (!family.health) family.health = 100;
        family.health = Math.max(0, family.health - amount);
        this.saveData();
        return Math.round(family.health);
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

module.exports = FamilySystem;
