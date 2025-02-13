class PvPSystem {
    constructor() {
        this.RECOVERY_TIME = 30000; 
        this.MIN_HP_PERCENT = 20;
        
        this.typeEffectiveness = {
            fire: { water: 0.5, grass: 2, ice: 2, steel: 2 },
            water: { fire: 2, grass: 0.5, ground: 2, rock: 2 },
            grass: { fire: 0.5, water: 2, flying: 0.5, poison: 0.5, bug: 0.5 },
            electric: { water: 2, ground: 0, flying: 2 },
            ice: { fire: 0.5, grass: 2, flying: 2, ground: 2, dragon: 2 },
            fighting: { normal: 2, ice: 2, dark: 2, steel: 2 },
            poison: { grass: 2, ground: 0.5, psychic: 0.5 },
            ground: { electric: 2, poison: 2, rock: 2, fire: 2 },
            flying: { grass: 2, fighting: 2, ground: 0, electric: 0.5 },
            psychic: { fighting: 2, poison: 2, dark: 0 },
            bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5 },
            rock: { fire: 2, ice: 2, flying: 2, bug: 2 },
            ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
            dragon: { dragon: 2, ice: 0.5, fairy: 0 },
            dark: { psychic: 2, ghost: 2, fighting: 0.5, fairy: 0.5 },
            steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5 },
            fairy: { fighting: 2, dragon: 2, dark: 2, poison: 0.5, steel: 0.5 }
        };

        this.BASE_DAMAGE = 8; 
        this.MAX_DAMAGE_MULTIPLIER = 1.4;
        this.MIN_DAMAGE = 5;
        this.AI_DECISION_WEIGHTS = {
            AGGRESSIVE: 0.7,
            DEFENSIVE: 0.3
        };
    }

    calculateDamage(attacker, defender) {
        const STAB_BONUS = 1.3;
        const CRITICAL_CHANCE = 0.08;
        const CRITICAL_MULTIPLIER = 1.3;
        
        let power = (attacker.attack / (defender.defense * 1.2)) * this.BASE_DAMAGE;
        
        power = Math.min(power, attacker.attack * this.MAX_DAMAGE_MULTIPLIER);
        power = Math.max(power, this.MIN_DAMAGE);
        
        let typeMultiplier = 1;
        attacker.types.forEach(attackerType => {
            defender.types.forEach(defenderType => {
                if (this.typeEffectiveness[attackerType]?.[defenderType]) {
                    typeMultiplier *= this.typeEffectiveness[attackerType][defenderType];
                }
            });
        });

        if (attacker.types.includes(attacker.types[0])) {
            power *= STAB_BONUS;
        }

        if (Math.random() < CRITICAL_CHANCE) {
            power *= CRITICAL_MULTIPLIER;
        }

        power *= typeMultiplier;
        power *= (0.95 + Math.random() * 0.1); 

        return Math.floor(power);
    }

    async battle(pokemon1, pokemon2) {
        if (!pokemon1 || !pokemon2) return null;

        if (pokemon1.hp === 0 || pokemon2.hp === 0) {
            return {
                error: pokemon1.hp === 0 ? "recovery1" : "recovery2",
                timeLeft: pokemon1.hp === 0 ? this.getRecoveryTimeLeft(pokemon1) : this.getRecoveryTimeLeft(pokemon2)
            };
        }

        if (this.needsRecovery(pokemon1)) {
            return { error: "recovery1", timeLeft: this.getRecoveryTimeLeft(pokemon1) };
        }

        if (this.needsRecovery(pokemon2)) {
            return { error: "recovery2", timeLeft: this.getRecoveryTimeLeft(pokemon2) };
        }

        let p1HP = pokemon1.hp;
        let p2HP = pokemon2.hp;
        const battleLog = [];
        const expGain = Math.floor(Math.random() * 30) + 20;

        while (p1HP > 0 && p2HP > 0) {
            const dmg1 = this.calculateDamage(pokemon1, pokemon2);
            p2HP -= dmg1;
            const effectiveness1 = this.getTypeEffectiveness(pokemon1.types[0], pokemon2.types);
            battleLog.push(`${pokemon1.name} gây ${dmg1} sát thương cho ${pokemon2.name} (${this.getEffectivenessText(effectiveness1)})`);

            if (p2HP <= 0) break;

            const dmg2 = this.calculateDamage(pokemon2, pokemon1);
            p1HP -= dmg2;
            const effectiveness2 = this.getTypeEffectiveness(pokemon2.types[0], pokemon1.types);
            battleLog.push(`${pokemon2.name} gây ${dmg2} sát thương cho ${pokemon1.name} (${this.getEffectivenessText(effectiveness2)})`);
        }

        return {
            winner: p1HP > 0 ? pokemon1 : pokemon2,
            loser: p1HP > 0 ? pokemon2 : pokemon1,
            finalHP: {
                pokemon1: Math.max(0, p1HP),
                pokemon2: Math.max(0, p2HP)
            },
            log: battleLog,
            expGained: expGain
        };
    }

    async pve(playerPokemon, wildPokemon) {
        if (!playerPokemon || !wildPokemon) return null;

        if (playerPokemon.hp === 0) {
            return { error: "recovery", timeLeft: this.getRecoveryTimeLeft(playerPokemon) };
        }

        let p1HP = playerPokemon.hp;
        let p2HP = wildPokemon.hp;
        const battleLog = [];
        const expGain = Math.floor(Math.random() * 40) + 30; // More EXP for PVE

        while (p1HP > 0 && p2HP > 0) {
            // Player turn
            const dmg1 = this.calculateDamage(playerPokemon, wildPokemon);
            p2HP -= dmg1;
            const effectiveness1 = this.getTypeEffectiveness(playerPokemon.types[0], wildPokemon.types);
            battleLog.push(`${playerPokemon.name} gây ${dmg1} sát thương cho ${wildPokemon.name} (${this.getEffectivenessText(effectiveness1)})`);

            if (p2HP <= 0) break;

            // Wild Pokemon turn with AI
            const aiDamageMultiplier = this.getAIDecision(p2HP / wildPokemon.hp);
            const dmg2 = Math.floor(this.calculateDamage(wildPokemon, playerPokemon) * aiDamageMultiplier);
            p1HP -= dmg2;
            const effectiveness2 = this.getTypeEffectiveness(wildPokemon.types[0], playerPokemon.types);
            battleLog.push(`${wildPokemon.name} gây ${dmg2} sát thương cho ${playerPokemon.name} (${this.getEffectivenessText(effectiveness2)})`);
        }

        return {
            winner: p1HP > 0 ? playerPokemon : wildPokemon,
            loser: p1HP > 0 ? wildPokemon : playerPokemon,
            finalHP: {
                player: Math.max(0, p1HP),
                wild: Math.max(0, p2HP)
            },
            log: battleLog,
            expGained: expGain,
            rewardCoins: Math.floor(Math.random() * 20000) + 10000
        };
    }

    getAIDecision(hpPercentage) {
        if (hpPercentage < 0.3) {
            return 1.2;
        } else if (hpPercentage < 0.5) {

            return this.AI_DECISION_WEIGHTS.AGGRESSIVE;
        }
        return 1.0;
    }

    getTypeEffectiveness(attackType, defenderTypes) {
        let effectiveness = 1;
        defenderTypes.forEach(defType => {
            if (this.typeEffectiveness[attackType]?.[defType]) {
                effectiveness *= this.typeEffectiveness[attackType][defType];
            }
        });
        return effectiveness;
    }

    getEffectivenessText(effectiveness) {
        if (effectiveness > 1) return "Rất hiệu quả!";
        if (effectiveness < 1) return "Không hiệu quả lắm...";
        return "Hiệu quả bình thường";
    }

    needsRecovery(pokemon) {
        if (!pokemon.maxHp) pokemon.maxHp = pokemon.hp;
        if (pokemon.hp < 0) pokemon.hp = 0;

        if (pokemon.recoveryStart) {
            const now = Date.now();
            const timeLeft = (pokemon.recoveryStart + this.RECOVERY_TIME) - now;
            
            if (timeLeft <= 0) {
                pokemon.hp = pokemon.maxHp;
                pokemon.recoveryStart = null;
                return false;
            }
            return true;
        }

        const hpPercent = (pokemon.hp / pokemon.maxHp) * 100;
        if (hpPercent < this.MIN_HP_PERCENT || pokemon.hp === 0) {
            pokemon.recoveryStart = Date.now();
            return true;
        }

        return false;
    }

    getRecoveryTimeLeft(pokemon) {
        if (!pokemon.recoveryStart) return 0;
        
        const now = Date.now();
        const endTime = pokemon.recoveryStart + this.RECOVERY_TIME;
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) {
            pokemon.recoveryStart = null;
            pokemon.hp = pokemon.maxHp;
            return 0;
        }
        
        return timeLeft;
    }
}

module.exports = new PvPSystem();
