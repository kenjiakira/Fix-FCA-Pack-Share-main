class BagSystem {
    constructor() {
        this.typeEmojis = {
            normal: "⚪️", fire: "🔥", water: "💧", electric: "⚡️",
            grass: "🌿", ice: "❄️", fighting: "👊", poison: "☠️",
            ground: "🌍", flying: "🦅", psychic: "🔮", bug: "🪲",
            rock: "🪨", ghost: "👻", dragon: "🐉", dark: "🌑",
            steel: "⚔️", fairy: "🧚"
        };

        this.typeNames = {
            normal: "Thường", fire: "Lửa", water: "Nước", electric: "Điện",
            grass: "Cỏ", ice: "Băng", fighting: "Chiến đấu", poison: "Độc",
            ground: "Đất", flying: "Bay", psychic: "Siêu linh", bug: "Côn trùng",
            rock: "Đá", ghost: "Ma", dragon: "Rồng", dark: "Bóng tối",
            steel: "Thép", fairy: "Tiên"
        };
    }

    async getBag(players, userId, page = 1, itemsPerPage = 5) {
        const player = players[userId];
        if (!player || player.pokemons.length === 0) return null;

        const totalPages = Math.ceil(player.pokemons.length / itemsPerPage);
        if (page < 1 || page > totalPages) return null;

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const displayedPokemons = player.pokemons.slice(start, end);

        return {
            pokemons: displayedPokemons,
            pagination: {
                current: page,
                total: totalPages,
                start: start,
                totalItems: player.pokemons.length
            },
            player: player
        };
    }

    async search(players, userId, searchTerm) {
        const player = players[userId];
        if (!player) return null;

        return player.pokemons.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    async sort(players, userId, sortType) {
        const player = players[userId];
        if (!player) return false;

        switch (sortType.toLowerCase()) {
            case "power":
                player.pokemons.sort((a, b) => 
                    (b.hp + b.attack + b.defense) - (a.hp + a.attack + a.defense)
                );
                break;
            case "level":
                player.pokemons.sort((a, b) => b.level - a.level);
                break;
            case "name":
                player.pokemons.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "wins":
                player.pokemons.sort((a, b) => b.wins - a.wins);
                break;
            case "date":
                player.pokemons.sort((a, b) => b.catchDate - a.catchDate);
                break;
            default:
                return false;
        }
        return true;
    }

    getTypeEmoji(type) {
        return this.typeEmojis[type] || '❓';
    }

    calculatePower(pokemon) {
        return Math.floor((pokemon.hp + pokemon.attack + pokemon.defense) / 3);
    }

    getPowerBar(power) {
        return "▰".repeat(Math.floor(power/20)) + "▱".repeat(5-Math.floor(power/20));
    }

    getTypeName(type) {
        return this.typeNames[type] || type;
    }
}

module.exports = new BagSystem();
