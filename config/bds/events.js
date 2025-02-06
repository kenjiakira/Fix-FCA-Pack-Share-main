module.exports = {
    marketEvents: [
        {
            type: 'infrastructure',
            name: 'Xây dựng metro',
            description: 'Tuyến metro mới được khởi công',
            effects: {
                priceIncrease: 0.2,
                rentIncrease: 0.1,
                radius: 2000,
                duration: 30,
                locations: ['TP.HCM', 'Hà Nội'],
                propertyTypes: ['Chung cư', 'Nhà phố']
            }
        },
        {
            type: 'policy',
            name: 'Siết tín dụng BDS',
            description: 'Ngân hàng nhà nước siết chặt cho vay BDS',
            effects: {
                priceDecrease: 0.15,
                loanInterestIncrease: 0.02,
                duration: 90,
                allLocations: true
            }
        },
        {
            type: 'development',
            name: 'Quy hoạch mới',
            description: 'Công bố quy hoạch phát triển đô thị',
            effects: {
                priceIncrease: 0.3,
                appreciation: 0.1,
                duration: 60,
                locations: ['Đà Nẵng'],
                propertyTypes: ['Đất nền']
            }
        },
        {
            type: 'crisis',
            name: 'Khủng hoảng thị trường',
            description: 'Thị trường BDS rơi vào khủng hoảng',
            effects: {
                priceDecrease: 0.25,
                rentDecrease: 0.2,
                duration: 120,
                allLocations: true
            }
        },
        {
            type: 'tourism',
            name: 'Mùa du lịch',
            description: 'Cao điểm mùa du lịch',
            effects: {
                rentIncrease: 0.3,
                duration: 90,
                locations: ['Đà Nẵng', 'Nha Trang'],
                propertyTypes: ['Chung cư', 'Biệt thự']
            }
        },
        {
            type: 'foreignInvestment',
            name: 'Làn sóng đầu tư nước ngoài',
            description: 'Nhà đầu tư nước ngoài đổ vốn vào BDS',
            effects: {
                priceIncrease: 0.25,
                rentIncrease: 0.15,
                duration: 180,
                locations: ['TP.HCM', 'Hà Nội'],
                propertyTypes: ['Chung cư cao cấp', 'Biệt thự']
            }
        },
        {
            type: 'naturalDisaster',
            name: 'Thiên tai',
            description: 'Bão lụt gây ảnh hưởng nghiêm trọng',
            effects: {
                priceDecrease: 0.2,
                rentDecrease: 0.3,
                duration: 45,
                locations: ['Miền Trung'],
                propertyTypes: ['Nhà phố', 'Biệt thự']
            }
        },
        {
            type: 'urbanization',
            name: 'Đô thị hóa nhanh',
            description: 'Tốc độ đô thị hóa tăng mạnh',
            effects: {
                priceIncrease: 0.15,
                appreciation: 0.05,
                duration: 365,
                locations: ['TP.HCM', 'Hà Nội', 'Đà Nẵng'],
                propertyTypes: ['Chung cư', 'Nhà phố']
            }
        },
        {
            type: 'techHub',
            name: 'Khu công nghệ cao',
            description: 'Xây dựng khu công nghệ cao mới',
            effects: {
                priceIncrease: 0.35,
                rentIncrease: 0.25,
                appreciation: 0.15,
                duration: 730,
                locations: ['TP.HCM', 'Đà Nẵng'],
                propertyTypes: ['Chung cư', 'Nhà phố', 'Đất nền']
            }
        },
        {
            type: 'marketBubble',
            name: 'Bong bóng BDS',
            description: 'Thị trường BDS xuất hiện bong bóng',
            effects: {
                priceIncrease: 0.5,
                duration: 60,
                crashChance: 0.7,
                crashEffect: {
                    priceDecrease: 0.4,
                    duration: 90
                },
                allLocations: true
            }
        }
    ]
};
