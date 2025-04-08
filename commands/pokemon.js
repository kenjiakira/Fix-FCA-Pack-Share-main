const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports = {
    name: "pokemon",
    aliases: ["catchpokemon", "pokemongo"],
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    info: "Trò chơi bắt Pokemon với dữ liệu chính xác từ PokeAPI",
    usedby: 0,
    usages: "Sử dụng: start để bắt đầu trò chơi, catch để bắt pokemon",
    cooldowns: 10,

    activeGames: new Map(),
    
    pokemonCache: new Map(),
    typeColors: {
        normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', 
        electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6', 
        fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', 
        flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A', 
        rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', 
        dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD'
    },

    fontPath: path.join(__dirname, '../fonts/BeVietnamPro-Bold.ttf'),
    pokemonFontPath: path.join(__dirname, '../fonts/Pokemon-Solid.ttf'),
    
    playerDataPath: path.join(__dirname, '../database/pokemon_players'),
    
    // Cấu hình
    catchDifficulty: {
        common: 0.8,    // 80% tỷ lệ bắt thành công
        uncommon: 0.6,  // 60%
        rare: 0.4,      // 40%
        epic: 0.25,     // 25%
        legendary: 0.1  // 10%
    },
    
    rarityByBaseStats: {
        // Tổng chỉ số cơ bản xác định độ hiếm
        common: 320,    // Dưới 320 là common
        uncommon: 420,  // 320-420 là uncommon
        rare: 500,      // 420-500 là rare
        epic: 600       // 500-600 là epic, trên 600 là legendary
    },

    // Hàm khởi tạo
    onLoad: function() {
        try {
            // Đăng ký font
            if (fs.existsSync(this.fontPath)) {
                registerFont(this.fontPath, { family: 'BeVietnamPro' });
                console.log("✓ Đã đăng ký font BeVietnamPro thành công cho Pokemon game");
            } else {
                console.log("✗ Không tìm thấy font BeVietnamPro. Sử dụng font mặc định.");
            }
            
            // Đăng ký font Pokemon
            if (fs.existsSync(this.pokemonFontPath)) {
                registerFont(this.pokemonFontPath, { family: 'PokemonSolid' });
                console.log("✓ Đã đăng ký font Pokemon Solid thành công cho Pokemon game");
            } else {
                console.log("✗ Không tìm thấy font Pokemon Solid. Sử dụng font mặc định.");
            }
            
            // Tạo thư mục lưu dữ liệu người chơi nếu không tồn tại
            if (!fs.existsSync(this.playerDataPath)) {
                fs.mkdirSync(this.playerDataPath, { recursive: true });
                console.log("✓ Đã tạo thư mục lưu dữ liệu Pokemon");
            }
            
            // Tạo thư mục cache
            this.ensureCacheDir();
            
            // Xóa các game đang chạy khi tải lại module
            for (const [threadID, game] of this.activeGames) {
                if (game.inactivityInterval) {
                    clearTimeout(game.inactivityInterval);
                }
            }
            this.activeGames.clear();
        } catch (error) {
            console.error("Lỗi khi khởi tạo Pokemon game:", error);
        }
    },
    
    // Tạo thư mục cache nếu không tồn tại
    async ensureCacheDir() {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    },
    
    // Lấy random Pokemon từ PokeAPI
    async getRandomPokemon() {
        try {
            // Giới hạn ở 898 Pokemon của 8 thế hệ chính (không bao gồm các forms đặc biệt)
            const maxPokemonId = 898;
            const randomId = Math.floor(Math.random() * maxPokemonId) + 1;
            
            // Kiểm tra cache trước khi gọi API
            if (this.pokemonCache.has(randomId)) {
                return this.pokemonCache.get(randomId);
            }
            
            // Gọi API để lấy thông tin Pokemon
            const pokemonResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            const speciesResponse = await axios.get(pokemonResponse.data.species.url);
            
            // Lấy mô tả tiếng Anh
            const englishDescription = speciesResponse.data.flavor_text_entries.find(
                entry => entry.language.name === 'en'
            )?.flavor_text.replace(/\f/g, ' ') || "No description available";
            
            // Tính tổng chỉ số cơ bản
            const baseStats = pokemonResponse.data.stats.reduce((total, stat) => total + stat.base_stat, 0);
            
            // Xác định độ hiếm dựa trên tổng chỉ số
            let rarity;
            if (baseStats < this.rarityByBaseStats.common) rarity = 'common';
            else if (baseStats < this.rarityByBaseStats.uncommon) rarity = 'uncommon';
            else if (baseStats < this.rarityByBaseStats.rare) rarity = 'rare';
            else if (baseStats < this.rarityByBaseStats.epic) rarity = 'epic';
            else rarity = 'legendary';
            
            // Xác định giá trị Pokemon dựa trên độ hiếm
            let value;
            switch (rarity) {
                case 'common': value = Math.floor(Math.random() * 100) + 100; break;      // 100-199
                case 'uncommon': value = Math.floor(Math.random() * 200) + 200; break;    // 200-399
                case 'rare': value = Math.floor(Math.random() * 300) + 400; break;        // 400-699
                case 'epic': value = Math.floor(Math.random() * 500) + 700; break;        // 700-1199
                case 'legendary': value = Math.floor(Math.random() * 1000) + 1200; break; // 1200-2199
                default: value = 100;
            }
            
            // Tạo đối tượng Pokemon
            const pokemon = {
                id: pokemonResponse.data.id,
                name: pokemonResponse.data.name,
                height: pokemonResponse.data.height / 10, // Chuyển đổi sang mét
                weight: pokemonResponse.data.weight / 10, // Chuyển đổi sang kg
                types: pokemonResponse.data.types.map(type => type.type.name),
                abilities: pokemonResponse.data.abilities.map(ability => ability.ability.name.replace('-', ' ')),
                stats: {
                    hp: pokemonResponse.data.stats[0].base_stat,
                    attack: pokemonResponse.data.stats[1].base_stat,
                    defense: pokemonResponse.data.stats[2].base_stat,
                    specialAttack: pokemonResponse.data.stats[3].base_stat,
                    specialDefense: pokemonResponse.data.stats[4].base_stat,
                    speed: pokemonResponse.data.stats[5].base_stat,
                    total: baseStats
                },
                sprites: {
                    front: pokemonResponse.data.sprites.front_default,
                    back: pokemonResponse.data.sprites.back_default,
                    official: pokemonResponse.data.sprites.other['official-artwork'].front_default
                },
                description: englishDescription,
                rarity: rarity,
                value: value,
                catchRate: this.catchDifficulty[rarity] || 0.5
            };
            
            // Lưu vào cache
            this.pokemonCache.set(randomId, pokemon);
            
            return pokemon;
        } catch (error) {
            console.error(`Lỗi khi lấy thông tin Pokemon: ${error.message}`);
            // Nếu lỗi, thử lại với ID khác
            return this.getRandomPokemon();
        }
    },
    
    // Lấy dữ liệu người chơi
    getPlayerData(userId) {
        const filePath = path.join(this.playerDataPath, `${userId}.json`);
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (error) {
            console.error(`Lỗi khi đọc dữ liệu người chơi ${userId}:`, error);
        }

        const newPlayerData = {
            userId,
            pokemons: [],
            coins: 1000,
            lastCatch: 0,
            stats: {
                catches: 0,
                fails: 0,
                totalValue: 0
            }
        };
        
        try {
            fs.writeFileSync(filePath, JSON.stringify(newPlayerData, null, 2));
        } catch (error) {
            console.error(`Lỗi khi tạo dữ liệu người chơi mới ${userId}:`, error);
        }
        
        return newPlayerData;
    },
    
    savePlayerData(userId, data) {
        const filePath = path.join(this.playerDataPath, `${userId}.json`);
        try {
            if (!fs.existsSync(this.playerDataPath)) {
                fs.mkdirSync(this.playerDataPath, { recursive: true });
            }
            
            // Đảm bảo dữ liệu hợp lệ trước khi lưu
            if (!data.userId) data.userId = userId;
            if (!data.pokemons) data.pokemons = [];
            if (!data.stats) {
                data.stats = {
                    catches: 0,
                    fails: 0,
                    totalValue: 0
                };
            }
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Lỗi khi lưu dữ liệu người chơi ${userId}:`, error);
            return false;
        }
    },
    
    // Tạo hình ảnh Pokemon spawn
    async createPokemonImage(pokemon, isWild = true) {
        await this.ensureCacheDir();
        
        const width = 800;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Vẽ nền
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#43cea2');
        gradient.addColorStop(1, '#185a9d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Vẽ khung thông tin
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, 150);
        ctx.fillRect(0, height - 150, width, 150);
        
        // Tải và vẽ hình Pokemon
        try {
            const pokemonImage = await loadImage(pokemon.sprites.official || pokemon.sprites.front);
            
            // Vẽ với hiệu ứng mờ nếu là Pokemon hoang dã
            if (isWild) {
                ctx.globalAlpha = 0.7;
                const silhouetteSize = Math.min(width, height - 300) * 0.9;
                ctx.drawImage(
                    pokemonImage, 
                    (width - silhouetteSize) / 2, 
                    ((height - 300) - silhouetteSize) / 2 + 150, 
                    silhouetteSize, 
                    silhouetteSize
                );
                ctx.globalAlpha = 1.0;
            } else {
                const imageSize = Math.min(width, height - 300) * 0.9;
                ctx.drawImage(
                    pokemonImage, 
                    (width - imageSize) / 2, 
                    ((height - 300) - imageSize) / 2 + 150, 
                    imageSize, 
                    imageSize
                );
            }
        } catch (error) {
            console.error("Lỗi khi tải hình ảnh Pokemon:", error);
            // Nếu không tải được hình, vẽ hình thay thế
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect((width - 200) / 2, ((height - 300) - 200) / 2 + 150, 200, 200);
            ctx.fillStyle = 'black';
            ctx.font = '30px "BeVietnamPro", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('?????', width / 2, height / 2);
        }
        
        // Vẽ thông tin tiêu đề
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isWild) {
            ctx.font = 'bold 40px "BeVietnamPro", Arial, sans-serif';
            ctx.fillText('POKEMON HOANG DÃ XUẤT HIỆN!', width / 2, 50);
            ctx.font = 'bold 30px "BeVietnamPro", Arial, sans-serif';
            ctx.fillText('Hãy reply "catch" để bắt!', width / 2, 100);
        } else {
            // Sử dụng font Pokemon cho tên Pokémon
            try {
                ctx.font = 'bold 42px "PokemonSolid", "BeVietnamPro", Arial, sans-serif';
                // Thêm hiệu ứng viền cho tên Pokemon
                ctx.strokeStyle = '#3B4CCA'; // Viền màu xanh Pokémon
                ctx.lineWidth = 4;
                ctx.strokeText(`${pokemon.name.toUpperCase()}`, width / 2, 50);
                ctx.fillStyle = '#FFDE00'; // Màu vàng Pokémon
                ctx.fillText(`${pokemon.name.toUpperCase()}`, width / 2, 50);
            } catch (e) {
                // Fallback nếu font Pokemon không hoạt động
                ctx.font = 'bold 40px "BeVietnamPro", Arial, sans-serif';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(`${pokemon.name.toUpperCase()}`, width / 2, 50);
            }
            
            // Hiển thị độ hiếm
            ctx.font = 'bold 30px "BeVietnamPro", Arial, sans-serif';
            let rarityText;
            let rarityColor;
            
            switch (pokemon.rarity) {
                case 'common': 
                    rarityText = 'COMMON'; 
                    rarityColor = '#AAAAAA'; 
                    break;
                case 'uncommon': 
                    rarityText = 'UNCOMMON'; 
                    rarityColor = '#55AA55'; 
                    break;
                case 'rare': 
                    rarityText = 'RARE'; 
                    rarityColor = '#5555FF'; 
                    break;
                case 'epic': 
                    rarityText = 'EPIC'; 
                    rarityColor = '#AA55AA'; 
                    break;
                case 'legendary': 
                    rarityText = 'LEGENDARY'; 
                    rarityColor = '#FFAA00'; 
                    break;
                default: 
                    rarityText = 'UNKNOWN'; 
                    rarityColor = '#FFFFFF';
            }
            
            ctx.fillStyle = rarityColor;
            ctx.fillText(rarityText, width / 2, 100);
        }
        
        // Vẽ thông tin dưới
        ctx.font = '25px "BeVietnamPro", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        if (!isWild) {
            // Vẽ các chỉ số và thông tin
            ctx.fillText(`Pokédex #${pokemon.id}`, 50, height - 140);
            ctx.fillText(`Type: ${pokemon.types.join(', ')}`, 50, height - 105);
            ctx.fillText(`Height: ${pokemon.height}m  |  Weight: ${pokemon.weight}kg`, 50, height - 70);
            
            // Vẽ các chỉ số cơ bản
            ctx.fillText(`HP: ${pokemon.stats.hp}`, 500, height - 140);
            ctx.fillText(`ATK: ${pokemon.stats.attack}  |  DEF: ${pokemon.stats.defense}`, 500, height - 105);
            ctx.fillText(`Value: ${pokemon.value} coins`, 500, height - 70);
            
            // Vẽ khung cho description
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(30, height - 35, width - 60, 25);
            
            // Vẽ description
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Arial, sans-serif';
            ctx.fillText(pokemon.description || "No description available", 40, height - 30);
        } else {
            // Center the text horizontally
            ctx.textAlign = 'center';
            ctx.fillText(`Một Pokemon hoang dã đã xuất hiện!`, width / 2, height - 110);
            ctx.fillText(`Hãy reply "catch" để bắt nó!`, width / 2, height - 70);
            ctx.fillText(`Bạn có duy nhất một cơ hội!`, width / 2, height - 30);
        }
        
        // Lưu và trả về đường dẫn hình ảnh
        const imagePath = path.join(__dirname, 'cache', `pokemon_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
        
        return new Promise((resolve, reject) => {
            const out = fs.createWriteStream(imagePath);
            const stream = canvas.createPNGStream();
            
            stream.pipe(out);
            out.on('finish', () => resolve(imagePath));
            out.on('error', reject);
        });
    },
    
    // Tạo hình ảnh kết quả bắt Pokemon
    async createCatchResultImage(pokemon, success) {
        await this.ensureCacheDir();
        
        const width = 800;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Vẽ nền
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        if (success) {
            gradient.addColorStop(0, '#56ab2f');
            gradient.addColorStop(1, '#a8e063');
        } else {
            gradient.addColorStop(0, '#cb2d3e');
            gradient.addColorStop(1, '#ef473a');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Vẽ overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);
        
        // Vẽ khung thông tin
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, 120);
        ctx.fillRect(0, height - 150, width, 150);
        
        // Tải và vẽ hình Pokemon
        try {
            const pokemonImage = await loadImage(pokemon.sprites.official || pokemon.sprites.front);
            const imageSize = Math.min(width, height - 270) * 0.8;
            ctx.drawImage(
                pokemonImage, 
                (width - imageSize) / 2, 
                ((height - 270) - imageSize) / 2 + 120, 
                imageSize, 
                imageSize
            );
        } catch (error) {
            console.error("Lỗi khi tải hình ảnh Pokemon:", error);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect((width - 200) / 2, ((height - 270) - 200) / 2 + 120, 200, 200);
        }
        
        // Vẽ thông tin tiêu đề
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Sử dụng font Pokemon cho tên Pokémon
        try {
            ctx.font = 'bold 38px "PokemonSolid", "BeVietnamPro", Arial, sans-serif';
            if (success) {
                // Hiệu ứng viền và màu
                ctx.strokeStyle = '#3B4CCA'; // Viền màu xanh Pokémon
                ctx.lineWidth = 4;
                ctx.strokeText(`BẮT ĐƯỢC ${pokemon.name.toUpperCase()}!`, width / 2, 60);
                ctx.fillStyle = '#FFDE00'; // Màu vàng Pokémon
                ctx.fillText(`BẮT ĐƯỢC ${pokemon.name.toUpperCase()}!`, width / 2, 60);
            } else {
                ctx.strokeStyle = '#3B4CCA';
                ctx.lineWidth = 4;
                ctx.strokeText(`${pokemon.name.toUpperCase()} ĐÃ THOÁT!`, width / 2, 60);
                ctx.fillStyle = '#FFDE00';
                ctx.fillText(`${pokemon.name.toUpperCase()} ĐÃ THOÁT!`, width / 2, 60);
            }
        } catch (e) {
            // Fallback nếu font Pokemon không hoạt động
            ctx.font = 'bold 40px "BeVietnamPro", Arial, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            if (success) {
                ctx.fillText(`BẮT ĐƯỢC ${pokemon.name.toUpperCase()}!`, width / 2, 60);
            } else {
                ctx.fillText(`${pokemon.name.toUpperCase()} ĐÃ THOÁT!`, width / 2, 60);
            }
        }
        
        // Vẽ thông tin dưới
        ctx.font = '25px "BeVietnamPro", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        if (success) {
            // Vẽ các chỉ số và thông tin
            ctx.fillText(`Pokédex #${pokemon.id}`, 50, height - 140);
            ctx.fillText(`Type: ${pokemon.types.join(', ')}`, 50, height - 105);
            ctx.fillText(`Height: ${pokemon.height}m  |  Weight: ${pokemon.weight}kg`, 50, height - 70);
            
            // Vẽ các chỉ số cơ bản
            ctx.fillText(`HP: ${pokemon.stats.hp}`, 500, height - 140);
            ctx.fillText(`ATK: ${pokemon.stats.attack}  |  DEF: ${pokemon.stats.defense}`, 500, height - 105);
            ctx.fillText(`Value: ${pokemon.value} coins`, 500, height - 70);
            
            // Vẽ khung cho description
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(30, height - 35, width - 60, 25);
            
            // Vẽ description
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Arial, sans-serif';
            ctx.fillText(pokemon.description || "No description available", 40, height - 30);
        } else {
            ctx.fillText(`Một Pokemon hoang dã đã xuất hiện!`, 50, height - 110);
            ctx.fillText(`Hãy reply "catch" để bắt nó!`, 50, height - 70);
            ctx.fillText(`Bạn có duy nhất một cơ hội!`, 50, height - 30);
        }
        
        // Lưu và trả về đường dẫn hình ảnh
        const imagePath = path.join(__dirname, 'cache', `pokemon_catch_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
        
        return new Promise((resolve, reject) => {
            const out = fs.createWriteStream(imagePath);
            const stream = canvas.createPNGStream();
            
            stream.pipe(out);
            out.on('finish', () => resolve(imagePath));
            out.on('error', reject);
        });
    },
    
    // Tạo hình ảnh bộ sưu tập Pokemon
    async createCollectionImage(playerData, page = 1) {
        await this.ensureCacheDir();
        
        const pokemons = playerData.pokemons;
        const itemsPerPage = 6;
        const totalPages = Math.ceil(pokemons.length / itemsPerPage);
        
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        
        const startIdx = (page - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, pokemons.length);
        const pagePokemons = pokemons.slice(startIdx, endIdx);
        
        const width = 900;
        const height = 800;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Vẽ nền
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#5C258D');
        gradient.addColorStop(1, '#4389A2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Vẽ tiêu đề
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, 100);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px "BeVietnamPro", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`BỘ SƯU TẬP POKEMON`, width / 2, 50);
        
        // Vẽ thông tin người chơi
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 100, width, 60);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '25px "BeVietnamPro", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Coins: ${playerData.coins}`, 20, 130);
        ctx.textAlign = 'right';
        ctx.fillText(`Pokémon: ${pokemons.length}`, width - 20, 130);
        
        // Vẽ thông tin phân trang
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, height - 60, width, 60);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`Trang ${page}/${totalPages || 1}`, width / 2, height - 30);
        
        // Nếu không có Pokemon
        if (pagePokemons.length === 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(100, 300, width - 200, 200);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '30px "BeVietnamPro", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Bạn chưa có Pokemon nào!', width / 2, 400);
            
            // Lưu và trả về đường dẫn hình ảnh
            const imagePath = path.join(__dirname, 'cache', `pokemon_collection_${Date.now()}.png`);
            
            return new Promise((resolve, reject) => {
                const out = fs.createWriteStream(imagePath);
                const stream = canvas.createPNGStream();
                
                stream.pipe(out);
                out.on('finish', () => resolve(imagePath));
                out.on('error', reject);
            });
        }
        
        // Sắp xếp các vị trí hiển thị
        const itemWidth = 280;
        const itemHeight = 300;
        const margin = 20;
        const startY = 180;
        
        // Vẽ từng Pokemon
        for (let i = 0; i < pagePokemons.length; i++) {
            const pokemon = pagePokemons[i];
            const row = Math.floor(i / 3);
            const col = i % 3;
            
            const x = margin + col * (itemWidth + margin);
            const y = startY + row * (itemHeight + margin);
            
            // Vẽ khung Pokemon
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, itemWidth, itemHeight);
            
            // Vẽ tên với font Pokemon
            try {
                ctx.font = 'bold 22px "PokemonSolid", "BeVietnamPro", Arial, sans-serif';
                ctx.textAlign = 'center';
                
                // Hiệu ứng viền cho tên Pokemon
                ctx.strokeStyle = '#3B4CCA';
                ctx.lineWidth = 2.5;
                ctx.strokeText(`${pokemon.name.toUpperCase()}`, x + itemWidth / 2, y + 25);
                
                ctx.fillStyle = '#FFDE00';
                ctx.fillText(`${pokemon.name.toUpperCase()}`, x + itemWidth / 2, y + 25);
            } catch (e) {
                // Fallback
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 25px "BeVietnamPro", Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${pokemon.name.toUpperCase()}`, x + itemWidth / 2, y + 25);
            }
            
            // Vẽ ID
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px "BeVietnamPro", Arial, sans-serif';
            ctx.fillText(`#${pokemon.id}`, x + itemWidth / 2, y + 50);
            
            // Vẽ độ hiếm
            let rarityColor;
            switch (pokemon.rarity) {
                case 'common': rarityColor = '#AAAAAA'; break;
                case 'uncommon': rarityColor = '#55AA55'; break;
                case 'rare': rarityColor = '#5555FF'; break;
                case 'epic': rarityColor = '#AA55AA'; break;
                case 'legendary': rarityColor = '#FFAA00'; break;
                default: rarityColor = '#FFFFFF';
            }
            
            ctx.fillStyle = rarityColor;
            ctx.fillText(pokemon.rarity.toUpperCase(), x + itemWidth / 2, y + 70);
            
            // Tải và vẽ hình ảnh Pokemon
            try {
                const pokemonImage = await loadImage(pokemon.sprites.front || pokemon.sprites.official);
                ctx.drawImage(pokemonImage, x + 40, y + 80, 200, 200);
            } catch (error) {
                console.error(`Lỗi khi tải hình ảnh Pokemon ${pokemon.name}:`, error);
                // Vẽ hình thay thế nếu không tải được
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(x + 40, y + 80, 200, 200);
            }
            
            // Vẽ giá trị
            ctx.fillStyle = '#FFFF00';
            ctx.font = '20px "BeVietnamPro", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${pokemon.value} coins`, x + itemWidth / 2, y + itemHeight - 15);
        }
        
        // Lưu và trả về đường dẫn hình ảnh
        const imagePath = path.join(__dirname, 'cache', `pokemon_collection_${Date.now()}.png`);
        
        return new Promise((resolve, reject) => {
            const out = fs.createWriteStream(imagePath);
            const stream = canvas.createPNGStream();
            
            stream.pipe(out);
            out.on('finish', () => resolve(imagePath));
            out.on('error', reject);
        });
    },
    
    // Hàm để tạo dữ liệu giả về Pokemon (dùng trong trường hợp API bị lỗi)
    createFallbackPokemon() {
        const fallbackPokemons = [
            {
                id: 25,
                name: "pikachu",
                height: 0.4,
                weight: 6.0,
                types: ["electric"],
                abilities: ["static", "lightning rod"],
                stats: {
                    hp: 35,
                    attack: 55,
                    defense: 40,
                    specialAttack: 50,
                    specialDefense: 50,
                    speed: 90,
                    total: 320
                },
                sprites: {
                    front: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
                    official: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
                },
                description: "When several of these Pokémon gather, their electricity could build and cause lightning storms.",
                rarity: "rare",
                value: 500,
                catchRate: 0.4
            },
            {
                id: 1,
                name: "bulbasaur",
                height: 0.7,
                weight: 6.9,
                types: ["grass", "poison"],
                abilities: ["overgrow", "chlorophyll"],
                stats: {
                    hp: 45,
                    attack: 49,
                    defense: 49,
                    specialAttack: 65,
                    specialDefense: 65,
                    speed: 45,
                    total: 318
                },
                sprites: {
                    front: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
                    official: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png"
                },
                description: "A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokémon.",
                rarity: "common",
                value: 300,
                catchRate: 0.8
            }
        ];
        
        return fallbackPokemons[Math.floor(Math.random() * fallbackPokemons.length)];
    },
    
    // Hàm xử lý lệnh
    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID, messageID } = event;
        
        // Nếu không có tham số, hiển thị hướng dẫn
        if (!target || target.length === 0) {
            return api.sendMessage(
                "🎮 POKEMON - HƯỚNG DẪN:\n\n" +
                "- Bắt đầu trò chơi: /pokemon start\n" +
                "- Bắt Pokemon: /pokemon catch\n" +
                "- Xem bộ sưu tập: /pokemon collection [trang]\n" +
                "- Xem thông tin: /pokemon info [tên/id]\n" +
                "- Bán Pokemon: /pokemon sell [tên/id]\n" +
                "- Bảng xếp hạng: /pokemon rank",
                threadID, messageID
            );
        }
        
        const command = target[0]?.toLowerCase();
        
        // Xử lý các lệnh
        switch (command) {
            case "start":
                await this.startGame(api, event);
                break;
                
            case "catch":
                await this.catchPokemon(api, event);
                break;
                
            case "collection":
            case "list":
            case "box":
                const page = parseInt(target[1]) || 1;
                await this.showCollection(api, event, page);
                break;
                
            case "info":
                if (!target[1]) {
                    return api.sendMessage("❌ Vui lòng nhập tên hoặc ID của Pokemon!", threadID, messageID);
                }
                await this.showPokemonInfo(api, event, target[1]);
                break;
                
            case "sell":
                if (!target[1]) {
                    return api.sendMessage("❌ Vui lòng nhập tên hoặc ID của Pokemon để bán!", threadID, messageID);
                }
                await this.sellPokemon(api, event, target[1]);
                break;
                
            case "rank":
                await this.showRanking(api, event);
                break;
                
            default:
                api.sendMessage("❓ Lệnh không hợp lệ. Gõ /pokemon để xem hướng dẫn.", threadID, messageID);
        }
    },
    
    // Bắt đầu trò chơi - Spawn một Pokemon ngẫu nhiên
    async startGame(api, event) {
        const { threadID, senderID, messageID } = event;
        
        // Kiểm tra xem đã có game chưa
        if (this.activeGames.has(threadID)) {
            return api.sendMessage("⚠️ Đã có một Pokemon hoang dã xuất hiện trong nhóm này. Hãy bắt nó trước!", threadID, messageID);
        }
        
        try {
            // Lấy dữ liệu người chơi
            const playerData = this.getPlayerData(senderID);
            
            // Kiểm tra thời gian cooldown
            const now = Date.now();
            const cooldownTime = 5 * 60 * 1000; // 5 phút
            if (now - playerData.lastCatch < cooldownTime && playerData.lastCatch !== 0) {
                const remainingTime = Math.ceil((cooldownTime - (now - playerData.lastCatch)) / 1000);
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                
                return api.sendMessage(
                    `⏱️ Bạn cần đợi ${minutes}:${seconds.toString().padStart(2, '0')} nữa mới có thể bắt Pokemon tiếp!`,
                    threadID, messageID
                );
            }
            
            // Lấy random Pokemon
            let pokemon;
            try {
                pokemon = await this.getRandomPokemon();
            } catch (error) {
                console.error("Lỗi khi lấy Pokemon từ API:", error);
                pokemon = this.createFallbackPokemon();
            }
            
            // Tạo trạng thái game
            const gameState = {
                pokemon: pokemon,
                threadID: threadID,
                startTime: Date.now(),
                spawnedBy: senderID,
                expires: Date.now() + 2 * 60 * 1000, // Pokemon sẽ biến mất sau 2 phút
                caught: false,
                inactivityInterval: null
            };
            
            // Tự động xóa Pokemon nếu không ai bắt
            gameState.inactivityInterval = setTimeout(() => {
                if (this.activeGames.has(threadID)) {
                    this.activeGames.delete(threadID);
                    api.sendMessage("⌛ Pokemon hoang dã đã biến mất vì không ai bắt kịp!", threadID);
                }
            }, 2 * 60 * 1000);
            
            this.activeGames.set(threadID, gameState);
            
            // Tạo hình ảnh Pokemon hoang dã (silhouette)
            const pokemonImage = await this.createPokemonImage(pokemon, true);
            
            // Gửi thông báo
            await api.sendMessage({
                body: `🔍 Một Pokemon hoang dã đã xuất hiện!\n`+
                      `👤 Được phát hiện bởi: ${await this.getUserName(api, senderID)}\n\n`+
                      `Hãy reply "catch" để bắt nó!`,
                attachment: fs.createReadStream(pokemonImage)
            }, threadID, (err, msg) => {
                if (err) {
                    console.error("Lỗi khi gửi hình ảnh Pokemon:", err);
                    return api.sendMessage("❌ Đã xảy ra lỗi khi tạo Pokemon!", threadID, messageID);
                }
                
                fs.unlinkSync(pokemonImage);
                
                global.client.onReply.push({
                    name: this.name,
                    messageID: msg.messageID,
                    author: senderID,
                    threadID: threadID
                });
            });
        } catch (error) {
            console.error("Lỗi khi bắt đầu trò chơi Pokemon:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi tạo Pokemon! Vui lòng thử lại sau.", threadID, messageID);
        }
    },
    
    // Hàm để bắt Pokemon
    async catchPokemon(api, event) {
        const { threadID, senderID, messageID } = event;
        
        // Kiểm tra xem có Pokemon để bắt không
        if (!this.activeGames.has(threadID)) {
            return api.sendMessage("❌ Không có Pokemon hoang dã nào để bắt! Hãy sử dụng /pokemon start để tìm Pokemon.", threadID, messageID);
        }
        
        try {
            const game = this.activeGames.get(threadID);
            const pokemon = game.pokemon;
            
            // Lấy dữ liệu người chơi
            const playerData = this.getPlayerData(senderID);
            
            // Tính toán tỷ lệ bắt thành công
            const catchSuccess = Math.random() < pokemon.catchRate;
            
            // Cập nhật trạng thái game
            game.caught = true;
            clearTimeout(game.inactivityInterval);
            this.activeGames.delete(threadID);
            
            // Cập nhật thời gian bắt Pokemon cuối cùng
            playerData.lastCatch = Date.now();
            
            if (catchSuccess) {
                // Bắt thành công
                playerData.pokemons.push(pokemon);
                playerData.stats.catches++;
                playerData.stats.totalValue += pokemon.value;
                playerData.coins += Math.floor(pokemon.value / 10); // Thưởng coins khi bắt thành công
                
                this.savePlayerData(senderID, playerData);
                
                // Tạo hình ảnh kết quả
                const resultImage = await this.createCatchResultImage(pokemon, true);
                
                // Gửi thông báo
                await api.sendMessage({
                    body: `🎉 ${await this.getUserName(api, senderID)} đã bắt được ${pokemon.name.toUpperCase()}!\n`+
                          `✨ Độ hiếm: ${pokemon.rarity.toUpperCase()}\n`+
                          `💰 Giá trị: ${pokemon.value} coins\n`+
                          `💵 Nhận được: ${Math.floor(pokemon.value / 10)} coins\n\n`+
                          `Sử dụng "/pokemon collection" để xem bộ sưu tập của bạn.`,
                    attachment: fs.createReadStream(resultImage)
                }, threadID, (err) => {
                    if (err) return console.error(err);
                    fs.unlinkSync(resultImage);
                });
            } else {
                // Bắt thất bại
                playerData.stats.fails++;
                this.savePlayerData(senderID, playerData);
                
                // Tạo hình ảnh kết quả
                const resultImage = await this.createCatchResultImage(pokemon, false);
                
                // Gửi thông báo
                await api.sendMessage({
                    body: `😢 ${await this.getUserName(api, senderID)} đã không bắt được ${pokemon.name.toUpperCase()}!\n`+
                          `Pokemon đã trốn thoát!\n\n`+
                          `Hãy thử lại sau 5 phút.`,
                    attachment: fs.createReadStream(resultImage)
                }, threadID, (err) => {
                    if (err) return console.error(err);
                    fs.unlinkSync(resultImage);
                });
            }
        } catch (error) {
            console.error("Lỗi khi bắt Pokemon:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi bắt Pokemon! Vui lòng thử lại.", threadID, messageID);
        }
    },
    
    // Hiển thị bộ sưu tập Pokemon
    async showCollection(api, event, page = 1) {
        const { threadID, senderID, messageID } = event;
        
        try {
            // Lấy dữ liệu người chơi
            const playerData = this.getPlayerData(senderID);
            
            // Sắp xếp Pokemon theo độ hiếm giảm dần
            const rarityOrder = { 'legendary': 5, 'epic': 4, 'rare': 3, 'uncommon': 2, 'common': 1 };
            playerData.pokemons.sort((a, b) => {
                return rarityOrder[b.rarity] - rarityOrder[a.rarity] || b.value - a.value;
            });
            
            // Tạo hình ảnh bộ sưu tập
            const collectionImage = await this.createCollectionImage(playerData, page);
            
            // Get username and then use it
            const userName = await this.getUserName(api, senderID);
            
            // Gửi thông báo
            await api.sendMessage({
                body: `📊 BỘ SƯU TẬP POKEMON CỦA ${userName.toUpperCase()}\n\n`+
                      `💰 Coins: ${playerData.coins}\n`+
                      `🎮 Đã bắt: ${playerData.stats.catches} Pokemon\n`+
                      `💎 Tổng giá trị: ${playerData.stats.totalValue} coins\n\n`+
                      `Sử dụng "/pokemon collection [số trang]" để xem các trang khác.`,
                attachment: fs.createReadStream(collectionImage)
            }, threadID, (err) => {
                if (err) return console.error(err);
                fs.unlinkSync(collectionImage);
            });
        } catch (error) {
            console.error("Lỗi khi hiển thị bộ sưu tập Pokemon:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi hiển thị bộ sưu tập! Vui lòng thử lại.", threadID, messageID);
        }
    },
    
    // Hiển thị thông tin chi tiết về Pokemon
    async showPokemonInfo(api, event, identifierStr) {
        const { threadID, senderID, messageID } = event;
        
        try {
            // Lấy dữ liệu người chơi
            const playerData = this.getPlayerData(senderID);
            
            // Tìm Pokemon theo tên hoặc ID
            const identifier = identifierStr.toLowerCase();
            const pokemonIndex = playerData.pokemons.findIndex(p => 
                p.name.toLowerCase() === identifier || p.id.toString() === identifier
            );
            
            if (pokemonIndex === -1) {
                return api.sendMessage(`❌ Không tìm thấy Pokemon có tên hoặc ID: ${identifierStr} trong bộ sưu tập của bạn!`, threadID, messageID);
            }
            
            const pokemon = playerData.pokemons[pokemonIndex];
            
            // Tạo hình ảnh Pokemon
            const pokemonImage = await this.createPokemonImage(pokemon, false);
            
            // Gửi thông báo
            await api.sendMessage({
                body: `📊 THÔNG TIN CHI TIẾT POKEMON\n\n`+
                      `🆔 Pokédex #${pokemon.id}: ${pokemon.name.toUpperCase()}\n`+
                      `✨ Độ hiếm: ${pokemon.rarity.toUpperCase()}\n`+
                      `📏 Chiều cao: ${pokemon.height}m | Cân nặng: ${pokemon.weight}kg\n`+
                      `💫 Loại: ${pokemon.types.join(', ')}\n`+
                      `💪 Khả năng: ${pokemon.abilities.join(', ')}\n\n`+
                      `📈 CHỈ SỐ:\n`+
                      `❤️ HP: ${pokemon.stats.hp}\n`+
                      `⚔️ Attack: ${pokemon.stats.attack}\n`+
                      `🛡️ Defense: ${pokemon.stats.defense}\n`+
                      `🔮 Special Attack: ${pokemon.stats.specialAttack}\n`+
                      `🔰 Special Defense: ${pokemon.stats.specialDefense}\n`+
                      `⚡ Speed: ${pokemon.stats.speed}\n`+
                      `📊 Total: ${pokemon.stats.total}\n\n`+
                      `💰 Giá trị: ${pokemon.value} coins`,
                attachment: fs.createReadStream(pokemonImage)
            }, threadID, (err) => {
                if (err) return console.error(err);
                fs.unlinkSync(pokemonImage);
            });
        } catch (error) {
            console.error("Lỗi khi hiển thị thông tin Pokemon:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi hiển thị thông tin Pokemon! Vui lòng thử lại.", threadID, messageID);
        }
    },
    
    // Bán Pokemon
    async sellPokemon(api, event, identifierStr) {
        const { threadID, senderID, messageID } = event;
        
        try {
            // Lấy dữ liệu người chơi
            const playerData = this.getPlayerData(senderID);
            
            // Tìm Pokemon theo tên hoặc ID
            const identifier = identifierStr.toLowerCase();
            const pokemonIndex = playerData.pokemons.findIndex(p => 
                p.name.toLowerCase() === identifier || p.id.toString() === identifier
            );
            
            if (pokemonIndex === -1) {
                return api.sendMessage(`❌ Không tìm thấy Pokemon có tên hoặc ID: ${identifierStr} trong bộ sưu tập của bạn!`, threadID, messageID);
            }
            
            const pokemon = playerData.pokemons[pokemonIndex];
            
            // Xóa Pokemon khỏi bộ sưu tập
            playerData.pokemons.splice(pokemonIndex, 1);
            
            // Thêm coins cho người chơi
            playerData.coins += pokemon.value;
            playerData.stats.totalValue -= pokemon.value;
            
            // Lưu dữ liệu
            this.savePlayerData(senderID, playerData);
            
            // Tạo hình ảnh Pokemon bán
            const pokemonImage = await this.createPokemonImage(pokemon, false);
            
            // Gửi thông báo
            await api.sendMessage({
                body: `💰 BÁN POKEMON THÀNH CÔNG\n\n`+
                      `🆔 Đã bán: ${pokemon.name.toUpperCase()} (#${pokemon.id})\n`+
                      `💵 Nhận được: ${pokemon.value} coins\n`+
                      `💰 Số dư hiện tại: ${playerData.coins} coins`,
                attachment: fs.createReadStream(pokemonImage)
            }, threadID, (err) => {
                if (err) return console.error(err);
                fs.unlinkSync(pokemonImage);
            });
        } catch (error) {
            console.error("Lỗi khi bán Pokemon:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi bán Pokemon! Vui lòng thử lại.", threadID, messageID);
        }
    },
    
    // Hiển thị bảng xếp hạng
    async showRanking(api, event) {
        const { threadID, messageID } = event;
        
        try {
            // Lấy danh sách các file trong thư mục dữ liệu người chơi
            const files = fs.readdirSync(this.playerDataPath);
            
            // Lấy dữ liệu tất cả người chơi
            const allPlayers = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.playerDataPath, file);
                    try {
                        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        const username = await this.getUserName(api, userData.userId);
                        
                        allPlayers.push({
                            userId: userData.userId,
                            username: username,
                            pokemonCount: userData.pokemons.length,
                            totalValue: userData.stats.totalValue,
                            catches: userData.stats.catches,
                            coins: userData.coins
                        });
                    } catch (err) {
                        console.error(`Lỗi khi đọc file ${file}:`, err);
                    }
                }
            }
            
            // Sắp xếp theo tổng giá trị giảm dần
            allPlayers.sort((a, b) => b.totalValue - a.totalValue);
            
            // Tạo nội dung bảng xếp hạng
            let rankingMessage = "🏆 BẢNG XẾP HẠNG POKEMON 🏆\n\n";
            
            for (let i = 0; i < Math.min(10, allPlayers.length); i++) {
                const player = allPlayers[i];
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                
                rankingMessage += `${medal} ${player.username}\n`;
                rankingMessage += `   💰 Giá trị: ${player.totalValue} | 🎮 Pokemon: ${player.pokemonCount}\n`;
            }
            
            rankingMessage += "\nSử dụng /pokemon start để bắt thêm Pokemon và vươn lên top!";
            
            // Gửi thông báo
            api.sendMessage(rankingMessage, threadID, messageID);
        } catch (error) {
            console.error("Lỗi khi hiển thị bảng xếp hạng:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi hiển thị bảng xếp hạng! Vui lòng thử lại.", threadID, messageID);
        }
    },
    
    // Lấy tên người dùng
    async getUserName(api, userId) {
        try {
            const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
            if (fs.existsSync(userDataPath)) {
                const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
                if (userData[userId]?.name) {
                    return userData[userId].name;
                }
            }
            
            // Nếu không tìm thấy trong cache, lấy từ API
            const userInfo = await api.getUserInfo(userId);
            return userInfo[userId]?.name || "Người dùng";
        } catch (error) {
            console.error("Error getting user name:", error);
            return "Người dùng";
        }
    },
    
    // Xử lý tin nhắn trả lời
    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        
        // Kiểm tra xem có game đang chạy không
        if (!this.activeGames.has(threadID)) {
            return;
        }
        
        // Kiểm tra nếu tin nhắn trả lời là "catch"
        if (body.toLowerCase() === "catch") {
            // Bắt Pokemon
            await this.catchPokemon(api, event);
        }
    }
};