module.exports = {
    STUDY_TIME: 12 * 60 * 60 * 1000, 
    LEARNING_SPEED: 1.0,

    DEGREE_CATEGORIES: {
        "school": {
            name: "Phổ thông",
            degrees: ["e1"]
        },
        "college": {
            name: "Cao đẳng",
            degrees: ["e2"]
        },
        "university": {
            name: "Đại học",
            degrees: ["vnuhcm", "vnuhn", "hcmut", "neu", "hust", "ftu", "ntu", "hmu", "tuaf", "ueh"]
        },
        "certificate": {
            name: "Chứng chỉ",
            degrees: ["eng1", "eng2", "eng3", "fe", "be", "aws", "azure", "ccna"]
        },
        "specialized": {
            name: "Chuyên sâu",
            degrees: ["e5", "research1"]
        }
    },

    DEGREES: {
        "e1": {
            name: "Tốt nghiệp THPT",
            level: 1,
            instantGrant: true,
            cost: 0,
            requirements: [],
            description: "Chứng nhận hoàn thành chương trình phổ thông"
        },

        "e2": {
            name: "Cao đẳng",
            level: 2,
            timeNeeded: 1.5,
            cost: 15000,
            requirements: ["e1"],
            description: "Cao đẳng đào tạo nghề trong 1-1.5 năm"
        },

        "vnuhcm": {
            name: "ĐH Quốc Gia TP.HCM",
            level: 3,
            timeNeeded: 3.5,
            cost: 200000,
            requirements: ["e1"],
            description: "Một trong những đại học trọng điểm quốc gia"
        },
        "vnuhn": {
            name: "ĐH Quốc Gia Hà Nội",
            level: 3,
            timeNeeded: 3.5,
            cost: 200000,
            requirements: ["e1"],
            description: "Đại học hàng đầu tại miền Bắc"
        },
        "hcmut": {
            name: "ĐH Bách Khoa TP.HCM",
            level: 3,
            timeNeeded: 3.5,
            cost: 250000,
            requirements: ["e1"],
            description: "Trường đào tạo kỹ thuật hàng đầu phía Nam"
        },
        "hust": {
            name: "ĐH Bách Khoa Hà Nội",
            level: 3,
            timeNeeded: 3.5,
            cost: 250000,
            requirements: ["e1"],
            description: "Trường kỹ thuật công nghệ hàng đầu Việt Nam"
        },
        "neu": {
            name: "ĐH Kinh tế Quốc dân",
            level: 3,
            timeNeeded: 3.5,
            cost: 220000,
            requirements: ["e1"],
            description: "Đại học hàng đầu về kinh tế, quản trị"
        },
        "ftu": {
            name: "ĐH Ngoại thương",
            level: 3,
            timeNeeded: 3.5,
            cost: 220000,
            requirements: ["e1"],
            description: "Trường đào tạo thương mại quốc tế hàng đầu"
        },
        "hmu": {
            name: "ĐH Y Hà Nội",
            level: 3,
            timeNeeded: 3.5,
            cost: 300000,
            requirements: ["e1"],
            description: "Trường y khoa hàng đầu Việt Nam"
        },
        "ntu": {
            name: "ĐH Nha Trang",
            level: 3,
            timeNeeded: 3.5,
            cost: 180000,
            requirements: ["e1"],
            description: "Chuyên ngành thủy sản và khoa học biển"
        },
        "tuaf": {
            name: "ĐH Nông Lâm TP.HCM",
            level: 3,
            timeNeeded: 3.5,
            cost: 200000,
            requirements: ["e1"],
            description: "Chuyên ngành về nông nghiệp, lâm nghiệp"
        },
        "ueh": {
            name: "ĐH Kinh tế TP.HCM",
            level: 3,
            timeNeeded: 3.5,
            cost: 200000,
            requirements: ["e1"],
            description: "Trường đào tạo kinh tế, tài chính hàng đầu"
        },
        "e5": {
            name: "Tiến sĩ",
            level: 10,
            timeNeeded: 7,
            cost: 1000000,
            requirements: ["vnuhcm", "vnuhn", "hcmut", "neu", "hust", "ftu", "ntu", "hmu", "tuaf", "ueh"],
            description: "Học vị cao nhất trong hệ thống giáo dục"
        },
        "research1": {
            name: "Nghiên cứu khoa học",
            level: 10,
            timeNeeded: 7,
            cost: 1000000,
            requirements: ["e5"],
            description: "Chứng nhận nghiên cứu khoa học"
        }
    }
};
