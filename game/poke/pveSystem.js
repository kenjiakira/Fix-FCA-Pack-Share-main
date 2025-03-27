const fs = require('fs').promises;
const path = require('path');
const { createBattleImage } = require('./canvasHelper');

class PvESystem {
    constructor() {
        this.cooldownFile = path.join(__dirname, '..', 'commands', 'json', 'pokemon', 'pve_cooldowns.json');
        this.cooldowns = {};
        this.loadCooldowns();
        
        this.cooldownTimes = {
            beginner: 2 * 60 * 1000,  
            easy: 3 * 60 * 1000,        
            normal: 4 * 60 * 1000,     
            hard: 5 * 60 * 1000,    
            expert: 7 * 60 * 1000,   
            master: 10 * 60 * 1000,    
            legend: 15 * 60 * 1000   
        };

        this.difficulties = {
            beginner: {
                name: "Tập Sự",
                levelRange: { min: 1, max: 20 },
                rewards: {
                    exp: { min: 10, max: 25 },
                    statBoost: 1.0
                }
            },
            easy: {
                name: "Dễ",
                levelRange: { min: 15, max: 35 },
                rewards: {
                    exp: { min: 20, max: 40 },
                    statBoost: 1.2
                }
            },
            normal: {
                name: "Thường",
                levelRange: { min: 30, max: 50 },
                rewards: {
                    exp: { min: 35, max: 55 },
                    statBoost: 1.4
                }
            },
            hard: {
                name: "Khó",
                levelRange: { min: 45, max: 70 },
                rewards: {
                    exp: { min: 50, max: 75 },
                    statBoost: 1.6
                }
            },
            expert: {
                name: "Chuyên Gia",
                levelRange: { min: 65, max: 85 },
                rewards: {
                    exp: { min: 70, max: 100 },
                    statBoost: 1.8
                }
            },
            master: {
                name: "Bậc Thầy",
                levelRange: { min: 80, max: 100 },
                rewards: {
                    exp: { min: 90, max: 130 },
                    statBoost: 2.0
                }
            },
            legend: {
                name: "Huyền Thoại",
                levelRange: { min: 95, max: 120 },
                rewards: {
                    exp: { min: 120, max: 180 },
                    statBoost: 2.5
                }
            }
        };
    }

    async generateWildPokemon(difficulty, pokeSystem) {
        const difficultySettings = this.difficulties[difficulty];
        if (!difficultySettings) throw new Error("Invalid difficulty");

        const wildPokemon = await pokeSystem.generatePokemon({
            minLevel: difficultySettings.levelRange.min,
            maxLevel: difficultySettings.levelRange.max,
            rarityMultiplier: difficultySettings.statBoost
        });

        wildPokemon.level = parseInt(wildPokemon.level);
        if (isNaN(wildPokemon.level) || wildPokemon.level < 1) {
            wildPokemon.level = difficultySettings.levelRange.min;
        }

        const baseStats = {
            hp: Math.max(50, parseInt(wildPokemon.hp) || 50),
            attack: Math.max(30, parseInt(wildPokemon.attack) || 30),
            defense: Math.max(20, parseInt(wildPokemon.defense) || 20)
        };

        const levelScaling = Math.max(1, 1 + (wildPokemon.level / 25));

        const difficultyScaling = parseFloat(difficultySettings.statBoost) || 1.0;

        const totalScaling = Math.max(1, levelScaling * difficultyScaling);

        let stats = {
            hp: Math.floor(baseStats.hp * totalScaling),
            attack: Math.floor(baseStats.attack * totalScaling),
            defense: Math.floor(baseStats.defense * totalScaling)
        };

        stats = {
            hp: Math.max(1, isNaN(stats.hp) ? baseStats.hp : stats.hp),
            attack: Math.max(1, isNaN(stats.attack) ? baseStats.attack : stats.attack),
            defense: Math.max(1, isNaN(stats.defense) ? baseStats.defense : stats.defense)
        };

        // Get difficulty bonuses with validation
        const defaultBonus = { hp: 1.0, atk: 1.0, def: 1.0 };
        const difficultyBonuses = {
            beginner: defaultBonus,
            easy: { hp: 1.1, atk: 1.1, def: 1.1 },
            normal: { hp: 1.2, atk: 1.2, def: 1.2 },
            hard: { hp: 1.3, atk: 1.3, def: 1.3 },
            expert: { hp: 1.4, atk: 1.4, def: 1.4 },
            master: { hp: 1.5, atk: 1.5, def: 1.5 },
            legend: { hp: 2.0, atk: 1.8, def: 1.8 }
        }[difficulty] || defaultBonus;

        // Apply and validate difficulty bonuses
        stats = {
            hp: Math.floor(stats.hp * difficultyBonuses.hp),
            attack: Math.floor(stats.attack * difficultyBonuses.atk),
            defense: Math.floor(stats.defense * difficultyBonuses.def)
        };

        // Calculate and validate level-based minimums
        const minimums = {
            hp: 30 + (wildPokemon.level * 2),
            attack: 20 + Math.floor(wildPokemon.level * 1.5),
            defense: 15 + Math.floor(wildPokemon.level * 1.2)
        };

        // Final stat assignment with validation
        wildPokemon.hp = Math.max(minimums.hp, stats.hp);
        wildPokemon.attack = Math.max(minimums.attack, stats.attack);
        wildPokemon.defense = Math.max(minimums.defense, stats.defense);

        // Ensure all stats are valid numbers one last time
        if (isNaN(wildPokemon.hp)) wildPokemon.hp = minimums.hp;
        if (isNaN(wildPokemon.attack)) wildPokemon.attack = minimums.attack;
        if (isNaN(wildPokemon.defense)) wildPokemon.defense = minimums.defense;

        // Set maxHp after all validations
        wildPokemon.maxHp = wildPokemon.hp;

        return wildPokemon;
    }

    async loadCooldowns() {
        try {
            const data = await fs.readFile(this.cooldownFile, 'utf8');
            this.cooldowns = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is invalid, start with empty cooldowns
            this.cooldowns = {};
            await this.saveCooldowns();
        }
    }

    async saveCooldowns() {
        try {
            const dir = path.dirname(this.cooldownFile);
            await fs.mkdir(dir, { recursive: true });
            
            await fs.writeFile(this.cooldownFile, JSON.stringify(this.cooldowns, null, 2));
        } catch (error) {
            console.error('Error saving cooldowns:', error);
        }
    }

    checkCooldown(userId, difficulty) {
        const key = `${userId}-${difficulty}`;
        const lastBattle = this.cooldowns[key] || 0;
        const cooldownTime = this.cooldownTimes[difficulty] || 5 * 60 * 1000;
        const now = Date.now();
        const timeLeft = lastBattle + cooldownTime - now;
        
        return {
            canBattle: timeLeft <= 0,
            timeLeft: Math.max(0, timeLeft),
            cooldownTime
        };
    }

    async setCooldown(userId, difficulty) {
        const key = `${userId}-${difficulty}`;
        this.cooldowns[key] = Date.now();
        await this.saveCooldowns();
    }

    async battle(playerPokemon, wildPokemon) {
        const battleLog = [];

        try {
            if (!playerPokemon || !wildPokemon) {
                throw new Error("Invalid Pokemon objects");
            }

            // Create safe copies with default values
            const player = {
                hp: Math.max(1, parseInt(playerPokemon?.hp) || 50),
                maxHp: Math.max(1, parseInt(playerPokemon?.maxHp) || 50),
                attack: Math.max(1, parseInt(playerPokemon?.attack) || 30),
                defense: Math.max(1, parseInt(playerPokemon?.defense) || 20),
                name: playerPokemon?.name || "Player Pokemon"
            };

            const wild = {
                hp: Math.max(1, parseInt(wildPokemon?.hp) || 50),
                maxHp: Math.max(1, parseInt(wildPokemon?.maxHp) || 50),
                attack: Math.max(1, parseInt(wildPokemon?.attack) || 30),
                defense: Math.max(1, parseInt(wildPokemon?.defense) || 20),
                name: wildPokemon?.name || "Wild Pokemon"
            };

            let pokemon1HP = player.hp;
            let pokemon2HP = wild.hp;
            
            const calculateDamage = (attacker, defender) => {
                try {
                    const attack = Math.max(1, parseInt(attacker.attack));
                    const defense = Math.max(1, parseInt(defender.defense));
                    
                    const defenseRatio = Math.min(0.95, Math.max(0, defense/100));
                    const baseDamage = Math.floor(attack * (1 - defenseRatio));
                    const minDamage = Math.max(1, Math.floor(baseDamage * 0.8));
                    const maxDamage = Math.max(minDamage + 1, Math.floor(baseDamage * 1.2));
                    
                    return Math.max(1, Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage);
                } catch (error) {
                    console.error("Damage calculation error:", error);
                    return 1;
                }
            };

            while (pokemon1HP > 0 && pokemon2HP > 0) {
                const damage1 = calculateDamage(player, wild);
                pokemon2HP = Math.max(0, pokemon2HP - damage1);
                battleLog.push(`${player.name} gây ${damage1} sát thương!`);

                if (pokemon2HP <= 0) break;

                const damage2 = calculateDamage(wild, player);
                pokemon1HP = Math.max(0, pokemon1HP - damage2);
                battleLog.push(`${wild.name} gây ${damage2} sát thương!`);
            }

            const winner = pokemon1HP > 0 ? playerPokemon : wildPokemon;
            const loser = pokemon1HP > 0 ? wildPokemon : playerPokemon;

            return {
                winner,
                loser,
                battleLog,
                finalHP: {
                    player: Math.max(0, pokemon1HP),
                    wild: Math.max(0, pokemon2HP)
                }
            };
        } catch (error) {
            console.error("Battle error:", error);
            battleLog.push("⚠️ Đã xảy ra lỗi trong trận đấu!");
            return {
                winner: null,
                loser: null,
                battleLog,
                finalHP: {
                    player: 0,
                    wild: 0
                }
            };
        }
    }

    calculateRewards(difficulty, wildPokemon, isWinner) {
        const settings = this.difficulties[difficulty];
        if (!settings) throw new Error("Invalid difficulty");

        const expBase = Math.floor(Math.random() * 
            (settings.rewards.exp.max - settings.rewards.exp.min + 1)) + 
            settings.rewards.exp.min;

        const levelMultiplier = 1 + (wildPokemon.level / 40);
        
        const difficultyBonus = {
            beginner: 1.0,
            easy: 1.2,
            normal: 1.4,
            hard: 1.6,
            expert: 1.8,
            master: 2.0,
            legend: 2.5
        }[difficulty] || 1.0;

        const winMultiplier = isWinner ? 1 : 0.3;

        const finalExp = Math.floor(
            expBase * levelMultiplier * difficultyBonus * winMultiplier
        );

        return {
            exp: Math.max(1, finalExp) 
        };
    }

    getDifficultyInfo() {
        return Object.entries(this.difficulties).map(([key, diff]) => ({
            id: key,
            name: diff.name,
            level: `${diff.levelRange.min}-${diff.levelRange.max}`,
            exp: `${diff.rewards.exp.min}-${diff.rewards.exp.max}`
        }));
    }
}

module.exports = new PvESystem();
