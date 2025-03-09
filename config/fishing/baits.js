module.exports = {
  "Mồi Thường": {
    price: 50,
    uses: 5,
    description: "Mồi câu cơ bản, tăng nhẹ tỉ lệ bắt cá",
    effects: {
      rarityBonus: 0.02,     // Giảm từ 0.05 xuống 0.02
      lossReduction: 0.05    // Giảm từ 0.1 xuống 0.05
    }
  },
  "Mồi Cao Cấp": {
    price: 200,
    uses: 5,
    description: "Mồi chất lượng cao, tăng đáng kể tỉ lệ bắt cá hiếm",
    effects: {
      rarityBonus: 0.05,     // Giảm từ 0.15 xuống 0.05
      lossReduction: 0.1     // Giảm từ 0.2 xuống 0.1
    }
  },
  "Mồi Đặc Biệt": {
    price: 500,
    uses: 3,
    description: "Mồi hiếm thu hút cá quý, giảm thiểu cơ hội mất cá",
    effects: {
      rarityBonus: 0.08,     // Giảm từ 0.25 xuống 0.08
      lossReduction: 0.15,   // Giảm từ 0.35 xuống 0.15
      valueBonus: 0.05       // Giảm từ 0.1 xuống 0.05
    }
  },
  "Mồi Thần Thoại": {
    price: 1500,
    uses: 2,
    description: "Mồi đắt đỏ, thu hút những loài cá huyền thoại",
    effects: {
      rarityBonus: 0.15,     // Giảm từ 0.40 xuống 0.15
      lossReduction: 0.2,    // Giảm từ 0.5 xuống 0.2
      valueBonus: 0.08,      // Giảm từ 0.2 xuống 0.08
      expBonus: 0.1          // Giảm từ 0.3 xuống 0.1
    }
  }
};