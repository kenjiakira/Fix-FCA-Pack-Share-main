module.exports = {
    STUDY_TIME: 24 * 60 * 60 * 1000, // 1 day in milliseconds
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
        // Phổ thông
        "e1": {
            name: "Tốt nghiệp THPT",
            level: 1,
            instantGrant: true,
            cost: 0,
            requirements: [],
            description: "Chứng nhận hoàn thành chương trình phổ thông"
        },

        // Cao đẳng
        "e2": {
            name: "Cao đẳng",
            level: 2,
            timeNeeded: 3,
            cost: 15000000,
            requirements: ["e1"],
            description: "Cao đẳng đào tạo nghề trong 2-3 năm"
        },

        "vnuhcm": {
            name: "ĐH Quốc Gia TP.HCM",
            level: 3,
            timeNeeded: 4,
            cost: 200000000,
            requirements: ["e1"],
            description: "Một trong những đại học trọng điểm quốc gia"
        },
        "vnuhn": {
            name: "ĐH Quốc Gia Hà Nội",
            level: 3,
            timeNeeded: 4,
            cost: 200000000,
            requirements: ["e1"],
            description: "Đại học hàng đầu tại miền Bắc"
        },
        "hcmut": {
            name: "ĐH Bách Khoa TP.HCM",
            level: 3,
            timeNeeded: 5,
            cost: 250000000,
            requirements: ["e1"],
            description: "Trường đào tạo kỹ thuật hàng đầu phía Nam"
        },
        "hust": {
            name: "ĐH Bách Khoa Hà Nội",
            level: 3,
            timeNeeded: 5,
            cost: 250000000,
            requirements: ["e1"],
            description: "Trường kỹ thuật công nghệ hàng đầu Việt Nam"
        },
        "neu": {
            name: "ĐH Kinh tế Quốc dân",
            level: 3,
            timeNeeded: 4,
            cost: 220000000,
            requirements: ["e1"],
            description: "Đại học hàng đầu về kinh tế, quản trị"
        },
        "hnue": {
            name: "ĐH Sư phạm Hà Nội",
            level: 3,
            timeNeeded: 4,
            cost: 180000000,
            requirements: ["e1"],
            description: "Trường đào tạo giáo viên hàng đầu Việt Nam"
        },
        "ftu": {
            name: "ĐH Ngoại thương",
            level: 3,
            timeNeeded: 4,
            cost: 220000000,
            requirements: ["e1"],
            description: "Trường đào tạo thương mại quốc tế hàng đầu"
        },
        "ntu": {
            name: "ĐH Nha Trang",
            level: 3,
            timeNeeded: 4,
            cost: 180000000,
            requirements: ["e1"],
            description: "Đại học chuyên về thủy sản và du lịch"
        },
        "hmu": {
            name: "ĐH Y Hà Nội",
            level: 3,
            timeNeeded: 6,
            cost: 300000000,
            requirements: ["e1"],
            description: "Trường y khoa hàng đầu Việt Nam"
        },
        "tuaf": {
            name: "ĐH Nông Lâm TP.HCM",
            level: 3,
            timeNeeded: 4,
            cost: 180000000,
            requirements: ["e1"],
            description: "Đại học về nông nghiệp và lâm nghiệp"
        },
        "ueh": {
            name: "ĐH Kinh tế TP.HCM",
            level: 3,
            timeNeeded: 4,
            cost: 200000000,
            requirements: ["e1"],
            description: "Trường đào tạo kinh tế hàng đầu phía Nam"
        },

        "e4": {
            name: "Thạc sĩ",
            level: 4,
            timeNeeded: 2,
            cost: 500000000,
            requirements: ["e3"],
            description: "Bằng thạc sĩ (sau đại học)"
        },

        // Tiến sĩ
        "e5": {
            name: "Tiến sĩ",
            level: 5,
            timeNeeded: 3,
            cost: 1000000000,
            requirements: ["e4"],
            description: "Học vị cao nhất trong hệ thống giáo dục"
        },

        // Chứng chỉ tiếng Anh
        "eng1": {
            name: "Tiếng Anh B1",
            level: 1,
            timeNeeded: 1,
            cost: 6000000,
            requirements: ["e1"],
            description: "Chứng chỉ tiếng Anh trình độ trung cấp"
        },
        "eng2": {
            name: "Tiếng Anh B2",
            level: 2,
            timeNeeded: 1.5,
            cost: 120000000,
            requirements: ["eng1"],
            description: "Chứng chỉ tiếng Anh trình độ khá"
        },
        "eng3": {
            name: "Tiếng Anh C1",
            level: 3,
            timeNeeded: 2,
            cost: 200000000,
            requirements: ["eng2"],
            description: "Chứng chỉ tiếng Anh cao cấp"
        },

        // Chứng chỉ CNTT
        "fe": {
            name: "Frontend Developer",
            level: 2,
            timeNeeded: 1,
            cost: 300000000,
            requirements: ["e1"],
            description: "Chứng chỉ phát triển giao diện web"
        },
        "be": {
            name: "Backend Developer",
            level: 2,
            timeNeeded: 1.5,
            cost: 350000000,
            requirements: ["e1"],
            description: "Chứng chỉ phát triển hệ thống backend"
        },
        "aws": {
            name: "AWS Certified",
            level: 3,
            timeNeeded: 1,
            cost: 400000000,
            requirements: ["e3"],
            description: "Chứng chỉ Amazon Web Services"
        },
        "azure": {
            name: "Microsoft Azure",
            level: 3,
            timeNeeded: 1,
            cost: 400000000,
            requirements: ["e3"],
            description: "Chứng chỉ Microsoft Azure Cloud"
        },
        "ccna": {
            name: "Cisco CCNA",
            level: 2,
            timeNeeded: 1,
            cost: 350000000,
            requirements: ["e1"],
            description: "Chứng chỉ mạng Cisco cơ bản"
        },

        // Nghiên cứu
        "research1": {
            name: "Nghiên cứu khoa học",
            level: 4,
            timeNeeded: 2,
            cost: 800000000,
            requirements: ["e4"],
            description: "Chứng nhận nghiên cứu khoa học"
        }
    }
};
