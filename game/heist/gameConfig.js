const GAME_CONFIG = {
    // Cấu hình cấp độ và kinh nghiệm
    LEVEL: {
        expPerHeist: 100,
        expMultiplier: {
            local: 1,
            state: 1.5,
            federal: 2
        },
        levelUpExp: level => Math.floor(100 * Math.pow(1.5, level-1)),
        rewards: {
            money: level => 1000 * level,
            items: {
                5: "Súng lục đặc biệt",
                10: "Áo giáp titanium",
                15: "Mặt nạ chống đạn",
                20: "Súng trường plasma"
            }
        }
    },

    // Cấu hình nhiệm vụ hàng ngày
    DAILY: {
        types: {
            heistWin: {
                name: "Chiến thắng vụ cướp",
                reward: 5000,
                exp: 200
            },
            moneyStolen: {
                name: "Cướp được X tiền",
                reward: 3000,
                exp: 150
            },
            arrests: {
                name: "Bắt X tên cướp",
                reward: 4000,
                exp: 180
            }
        },
        refresh: 86400000 // 24h
    },

    // Cấu hình kỹ năng
    SKILLS: {
        robber: {
            stealth: {
                name: "Ẩn thân",
                maxLevel: 5,
                effect: level => ({
                    detection: -5 * level,
                    criticalChance: 2 * level
                })
            },
            lockpicking: {
                name: "Phá khóa",
                maxLevel: 5,
                effect: level => ({
                    safecrackSpeed: 10 * level,
                    extraLoot: 5 * level
                })
            }
        },
        police: {
            investigation: {
                name: "Điều tra",
                maxLevel: 5,
                effect: level => ({
                    detectionRange: 10 * level,
                    trackingAccuracy: 5 * level
                })
            },
            tactics: {
                name: "Chiến thuật",
                maxLevel: 5,
                effect: level => ({
                    teamDefense: 3 * level,
                    coordinationBonus: 5 * level
                })
            }
        }
    },

    // Cấu hình bang hội
    GANG: {
        createCost: 100000,
        maxMembers: 20,
        features: {
            hideout: {
                name: "Căn cứ",
                levels: [
                    {cost: 50000, storage: 10},
                    {cost: 100000, storage: 20},
                    {cost: 200000, storage: 30}
                ]
            },
            training: {
                name: "Phòng tập",
                levels: [
                    {cost: 30000, expBonus: 5},
                    {cost: 60000, expBonus: 10},
                    {cost: 120000, expBonus: 15}
                ]
            }
        }
    },

    // Cấu hình sự kiện
    EVENTS: {
        goldRush: {
            name: "Cơn sốt vàng",
            duration: 3600000,
            effects: {
                moneyMultiplier: 2,
                policeResponse: 1.5
            }
        },
        blackout: {
            name: "Mất điện",
            duration: 1800000,
            effects: {
                stealthBonus: 2,
                visionRange: 0.5
            }
        },
        riot: {
            name: "Bạo loạn",
            duration: 2700000,
            effects: {
                policePresence: 0.5,
                civilianPanic: true
            }
        }
    },

    // Cấu hình thú cưng
    PETS: {
        types: {
            dog: {
                name: "Chó nghiệp vụ",
                price: 50000,
                abilities: {
                    detect: "Phát hiện kẻ địch trong phạm vi",
                    attack: "Tấn công và làm chậm mục tiêu",
                    guard: "Bảo vệ chủ nhân"
                },
                stats: {
                    health: 100,
                    damage: 15,
                    speed: 20
                }
            },
            hawk: {
                name: "Diều hâu trinh sát",
                price: 75000,
                abilities: {
                    scout: "Trinh sát khu vực từ trên cao",
                    mark: "Đánh dấu mục tiêu",
                    distract: "Gây nhiễu địch"
                },
                stats: {
                    health: 60,
                    vision: 40,
                    speed: 35
                }
            },
            drone: {
                name: "Drone theo dõi",
                price: 100000,
                abilities: {
                    scan: "Quét khu vực",
                    hack: "Vô hiệu hóa thiết bị điện tử",
                    record: "Ghi hình làm bằng chứng"
                },
                stats: {
                    health: 80,
                    tech: 30,
                    stealth: 25
                }
            }
        }
    },

    // Cấu hình phương tiện
    VEHICLES: {
        types: {
            motorcycle: {
                name: "Xe máy",
                price: 30000,
                stats: {
                    speed: 80,
                    handling: 90,
                    capacity: 2
                }
            },
            car: {
                name: "Ô tô",
                price: 80000,
                stats: {
                    speed: 100,
                    handling: 70,
                    capacity: 4
                }
            },
            van: {
                name: "Xe tải",
                price: 120000,
                stats: {
                    speed: 60,
                    handling: 50,
                    capacity: 6
                }
            }
        }
    },

    // Cấu hình chợ đen
    BLACK_MARKET: {
        refresh: 3600000,
        items: {
            weapons: {
                goldenGun: {
                    name: "Súng vàng",
                    price: 500000,
                    rarity: "Legendary",
                    stats: {damage: 100, accuracy: 0.95}
                },
                silencedSniper: {
                    name: "Súng bắn tỉa có ống giảm thanh",
                    price: 300000,
                    rarity: "Epic",
                    stats: {damage: 80, stealth: 100}
                }
            },
            equipment: {
                ghostSuit: {
                    name: "Bộ đồ tàng hình",
                    price: 400000,
                    rarity: "Legendary",
                    stats: {stealth: 100, defense: 50}
                },
                hackerDevice: {
                    name: "Thiết bị hack",
                    price: 250000,
                    rarity: "Epic",
                    stats: {hackSpeed: 200, detection: -80}
                }
            }
        }
    },

    // Cấu hình giải đấu
    TOURNAMENT: {
        types: {
            heistMaster: {
                name: "Vua Cướp",
                duration: 86400000,
                format: "Solo",
                rewards: {
                    first: {money: 500000, item: "Vương Miện Cướp"},
                    second: {money: 300000},
                    third: {money: 100000}
                }
            },
            teamBattle: {
                name: "Đại Chiến Bang Hội",
                duration: 604800000,
                format: "Team",
                rewards: {
                    first: {money: 1000000, item: "Cúp Bang Hội"},
                    second: {money: 600000},
                    third: {money: 300000}
                }
            }
        }
    }
};

module.exports = GAME_CONFIG; 