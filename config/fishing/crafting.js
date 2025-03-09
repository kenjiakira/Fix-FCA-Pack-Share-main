module.exports = {
    recipes: {
      "Cần Tre Nâng Cấp": {
        materials: {
          "Cần trúc": 2, 
          "Dây Cước": 1
        },
        result: {
          name: "Cần Tre Nâng Cấp",
          durability: 20,
          multiplier: 1.2,
          description: "Cần câu cải tiến, bền hơn và hiệu quả hơn cần trúc thông thường"
        },
        price: 200,
        level: 3
      },
      "Cần Composite": {
        materials: {
          "Cần trúc": 1, 
          "Cần Tre Nâng Cấp": 1,
          "Dây Cước Đặc Biệt": 1
        },
        result: {
          name: "Cần Composite",
          durability: 35,
          multiplier: 1.8,
          description: "Cần câu hiện đại, tăng đáng kể khả năng bắt cá giá trị cao"
        },
        price: 800,
        level: 8
      },
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
          special: "Tăng 10% cơ hội bắt cá hiếm",
          description: "Cần câu cao cấp nhất, đem lại cơ hội bắt cá hiếm và tăng giá trị thu về"
        },
        price: 2000,
        level: 12
      }
    },
    
    craftingMaterials: {
      "Dây Cước": {
        price: 100,
        description: "Dây cước thường dùng để làm cần câu cơ bản"
      },
      "Dây Cước Đặc Biệt": {
        price: 300,
        description: "Dây cước bền và đàn hồi tốt"
      },
      "Dây Cước Titan": {
        price: 1000,
        description: "Dây cước siêu bền được làm từ hợp kim đặc biệt"
      },
      "Cần Máy": {  
        price: 1500,
        description: "Cần câu máy hiện đại, cần thiết để chế tạo cần siêu cấp"
      }
    }
};