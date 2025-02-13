const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const pvpSystem = require('./pvpSystem');
const bagSystem = require('./bagSystem');
const battleManager = require('./battleManager');

class PokemonSystem {
    constructor() {
        this.dataPath = path.join(__dirname, '..', 'commands', 'json', 'pokemon', 'pokemon.json');
        this.players = {};
        this.loaded = false;
        this.RECOVERY_TIME = 30000; 
        this.MIN_HP_PERCENT = 30;
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
            this.players = {};
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

    async catch(userId) {
        const randomId = Math.floor(Math.random() * 898) + 1;
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const pokemon = response.data;

        const newPokemon = {
            id: pokemon.id,
            name: pokemon.name,
            level: Math.floor(Math.random() * 10) + 1,
            exp: 0,
            expNeeded: 100,
            hp: Math.floor((pokemon.stats[0].base_stat * (Math.random() * 0.3 + 0.85))),
            maxHp: Math.floor((pokemon.stats[0].base_stat * (Math.random() * 0.3 + 0.85))),
            attack: Math.floor((pokemon.stats[1].base_stat * (Math.random() * 0.3 + 0.85))),
            defense: Math.floor((pokemon.stats[2].base_stat * (Math.random() * 0.3 + 0.85))),
            types: pokemon.types.map(t => t.type.name),
            moves: pokemon.moves.slice(0, 4).map(m => m.move.name),
            image: pokemon.sprites.other['official-artwork'].front_default,
            shiny: Math.random() < 0.02, 
            catchDate: Date.now(),
            wins: 0,
            battles: 0
        };
        
        newPokemon.hp = newPokemon.maxHp; 

        if (!this.players[userId]) {
            this.players[userId] = {
                pokemons: [],
                activePokemon: 0,
                battles: 0,
                wins: 0,
                lastCatch: Date.now(),
                inventory: {
                    pokeballs: 10,
                    potions: 5,
                    revives: 2
                }
            };
        }

        this.players[userId].pokemons.push(newPokemon);
        await this.saveData();
        return newPokemon;
    }

    async battle(player1Id, player2Id, threadID) {
        if (battleManager.isActiveBattle(threadID)) {
            return { error: "activeBattle" };
        }

        const p1 = this.players[player1Id];
        const p2 = this.players[player2Id];

        if (!p1 || !p2) return null;

        const pokemon1 = p1.pokemons[p1.activePokemon];
        const pokemon2 = p2.pokemons[p2.activePokemon];

        if (!pokemon1 || !pokemon2) return null;

        if (pokemon1.hp === 0 || pvpSystem.needsRecovery(pokemon1)) {
            const recoveryTime = pokemon1.recoveryStart ? 
                pvpSystem.getRecoveryTimeLeft(pokemon1) : this.RECOVERY_TIME;
            return {
                error: "recovery1",
                timeLeft: recoveryTime,
                message: "Pokemon của bạn đã kiệt sức và cần hồi phục!"
            };
        }

        if (pokemon2.hp === 0 || pvpSystem.needsRecovery(pokemon2)) {
            const recoveryTime = pokemon2.recoveryStart ? 
                pvpSystem.getRecoveryTimeLeft(pokemon2) : this.RECOVERY_TIME;
            return {
                error: "recovery2",
                timeLeft: recoveryTime,
                message: "Pokemon đối thủ đã kiệt sức và cần hồi phục!"
            };
        }

        battleManager.startBattle(threadID);

        const battleResult = await pvpSystem.battle(pokemon1, pokemon2);
        
        battleManager.endBattle(threadID);
        
        if (battleResult?.error) {
            await this.saveData(); 
            return battleResult;
        }

        pokemon1.hp = Math.max(0, battleResult.finalHP.pokemon1);
        pokemon2.hp = Math.max(0, battleResult.finalHP.pokemon2);
        
        if (pokemon1.hp === 0) {
            pokemon1.recoveryStart = Date.now();
        }
        if (pokemon2.hp === 0) {
            pokemon2.recoveryStart = Date.now();
        }
        await this.saveData();

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
                remainingHp: battleResult.winner === pokemon1 ? pokemon1.hp : pokemon2.hp
            },
            loser: {
                name: battleResult.loser.name,
                remainingHp: battleResult.loser === pokemon1 ? pokemon2.hp : pokemon1.hp
            },
            log: battleResult.log,
            expGained: battleResult.expGained
        };
    }

    async checkLevelUp(userId, pokemonIndex) {
        const pokemon = this.players[userId].pokemons[pokemonIndex];
        if (pokemon.exp >= pokemon.expNeeded) {
            pokemon.level++;
            pokemon.exp -= pokemon.expNeeded;
            pokemon.expNeeded = Math.floor(pokemon.expNeeded * 1.5);
            pokemon.hp = Math.floor(pokemon.hp * 1.1);
            pokemon.attack = Math.floor(pokemon.attack * 1.1);
            pokemon.defense = Math.floor(pokemon.defense * 1.1);
            return true;
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
        
        await this.updatePokemonStatus(userId, player.activePokemon);
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

    async startRecovery(userId, pokemonIndex) {
        const pokemon = this.players[userId].pokemons[pokemonIndex];
        if (!pokemon) return false;

        if (!pokemon.maxHp) pokemon.maxHp = pokemon.hp;
        pokemon.recoveryStart = Date.now();
        
        await this.saveData();
        return true;
    }

    async checkAndHealPokemon(userId, pokemonIndex) {
        const pokemon = this.players[userId].pokemons[pokemonIndex];
        if (!pokemon || !pokemon.recoveryStart) return false;

        const timeLeft = pvpSystem.getRecoveryTimeLeft(pokemon);
        if (timeLeft <= 0) {
            if (!pokemon.maxHp) pokemon.maxHp = pokemon.hp;
            pokemon.hp = pokemon.maxHp;
            pokemon.recoveryStart = null;
            await this.saveData(); 
            return true;
        }
        return false;
    }

    async updatePokemonStatus(userId, pokemonIndex) {
        const pokemon = this.players[userId].pokemons[pokemonIndex];
        if (!pokemon) return;

        if (pokemon.recoveryStart) {
            const now = Date.now();
            const timeLeft = (pokemon.recoveryStart + this.RECOVERY_TIME) - now;
            
            if (timeLeft <= 0) {
                pokemon.hp = pokemon.maxHp;
                pokemon.recoveryStart = null;
                await this.saveData();
            }
        }
    }
}

module.exports = new PokemonSystem();
