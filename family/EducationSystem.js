const fs = require("fs-extra");
const path = require("path");

class EducationSystem {
  constructor() {
    this.educationDataPath = path.join(
      __dirname,
      "..",
      "database",
      "json",
      "family",
      "education.json"
    );
    this.educationData = this.loadEducationData();
    this.schools = {
      kindergarten: {
        name: "Trường Mẫu giáo",
        minAge: 3,
        maxAge: 6,
        cost: 2000000,
        duration: 3,
        subjects: ["Kỹ năng sống", "Vận động", "Âm nhạc", "Mỹ thuật"],
        benefits: {
          happiness: 3,
          intelligence: 5,
        },
      },
      primary: {
        name: "Trường Tiểu học",
        minAge: 6,
        maxAge: 11,
        cost: 5000000,
        duration: 5,
        subjects: ["Toán", "Văn", "Tiếng Anh", "Tự nhiên - Xã hội"],
        benefits: {
          happiness: 5,
          intelligence: 10,
        },
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
          intelligence: 15,
        },
      },
      highschool: {
        name: "Trường THPT",
        minAge: 15,
        maxAge: 18,
        cost: 15000000,
        duration: 3,
        subjects: [
          "Toán",
          "Văn",
          "Tiếng Anh",
          "Vật lý",
          "Hóa học",
          "Sinh học",
          "Lịch sử",
          "Địa lý",
        ],
        benefits: {
          happiness: 10,
          intelligence: 20,
        },
      },
    };

    this.updateAllEducationYears();
    setInterval(() => this.updateAllEducationYears(), 6 * 60 * 60 * 1000);
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

  debug(message, error = null) {
    console.log(`[EducationSystem Debug] ${message}`);
    if (error) {
      console.error(error);
    }
  }

  updateAllEducationYears() {
    try {
      if (!this.educationData.students) return;

      for (const childId in this.educationData.students) {
        const studentData = this.educationData.students[childId];
        if (studentData.current && studentData.current.status === "enrolled") {
          this.updateEducationYear(childId);
        }
      }

      this.saveEducationData();
    } catch (error) {
      this.debug("Error updating education years", error);
    }
  }

  updateEducationYear(childId) {
    try {
      const studentData = this.educationData.students[childId];
      if (
        !studentData ||
        !studentData.current ||
        studentData.current.status !== "enrolled"
      )
        return;

      const education = studentData.current;
      const school = this.schools[education.schoolType];
      if (!school) return;

      const timeEnrolled = Date.now() - education.enrollmentDate;
      const monthsPerYear = 3;
      const monthsPassed = timeEnrolled / (30 * 24 * 60 * 60 * 1000);
      const yearsShouldBe = Math.min(
        Math.floor(monthsPassed / monthsPerYear) + 1,
        school.duration
      );

      if (yearsShouldBe > education.year) {
        education.year = yearsShouldBe;
        this.debug(`Updated ${childId}'s education year to ${yearsShouldBe}`);

        if (yearsShouldBe >= school.duration) {
          this.autoGraduate(childId);
        }
      }

      if (education.schoolType === "kindergarten") {
        let FamilySystem;
        try {
            FamilySystem = require("./FamilySystem");
            const family = FamilySystem.getInstance();
            const child = family.getChildById(childId);
            
            if (child && child.age >= 6) {
                this.debug(
                    `Force graduating ${childId} from kindergarten due to age (${child.age})`
                );
                this.autoGraduate(childId);
            }
        } catch (err) {
            this.debug(`Error getting FamilySystem: ${err.message}`);
        }
    }
    } catch (error) {
      this.debug(`Error updating education year for ${childId}`, error);
    }
  }

  fixStuckEducation(child) {
    try {
      const currentEducation = this.getChildEducation(child.id);

      if (
        currentEducation &&
        currentEducation.schoolType === "kindergarten" &&
        currentEducation.status === "enrolled" &&
        child.age >= 6
      ) {
        this.debug(
          `Fixing stuck kindergarten student: ${child.id}, age: ${child.age}`
        );

        this.autoGraduate(child.id);

        if (child.age < 11) {
          const check = this.canEnrollInSchool(child, "primary");
          if (check.canEnroll) {
            return this.enrollInSchool(child, "primary");
          }
        } else if (child.age < 15) {
          if (!this.educationData.students[child.id]) {
            this.educationData.students[child.id] = {
              history: [],
              current: null,
            };
          }

          if (!this.educationData.students[child.id].history) {
            this.educationData.students[child.id].history = [];
          }

          const hasPrimary = this.educationData.students[child.id].history.some(
            (edu) => edu.schoolType === "primary" && edu.status === "graduated"
          );

          if (!hasPrimary) {
            const fakeGraduation = {
              schoolType: "primary",
              schoolName: this.schools["primary"].name,
              enrollmentDate: Date.now() - 5 * 365 * 24 * 60 * 60 * 1000,
              graduationDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
              status: "graduated",
              year: this.schools["primary"].duration,
              grades: {},
              attendance: 95,
              behavior: "Tốt",
            };

            this.schools["primary"].subjects.forEach((subject) => {
              fakeGraduation.grades[subject] = {
                score: 7 + Math.random() * 2,
                lastStudy: fakeGraduation.graduationDate,
              };
            });

            this.educationData.students[child.id].history.push(fakeGraduation);
          }

          const check = this.canEnrollInSchool(child, "secondary");
          if (check.canEnroll) {
            return this.enrollInSchool(child, "secondary");
          }
        }

        return { fixed: true, message: "Đã sửa trạng thái học tập" };
      }

      return { fixed: false };
    } catch (error) {
      this.debug(`Error fixing stuck education: ${error.message}`, error);
      return { fixed: false, error: error.message };
    }
  }

  autoGraduate(childId) {
    try {
      const studentData = this.educationData.students[childId];
      if (!studentData || !studentData.current) return;

      const education = studentData.current;
      if (
        education.schoolType !== "kindergarten" &&
        education.schoolType !== "primary"
      )
        return;

      education.status = "graduated";
      education.graduationDate = Date.now();

      if (!studentData.history) studentData.history = [];
      studentData.history.push({ ...education });
      studentData.current = null;

      this.debug(`Auto graduated ${childId} from ${education.schoolType}`);
    } catch (error) {
      this.debug(`Error auto graduating ${childId}`, error);
    }
  }

  canEnrollInSchool(child, schoolType) {
    const school = this.schools[schoolType];
    if (!school)
      return { canEnroll: false, reason: "Trường học không tồn tại" };

    if (child.age < school.minAge) {
      return {
        canEnroll: false,
        reason: `Cần ${school.minAge} tuổi để vào ${school.name}`,
      };
    }

    if (child.age > school.maxAge) {
      return { canEnroll: false, reason: `Quá tuổi để vào ${school.name}` };
    }

    const currentEducation = this.getChildEducation(child.id);
    if (currentEducation && currentEducation.status === "enrolled") {
      if (
        schoolType === "primary" &&
        currentEducation.schoolType === "kindergarten" &&
        child.age >= 6
      ) {
        this.autoGraduate(child.id);
      } else {
        return { canEnroll: false, reason: "Đang học tại trường khác" };
      }
    }

    const studentData = this.educationData.students[child.id];
    if (
      studentData &&
      studentData.history &&
      Array.isArray(studentData.history)
    ) {
      if (schoolType === "primary") {
      } else if (schoolType === "secondary") {
        const hasPrimary = studentData.history.some(
          (edu) => edu.schoolType === "primary" && edu.status === "graduated"
        );
        if (!hasPrimary) {
          return { canEnroll: false, reason: "Cần tốt nghiệp tiểu học trước" };
        }
      } else if (schoolType === "highschool") {
        const hasSecondary = studentData.history.some(
          (edu) => edu.schoolType === "secondary" && edu.status === "graduated"
        );
        if (!hasSecondary) {
          return { canEnroll: false, reason: "Cần tốt nghiệp THCS trước" };
        }
      } else if (schoolType === "university") {
        const hasHighschool = studentData.history.some(
          (edu) => edu.schoolType === "highschool" && edu.status === "graduated"
        );
        if (!hasHighschool) {
          return { canEnroll: false, reason: "Cần tốt nghiệp THPT trước" };
        }
      }
    }

    return { canEnroll: true };
  }

  fixEducationBug(childId) {
    try {
      const family = require("./FamilySystem").getInstance();
      const child = family.getChildById(childId);

      if (!child) {
        return {
          success: false,
          message: "Không tìm thấy thông tin trẻ em này",
        };
      }

      if (this.educationData.students[childId]) {
        const oldHistory = this.educationData.students[childId].history || [];

        this.educationData.students[childId] = {
          history: oldHistory,
          current: null,
        };
      } else {
        this.educationData.students[childId] = {
          history: [],
          current: null,
        };
      }

      const result = this.checkAndAutoEnroll(child);
      this.saveEducationData();

      return {
        success: true,
        message: "Đã sửa lỗi giáo dục thành công",
        newEducation: result || "Không có trường phù hợp với độ tuổi",
      };
    } catch (error) {
      return { success: false, message: `Lỗi: ${error.message}` };
    }
  }
  checkAndAutoEnroll(child) {
    if (!this.educationData.students[child.id]) {
      this.educationData.students[child.id] = {
        history: [],
        current: null,
      };
    }

    const fixResult = this.fixStuckEducation(child);
    if (fixResult && fixResult.fixed) {
      return fixResult;
    }

    const currentEducation = this.getChildEducation(child.id);

    if (currentEducation && currentEducation.status === "enrolled") {
      const school = this.schools[currentEducation.schoolType];
      if (child.age > school.maxAge) {
        this.autoGraduate(child.id);
      } else {
        this.updateEducationYear(child.id);
        return null;
      }
    }

    if (child.age >= 3 && child.age < 6 && !currentEducation) {
      const check = this.canEnrollInSchool(child, "kindergarten");
      if (check.canEnroll) {
        return this.enrollInSchool(child, "kindergarten");
      }
    }

    if (child.age >= 6 && child.age < 11) {
      if (currentEducation && currentEducation.schoolType === "kindergarten") {
        this.autoGraduate(child.id);
      }

      const check = this.canEnrollInSchool(child, "primary");
      if (check.canEnroll) {
        return this.enrollInSchool(child, "primary");
      }
    }

    const studentData = this.educationData.students[child.id];

    if (child.age >= 11 && child.age < 15) {
      if (currentEducation && currentEducation.schoolType === "primary") {
        this.autoGraduate(child.id);
      }

      const hasPrimary =
        studentData &&
        studentData.history &&
        studentData.history.some(
          (edu) => edu.schoolType === "primary" && edu.status === "graduated"
        );

      if (hasPrimary) {
        const check = this.canEnrollInSchool(child, "secondary");
        if (check.canEnroll) {
          return this.enrollInSchool(child, "secondary");
        }
      }
    }

    if (child.age >= 15 && child.age < 18) {
      if (currentEducation && currentEducation.schoolType === "secondary") {
        this.autoGraduate(child.id);
      }

      const hasSecondary =
        studentData &&
        studentData.history &&
        studentData.history.some(
          (edu) => edu.schoolType === "secondary" && edu.status === "graduated"
        );

      if (hasSecondary) {
        const check = this.canEnrollInSchool(child, "highschool");
        if (check.canEnroll) {
          return this.enrollInSchool(child, "highschool");
        }
      }
    }

    return null;
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
      lastStudyTime: 0,
    };

    school.subjects.forEach((subject) => {
      education.grades[subject] = {
        score: 0,
        lastStudy: 0,
      };
    });

    if (!this.educationData.students[child.id]) {
      this.educationData.students[child.id] = {
        history: [],
        current: null,
      };
    }

    const currentEducation = this.getChildEducation(child.id);
    if (currentEducation) {
      if (currentEducation.status === "graduated") {
        if (!this.educationData.students[child.id].history) {
          this.educationData.students[child.id].history = [];
        }
        this.educationData.students[child.id].history.push(currentEducation);
      } else {
        throw new Error("Đang học tại trường khác");
      }
    }

    this.educationData.students[child.id].current = education;
    this.saveEducationData();

    return education;
  }

  getChildEducation(childId) {
    try {
      if (!childId) {
        this.debug("getChildEducation called with null/undefined childId");
        return null;
      }

      if (!this.educationData.students) {
        this.debug("educationData.students is undefined");
        this.educationData.students = {};
        this.saveEducationData();
        return null;
      }

      if (!this.educationData.students[childId]) {
        this.debug(`No education data for child ${childId}`);
        return null;
      }

      return this.educationData.students[childId].current || null;
    } catch (error) {
      this.debug(`Error in getChildEducation: ${error.message}`, error);
      return null;
    }
  }

  getEducationHistory(childId) {
    if (!this.educationData.students[childId]) return [];

    const studentData = this.educationData.students[childId];
    if (studentData.history && Array.isArray(studentData.history)) {
      return studentData.history;
    }

    return [];
  }

  study(child) {
    const education = this.getChildEducation(child.id);
    if (!education || education.status !== "enrolled") {
      throw new Error("Chưa đăng ký học tại trường nào");
    }

    const now = Date.now();
    const cooldown = 3600000;
    if (now - education.lastStudyTime < cooldown) {
      const remainingTime = Math.ceil(
        (cooldown - (now - education.lastStudyTime)) / 60000
      );
      throw new Error(`Cần nghỉ ngơi thêm ${remainingTime} phút`);
    }

    const school = this.schools[education.schoolType];
    const results = {
      intelligence: 0,
      happiness: 0,
      grades: {},
    };

    if (!education.studyStreak) {
      education.studyStreak = {
        count: 0,
        lastStudyDate: null,
      };
    }

    const today = new Date().toDateString();
    if (education.studyStreak.lastStudyDate === today) {
    } else if (
      education.studyStreak.lastStudyDate &&
      new Date(education.studyStreak.lastStudyDate).toDateString() ===
        new Date(Date.now() - 86400000).toDateString()
    ) {
      education.studyStreak.count++;
    } else {
      education.studyStreak.count = 1;
    }

    const streakBonus = Math.min(education.studyStreak.count * 0.1, 0.5);

    const subjects = Object.entries(education.grades)
      .sort(([, a], [, b]) => a.score - b.score)
      .map(([subject]) => subject);
    const subject = subjects[0];

    let improvement = Math.random() * 2 + 2;

    improvement *= 1 + streakBonus;

    if (child.happiness) {
      const happinessBonus = child.happiness / 500;
      improvement *= 1 + happinessBonus;
    }

    if (child.intelligence) {
      const intelligenceBonus = child.intelligence / 333;
      improvement *= 1 + intelligenceBonus;
    }

    const currentScore = education.grades[subject].score;
    const diminishingFactor = Math.max(0.1, (10 - currentScore) / 10);
    improvement *= diminishingFactor;

    education.grades[subject].score = Math.min(10, currentScore + improvement);
    education.grades[subject].lastStudy = now;
    education.lastStudyTime = now;

    results.grades[subject] = {
      name: subject,
      improvement: improvement.toFixed(1),
      streak: education.studyStreak.count,
      streakBonus: `+${(streakBonus * 100).toFixed(0)}%`,
    };

    results.intelligence =
      school.benefits.intelligence * (Math.random() * 0.3 + 0.7);
    results.happiness = school.benefits.happiness * (Math.random() * 0.2 + 0.8);

    this.saveEducationData();

    return results;
  }

  getReport(child) {
    const education = this.getChildEducation(child.id);
    if (!education) {
      return null;
    }

    const school = this.schools[education.schoolType];
    const averageGrade =
      Object.values(education.grades).reduce(
        (sum, grade) => sum + grade.score,
        0
      ) / Object.keys(education.grades).length;

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
      behavior: education.behavior,
    };
  }

  graduate(child) {
    const education = this.getChildEducation(child.id);
    if (!education || education.status !== "enrolled") {
      throw new Error("Không đang học tại trường nào");
    }

    const school = this.schools[education.schoolType];
    const yearsEnrolled =
      (Date.now() - education.enrollmentDate) / (365 * 24 * 60 * 60 * 1000);

    if (yearsEnrolled < school.duration) {
      throw new Error(`Cần học đủ ${school.duration} năm để tốt nghiệp`);
    }

    const averageGrade =
      Object.values(education.grades).reduce(
        (sum, grade) => sum + grade.score,
        0
      ) / Object.keys(education.grades).length;

    if (averageGrade < 5) {
      throw new Error("Điểm trung bình phải đạt từ 5.0 trở lên để tốt nghiệp");
    }

    education.status = "graduated";
    education.graduationDate = Date.now();

    if (!this.educationData.students[child.id]) {
      this.educationData.students[child.id] = {
        history: [],
        current: null,
      };
    }

    if (!this.educationData.students[child.id].history) {
      this.educationData.students[child.id].history = [];
    }

    this.educationData.students[child.id].history.push(education);
    this.educationData.students[child.id].current = null;

    let nextSchool = null;
    if (education.schoolType === "primary" && child.age >= 11) {
      nextSchool = "secondary";
    } else if (education.schoolType === "secondary" && child.age >= 15) {
      nextSchool = "highschool";
    } else if (education.schoolType === "highschool" && child.age >= 18) {
      nextSchool = "university";
    }
    let nextEnrollment = null;
    if (nextSchool) {
      const check = this.canEnrollInSchool(child, nextSchool);
      if (check.canEnroll) {
        nextEnrollment = this.enrollInSchool(child, nextSchool);
      }
    }

    this.saveEducationData();

    const result = {
      schoolName: school.name,
      averageGrade: averageGrade.toFixed(1),
      duration: school.duration,
      graduationDate: education.graduationDate,
    };

    if (nextEnrollment) {
      result.nextSchool = {
        name: nextEnrollment.schoolName,
        type: nextEnrollment.schoolType,
      };
    }

    return result;
  }
}

module.exports = EducationSystem;
