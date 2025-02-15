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
            jobs: ["j7", "j8", "j9"]
        },
        expert: {
            name: "Chuyên gia",
            desc: "Yêu cầu bằng Thạc sĩ trở lên",
            jobs: ["j10", "j11", "j12"]
        }
    },

    JOBS: {
        j1: {
            name: "Shipper",
            salary: 50000,
            type: "shipper",
            requirements: []
        },
        j2: {
            name: "Phụ hồ",
            salary: 60000,
            type: "construction",
            requirements: []
        },
        j3: {
            name: "Phục vụ",
            salary: 45000,
            type: "service",
            requirements: []
        },

        j4: {
            name: "Công nhân",
            salary: 80000,
            type: "worker",
            requirements: ["e1"]
        },
        j5: {
            name: "Nhân viên bán hàng",
            salary: 70000,
            type: "sales",
            requirements: ["e1"]
        },
        j6: {
            name: "Lễ tân khách sạn",
            salary: 75000,
            type: "receptionist",
            requirements: ["e1"]
        },

        j7: {
            name: "Kế toán",
            salary: 150000,
            type: "accountant",
            requirements: ["e2", "e3"]
        },
        j8: {
            name: "Lập trình viên",
            salary: 200000,
            type: "developer",
            requirements: ["e3"]
        },
        j9: {
            name: "Giáo viên",
            salary: 180000,
            type: "teacher",
            requirements: ["e3"]
        },

        j10: {
            name: "Giảng viên ĐH",
            salary: 300000,
            type: "lecturer",
            requirements: ["e4"]
        },
        j11: {
            name: "Nghiên cứu viên",
            salary: 350000,
            type: "researcher",
            requirements: ["e4", "e5"]
        },
        j12: {
            name: "Chuyên gia tư vấn",
            salary: 400000,
            type: "consultant",
            requirements: ["e4"]
        }
    }
};
