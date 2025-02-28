const fs = require('fs-extra');
const path = require('path');

class EducationSystem {
    constructor() {
        this.educationDataPath = path.join(__dirname, '..', 'database', 'json', 'family', 'education.json');
        this.educationData = this.loadEducationData();
        this.schools = {
            primary: {
                name: "Trường Tiểu học",
                minAge: 6,
                maxAge: 11,
                cost: 5000000,
                duration: 5, 
                subjects: ["Toán", "Văn", "Tiếng Anh", "Tự nhiên - Xã hội"],
                benefits: {
                    happiness: 5,
                    intelligence: 10
                }
            },
            secondary: {
                name: "Trường THCS",
                minAge: 11,
                maxAge: 15,
                cost: 10000000,
                duration: 4,
                subjects: ["Toán", "Văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học"],
                benefits: {
                    happiness: 8,
                    intelligence: 15
                }
            },
            highschool: {
                name: "Trường THPT",
                minAge: 15,
                maxAge: 18,
                cost: 15000000,
                duration: 3,
                subjects: ["Toán", "Văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý"],
                benefits: {
                    happiness: 10,
                    intelligence: 20
                }
            }
        };
    }

    loadEducationData() {
        try {
            return fs.readJsonSync(this.educationDataPath);
        } catch (error) {
            const defaultData = { students: {} };
            fs.writeJsonSync(this.educationDataPath, defaultData);
            return defaultData;
        }
    }

    saveEducationData() {
        fs.writeJsonSync(this.educationDataPath, this.educationData);
    }

    getChildEducation(childId) {
        return this.educationData.students[childId] || null;
    }

    canEnrollInSchool(child, schoolType) {
        const school = this.schools[schoolType];
        if (!school) return { canEnroll: false, reason: "Trường học không tồn tại" };

        if (child.age < school.minAge) {
            return { canEnroll: false, reason: `Cần ${school.minAge} tuổi để vào ${school.name}` };
        }

        if (child.age > school.maxAge) {
            return { canEnroll: false, reason: `Quá tuổi để vào ${school.name}` };
        }

        const currentEducation = this.getChildEducation(child.id);
        if (currentEducation && currentEducation.status === "enrolled") {
            return { canEnroll: false, reason: "Đang học tại trường khác" };
        }

        return { canEnroll: true };
    }

    enrollInSchool(child, schoolType) {
        const check = this.canEnrollInSchool(child, schoolType);
        if (!check.canEnroll) {
            throw new Error(check.reason);
        }

        const school = this.schools[schoolType];
        const education = {
            schoolType,
            schoolName: school.name,
            enrollmentDate: Date.now(),
            status: "enrolled",
            year: 1,
            grades: {},
            attendance: 100,
            behavior: "Tốt",
            lastStudyTime: 0
        };

        school.subjects.forEach(subject => {
            education.grades[subject] = {
                score: 0,
                lastStudy: 0
            };
        });

        if (!this.educationData.students[child.id]) {
            this.educationData.students[child.id] = [];
        }
        this.educationData.students[child.id] = education;
        this.saveEducationData();

        return education;
    }

    study(child) {
        const education = this.getChildEducation(child.id);
        if (!education || education.status !== "enrolled") {
            throw new Error("Chưa đăng ký học tại trường nào");
        }

        const now = Date.now();
        const cooldown = 3600000; // 1 hour cooldown
        if (now - education.lastStudyTime < cooldown) {
            const remainingTime = Math.ceil((cooldown - (now - education.lastStudyTime)) / 60000);
            throw new Error(`Cần nghỉ ngơi thêm ${remainingTime} phút`);
        }

        const school = this.schools[education.schoolType];
        const results = {
            intelligence: 0,
            happiness: 0,
            grades: {}
        };

        const subjects = Object.keys(education.grades);
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const improvement = Math.random() * 2 + 1;
        
        education.grades[subject].score = Math.min(10, education.grades[subject].score + improvement);
        education.grades[subject].lastStudy = now;
        education.lastStudyTime = now;

        results.grades[subject] = {
            name: subject,
            improvement: improvement.toFixed(1)
        };

        results.intelligence = school.benefits.intelligence * (Math.random() * 0.5 + 0.5); // 50-100% of benefit
        results.happiness = school.benefits.happiness * (Math.random() * 0.8 + 0.2); // 20-100% of benefit

        this.saveEducationData();

        return results;
    }

    getReport(child) {
        const education = this.getChildEducation(child.id);
        if (!education) {
            return null;
        }

        const school = this.schools[education.schoolType];
        const averageGrade = Object.values(education.grades)
            .reduce((sum, grade) => sum + grade.score, 0) / Object.keys(education.grades).length;

        let ranking;
        if (averageGrade >= 9) ranking = "Xuất sắc";
        else if (averageGrade >= 8) ranking = "Giỏi";
        else if (averageGrade >= 7) ranking = "Khá";
        else if (averageGrade >= 5) ranking = "Trung bình";
        else ranking = "Yếu";

        return {
            schoolName: school.name,
            year: education.year,
            grades: education.grades,
            averageGrade: averageGrade.toFixed(1),
            ranking,
            attendance: education.attendance,
            behavior: education.behavior
        };
    }

    graduate(child) {
        const education = this.getChildEducation(child.id);
        if (!education || education.status !== "enrolled") {
            throw new Error("Không đang học tại trường nào");
        }

        const school = this.schools[education.schoolType];
        const yearsEnrolled = (Date.now() - education.enrollmentDate) / (365 * 24 * 60 * 60 * 1000);
        
        if (yearsEnrolled < school.duration) {
            throw new Error(`Cần học đủ ${school.duration} năm để tốt nghiệp`);
        }

        const averageGrade = Object.values(education.grades)
            .reduce((sum, grade) => sum + grade.score, 0) / Object.keys(education.grades).length;

        if (averageGrade < 5) {
            throw new Error("Điểm trung bình phải đạt từ 5.0 trở lên để tốt nghiệp");
        }

        education.status = "graduated";
        this.saveEducationData();

        return {
            schoolName: school.name,
            averageGrade: averageGrade.toFixed(1),
            duration: school.duration,
            graduationDate: Date.now()
        };
    }
}

module.exports = EducationSystem;
