module.exports = {
    DEGREE_CATEGORIES: {
        school: {
            name: "BẰNG PHỔ THÔNG",
            degrees: ["e1"]
        },
        university: {
            name: "ĐẠI HỌC - CAO ĐẲNG",
            degrees: ["e2", "e3"]
        },
        master: {
            name: "SAU ĐẠI HỌC",
            degrees: ["e4", "e5"]
        },
        language: {
            name: "CHỨNG CHỈ NGOẠI NGỮ",
            degrees: ["eng1", "eng2", "eng3", "jlpt"]
        },
        tech: {
            name: "CHỨNG CHỈ CÔNG NGHỆ",
            degrees: ["aws", "azure", "ccna"]
        },
        skill: {
            name: "KỸ NĂNG CHUYÊN MÔN",
            degrees: ["kyna", "fe", "be"]
        },
        research: {
            name: "CHỨNG CHỈ NGHIÊN CỨU",
            degrees: ["research1"]
        }
    },

    DEGREES: {
        none: {
            name: "Chưa tốt nghiệp",
            level: 0
        },
        e1: {  
            name: "THPT",
            cost: 0,           
            timeNeeded: 0,        
            level: 1,
            requirements: [],
            instantGrant: true   
        },
        e2: {  
            name: "Cao đẳng",
            cost: 15000000,
            timeNeeded: 20,
            level: 2,
            requirements: ["e1"]  
        },
        e3: {
            name: "Đại học",
            cost: 50000000,
            timeNeeded: 30,
            level: 3,
            requirements: ["e1"]
        },
        e4: {
            name: "Thạc sĩ",
            cost: 200000000,
            timeNeeded: 40,
            level: 4,
            requirements: ["e3"]
        },
        e5: { 
            name: "Tiến sĩ",
            cost: 500000000,
            timeNeeded: 50,
            level: 5,
            requirements: ["e4"]
        },

        eng1: {
            name: "IELTS 6.5",
            cost: 25000000,
            timeNeeded: 15,
            level: 1,
            requirements: ["e1"]
        },
        eng2: {
            name: "IELTS 7.5",
            cost: 50000000,
            timeNeeded: 20,
            level: 2,
            requirements: ["eng1"]
        },
        eng3: {
            name: "IELTS 8.5",
            cost: 100000000,
            timeNeeded: 25,
            level: 3,
            requirements: ["eng2"]
        },
        jlpt: {
            name: "JLPT N2",
            cost: 300000000,
            timeNeeded: 18,
            level: 2,
            requirements: ["e1"]
        },

        aws: {
            name: "AWS Certified",
            cost: 200000000,
            timeNeeded: 15,
            level: 3,
            requirements: ["e3"]
        },
        azure: {
            name: "Azure Expert",
            cost: 250000000,
            timeNeeded: 15,
            level: 3,
            requirements: ["e3"]
        },
        ccna: {
            name: "Cisco CCNA",
            cost: 350000000,
            timeNeeded: 12,
            level: 2,
            requirements: ["e2"]
        },

        kyna: {
            name: "Digital Marketing",
            cost: 100000000,
            timeNeeded: 10,
            level: 1,
            requirements: ["e1"]
        },
        fe: {
            name: "Frontend Master",
            cost: 200000000,
            timeNeeded: 15,
            level: 2,
            requirements: ["e1"]
        },
        be: {
            name: "Backend Expert",
            cost: 250000000,
            timeNeeded: 15,
            level: 2,
            requirements: ["e1"]
        },
        
        research1: {
            name: "Chứng nhận Nghiên cứu Quốc tế",
            cost: 3000000000,
            timeNeeded: 60,
            level: 4,
            requirements: ["e5", "eng3"],
            description: "Chứng chỉ nghiên cứu cao cấp được công nhận quốc tế"
        }
    },

    STUDY_TIME: 1000 * 60 * 60, 
    LEARNING_SPEED: 1 
};
