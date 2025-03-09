module.exports = {
    pond: {
        name: "Ao làng",
        cost: 0,
        fish: {
            trash: 15,          // Tăng lên
            common: 70,         // Giữ cao
            uncommon: 14,       // Giảm
            rare: 0.95,         // Giảm
            legendary: 0.05,    // Cực hiếm
            mythical: 0.0,      // Không có
            cosmic: 0.0         // Không có
        }
    },
    river: {
        name: "Sông",
        cost: 25,
        fish: {
            trash: 10,          
            common: 60,         
            uncommon: 28,       
            rare: 1.9,          
            legendary: 0.1,     // Cực hiếm
            mythical: 0.0,      // Không có
            cosmic: 0.0         // Không có
        }
    },
    ocean: {
        name: "Biển",
        cost: 50,
        fish: {
            trash: 8,           
            common: 50,         
            uncommon: 38,       
            rare: 3.5,          
            legendary: 0.5,     // Rất hiếm
            mythical: 0.0,      
            cosmic: 0.0         
        }
    },
    deepSea: {
        name: "Biển sâu",
        cost: 250,
        fish: {
            trash: 5,           
            common: 40,         
            uncommon: 45,       
            rare: 8,            
            legendary: 1.9,     
            mythical: 0.1,      // Cực hiếm
            cosmic: 0.0         // Không có
        }
    },
    abyss: {
        name: "Vực Sâu",
        cost: 1000,
        fish: {
            trash: 3,           
            common: 25,         
            uncommon: 50,       
            rare: 18,           
            legendary: 3.8,     
            mythical: 0.2,      // Rất hiếm
            cosmic: 0.0         // Không có
        }
    },
    atlantis: {
        name: "Atlantis",
        cost: 2500,
        fish: {
            trash: 2,           
            common: 15,         
            uncommon: 45,       
            rare: 30,           
            legendary: 7.5,     
            mythical: 0.5,      // Hiếm
            cosmic: 0.0         // Cơ hội cực kỳ nhỏ
        }
    },
    spaceOcean: {
        name: "Đại Dương Vũ Trụ",
        cost: 5000,
        fish: {
            trash: 0,           
            common: 5,          
            uncommon: 35,       
            rare: 45,           
            legendary: 13,      
            mythical: 1.8,      // Hiếm
            cosmic: 0.2         // Cực hiếm
        }
    },
    dragonRealm: {
        name: "Thủy Cung Rồng",
        cost: 10000,
        fish: {
            trash: 0,           
            common: 0,          
            uncommon: 20,       
            rare: 55,           
            legendary: 22,      
            mythical: 2.5,      // Hiếm
            cosmic: 0.5         // Cực hiếm
        }
    },
    vipReserve: {
      name: "Khu VIP VÀNG",
      cost: 1500,
      description: "Khu vực câu cá độc quyền dành riêng cho người dùng VIP",
      fish: {
          trash: 0,            
          common: 20,          
          uncommon: 40,        
          rare: 30,            
          legendary: 8.5,       
          mythical: 1.2,        // Hiếm nhưng vẫn có cơ hội
          cosmic: 0.3           // Cực hiếm nhưng có cơ hội
      }
    },
    vipBronzeResort: {
      name: "Khu Nghỉ Dưỡng",
      cost: 500,
      fish: {
        trash: 3,              
        common: 42,            
        uncommon: 43,          
        rare: 10,              
        legendary: 1.8,         
        mythical: 0.2,         // Rất hiếm
        cosmic: 0.0            // Không có
      }
    },
    vipSilverLagoon: {
      name: "Hồ Bạc",
      cost: 1000,
      fish: {
        trash: 2,              
        common: 30,            
        uncommon: 45,          
        rare: 18,              
        legendary: 4.5,         
        mythical: 0.5,         // Hiếm
        cosmic: 0.1            // Cực hiếm
      }
    },
  };