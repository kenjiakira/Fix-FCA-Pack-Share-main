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
        this.catchStatus = {};
        this.trainingSystem = require('./trainingSystem');

        this.POKEBALLS = {
            "pokeball": {
                name: "Pokéball",
                catchRate: 0.8,     
                price: 50,
                emoji: "⚪",
                image: "https://imgur.com/shWA5J3.png"
            },
            "safariball": {
                name: "Safari Ball",
                catchRate: 1.2,     
                price: 500,
                emoji: "🔵",
                image: "https://imgur.com/GKsonvb.png"
            },
            "ultraball": {
                name: "Ultra Ball",
                catchRate: 1.8,     
                price: 700,
                emoji: "🟡",
                image: "https://imgur.com/00teTZb.png"
            },
            "masterball": {
                name: "Master Ball",
                catchRate: 100,
                price: 50000,
                emoji: "🟣",
                image: "https://imgur.com/8NRJjQt.png"
            },
            "greatball": {
                name: "Great Ball", 
                catchRate: 1.0,    
                price: 250,
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
            if (await fs.access(this.dataPath).then(() => true).catch(() => false)) {
                const backupPath = `${this.dataPath}.backup`;
                await fs.copyFile(this.dataPath, backupPath);
            }

            const data = await fs.readFile(this.dataPath, 'utf8');
            this.players = JSON.parse(data);
            this.loaded = true;
            
            for (const userId in this.players) {
                const player = this.players[userId];
                if (!player.pokemons) player.pokemons = [];
                if (!player.inventory) player.inventory = {};
                
                if (player.pokemons) {
                    for (const pokemon of player.pokemons) {
                        if (typeof pokemon.exp === 'undefined') pokemon.exp = 0;
                        if (typeof pokemon.expNeeded === 'undefined') pokemon.expNeeded = 100;
                        if (typeof pokemon.level === 'undefined') pokemon.level = 1;
                        if (typeof pokemon.maxHp === 'undefined') pokemon.maxHp = pokemon.hp;
                    }
                }
            }
        } catch (error) {
            console.log("Loading from backup or creating new data file");
            try {
                // Try to load from backup
                const backupPath = `${this.dataPath}.backup`;
                if (await fs.access(backupPath).then(() => true).catch(() => false)) {
                    const backupData = await fs.readFile(backupPath, 'utf8');
                    this.players = JSON.parse(backupData);
                } else {
                    // Create new data if no backup exists
                    this.players = {};
                }
            } catch (backupError) {
                console.error("Failed to load backup:", backupError);
                this.players = {};
            }
            await this.saveData();
        }
    }

    async saveData() {
        const dir = path.dirname(this.dataPath);
        const tempPath = `${this.dataPath}.temp`;
        const backupPath = `${this.dataPath}.backup`;
        
        try {
            // Validate data before saving
            for (const userId in this.players) {
                const player = this.players[userId];
                if (!player.pokemons) player.pokemons = [];
                if (!player.inventory) player.inventory = {};
                
                if (player.pokemons) {
                    for (const pokemon of player.pokemons) {
                        if (typeof pokemon.exp === 'undefined') pokemon.exp = 0;
                        if (typeof pokemon.expNeeded === 'undefined') pokemon.expNeeded = 100;
                        if (typeof pokemon.level === 'undefined') pokemon.level = 1;
                        if (typeof pokemon.maxHp === 'undefined') pokemon.maxHp = pokemon.hp;
                    }
                }
            }

            // Create directory if it doesn't exist
            await fs.mkdir(dir, { recursive: true });

            // Create backup of current file if it exists
            if (await fs.access(this.dataPath).then(() => true).catch(() => false)) {
                await fs.copyFile(this.dataPath, backupPath);
            }

            // Write data directly to the main file
            await fs.writeFile(this.dataPath, JSON.stringify(this.players, null, 2));

        } catch (error) {
            console.error('Error saving Pokemon data:', error);
            // If save fails, try to restore from backup
            try {
                if (await fs.access(backupPath).then(() => true).catch(() => false)) {
                    await fs.copyFile(backupPath, this.dataPath);
                }
            } catch (restoreError) {
                console.error('Failed to restore from backup:', restoreError);
            }
            throw error;
        } finally {
            // Clean up temp file if it exists
            try {
                if (await fs.access(tempPath).then(() => true).catch(() => false)) {
                    await fs.unlink(tempPath);
                }
            } catch (cleanupError) {
                console.error('Failed to clean up temp file:', cleanupError);
            }
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

                const stats = {
                    hp: Math.floor(pokemon.stats[0].base_stat * 0.7),
                    attack: Math.floor(pokemon.stats[1].base_stat * 0.6),
                    defense: Math.floor(pokemon.stats[2].base_stat * 0.6)
                };

                const levelMultiplier = 1 + (level - 1) * 0.03;
                
                const weatherBoost = weather && 
                    WEATHER_EFFECTS[weather]?.types.some(t => 
                        pokemon.types.some(pt => pt.type.name === t)
                    ) ? 1.1 : 1;

                const rarityBonus = isShiny ? 1.1 : 1;

                Object.keys(stats).forEach(stat => {
                    stats[stat] = Math.floor(stats[stat] * levelMultiplier * weatherBoost * rarityBonus);
                });

                stats.hp = Math.min(stats.hp, 40 + level * 3);
                stats.attack = Math.min(stats.attack, 25 + level * 2);
                stats.defense = Math.min(stats.defense, 20 + level * 2);

                return {
                    id: pokemon.id,
                    name: pokemon.name,
                    level: level,
                    hp: stats.hp,
                    maxHp: stats.hp,
                    attack: stats.attack,
                    defense: stats.defense,
                    types: pokemon.types.map(t => t.type.name),
                    moves: pokemon.moves.slice(0, 4).map(m => m.move.name),
                    image: pokemon.sprites.other['official-artwork'].front_default,
                    shiny: isShiny,
                    weather: weather,
                    exp: 0,
                    expNeeded: 100,
                    evolutionStage: 0,
                    wins: 0,
                    battles: 0
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
        if (!this.players[userId]) {
            this.players[userId] = await this.initNewPlayer(userId);
        }

        const ball = this.POKEBALLS[ballType];
        if (!ball) return { error: "invalidBall" };

        if (!this.players[userId].inventory[ballType] || this.players[userId].inventory[ballType] <= 0) {
            return { 
                error: "noBall",
                ballType: ball.name,
                inventory: await this.getBallInventory(userId)
            };
        }

        const catchRate = this.calculateCatchRate(pokemonData, ball.catchRate);
        const caught = Math.random() < catchRate;

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

        await this.loadData();

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

            await this.loadData();
            
            const updatedP1 = this.players[player1Id];
            const updatedP2 = this.players[player2Id];
            const updatedPokemon1 = updatedP1.pokemons[updatedP1.activePokemon];
            const updatedPokemon2 = updatedP2.pokemons[updatedP2.activePokemon];

            const winner = battleResult.winner === pokemon1 ? player1Id : player2Id;
            
            if (winner === player1Id) {
                updatedP1.wins++;
                updatedPokemon1.wins++;
                
                if (typeof updatedPokemon1.exp === 'undefined') updatedPokemon1.exp = 0;
                if (typeof updatedPokemon1.expNeeded === 'undefined') updatedPokemon1.expNeeded = 100;
                if (typeof updatedPokemon2.exp === 'undefined') updatedPokemon2.exp = 0;
                if (typeof updatedPokemon2.expNeeded === 'undefined') updatedPokemon2.expNeeded = 100;
                
                updatedPokemon1.exp += battleResult.expGained.winner;
                updatedPokemon2.exp += battleResult.expGained.loser;
                
                await this.saveData();
                
                await this.checkLevelUp(player1Id, updatedP1.activePokemon);
                await this.checkLevelUp(player2Id, updatedP2.activePokemon);
            } else {
                updatedP2.wins++;
                updatedPokemon2.wins++;
                
                if (typeof updatedPokemon1.exp === 'undefined') updatedPokemon1.exp = 0;
                if (typeof updatedPokemon1.expNeeded === 'undefined') updatedPokemon1.expNeeded = 100;
                if (typeof updatedPokemon2.exp === 'undefined') updatedPokemon2.exp = 0;
                if (typeof updatedPokemon2.expNeeded === 'undefined') updatedPokemon2.expNeeded = 100;
                
                updatedPokemon2.exp += battleResult.expGained.winner;
                updatedPokemon1.exp += battleResult.expGained.loser;
                
                await this.saveData();
                
                await this.checkLevelUp(player1Id, updatedP1.activePokemon);
                await this.checkLevelUp(player2Id, updatedP2.activePokemon);
            }

            updatedP1.battles++;
            updatedP2.battles++;
            updatedPokemon1.battles++;
            updatedPokemon2.battles++;

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

    async checkEvolution(userId, pokemonIndex, checkFriendship = true) {
        const player = this.players[userId];
        const pokemon = player.pokemons[pokemonIndex];
        if (!pokemon) return null;

        const friendship = player.friendship?.[pokemonIndex] || 0;

        const evolutionData = {
            pichu: {
                condition: 'friendship',
                evolution: 'pikachu',
                friendshipRequired: 220,
                powerBoost: 1.3,
                power: 500,
                moveBonus: ['thunderbolt', 'quick-attack']
            },
     
            bulbasaur: { level: 16, evolution: 'ivysaur', power: 35, moveBonus: ['vine-whip', 'razor-leaf'] },
            ivysaur: { level: 32, evolution: 'venusaur', power: 45, moveBonus: ['solar-beam', 'petal-dance'] },
            charmander: { level: 16, evolution: 'charmeleon', power: 35, moveBonus: ['ember', 'flame-burst'] },
            charmeleon: { level: 36, evolution: 'charizard', power: 45, moveBonus: ['flamethrower', 'fire-blast'] },
            squirtle: { level: 16, evolution: 'wartortle', power: 35, moveBonus: ['water-gun', 'aqua-tail'] },
            wartortle: { level: 36, evolution: 'blastoise', power: 45, moveBonus: ['hydro-pump', 'skull-bash'] },

            caterpie: { level: 7, evolution: 'metapod', power: 25, moveBonus: ['harden'] },
            metapod: { level: 10, evolution: 'butterfree', power: 35, moveBonus: ['confusion', 'gust'] },
            weedle: { level: 7, evolution: 'kakuna', power: 25, moveBonus: ['poison-sting'] },
            kakuna: { level: 10, evolution: 'beedrill', power: 35, moveBonus: ['twineedle', 'fury-attack'] },

            pidgey: { level: 18, evolution: 'pidgeotto', power: 35, moveBonus: ['gust', 'wing-attack'] },
            pidgeotto: { level: 36, evolution: 'pidgeot', power: 45, moveBonus: ['hurricane', 'brave-bird'] },

            pikachu: { 
                evolution: 'raichu',
                condition: 'thunder-stone',
                powerBoost: 1.4,
                moveBonus: ['thunder', 'volt-tackle']
            },
            eevee: {
                evolutions: {
                    'vaporeon': { 
                        condition: 'water-stone',
                        powerBoost: 1.45, 
                        moveBonus: ['hydro-pump', 'aqua-ring'] 
                    },
                    'jolteon': { 
                        condition: 'thunder-stone',
                        powerBoost: 1.45, 
                        moveBonus: ['thunder', 'volt-switch'] 
                    },
                    'flareon': { 
                        condition: 'fire-stone',
                        powerBoost: 1.45, 
                        moveBonus: ['flare-blitz', 'fire-blast'] 
                    },
                    'espeon': { 
                        condition: 'friendship', 
                        timeOfDay: 'day', 
                        powerBoost: 1.45, 
                        moveBonus: ['psychic', 'future-sight'] 
                    },
                    'umbreon': { 
                        condition: 'friendship', 
                        timeOfDay: 'night', 
                        powerBoost: 1.45, 
                        moveBonus: ['dark-pulse', 'moonlight'] 
                    },
                    'leafeon': { 
                        condition: 'leaf-stone',
                        powerBoost: 1.45, 
                        moveBonus: ['leaf-blade', 'synthesis'] 
                    },
                    'glaceon': { 
                        condition: 'ice-stone',
                        powerBoost: 1.45, 
                        moveBonus: ['ice-beam', 'blizzard'] 
                    },
                    'sylveon': { 
                        condition: 'friendship', 
                        moveType: 'fairy', 
                        powerBoost: 1.45, 
                        moveBonus: ['moonblast', 'dazzling-gleam'] 
                    }
                }
            },
            magikarp: { 
                level: 20,
                evolution: 'gyarados', 
                powerBoost: 2.0,
                moveBonus: ['waterfall', 'dragon-rage', 'hyper-beam']
            },

            dratini: { level: 30, evolution: 'dragonair', power: 40, moveBonus: ['dragon-rage', 'aqua-tail'] },
            dragonair: { level: 55, evolution: 'dragonite', power: 55, moveBonus: ['dragon-dance', 'outrage'] },

            geodude: { level: 25, evolution: 'graveler', power: 35, moveBonus: ['rock-throw', 'magnitude'] },
            graveler: { 
                power: 850,
                evolution: 'golem',
                powerBoost: 1.4,
                moveBonus: ['earthquake', 'explosion'],
                condition: 'trade'
            },

            gastly: { level: 25, evolution: 'haunter', power: 35, moveBonus: ['shadow-ball', 'dark-pulse'] },
            haunter: {
                power: 850,
                evolution: 'gengar',
                powerBoost: 1.4,
                moveBonus: ['shadow-punch', 'dream-eater'],
                condition: 'trade'
            }
        };

        const pokemonData = evolutionData[pokemon.name.toLowerCase()];
        if (!pokemonData) return null;

        let canEvolve = false;
        let evolutionChoice = null;

        if (pokemon.name.toLowerCase() === 'eevee') {
          
            for (const [evoName, evoData] of Object.entries(pokemonData.evolutions)) {
                if (evoData.condition.endsWith('-stone')) {
                    
                    if (player.inventory[evoData.condition] > 0) {
                        canEvolve = true;
                        evolutionChoice = {
                            name: evoName,
                            data: evoData
                        };
                    
                        player.inventory[evoData.condition]--;
                        await this.saveData();
                        break;
                    }
                } else if (evoData.condition === 'friendship') {
                    // Friendship-based evolution
                    if (checkFriendship && friendship >= 220) {
                        const currentTime = this.getTimeOfDay();
                        if ((evoName === 'espeon' && currentTime === 'day') ||
                            (evoName === 'umbreon' && currentTime === 'night')) {
                            canEvolve = true;
                            evolutionChoice = {
                                name: evoName,
                                data: evoData
                            };
                            break;
                        }
                    }
                }
            }
        } else if (pokemonData.level && pokemon.level >= pokemonData.level) {
            canEvolve = true;
        } else if (pokemonData.condition && pokemonData.condition.endsWith('-stone')) {
            const stoneType = pokemonData.condition;
            if (player.inventory[stoneType] > 0) {
                canEvolve = true;
                player.inventory[stoneType]--;
                await this.saveData();
            }
        } else if (pokemonData.power) {
            const currentPower = this.calculatePower(pokemon);
            if (currentPower >= pokemonData.power) {
                if (pokemonData.condition === 'friendship') {
                    if (checkFriendship && friendship >= (pokemonData.friendshipRequired || 220)) {
                        canEvolve = true;
                    }
                } else {
                    canEvolve = true;
                }
            }
        }

        if (!canEvolve) return null;

        try {
            let evolutionName, evolutionData;
            if (evolutionChoice) {
                // Handle Eevee's evolution
                evolutionName = evolutionChoice.name;
                evolutionData = evolutionChoice.data;
            } else {
                // Handle normal evolution
                evolutionName = pokemonData.evolution;
                evolutionData = pokemonData;
            }

            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${evolutionName}`);
            const evolutionPokemon = response.data;

            const statMultiplier = evolutionData.powerBoost || (1 + (pokemonData.power || 0) / 100);

            const newPokemon = {
                ...pokemon,
                name: pokemonData.evolution,
                hp: Math.floor(pokemon.hp * statMultiplier),
                maxHp: Math.floor(pokemon.maxHp * statMultiplier),
                attack: Math.floor(pokemon.attack * statMultiplier),
                defense: Math.floor(pokemon.defense * statMultiplier),
                image: evolutionPokemon.sprites.other['official-artwork'].front_default,
                evolutionDate: Date.now(),
                evolutionStage: (pokemon.evolutionStage || 0) + 1,
                moves: [
                    ...pokemon.moves,
                    ...(pokemonData.moveBonus || [])
                ].slice(0, 4)
            };

            if (pokemonData.condition === 'friendship') {
                newPokemon.friendship = 0;
            }

            if (pokemonData.condition && pokemonData.condition.endsWith('-stone')) {
                delete newPokemon.heldItem;
            }

            this.players[userId].pokemons[pokemonIndex] = newPokemon;
            await this.saveData();

            return {
                oldPokemon: pokemon,
                newPokemon: newPokemon,
                powerIncrease: Math.floor((this.calculatePower(newPokemon) - this.calculatePower(pokemon)) * 10) / 10
            };

        } catch (error) {
            console.error("Evolution error:", error);
            return null;
        }
    }

    async checkLevelUp(userId, pokemonIndex, api = null, threadID = null) {
        await this.loadData();
        
        const player = this.players[userId];
        if (!player) return false;
        
        const pokemon = player.pokemons[pokemonIndex];
        if (!pokemon) return false;
        
        if (typeof pokemon.exp === 'undefined') pokemon.exp = 0;
        if (typeof pokemon.expNeeded === 'undefined') pokemon.expNeeded = 100;
        if (typeof pokemon.level === 'undefined') pokemon.level = 1;
        
        let leveledUp = false;
        let changes = false;
        let startLevel = pokemon.level;
        let startStats = {
            hp: pokemon.hp,
            maxHp: pokemon.maxHp,
            attack: pokemon.attack,
            defense: pokemon.defense
        };
        
        while (pokemon.exp >= pokemon.expNeeded) {
            pokemon.level++;
            pokemon.exp = pokemon.exp - pokemon.expNeeded;
            pokemon.expNeeded = Math.floor(pokemon.expNeeded * 1.5);
            pokemon.hp = Math.floor(pokemon.hp * 1.1);
            pokemon.maxHp = Math.floor(pokemon.maxHp * 1.1);
            pokemon.attack = Math.floor(pokemon.attack * 1.1);
            pokemon.defense = Math.floor(pokemon.defense * 1.1);
            leveledUp = true;
            changes = true;
        }
        
        if (changes) {
            await this.saveData();
            
            const evolution = await this.checkEvolution(userId, pokemonIndex);
            if (evolution && evolution !== true) {
                return evolution;
            }
         
        }
        
        return leveledUp;
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
        await this.loadData();
        
        const player = this.players[userId];
        if (!player || !player.pokemons || !player.pokemons[player.activePokemon]) return null;
        
        const pokemon = player.pokemons[player.activePokemon];
        
        if (typeof pokemon.exp === 'undefined') pokemon.exp = 0;
        if (typeof pokemon.expNeeded === 'undefined') pokemon.expNeeded = 100;
        if (typeof pokemon.level === 'undefined') pokemon.level = 1;
        
        await this.saveData();
        
        return pokemon;
    }

    async getPlayerStats(userId) {
        await this.loadData();
        
        const player = this.players[userId];
        if (!player) return null;

        if (player.pokemons) {
            for (const pokemon of player.pokemons) {
                if (typeof pokemon.exp === 'undefined') pokemon.exp = 0;
                if (typeof pokemon.expNeeded === 'undefined') pokemon.expNeeded = 100;
                if (typeof pokemon.level === 'undefined') pokemon.level = 1;
            }
            await this.saveData();
        }

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
                safariball: 0,
                'fire-stone': 0,
                'water-stone': 0,
                'thunder-stone': 0,
                'leaf-stone': 0,
                'ice-stone': 0,
                'moon-stone': 0,
                'sun-stone': 0,
                'shiny-stone': 0,
                'dusk-stone': 0,
                'dawn-stone': 0,
                'oval-stone': 0
            },
            lastCatch: null,
            friendship: {}
        };
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            return 'day';
        } else {
            return 'night';
        }
    }

    async updateFriendship(userId, pokemonIndex, amount) {
        const player = this.players[userId];
        if (!player || !player.pokemons[pokemonIndex]) return;

        if (!player.friendship) player.friendship = {};
        if (!player.friendship[pokemonIndex]) player.friendship[pokemonIndex] = 0;

        player.friendship[pokemonIndex] = Math.min(255, player.friendship[pokemonIndex] + amount);
        await this.saveData();
        
        return player.friendship[pokemonIndex];
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
