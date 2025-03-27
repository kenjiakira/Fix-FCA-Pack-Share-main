const pokemonSystem = require('./pokemonSystem');

class MinigameSystem {
    constructor() {
        this.minigames = {
            'target': {
                id: 'targetPractice',
                name: 'Target Practice',
                description: 'Tập trung bắn mục tiêu để tăng độ chính xác',
                rewards: {
                    exp: {min: 20, max: 50},
                    stats: {
                        attack: {min: 2, max: 4}
                    }
                }
            },
            
            'speed': {
                id: 'speedTraining',
                name: 'Speed Training',
                description: 'Luyện tập tốc độ và phản xạ',
                rewards: {
                    exp: {min: 25, max: 55},
                    stats: {
                        speed: {min: 2, max: 4},
                        defense: {min: 1, max: 3}
                    }
                }
            },
            
            'power': {
                id: 'powerLift',
                name: 'Power Lifting',
                description: 'Tập luyện sức mạnh',
                rewards: {
                    exp: {min: 30, max: 60},
                    stats: {
                        attack: {min: 3, max: 5},
                        defense: {min: 2, max: 4}
                    }
                }
            },
            
            'med': {
                id: 'meditation',
                name: 'Meditation',
                description: 'Tăng cường tinh thần và sức mạnh nội tại',
                rewards: {
                    exp: {min: 35, max: 65},
                    stats: {
                        defense: {min: 3, max: 5},
                        specialDefense: {min: 2, max: 4}
                    }
                }
            }
        };
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomGame() {
        const games = Object.keys(this.minigames);
        const randomIndex = Math.floor(Math.random() * games.length);
        return games[randomIndex];
    }

    async startMinigame(userId, gameType = null) {
        if (!gameType) {
            gameType = this.getRandomGame();
        }

        const game = this.minigames[gameType];
        if (!game) {
            return { 
                error: '❌ Lỗi khi train Pokemon!\n' +
                      'Hãy thử lại với lệnh .poke train'
            };
        }

        const pokemon = await pokemonSystem.getSelectedPokemon(userId);
        if (!pokemon) {
            return { error: 'Bạn chưa chọn Pokemon!' };
        }

        const rewards = {
            exp: this.getRandomNumber(game.rewards.exp.min, game.rewards.exp.max),
            stats: {}
        };

        Object.entries(game.rewards.stats).forEach(([stat, range]) => {
            rewards.stats[stat] = this.getRandomNumber(range.min, range.max);
        });

        pokemon.exp += rewards.exp;
        Object.entries(rewards.stats).forEach(([stat, value]) => {
            pokemon[stat] = (pokemon[stat] || 0) + value;
        });
        await pokemonSystem.saveData();
      
        let levelUpMessage = '';
        if (pokemon.exp >= pokemon.expNeeded) {
            const levelUpResult = await pokemonSystem.checkLevelUp(userId, pokemonSystem.players[userId].activePokemon);
            if (levelUpResult && levelUpResult.message) {
                levelUpMessage = '\n' + levelUpResult.message;
            }
        }

        const rewardMessage = [
            `🎮 ${game.name} hoàn thành!`,
            `\n📊 Phần thưởng:`,
            `\n- EXP: +${rewards.exp}\n`,
            ...Object.entries(rewards.stats).map(([stat, value]) => `- ${stat}: +${value}\n`),
            levelUpMessage
        ].join('');

        return {
            success: true,
            rewards,
            message: rewardMessage
        };
    }

    getAllMinigames() {
        return Object.entries(this.minigames).map(([id, game]) => ({
            id,
            name: game.name,
            description: game.description,
            rewards: game.rewards
        }));
    }

    async checkAnswer(userId, answer) {
        const pokemon = await pokemonSystem.getSelectedPokemon(userId);
        if (!pokemon) {
            return { error: '❌ Không tìm thấy Pokemon!' };
        }

        // Process training result
        const game = this.minigames[this.getRandomGame()];
        const rewards = {
            exp: this.getRandomNumber(game.rewards.exp.min, game.rewards.exp.max),
            stats: {}
        };

        Object.entries(game.rewards.stats).forEach(([stat, range]) => {
            rewards.stats[stat] = this.getRandomNumber(range.min, range.max);
        });

        // Apply rewards
        pokemon.exp += rewards.exp;
        Object.entries(rewards.stats).forEach(([stat, value]) => {
            pokemon[stat] = (pokemon[stat] || 0) + value;
        });

        await pokemonSystem.saveData();

        return {
            success: true,
            rewards,
            message: '✅ Huấn luyện thành công!'
        };
    }
}

module.exports = new MinigameSystem();
