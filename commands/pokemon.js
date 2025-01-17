const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "pokemon",
  dev: "HNT",
  info: "Pokemon",
  onPrefix: true,
  dmUser: false,
  usedby: 0,
  usages: "pokemon",
  cooldowns: 5,

  onLaunch: async ({ api, event }) => {
    try {
      const randomId = Math.floor(Math.random() * 898) + 1;
      
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      const pokemon = response.data;
      
      const imageUrl = pokemon.sprites.other['official-artwork'].front_default;
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      
      const imagePath = path.join(__dirname, '../commands/cache/pokemon.png');
      fs.writeFileSync(imagePath, imageResponse.data);

      const message = {
        body: `🌟 Thông Tin Pokemon 🌟\n\n` +
              `Tên: ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}\n` +
              `Mã số: #${pokemon.id}\n` +
              `Chiều cao: ${pokemon.height/10}m\n` +
              `Cân nặng: ${pokemon.weight/10}kg\n` +
              `Hệ: ${pokemon.types.map(type => {
                const typeMap = {
                  normal: "Thường",
                  fire: "Lửa",
                  water: "Nước",
                  electric: "Điện",
                  grass: "Cỏ",
                  ice: "Băng",
                  fighting: "Chiến đấu",
                  poison: "Độc",
                  ground: "Đất",
                  flying: "Bay",
                  psychic: "Siêu linh",
                  bug: "Bọ",
                  rock: "Đá",
                  ghost: "Ma",
                  dragon: "Rồng",
                  dark: "Bóng tối",
                  steel: "Thép",
                  fairy: "Tiên"
                };
                return typeMap[type.type.name] || type.type.name;
              }).join(', ')}\n` +
              `Kinh nghiệm cơ bản: ${pokemon.base_experience}`,
        attachment: fs.createReadStream(imagePath)
      };

      await api.sendMessage(message, event.threadID, event.messageID);

      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting temporary Pokemon image:', err);
      });

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Đã xảy ra lỗi khi tìm Pokemon. Vui lòng thử lại sau!", event.threadID, event.messageID);
    }
  }
};
