module.exports = {
    JOB_CATEGORIES: {
        basic: {
            name: "Công việc phổ thông",
            desc: "Không yêu cầu bằng cấp",
            jobs: ["j1", "j2", "j3"]
        },
        skilled: {
            name: "Công việc kỹ thuật",
            desc: "Yêu cầu tốt nghiệp THPT",
            jobs: ["j4", "j5", "j6"]
        },
        professional: {
            name: "Công việc chuyên môn",
            desc: "Yêu cầu bằng Cao đẳng/Đại học",
            jobs: ["j7", "j8", "j9", "j14", "j15", "j16", "j17", "j18", "j19", "j20"]
        },
        expert: {
            name: "Chuyên gia",
            desc: "Yêu cầu bằng Thạc sĩ trở lên",
            jobs: ["j10", "j11", "j12", "j13", "j21", "j22"]
        }
    },

    JOB_RANKS: {
        shipper: [
            { name: "Shipper Tập Sự", minWork: 0, bonus: 1.0 },
            { name: "Shipper Chuyên Nghiệp", minWork: 50, bonus: 1.2 },
            { name: "Shipper Cao Cấp", minWork: 100, bonus: 1.5 },
            { name: "Shipper Kỳ Cựu", minWork: 200, bonus: 1.8 },
            { name: "Thủ Lĩnh Shipper", minWork: 500, bonus: 2.2 }
        ],
        construction: [
            { name: "Phụ Hồ", minWork: 0, bonus: 1.0 },
            { name: "Thợ Xây", minWork: 40, bonus: 1.3 },
            { name: "Thợ Xây Chính", minWork: 100, bonus: 1.6 },
            { name: "Thợ Cả", minWork: 200, bonus: 2.0 },
            { name: "Kiến Trúc Sư", minWork: 500, bonus: 2.5 }
        ],
        service: [
            { name: "Phục Vụ Tập Sự", minWork: 0, bonus: 1.0 },
            { name: "Phục Vụ Chính", minWork: 30, bonus: 1.2 },
            { name: "Phục Vụ Cao Cấp", minWork: 80, bonus: 1.5 },
            { name: "Quản Lý", minWork: 150, bonus: 1.8 },
            { name: "Giám Đốc Dịch Vụ", minWork: 400, bonus: 2.3 }
        ],
        worker: [
            { name: "Công Nhân Tập Sự", minWork: 0, bonus: 1.0 },
            { name: "Công Nhân Lành Nghề", minWork: 50, bonus: 1.3 },
            { name: "Công Nhân Kỹ Thuật", minWork: 120, bonus: 1.6 },
            { name: "Tổ Trưởng", minWork: 250, bonus: 2.0 },
            { name: "Quản Đốc", minWork: 600, bonus: 2.5 }
        ],
        sales: [
            { name: "Nhân Viên Mới", minWork: 0, bonus: 1.0 },
            { name: "Nhân Viên Kinh Nghiệm", minWork: 40, bonus: 1.3 },
            { name: "Chuyên Viên Bán Hàng", minWork: 100, bonus: 1.7 },
            { name: "Trưởng Phòng Kinh Doanh", minWork: 200, bonus: 2.2 },
            { name: "Giám Đốc Kinh Doanh", minWork: 500, bonus: 3.0 }
        ],
        accountant: [
            { name: "Kế Toán Viên", minWork: 0, bonus: 1.0 },
            { name: "Kế Toán Tổng Hợp", minWork: 60, bonus: 1.4 },
            { name: "Kế Toán Trưởng", minWork: 150, bonus: 2.0 },
            { name: "Giám Đốc Tài Chính", minWork: 300, bonus: 2.8 },
            { name: "CFO", minWork: 700, bonus: 3.5 }
        ],
        developer: [
            { name: "Intern Dev", minWork: 0, bonus: 1.0 },
            { name: "Junior Dev", minWork: 50, bonus: 1.5 },
            { name: "Senior Dev", minWork: 120, bonus: 2.2 },
            { name: "Tech Lead", minWork: 250, bonus: 3.0 },
            { name: "Software Architect", minWork: 600, bonus: 4.0 }
        ],
        teacher: [
            { name: "Giáo Viên Tập Sự", minWork: 0, bonus: 1.0 },
            { name: "Giáo Viên Chính", minWork: 70, bonus: 1.4 },
            { name: "Giáo Viên Cao Cấp", minWork: 160, bonus: 1.9 },
            { name: "Tổ Trưởng Bộ Môn", minWork: 300, bonus: 2.5 },
            { name: "Hiệu Trưởng", minWork: 700, bonus: 3.2 }
        ],
        lecturer: [
            { name: "Trợ Giảng", minWork: 0, bonus: 1.0 },
            { name: "Giảng Viên", minWork: 80, bonus: 1.6 },
            { name: "Giảng Viên Cao Cấp", minWork: 180, bonus: 2.3 },
            { name: "Phó Giáo Sư", minWork: 400, bonus: 3.2 },
            { name: "Giáo Sư", minWork: 1000, bonus: 4.5 }
        ],
        researcher: [
            { name: "Nghiên Cứu Viên", minWork: 0, bonus: 1.0 },
            { name: "Nghiên Cứu Viên Chính", minWork: 100, bonus: 1.8 },
            { name: "Trưởng Nhóm Nghiên Cứu", minWork: 250, bonus: 2.5 },
            { name: "Giám Đốc Nghiên Cứu", minWork: 500, bonus: 3.5 },
            { name: "Chuyên Gia Đầu Ngành", minWork: 1200, bonus: 5.0 }
        ],
        consultant: [
            { name: "Beginner", minWork: 0, bonus: 1.0 },
            { name: "Junior", minWork: 90, bonus: 1.7 },
            { name: "Mid-Level", minWork: 200, bonus: 2.4 },
            { name: "Senior", minWork: 450, bonus: 3.3 },
            { name: "Architect", minWork: 1000, bonus: 4.8 }
        ],
        medical: [
            { name: "Bác Sĩ Thực Tập", minWork: 0, bonus: 1.0 },
            { name: "Bác Sĩ", minWork: 60, bonus: 1.5 },
            { name: "Bác Sĩ Chuyên Khoa", minWork: 150, bonus: 2.0 },
            { name: "Trưởng Khoa", minWork: 300, bonus: 3.0 },
            { name: "Giám Đốc Y Khoa", minWork: 700, bonus: 4.0 }
        ],
        agriculture: [
            { name: "Kỹ Thuật Viên", minWork: 0, bonus: 1.0 },
            { name: "Kỹ Sư Nông Nghiệp", minWork: 50, bonus: 1.4 },
            { name: "Chuyên Gia Nông Nghiệp", minWork: 120, bonus: 1.9 },
            { name: "Giám Đốc Sản Xuất", minWork: 250, bonus: 2.5 },
            { name: "Chuyên Gia Cao Cấp", minWork: 500, bonus: 3.2 }
        ],
        marine: [
            { name: "Nghiên Cứu Viên", minWork: 0, bonus: 1.0 },
            { name: "Chuyên Viên Hải Sản", minWork: 50, bonus: 1.4 },
            { name: "Chuyên Gia Ngành Cá", minWork: 120, bonus: 1.8 },
            { name: "Trưởng Phòng Nghiên Cứu", minWork: 250, bonus: 2.3 },
            { name: "Giám Đốc Phát Triển", minWork: 500, bonus: 3.0 }
        ],
        analyst: [
            { name: "Chuyên Viên Junior", minWork: 0, bonus: 1.0 },
            { name: "Chuyên Viên Senior", minWork: 60, bonus: 1.5 },
            { name: "Trưởng Nhóm Phân Tích", minWork: 150, bonus: 2.0 },
            { name: "Giám Đốc Phân Tích", minWork: 300, bonus: 2.8 },
            { name: "Chuyên Gia Tư Vấn", minWork: 600, bonus: 3.5 }
        ]
    },

    JOBS: {
        j1: {
            name: "Shipper",
            salary: 50000,
            type: "shipper",
            requirements: [],
            description: "Giao hàng nhanh chóng và an toàn"
        },
        j2: {
            name: "Phụ hồ",
            salary: 60000,
            type: "construction",
            requirements: [],
            description: "Xây dựng và phát triển công trình"
        },
        j3: {
            name: "Phục vụ",
            salary: 45000,
            type: "service",
            requirements: [],
            description: "Phục vụ khách hàng tận tình"
        },
        j4: {
            name: "Công nhân",
            salary: 80000,
            type: "worker",
            requirements: ["e1"],
            description: "Vận hành máy móc và sản xuất"
        },
        j5: {
            name: "Nhân viên bán hàng",
            salary: 70000,
            type: "sales",
            requirements: ["e1"],
            description: "Tư vấn và bán hàng chuyên nghiệp"
        },
        j6: {
            name: "Lễ tân khách sạn",
            salary: 75000,
            type: "service",
            requirements: ["e1"],
            description: "Tiếp đón và phục vụ khách hàng"
        },
        j7: {
            name: "Kế toán",
            salary: 12000000,
            type: "accountant",
            requirements: ["ueh", "neu"],
            description: "Quản lý tài chính và sổ sách"
        },
        j8: {
            name: "Lập trình viên",
            salary: 22000000,
            type: "developer",
            requirements: ["hcmut", "hust", "fe", "be"],
            description: "Phát triển phần mềm và ứng dụng"
        },
        j9: {
            name: "Giáo viên",
            salary: 15000000,
            type: "teacher",
            requirements: ["hnue", "eng2"],
            description: "Giảng dạy và đào tạo học sinh"
        },
        j10: {
            name: "Giảng viên ĐH",
            salary: 30000000,
            type: "lecturer",
            requirements: ["e4", "eng3"],
            description: "Giảng dạy và nghiên cứu đại học"
        },
        j11: {
            name: "Nghiên cứu viên",
            salary: 35000000,
            type: "researcher",
            requirements: ["e4", "e5", "eng3"],
            description: "Nghiên cứu và phát triển khoa học"
        },
        j12: {
            name: "Chuyên gia IT",
            salary: 50000000,
            type: "consultant",
            requirements: ["e4", "aws", "azure", "ccna", "hcmut"],
            description: "Tư vấn giải pháp công nghệ cấp cao"
        },
        j13: {
            name: "Nhà khoa học trưởng",
            salary: 100000000,
            type: "researcher",
            requirements: ["e5", "eng3", "research1"],
            description: "Lãnh đạo nhóm nghiên cứu đỉnh cao, công bố quốc tế"
        },
        j14: {
            name: "Chuyên viên thương mại",
            salary: 18000000,
            type: "sales",
            requirements: ["ftu", "eng2"],
            description: "Phát triển thị trường và quan hệ thương mại quốc tế"
        },
        j15: {
            name: "Bác sĩ",
            salary: 25000000,
            type: "medical",
            requirements: ["hmu"],
            description: "Khám chữa bệnh và chăm sóc sức khỏe"
        },
        j16: {
            name: "Kỹ sư nông nghiệp",
            salary: 16000000,
            type: "agriculture",
            requirements: ["tuaf"],
            description: "Phát triển và ứng dụng kỹ thuật nông nghiệp"
        },
        j17: {
            name: "Chuyên gia hải sản",
            salary: 17000000,
            type: "marine",
            requirements: ["ntu"],
            description: "Nghiên cứu và phát triển ngành hải sản"
        },
        j18: {
            name: "Nhà nghiên cứu xã hội",
            salary: 16500000,
            type: "researcher",
            requirements: ["vnuhn", "eng2"],
            description: "Nghiên cứu các vấn đề xã hội và nhân văn"
        },
        j19: {
            name: "Chuyên viên phân tích",
            salary: 19000000,
            type: "analyst",
            requirements: ["vnuhcm", "eng2"],
            description: "Phân tích dữ liệu và đưa ra giải pháp"
        },
        j20: {
            name: "Kiến trúc sư phần mềm",
            salary: 28000000,
            type: "developer",
            requirements: ["hcmut", "hust", "aws"],
            description: "Thiết kế và phát triển kiến trúc phần mềm"
        },
        j21: {
            name: "Giáo sư y khoa",
            salary: 60000000,
            type: "medical",
            requirements: ["e4", "hmu", "research1"],
            description: "Nghiên cứu và giảng dạy y khoa cấp cao"
        },
        j22: {
            name: "Chuyên gia kinh tế",
            salary: 55000000,
            type: "consultant",
            requirements: ["e4", "neu", "ueh", "eng3"],
            description: "Tư vấn và hoạch định chính sách kinh tế"
        },
        j23: {
            name: "Việc cơ bản cho Đại Học",
            salary: 5000000,
            requirements: ["e3"],
            description: "Việc cơ bản cho sinh viên Đại Học"
        },
        j24: {
            name: "Việc cơ bản cho Cao Đẳng",
            salary: 5000000,
            requirements: ["e2"],
            description: "Việc cơ bản cho sinh viên Cao Đẳng"
        },
        j25: {
            name: "JOB ADMIN TEST",
            salary: 1,
            requirements: ["e1"],
            description: "JOB ADMIN TEST"
        }
    }
};