module.exports = {
    STUDY_TIME: 24 * 60 * 60 * 1000, 
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
            degrees: ["e3", "vnuhcm", "vnuhn", "hcmut", "neu", "hust", "ftu", "ntu", "hmu", "tuaf", "ueh"]
        },
        "certificate": {
            name: "Chứng chỉ",
            degrees: ["eng1", "eng2", "eng3", "fe", "be", "aws", "azure", "ccna"]
        },
        "specialized": {
            name: "Chuyên sâu",
            degrees: ["e4", "e5", "research1"]
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
            timeNeeded: 3,
            cost: 15000,
            requirements: ["e1"],
            description: "Cao đẳng đào tạo nghề trong 2-3 năm"
        },

        "e3": {
            name: "Đại học",
            level: 3,
            timeNeeded: 4,
            cost: 20000,
            requirements: ["e1"],
            description: "Đại học cơ bản đào tạo 4-5"
        },

        "vnuhcm": {
            name: "ĐH Quốc Gia TP.HCM",
            level: 3,
            timeNeeded: 7,
            cost: 200000,
            requirements: ["e1"],
            description: "Một trong những đại học trọng điểm quốc gia"
        },
        "vnuhn": {
            name: "ĐH Quốc Gia Hà Nội",
            level: 3,
            timeNeeded: 7,
            cost: 200000,
            requirements: ["e1"],
            description: "Đại học hàng đầu tại miền Bắc"
        },
        "hcmut": {
            name: "ĐH Bách Khoa TP.HCM",
            level: 3,
            timeNeeded: 7,
            cost: 250000,
            requirements: ["e1"],
            description: "Trường đào tạo kỹ thuật hàng đầu phía Nam"
        },
        "hust": {
            name: "ĐH Bách Khoa Hà Nội",
            level: 3,
            timeNeeded: 7,
            cost: 250000,
            requirements: ["e1"],
            description: "Trường kỹ thuật công nghệ hàng đầu Việt Nam"
        },
        "neu": {
            name: "ĐH Kinh tế Quốc dân",
            level: 3,
            timeNeeded: 7,
            cost: 220000,
            requirements: ["e1"],
            description: "Đại học hàng đầu về kinh tế, quản trị"
        },
        "hnue": {
            name: "ĐH Sư phạm Hà Nội",
            level: 3,
            timeNeeded: 7,
            cost: 180000,
            requirements: ["e1"],
            description: "Trường đào tạo giáo viên hàng đầu Việt Nam"
        },
        "ftu": {
            name: "ĐH Ngoại thương",
            level: 5,
            timeNeeded: 7,
            cost: 220000,
            requirements: ["e1"],
            description: "Trường đào tạo thương mại quốc tế hàng đầu"
        },
        "ntu": {
            name: "ĐH Nha Trang",
            level: 5,
            timeNeeded: 7,
            cost: 180000,
            requirements: ["e1"],
            description: "Đại học chuyên về thủy sản và du lịch"
        },
        "hmu": {
            name: "ĐH Y Hà Nội",
            level: 5,
            timeNeeded: 7,
            cost: 300000,
            requirements: ["e1"],
            description: "Trường y khoa hàng đầu Việt Nam"
        },
        "tuaf": {
            name: "ĐH Nông Lâm TP.HCM",
            level: 5,
            timeNeeded: 7,
            cost: 180000,
            requirements: ["e1"],
            description: "Đại học về nông nghiệp và lâm nghiệp"
        },
        "ueh": {
            name: "ĐH Kinh tế TP.HCM",
            level: 5,
            timeNeeded: 7,
            cost: 200000,
            requirements: ["e1"],
            description: "Trường đào tạo kinh tế hàng đầu phía Nam"
        },

        "e4": {
            name: "Thạc sĩ",
            level: 9,
            timeNeeded: 10,
            cost: 500000,
            requirements: ["e3"],
            description: "Bằng thạc sĩ (sau đại học)"
        },

        "e5": {
            name: "Tiến sĩ",
            level: 10,
            timeNeeded: 14,
            cost: 1000000,
            requirements: ["e4"],
            description: "Học vị cao nhất trong hệ thống giáo dục"
        },

        "eng1": {
            name: "Tiếng Anh B1",
            level: 1,
            timeNeeded: 7,
            cost: 60000,
            requirements: ["e1"],
            description: "Chứng chỉ tiếng Anh trình độ trung cấp"
        },
        "eng2": {
            name: "Tiếng Anh B2",
            level: 2,
            timeNeeded: 7,
            cost: 120000,
            requirements: ["eng1"],
            description: "Chứng chỉ tiếng Anh trình độ khá"
        },
        "eng3": {
            name: "Tiếng Anh C1",
            level: 3,
            timeNeeded: 7,
            cost: 200000,
            requirements: ["eng2"],
            description: "Chứng chỉ tiếng Anh cao cấp"
        },

        "fe": {
            name: "Frontend Developer",
            level: 2,
            timeNeeded: 7,
            cost: 300000,
            requirements: ["e1"],
            description: "Chứng chỉ phát triển giao diện web"
        },
        "be": {
            name: "Backend Developer",
            level: 2,
            timeNeeded: 7,
            cost: 350000,
            requirements: ["e1"],
            description: "Chứng chỉ phát triển hệ thống backend"
        },
        "aws": {
            name: "AWS Certified",
            level: 3,
            timeNeeded: 7,
            cost: 400000,
            requirements: ["e3"],
            description: "Chứng chỉ Amazon Web Services"
        },
        "azure": {
            name: "Microsoft Azure",
            level: 3,
            timeNeeded: 7,
            cost: 400000,
            requirements: ["e3"],
            description: "Chứng chỉ Microsoft Azure Cloud"
        },
        "ccna": {
            name: "Cisco CCNA",
            level: 2,
            timeNeeded: 7,
            cost: 350000,
            requirements: ["e1"],
            description: "Chứng chỉ mạng Cisco cơ bản"
        },

        "research1": {
            name: "Nghiên cứu khoa học",
            level: 10,
            timeNeeded: 14,
            cost: 1000000,
            requirements: ["e4"],
            description: "Chứng nhận nghiên cứu khoa học"
        }
    }
};
