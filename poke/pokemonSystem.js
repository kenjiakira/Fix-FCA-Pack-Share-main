const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const pvpSystem = require('./pvpSystem');
const bagSystem = require('./bagSystem');
const battleManager = require('./battleManager');
const currencies = require('../utils/currencies');
const { system: catchSystem, WEATHER_EFFECTS } = require('./catchSystem');

class PokemonSystem {
    constructor() {
        this.dataPath = path.join(__dirname, '..', 'commands', 'json', 'pokemon', 'pokemon.json');
        this.players = {};
        this.loaded = false;
        this.PVE_COOLDOWN = 60000;
        this.catchStatus = {};

        this.POKEBALLS = {
            "pokeball": {
                name: "Pokéball",
                catchRate: 1.2,     
                price: 5000,
                emoji: "⚪",
                image: "https://imgur.com/shWA5J3.png"
            },
            "safariball": {
                name: "Safari Ball",
                catchRate: 1.8,     
                price: 50000,
                emoji: "🔵",
                image: "https://imgur.com/GKsonvb.png"
            },
            "ultraball": {
                name: "Ultra Ball",
                catchRate: 2.5,     
                price: 70000,
                emoji: "🟡",
                image: "https://imgur.com/00teTZb.png"
            },
            "masterball": {
                name: "Master Ball",
                catchRate: 255,
                price: 5000000,
                emoji: "🟣",
                image: "https://imgur.com/8NRJjQt.png"
            },
            "greatball": {
                name: "Great Ball", 
                catchRate: 1.5,    
                price: 25000,
                emoji: "⚪",
                image: "https://imgur.com/3DIk7lU.png"
            }
        };
    }

    async init() {
        if (!this.loaded) {
            await this.loadData();
            this.loaded = true;
        }
    }

    async loadData() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            this.players = JSON.parse(data);
        } catch (error) {
            console.log("No existing data, creating new data file");
            this.players = {};
            await this.saveData();
        }
    }

    async saveData() {
        const dir = path.dirname(this.dataPath);
        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.dataPath, JSON.stringify(this.players, null, 2));
        } catch (error) {
            console.error('Error saving Pokemon data:', error);
        }
    }

    setCatchStatus(threadID, status) {
        this.catchStatus[threadID] = status;
    }

    getCatchStatus(threadID) {
        return this.catchStatus[threadID] || false;
    }

    async generatePokemon(options = {}) {
        const {
            minLevel = 1,
            maxLevel = 10,
            preferredTypes = [],
            rarityMultiplier = 1,
            weather = null
        } = options;

        let attempts = 0;
        const maxAttempts = 5;
        
        while(attempts < maxAttempts) {
            const randomId = Math.floor(Math.random() * 898) + 1;
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            const pokemon = response.data;

            const matchesType = preferredTypes.length === 0 || 
                pokemon.types.some(t => preferredTypes.includes(t.type.name));

            if (matchesType) {
                const level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
                const isShiny = Math.random() < (0.02 * rarityMultiplier);

                const weatherBoost = weather && 
                    WEATHER_EFFECTS[weather]?.types.some(t => 
                        pokemon.types.some(pt => pt.type.name === t)
                    ) ? WEATHER_EFFECTS[weather].boost : 1;

                const statMultiplier = weatherBoost * (0.9 + Math.random() * 0.2);

                return {
                    id: pokemon.id,
                    name: pokemon.name,
                    level: level,
                    hp: Math.floor(pokemon.stats[0].base_stat * statMultiplier),
                    maxHp: Math.floor(pokemon.stats[0].base_stat * statMultiplier),
                    attack: Math.floor(pokemon.stats[1].base_stat * statMultiplier),
                    defense: Math.floor(pokemon.stats[2].base_stat * statMultiplier),
                    types: pokemon.types.map(t => t.type.name),
                    moves: pokemon.moves.slice(0, 4).map(m => m.move.name),
                    image: pokemon.sprites.other['official-artwork'].front_default,
                    shiny: isShiny,
                    weather: weather
                };
            }
            attempts++;
        }
        
        return this.generateFallbackPokemon(minLevel, maxLevel);
    }

    async generateFallbackPokemon() {
        const randomId = Math.floor(Math.random() * 898) + 1;
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const pokemon = response.data;
        
        return {
            id: pokemon.id,
            name: pokemon.name,
            level: Math.floor(Math.random() * 10) + 1,
            hp: Math.floor(pokemon.stats[0].base_stat),
            maxHp: Math.floor(pokemon.stats[0].base_stat),
            attack: Math.floor(pokemon.stats[1].base_stat),
            defense: Math.floor(pokemon.stats[2].base_stat),
            types: pokemon.types.map(t => t.type.name),
            moves: pokemon.moves.slice(0, 4).map(m => m.move.name),
            image: pokemon.sprites.other['official-artwork'].front_default,
            shiny: Math.random() < 0.02
        };
    }

    async generateWildPokemon(playerLevel) {
        const randomId = Math.floor(Math.random() * 898) + 1;
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const pokemon = response.data;

        const level = Math.max(1, Math.floor(playerLevel * (Math.random() * 0.4 + 0.8)));
        const levelMultiplier = 1 + (level - 1) * 0.1;

        return {
            id: pokemon.id,
            name: pokemon.name,
            level: level,
            hp: Math.floor(pokemon.stats[0].base_stat * levelMultiplier),
            maxHp: Math.floor(pokemon.stats[0].base_stat * levelMultiplier),
            attack: Math.floor(pokemon.stats[1].base_stat * levelMultiplier),
            defense: Math.floor(pokemon.stats[2].base_stat * levelMultiplier),
            types: pokemon.types.map(t => t.type.name),
            moves: pokemon.moves.slice(0, 4).map(m => m.move.name),
            image: pokemon.sprites.other['official-artwork'].front_default,
            isWild: true
        };
    }

    async getBallInventory(userId) {
        const player = this.players[userId];
        if (!player) return null;

        const ballInventory = {};
        Object.keys(this.POKEBALLS).forEach(ballType => {
            ballInventory[ballType] = player.inventory[ballType] || 0;
        });

        return ballInventory;
    }

    async catch(userId, pokemonData, ballType = "pokeball") {
        // Kiểm tra và khởi tạo dữ liệu người chơi nếu chưa có
        if (!this.players[userId]) {
            this.players[userId] = await this.initNewPlayer(userId);
        }

        // Kiểm tra ball hợp lệ
        const ball = this.POKEBALLS[ballType];
        if (!ball) return { error: "invalidBall" };

        // Kiểm tra số lượng ball
        if (!this.players[userId].inventory[ballType] || this.players[userId].inventory[ballType] <= 0) {
            return { 
                error: "noBall",
                ballType: ball.name,
                inventory: await this.getBallInventory(userId)
            };
        }

        const catchRate = this.calculateCatchRate(pokemonData, ball.catchRate);
        const caught = Math.random() < catchRate;

        // Trừ ball đã sử dụng
        this.players[userId].inventory[ballType]--;
        await this.saveData();

        if (!caught) {
            return { 
                error: "failed", 
                ballUsed: ball.name,
                ballsLeft: this.players[userId].inventory[ballType],
                inventory: await this.getBallInventory(userId)
            };
        }

        // Thêm Pokemon mới
        const newPokemon = {
            ...pokemonData,
            exp: 0,
            expNeeded: 100,
            catchDate: Date.now(),
            wins: 0,
            battles: 0,
            ballCaught: ball.name
        };

        newPokemon.hp = newPokemon.maxHp;
        this.players[userId].pokemons.push(newPokemon);
        await this.saveData();

        return {
            success: true,
            pokemon: newPokemon,
            ballUsed: ball.name
        };
    }

    calculateCatchRate(pokemon, ballBonus) {
   
        const baseRate = Math.max(0.2, 1 - (pokemon.level / 150)); 
        const hpRate = pokemon.hp / pokemon.maxHp;
        const hpBonus = Math.max(0.2, 1 - hpRate); 
        let weaknessBonus = 1.0;
        if (pokemon.attack < 50 || pokemon.defense < 50) {
            weaknessBonus = 1.2;
        }

        let levelBonus = 1.0;
        if (pokemon.level <= 5) levelBonus = 1.4;
        else if (pokemon.level <= 10) levelBonus = 1.2;
        
        let finalRate = baseRate * ballBonus * (1 + hpBonus) * weaknessBonus * levelBonus;
        
        finalRate = Math.min(0.95, finalRate);
        finalRate = Math.max(0.15, finalRate); 
    
        finalRate *= (1 + Math.random() * 0.1);
        
        return finalRate;
    }

    async buyBall(userId, ballType, quantity = 1) {
        if (!this.players[userId]) {
            this.players[userId] = await this.initNewPlayer(userId);
        }

        if (!this.players[userId].inventory) {
            this.players[userId].inventory = {
                pokeball: 0,
                greatball: 0,
                ultraball: 0,
                masterball: 0,
                safariball: 0
            };
        }

        this.players[userId].inventory[ballType] = 
            (this.players[userId].inventory[ballType] || 0) + quantity;

        await this.saveData();

        return {
            success: true,
            currentQuantity: this.players[userId].inventory[ballType],
            ballType: ballType
        };
    }

    async battle(player1Id, player2Id, threadID) {
        if (battleManager.isActiveBattle(threadID)) {
            return { error: "activeBattle" };
        }

        const p1 = this.players[player1Id];
        const p2 = this.players[player2Id];

        if (!p1 || !p2) return { error: "noPlayers" };

        const pokemon1 = p1.pokemons[p1.activePokemon];
        const pokemon2 = p2.pokemons[p2.activePokemon];

        if (!pokemon1 || !pokemon2) return { error: "noPokemon" };

        battleManager.startBattle(threadID);

        try {
            const battleResult = await pvpSystem.battle(pokemon1, pokemon2);
            
            battleManager.endBattle(threadID);
            
            if (battleResult?.error) {
                await this.saveData(); 
                return battleResult;
            }

            const winner = battleResult.winner === pokemon1 ? player1Id : player2Id;
            if (winner === player1Id) {
                p1.wins++;
                pokemon1.wins++;
                pokemon1.exp += battleResult.expGained;
                await this.checkLevelUp(player1Id, p1.activePokemon);
            } else {
                p2.wins++;
                pokemon2.wins++;
                pokemon2.exp += battleResult.expGained;
                await this.checkLevelUp(player2Id, p2.activePokemon);
            }

            p1.battles++;
            p2.battles++;
            pokemon1.battles++;
            pokemon2.battles++;

            await this.saveData();

            return {
                winner: {
                    id: winner,
                    name: battleResult.winner.name,
                    remainingHp: winner === player1Id ? battleResult.finalHP.pokemon1 : battleResult.finalHP.pokemon2
                },
                loser: {
                    name: battleResult.loser.name,
                    remainingHp: winner === player1Id ? battleResult.finalHP.pokemon2 : battleResult.finalHP.pokemon1
                },
                log: battleResult.log,
                expGained: battleResult.expGained
            };
        } catch (error) {
            battleManager.endBattle(threadID);
            console.error("Battle error:", error);
            return { error: "battleError" };
        }
    }

    async pve(userId) {
        const player = this.players[userId];
        if (!player) return null;

        const pokemon = player.pokemons[player.activePokemon];
        if (!pokemon) return null;

        const now = Date.now();
        if (player.lastPvE && now - player.lastPvE < this.PVE_COOLDOWN) {
            return { error: "cooldown", timeLeft: this.PVE_COOLDOWN - (now - player.lastPvE) };
        }

        const wildPokemon = await this.generateWildPokemon(pokemon.level);
        const battleResult = await pvpSystem.pve(pokemon, wildPokemon);

        if (!battleResult.error && battleResult.winner === pokemon) {
            player.lastPvE = now;
            pokemon.exp += battleResult.expGained;
            pokemon.wins++;
            
            const coinsEarned = battleResult.rewardCoins;
            currencies.updateBalance(userId, coinsEarned);
            
            await this.checkLevelUp(userId, player.activePokemon);
        }

        pokemon.battles++;
        await this.saveData();

        return battleResult;
    }

    async checkEvolution(userId, pokemonIndex) {
        // Simplified evolution check based on level only
        const pokemon = this.players[userId].pokemons[pokemonIndex];
        if (!pokemon) return null;

        // Define evolution thresholds
        const evolutions = {
            25: 30,  // Level 25 -> evolve power multiplier 1.3
            50: 40,  // Level 50 -> evolve power multiplier 1.4
            75: 50   // Level 75 -> evolve power multiplier 1.5
        };

        let evolutionPower = null;
        for (const [level, power] of Object.entries(evolutions)) {
            if (pokemon.level >= parseInt(level)) {
                evolutionPower = power;
            }
        }

        if (!evolutionPower) return null;

        // Simple stat boost evolution
        const statMultiplier = 1 + (evolutionPower / 100);
        const newPokemon = {
            ...pokemon,
            name: `${pokemon.name} ✨`,
            hp: Math.floor(pokemon.hp * statMultiplier),
            maxHp: Math.floor(pokemon.maxHp * statMultiplier),
            attack: Math.floor(pokemon.attack * statMultiplier),
            defense: Math.floor(pokemon.defense * statMultiplier),
            evolutionDate: Date.now()
        };

        this.players[userId].pokemons[pokemonIndex] = newPokemon;
        await this.saveData();

        return {
            oldPokemon: pokemon,
            newPokemon: newPokemon
        };
    }

    async checkLevelUp(userId, pokemonIndex) {
        const pokemon = this.players[userId].pokemons[pokemonIndex];
        if (pokemon.exp >= pokemon.expNeeded) {
            pokemon.level++;
            pokemon.exp -= pokemon.expNeeded;
            pokemon.expNeeded = Math.floor(pokemon.expNeeded * 1.5);
            pokemon.hp = Math.floor(pokemon.hp * 1.1);
            pokemon.maxHp = Math.floor(pokemon.maxHp * 1.1);
            pokemon.attack = Math.floor(pokemon.attack * 1.1);
            pokemon.defense = Math.floor(pokemon.defense * 1.1);

            const evolution = await this.checkEvolution(userId, pokemonIndex);
            return evolution || true;
        }
        return false;
    }

    async getBag(userId, page = 1, itemsPerPage = 5) {
        return await bagSystem.getBag(this.players, userId, page, itemsPerPage);
    }

    async search(userId, searchTerm) {
        return await bagSystem.search(this.players, userId, searchTerm);
    }

    async sort(userId, sortType) {
        const success = await bagSystem.sort(this.players, userId, sortType);
        if (success) await this.saveData();
        return success;
    }

    async selectPokemon(userId, index) {
        const player = this.players[userId];
        if (!player || !player.pokemons[index]) return false;
        
        player.activePokemon = index;
        await this.saveData();
        return true;
    }

    async getSelectedPokemon(userId) {
        const player = this.players[userId];
        if (!player) return null;
        
        return player.pokemons[player.activePokemon];
    }

    async getPlayerStats(userId) {
        const player = this.players[userId];
        if (!player) return null;

        const strongestPokemon = [...player.pokemons].sort((a, b) => 
            (b.hp + b.attack + b.defense) - (a.hp + a.attack + a.defense)
        )[0];

        return {
            totalPokemon: player.pokemons.length,
            battles: player.battles,
            wins: player.wins,
            winRate: player.battles > 0 ? ((player.wins / player.battles) * 100).toFixed(1) : 0,
            strongestPokemon: {
                name: strongestPokemon.name,
                level: strongestPokemon.level,
                power: this.calculatePower(strongestPokemon)
            }
        };
    }

    getTypeEmoji(type) {
        return bagSystem.getTypeEmoji(type);
    }

    calculatePower(pokemon) {
        return bagSystem.calculatePower(pokemon);
    }

    getPowerBar(power) {
        return bagSystem.getPowerBar(power);
    }

    getTypeName(type) {
        return bagSystem.getTypeName(type);
    }

    async getBestAvailableBall(userId) {
        const player = this.players[userId];
        if (!player) return null;

        const ballPriority = [
            "masterball",
            "ultraball",
            "greatball",
            "premierball",
            "pokeball"
        ];

        for (const ballType of ballPriority) {
            if (player.inventory[ballType] && player.inventory[ballType] > 0) {
                return {
                    type: ballType,
                    ball: this.POKEBALLS[ballType],
                    count: player.inventory[ballType]
                };
            }
        }
        return null;
    }

    async getPlayer(userId) {
        return this.players[userId] || null;
    }

    async initNewPlayer(userId) {
        return {
            name: null,
            pokemons: [],
            activePokemon: 0,
            battles: 0,
            wins: 0,
            inventory: {
                pokeball: 10,
                greatball: 5,
                ultraball: 2,
                masterball: 0,
                safariball: 0
            },
            lastCatch: null,
            lastPvE: null
        };
    }

    async setPlayerName(userId, name) {
        if (!this.players[userId]) {
            this.players[userId] = await this.initNewPlayer(userId);
        }
        this.players[userId].name = name;
        await this.saveData();
        return true;
    }

    async getPlayerName(userId) {
        return this.players[userId]?.name || null;
    }

    async requirePlayerName(userId) {
        return !this.players[userId] || !this.players[userId].name;
    }
}

module.exports = new PokemonSystem();
