module.exports = {
    recipes: {
      // CẦN CƠ BẢN - CHO NGƯỜI MỚI
      "Cần Tre Nâng Cấp": {
        materials: {
          "Cần trúc": 2, 
          "Dây Cước": 1
        },
        result: {
          name: "Cần Tre Nâng Cấp",
          durability: 20,
          multiplier: 1.2,
          rarity: "Phổ thông",
          description: "Cần câu cải tiến, bền hơn và hiệu quả hơn cần trúc thông thường"
        },
        price: 5000,
        level: 3,
        craftTime: 10, // Thời gian chế tạo (giây)
      },
      "Cần Tre Đôi": {
        materials: {
          "Cần trúc": 3,
          "Dây Cước": 2,
          "Móc Sắt": 1
        },
        result: {
          name: "Cần Tre Đôi",
          durability: 25,
          multiplier: 1.3,
          rarity: "Phổ thông",
          special: "Có 5% cơ hội bắt được 2 cá cùng lúc",
          description: "Cần câu hai đầu, cho phép bạn câu được nhiều cá hơn trong một lần"
        },
        price: 8000,
        level: 5,
        craftTime: 15
      },
      
      // CẦN TRUNG CẤP
      "Cần Composite": {
        materials: {
          "Cần Tre Nâng Cấp": 1,
          "Dây Cước Đặc Biệt": 1,
          "Móc Đồng": 1
        },
        result: {
          name: "Cần Composite",
          durability: 35,
          multiplier: 1.8,
          rarity: "Hiếm",
          special: "Giảm 5% thuế khi bán cá",
          description: "Cần câu hiện đại, tăng đáng kể khả năng bắt cá giá trị cao"
        },
        price: 15000,
        level: 8,
        craftTime: 30
      },
      "Cần Gỗ Lim": {
        materials: {
          "Gỗ Lim": 2,
          "Dây Cước Đặc Biệt": 1,
          "Móc Đồng": 1
        },
        result: {
          name: "Cần Gỗ Lim",
          durability: 45,
          multiplier: 2.0,
          rarity: "Hiếm",
          special: "Tăng 10% cơ hội không mất mồi câu",
          description: "Cần câu làm từ gỗ lim quý hiếm, mang lại sự ổn định khi câu cá lớn"
        },
        price: 20000,
        level: 10,
        craftTime: 45
      },
      "Cần Siêu Nhẹ": {
        materials: {
          "Hợp Kim Nhẹ": 1,
          "Dây Cước Đặc Biệt": 2,
          "Móc Bạc": 1
        },
        result: {
          name: "Cần Siêu Nhẹ",
          durability: 30,
          multiplier: 2.2,
          rarity: "Hiếm",
          special: "Giảm 10% thời gian chờ giữa các lần câu",
          description: "Cần câu siêu nhẹ giúp bạn câu cá nhanh hơn với ít mệt mỏi hơn"
        },
        price: 35000,
        level: 12,
        craftTime: 40
      },
      
      // CẦN CAO CẤP
      "Cần Siêu Cấp": {
        materials: {
          "Cần Composite": 1,
          "Cần Máy": 1, 
          "Dây Cước Titan": 1
        },
        result: {
          name: "Cần Siêu Cấp",
          durability: 50,
          multiplier: 2.5,
          rarity: "Quý hiếm",
          special: "Tăng 15% cơ hội bắt cá hiếm",
          description: "Cần câu cao cấp đem lại cơ hội bắt cá hiếm và tăng giá trị thu về"
        },
        price: 60000,
        level: 15,
        craftTime: 60
      },
      "Cần Carbon Fiber": {
        materials: {
          "Sợi Carbon": 2,
          "Hợp Kim Nhẹ": 1,
          "Dây Cước Titan": 1,
          "Móc Bạc": 1
        },
        result: {
          name: "Cần Carbon Fiber",
          durability: 60,
          multiplier: 3.0,
          rarity: "Quý hiếm",
          special: "Giảm 20% cơ hội cá thoát khỏi lưỡi câu",
          description: "Cần câu công nghệ cao cực kỳ bền và nhẹ, cho phép điều khiển chính xác"
        },
        price: 90000,
        level: 20,
        craftTime: 90
      },
      
      // CẦN HUYỀN THOẠI
      "Cần Thủy Thần": {
        materials: {
          "Cần Siêu Cấp": 1,
          "Đá Thủy Linh": 1,
          "Vảy Thủy Quái": 2,
          "Dây Cước Ma Thuật": 1
        },
        result: {
          name: "Cần Thủy Thần",
          durability: 100,
          multiplier: 4.0,
          rarity: "Huyền thoại",
          special: "Tăng 25% cơ hội bắt được cá quý hiếm và huyền thoại",
          description: "Cần câu được ban phước bởi thần biển, thu hút những loài cá hiếm nhất"
        },
        price: 250000,
        level: 30,
        craftTime: 120
      },
      "Cần Thần Rừng": {
        materials: {
          "Cần Carbon Fiber": 1,
          "Gỗ Thần Mộc": 1,
          "Móc Vàng": 1,
          "Dây Cước Ma Thuật": 1,
        },
        result: {
          name: "Cần Thần Rừng",
          durability: 120,
          multiplier: 4.5,
          rarity: "Huyền thoại",
          special: "Tăng 30% EXP nhận được khi câu cá và 10% cơ hội nhận được kho báu",
          description: "Cần câu làm từ gỗ cây thần rừng cổ đại, mang sức mạnh của thiên nhiên"
        },
        price: 450000,
        level: 35,
        craftTime: 180
      },
      
      // CẦN THẦN THOẠI
      "Cần Long Vương": {
        materials: {
          "Cần Thủy Thần": 1,
          "Vảy Rồng Biển": 1,
          "Móc Bạch Kim": 1,
          "Dây Cước Rồng": 1,
          "Ngọc Long Thần": 1
        },
        result: {
          name: "Cần Long Vương",
          durability: 200,
          multiplier: 6.0,
          rarity: "Thần thoại",
          special: "Tăng 40% cơ hội bắt cá hiếm, 20% EXP và 20% giá trị cá",
          description: "Cần câu được tạo ra từ xương và vảy của Long Vương, chứa đựng sức mạnh kinh hoàng"
        },
        price: 2500000,
        level: 50,
        craftTime: 300
      },
      "Cần Hư Không": {
        materials: {
          "Cần Thần Rừng": 1,
          "Tinh Thể Vũ Trụ": 1,
          "Móc Thiên Thạch": 1,
          "Dây Cước Rồng": 1,
          "Mảnh Hư Không": 1
        },
        result: {
          name: "Cần Hư Không",
          durability: 250,
          multiplier: 7.0,
          rarity: "Thần thoại",
          special: "Tăng 15% cơ hội bắt được các sinh vật vũ trụ và giảm 30% thời gian chờ",
          description: "Cần câu định hình từ vật chất hư không, có thể câu xuyên không gian và thời gian"
        },
        price: 5000000,
        level: 60,
        craftTime: 360
      }
    },
    
    craftingMaterials: {
      // VẬT LIỆU CƠ BẢN
      "Dây Cước": {
        price: 2000,
        rarity: "Phổ thông",
        sources: ["Cửa hàng", "Câu cá (5%)"],
        description: "Dây cước thường dùng để làm cần câu cơ bản"
      },
      "Móc Sắt": {
        price: 3000,
        rarity: "Phổ thông",
        sources: ["Cửa hàng", "Câu cá (5%)"],
        description: "Móc câu thép cơ bản, chắc chắn và dễ tìm"
      },
      "Gỗ Lim": {
        price: 5000,
        rarity: "Phổ thông",
        sources: ["Cửa hàng", "Câu cá (3%)"],
        description: "Gỗ quý bền chắc, thích hợp làm cần câu chắc chắn"
      },
      
      // VẬT LIỆU TRUNG CẤP
      "Dây Cước Đặc Biệt": {
        price: 8000,
        rarity: "Hiếm",
        sources: ["Cửa hàng", "Câu cá (khu vực sông/2%)"],
        description: "Dây cước bền và đàn hồi tốt, khó bị đứt"
      },
      "Móc Đồng": {
        price: 10000,
        rarity: "Hiếm",
        sources: ["Cửa hàng", "Câu cá (khu vực sông/2%)"],
        description: "Móc câu đồng bền hơn và có khả năng giữ cá tốt hơn"
      },
      "Hợp Kim Nhẹ": {
        price: 15000,
        rarity: "Hiếm",
        sources: ["Cửa hàng", "Câu cá (đại dương/3%)"],
        description: "Hợp kim nhẹ và bền, thích hợp cho cần câu cao cấp"
      },
      
      // VẬT LIỆU CAO CẤP
      "Dây Cước Titan": {
        price: 25000,
        rarity: "Quý hiếm",
        sources: ["Cửa hàng", "Câu cá (biển sâu/2%)"],
        description: "Dây cước siêu bền được làm từ hợp kim đặc biệt"
      },
      "Cần Máy": {  
        price: 40000,
        rarity: "Quý hiếm",
        sources: ["Cửa hàng", "Câu cá (biển sâu/1%)"],
        description: "Cần câu máy hiện đại, cần thiết để chế tạo cần siêu cấp"
      },
      "Móc Bạc": {
        price: 30000,
        rarity: "Quý hiếm",
        sources: ["Cửa hàng", "Câu cá (biển sâu/1%)"],
        description: "Móc câu bạc đặc biệt, tăng cơ hội bắt cá quý hiếm"
      },
      "Sợi Carbon": {
        price: 45000,
        rarity: "Quý hiếm",
        sources: ["Cửa hàng", "Kho báu (5%)"],
        description: "Sợi carbon siêu nhẹ và cực kỳ bền, vật liệu tối tân"
      },
      
      // VẬT LIỆU HUYỀN THOẠI
      "Đá Thủy Linh": {
        price: 80000,
        rarity: "Huyền thoại",
        sources: ["Câu cá (vực sâu/0.5%)", "Kho báu (2%)"],
        description: "Đá phát sáng trong suốt từ vực sâu, chứa sức mạnh của biển cả"
      },
      "Vảy Thủy Quái": {
        price: 120000,
        rarity: "Huyền thoại",
        sources: ["Câu cá (quái vật thủy/0.3%)", "Nhiệm vụ đặc biệt"],
        description: "Vảy của quái vật biển sâu, cứng như thép và chứa năng lượng huyền bí"
      },
      "Dây Cước Ma Thuật": {
        price: 150000,
        rarity: "Huyền thoại",
        sources: ["Câu cá (atlantis/0.5%)", "Kho báu (1%)"],
        description: "Dây cước được thêu thêm phép thuật, có thể tự phục hồi và không bao giờ rối"
      },
      "Gỗ Thần Mộc": {
        price: 200000,
        rarity: "Huyền thoại",
        sources: ["Câu cá (atlantis/0.3%)", "Nhiệm vụ đặc biệt"],
        description: "Gỗ từ cây thần 1000 năm tuổi, nhẹ như lông vũ nhưng cứng như kim cương"
      },
      "Móc Vàng": {
        price: 180000,
        rarity: "Huyền thoại",
        sources: ["Câu cá (atlantis/0.2%)", "Kho báu (0.5%)"],
        description: "Móc câu vàng ròng với khả năng thu hút cá quý hiếm và kho báu"
      },
      
      // VẬT LIỆU THẦN THOẠI
      "Vảy Rồng Biển": {
        price: 500000,
        rarity: "Thần thoại",
        sources: ["Câu cá (rồng biển/0.1%)", "Nhiệm vụ truyền thuyết"],
        description: "Vảy từ Rồng Biển cổ đại, ánh lên màu xanh sapphire kỳ ảo"
      },
      "Móc Bạch Kim": {
        price: 600000,
        rarity: "Thần thoại",
        sources: ["Câu cá (đại dương vũ trụ/0.1%)"],
        description: "Móc câu bạch kim với khả năng tự điều chỉnh kích thước và độ sắc bén"
      },
      "Dây Cước Rồng": {
        price: 750000,
        rarity: "Thần thoại",
        sources: ["Câu cá (vương quốc rồng/0.1%)"],
        description: "Dây cước làm từ tơ rồng, không thể bị đứt và có khả năng điều khiển từ xa"
      },
      "Ngọc Long Thần": {
        price: 1000000,
        rarity: "Thần thoại",
        sources: ["Câu cá (vương quốc rồng/0.05%)"],
        description: "Viên ngọc chứa linh hồn của Long Vương, tỏa ra năng lượng vô tận"
      },
      "Tinh Thể Vũ Trụ": {
        price: 1200000,
        rarity: "Thần thoại",
        sources: ["Câu cá (đại dương vũ trụ/0.05%)"],
        description: "Tinh thể từ vũ trụ xa xôi, chứa đựng năng lượng của cả thiên hà"
      },
      "Móc Thiên Thạch": {
        price: 1500000,
        rarity: "Thần thoại",
        sources: ["Câu cá (đại dương vũ trụ/0.03%)"],
        description: "Móc câu làm từ thiên thạch hiếm, có thể xuyên qua mọi vật chất"
      },
      "Mảnh Hư Không": {
        price: 2000000,
        rarity: "Thần thoại",
        sources: ["Câu cá (đại dương vũ trụ/0.01%)"],
        description: "Một mảnh không gian bị bẻ cong, không tuân theo quy luật vật lý"
      }
    },
    
    craftSystem: {
      // Thêm các thông số cơ bản của hệ thống chế tạo
      timeMultiplier: 1.0, // Hệ số thời gian chế tạo
      rarityBonus: { // Bonus cho các độ hiếm
        "Phổ thông": 0,
        "Hiếm": 0.05,
        "Quý hiếm": 0.1,
        "Huyền thoại": 0.2,
        "Thần thoại": 0.3
      },
      failureChance: { // Tỉ lệ thất bại khi chế tạo
        "Phổ thông": 0.05,
        "Hiếm": 0.1,
        "Quý hiếm": 0.15,
        "Huyền thoại": 0.25,
        "Thần thoại": 0.4
      },
      materialReturn: 0.7, // Tỉ lệ hoàn trả nguyên liệu khi thất bại
      criticalSuccess: 0.05, // Tỉ lệ thành công vượt trội (tăng thuộc tính)
      criticalBonus: 0.2, // % tăng thuộc tính khi thành công vượt trội
    }
};