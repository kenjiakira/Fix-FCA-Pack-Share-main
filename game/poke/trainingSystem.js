const pokemonSystem = require('./pokemonSystem');
const bagSystem = require('./bagSystem');

class TrainingSystem {
    constructor() {
        this.trainingAreas = {
            'gym': {
                name: 'Gym',
                description: 'Tăng sức mạnh tổng thể',
                statBoosts: { attack: 1.2, defense: 1.1 },
                expMultiplier: 1.2,
                minigames: ['weightLifting', 'obstacleCourse']
            },
            'pool': {
                name: 'Pool',
                description: 'Luyện tập cho Pokemon hệ Nước',
                typeBonus: 'water',
                statBoosts: { defense: 1.2 },
                expMultiplier: 1.3,
                minigames: ['swimming', 'divingContest']
            },
            'track': {
                name: 'Track',
                description: 'Tăng tốc độ và sức bền',
                statBoosts: { speed: 1.2 },
                expMultiplier: 1.1,
                minigames: ['sprint', 'relay']
            },
            'dojo': {
                name: 'Dojo',
                description: 'Luyện tập kỹ năng chiến đấu',
                statBoosts: { attack: 1.3 },
                expMultiplier: 1.4,
                minigames: ['targetPractice', 'shadowBoxing']
            }
        };

        this.minigames = {
            'weightLifting': {
                name: 'Weight Lifting',
                description: 'Nâng tạ để tăng sức mạnh',
                duration: 60,
                maxAttempts: 3,
                rewards: {
                    exp: [20, 40, 60],
                    stats: { attack: [1, 2, 3] }
                }
            },
            'swimming': {
                name: 'Swimming',
                description: 'Bơi lội để tăng sức bền',
                duration: 90,
                maxAttempts: 3,
                rewards: {
                    exp: [30, 50, 70],
                    stats: { defense: [1, 2, 3] }
                }
            },
            'targetPractice': {
                name: 'Target Practice',
                description: 'Tập trung mục tiêu',
                duration: 45,
                maxAttempts: 5,
                rewards: {
                    exp: [25, 45, 65],
                    stats: { accuracy: [1, 2, 3] }
                }
            }
        };

        this.trainingStreaks = {};
        this.lastTraining = {};
    }

    async startTraining(userId, pokemonIndex, areaId, minigameId) {
        const player = await pokemonSystem.getPlayer(userId);
        if (!player) return { error: 'Không tìm thấy người chơi' };

        const pokemon = player.pokemons[pokemonIndex];
        if (!pokemon) return { error: 'Không tìm thấy Pokemon' };

        const area = this.trainingAreas[areaId];
        if (!area) return { error: 'Không tìm thấy khu vực luyện tập' };

        const minigame = this.minigames[minigameId];
        if (!minigame) return { error: 'Không tìm thấy minigame' };

        // Check training cooldown
        const now = Date.now();
        const lastTime = this.lastTraining[userId] || 0;
        if (now - lastTime < 300000) { // 5 minutes cooldown
            const timeLeft = Math.ceil((300000 - (now - lastTime)) / 1000);
            return { error: `Vui lòng đợi ${timeLeft} giây để tiếp tục luyện tập` };
        }

        // Calculate training effectiveness
        let effectiveness = 1.0;
        
        // Type bonus
        if (area.typeBonus && pokemon.types.includes(area.typeBonus)) {
            effectiveness *= 1.5;
        }

        // Streak bonus
        const streak = this.trainingStreaks[userId] || 0;
        effectiveness *= (1 + streak * 0.1); // 10% bonus per streak

        // Calculate rewards
        const baseExp = minigame.rewards.exp[0];
        const expGain = Math.floor(baseExp * effectiveness * area.expMultiplier);

        // Apply stat boosts
        const statGains = {};
        Object.entries(area.statBoosts).forEach(([stat, boost]) => {
            statGains[stat] = Math.floor(boost * effectiveness);
        });

        // Update Pokemon stats
        pokemon.exp += expGain;
        Object.entries(statGains).forEach(([stat, gain]) => {
            pokemon[stat] = (pokemon[stat] || 0) + gain;
        });

        // Update training history
        this.lastTraining[userId] = now;
        this.trainingStreaks[userId] = (this.trainingStreaks[userId] || 0) + 1;

        // Save changes
        await pokemonSystem.saveData();

        return {
            success: true,
            expGained: expGain,
            statGains: statGains,
            streak: this.trainingStreaks[userId],
            effectiveness: effectiveness
        };
    }

    getTrainingAreas() {
        return this.trainingAreas;
    }

    getMinigames() {
        return this.minigames;
    }

    async getTrainingStats(userId) {
        const streak = this.trainingStreaks[userId] || 0;
        const lastTraining = this.lastTraining[userId] || 0;
        
        return {
            streak,
            lastTraining,
            timeUntilNext: Math.max(0, 300000 - (Date.now() - lastTraining))
        };
    }
}

module.exports = new TrainingSystem();
