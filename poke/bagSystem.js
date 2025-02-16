  const MAX_POWER = 1000;

class BagSystem {
    constructor() {
        this.TYPE_EMOJIS = {
            normal: "⚪",
            fire: "🔥",
            water: "💧",
            grass: "🌿",
            electric: "⚡",
            ice: "❄️",
            fighting: "👊",
            poison: "☠️",
            ground: "🌍",
            flying: "🦅",
            psychic: "🔮",
            bug: "🐛",
            rock: "🪨",
            ghost: "👻",
            dragon: "🐲",
            dark: "🌑",
            steel: "⚔️",
            fairy: "🎀"
        };

        this.TYPE_NAMES = {
            normal: "Thường",
            fire: "Lửa",
            water: "Nước", 
            grass: "Cỏ",
            electric: "Điện",
            ice: "Băng",
            fighting: "Chiến đấu",
            poison: "Độc",
            ground: "Đất",
            flying: "Bay",
            psychic: "Tâm linh",
            bug: "Bọ",
            rock: "Đá",
            ghost: "Ma",
            dragon: "Rồng",
            dark: "Bóng tối",
            steel: "Thép",
            fairy: "Tiên"
        };
    }

    async getBag(players, userId, page = 1, itemsPerPage = 5) {
        const player = players[userId];
        if (!player || !player.pokemons?.length) return null;

        const totalPages = Math.ceil(player.pokemons.length / itemsPerPage);
        page = Math.min(Math.max(1, page), totalPages);
        
        const startIndex = (page - 1) * itemsPerPage;
        const pokemons = player.pokemons.slice(startIndex, startIndex + itemsPerPage);

        return {
            pokemons,
            player,
            pagination: {
                current: page,
                total: totalPages,
                start: startIndex,
                totalItems: player.pokemons.length
            }
        };
    }

    async search(players, userId, searchTerm) {
        const player = players[userId];
        if (!player || !player.pokemons?.length) return null;

        searchTerm = searchTerm.toLowerCase();
        return player.pokemons.filter(p => 
            p.name.toLowerCase().includes(searchTerm)
        );
    }

    async sort(players, userId, sortType) {
        const player = players[userId];
        if (!player || !player.pokemons?.length) return false;

        switch(sortType?.toLowerCase()) {
            case "power":
                player.pokemons.sort((a, b) => this.calculatePower(b) - this.calculatePower(a));
                break;
            case "level":
                player.pokemons.sort((a, b) => b.level - a.level);
                break;
            case "name":
                player.pokemons.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                return false;
        }
        return true;
    }

    calculatePower(pokemon) {
        if (!pokemon) return 0;

        const baseStats = (
            (pokemon.hp * 0.8) + 
            (pokemon.attack * 1.2) + 
            (pokemon.defense * 1.0)
        ) / 3;

        const levelBonus = Math.pow(pokemon.level, 1.2) * 8;

        const evolutionBonus = (pokemon.evolutionStage || 0) * 50;

        const shinyBonus = pokemon.shiny ? 100 : 0;

        const typeBonus = (pokemon.types?.length || 1) * 25;

        // Wins bonus - reward battle experience
        const winsBonus = (pokemon.wins || 0) * 5;

        let power = Math.floor(
            baseStats + 
            levelBonus + 
            evolutionBonus + 
            shinyBonus + 
            typeBonus + 
            winsBonus
        );

        power = Math.min(Math.max(0, power), MAX_POWER);

        return power;
    }

    getPowerBar(power) {
        const barLength = 10;
        const filledLength = Math.floor((power / MAX_POWER) * barLength);
        const emptyLength = barLength - filledLength;
        
        const safeFilledLength = Math.max(0, filledLength);
        const safeEmptyLength = Math.max(0, emptyLength);
        
        return "█".repeat(safeFilledLength) + "░".repeat(safeEmptyLength);
    }

    getTypeEmoji(type) {
        return this.TYPE_EMOJIS[type] || "❓";
    }

    getTypeName(type) {
        return this.TYPE_NAMES[type] || "Không xác định";
    }
}

module.exports = new BagSystem();
