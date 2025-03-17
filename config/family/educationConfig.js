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
            timeNeeded: 1.5, 
            cost: 4500000,
            requirements: ["e1"],
            description: "Cao đẳng đào tạo nghề trong 2-3 năm"
        },
        "e3": {
            name: "Đại học",
            level: 3,
            timeNeeded: 4, 
            cost: 6000000,
            requirements: ["e1"],
            description: "Đại học cơ bản đào tạo 4-5 năm"
        },
        "e4": {
            name: "Thạc sĩ",
            level: 4,
            timeNeeded: 2,
            cost: 15000000,
            requirements: ["e3"],
            description: "Bằng thạc sĩ (sau đại học)"
        },
        "e5": {
            name: "Tiến sĩ",
            level: 5,
            timeNeeded: 3,
            cost: 30000000,
            requirements: ["e4"],
            description: "Học vị cao nhất trong hệ thống giáo dục"
        },
        "eng1": {
            name: "Tiếng Anh B1",
            level: 1,
            timeNeeded: 3, 
            cost: 1800000,
            requirements: ["e1"],
            description: "Chứng chỉ tiếng Anh trình độ trung cấp"
        },
        "eng2": {
            name: "Tiếng Anh B2",
            level: 2,
            timeNeeded: 6, 
            cost: 3600000,
            requirements: ["eng1"],
            description: "Chứng chỉ tiếng Anh trình độ khá"
        },
        "eng3": {
            name: "Tiếng Anh C1",
            level: 3,
            timeNeeded: 9, 
            cost: 6000000,
            requirements: ["eng2"],
            description: "Chứng chỉ tiếng Anh cao cấp"
        },
        "fe": {
            name: "Frontend Developer",
            level: 2,
            timeNeeded: 6, 
            cost: 9000000,
            requirements: ["e1"],
            description: "Chứng chỉ phát triển giao diện web"
        },
        "be": {
            name: "Backend Developer",
            level: 2,
            timeNeeded: 6, 
            cost: 10500000,
            requirements: ["e1"],
            description: "Chứng chỉ phát triển hệ thống backend"
        },
        "aws": {
            name: "AWS Certified",
            level: 3,
            timeNeeded: 6, 
            cost: 12000000,
            requirements: ["e3"],
            description: "Chứng chỉ Amazon Web Services"
        },
        "azure": {
            name: "Microsoft Azure",
            level: 3,
            timeNeeded: 6, 
            cost: 12000000,
            requirements: ["e3"],
            description: "Chứng chỉ Microsoft Azure Cloud"
        },
        "ccna": {
            name: "Cisco CCNA",
            level: 2,
            timeNeeded: 6,
            cost: 10500000,
            requirements: ["e1"],
            description: "Chứng chỉ mạng Cisco cơ bản"
        },
        "research1": {
            name: "Nghiên cứu khoa học",
            level: 5,
            timeNeeded: 12,
            cost: 30000000,
            requirements: ["e4"],
            description: "Chứng nhận nghiên cứu khoa học"
        }
    }
};