const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBalance, updateBalance } = require('../utils/currencies');
const fs = require('fs');
const path = require('path');

// Update the file path to ensure the directory exists
const PET_DATA_FILE = path.join(__dirname, '../../database/discord/game/pets.json');

const PET_TYPES = {
    DOG: {
        name: 'Chó',
        emoji: '🐕',
        basePrice: 5000,
        incomeRate: 10,
        maxHunger: 100,
        maxHappiness: 100,
        foodCost: 50
    },
    CAT: {
        name: 'Mèo',
        emoji: '🐱',
        basePrice: 7500,
        incomeRate: 15,
        maxHunger: 100,
        maxHappiness: 100,
        foodCost: 75
    },
    HAMSTER: {
        name: 'Chuột Hamster',
        emoji: '🐹',
        basePrice: 3000,
        incomeRate: 8,
        maxHunger: 100,
        maxHappiness: 100,
        foodCost: 30
    }
};

const MOOD_EMOJIS = {
    HAPPY: ['😊', '🥰', '😄', '🤗'],
    NEUTRAL: ['😐', '🙂', '😌'],
    SAD: ['😢', '😥', '😞', '😔']
};

function getMoodEmoji(value) {
    if (value >= 70) return MOOD_EMOJIS.HAPPY[Math.floor(Math.random() * MOOD_EMOJIS.HAPPY.length)];
    if (value >= 30) return MOOD_EMOJIS.NEUTRAL[Math.floor(Math.random() * MOOD_EMOJIS.NEUTRAL.length)];
    return MOOD_EMOJIS.SAD[Math.floor(Math.random() * MOOD_EMOJIS.SAD.length)];
}

function createProgressBar(value, maxValue, size = 10) {
    const percentage = (value / maxValue) * 100;
    const filledSize = Math.round((value / maxValue) * size);
    
    let barColor;
    if (percentage >= 70) barColor = '🟦'; // Blue for good
    else if (percentage >= 30) barColor = '🟨'; // Yellow for medium
    else barColor = '🟥'; // Red for low
    
    return barColor.repeat(filledSize) + '⬜'.repeat(size - filledSize);
}

let petsData = {};

// Add initialization function
function initializePetSystem() {
    try {
        // Create directories if they don't exist
        const dir = path.dirname(PET_DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Create pets file if it doesn't exist
        if (!fs.existsSync(PET_DATA_FILE)) {
            fs.writeFileSync(PET_DATA_FILE, JSON.stringify({ pets: {} }, null, 2));
        }
        
        loadPetsData();
    } catch (error) {
        console.error('Error initializing pet system:', error);
    }
}

function loadPetsData() {
    try {
        if (fs.existsSync(PET_DATA_FILE)) {
            petsData = JSON.parse(fs.readFileSync(PET_DATA_FILE));
        }
    } catch (error) {
        console.error('Error loading pets data:', error);
        petsData = {};
    }
}

function savePetsData() {
    try {
        const dir = path.dirname(PET_DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(PET_DATA_FILE, JSON.stringify(petsData, null, 2));
    } catch (error) {
        console.error('Error saving pets data:', error);
        throw new Error('Could not save pet data');
    }
}

function createPet(type) {
    const petConfig = PET_TYPES[type];
    return {
        type: type,
        name: petConfig.name,
        level: 1,
        exp: 0,
        hunger: petConfig.maxHunger,
        happiness: petConfig.maxHappiness,
        lastFed: Date.now(),
        lastPetted: Date.now(),
        lastReward: Date.now()
    };
}

function updatePetStats(userId) {
    if (!petsData[userId]) return;

    const now = Date.now();
    const pet = petsData[userId];
    const timeSinceLastFed = (now - pet.lastFed) / (1000 * 60 * 60); // hours
    const timeSinceLastPetted = (now - pet.lastPetted) / (1000 * 60 * 60);

    // Decrease hunger and happiness over time
    pet.hunger = Math.max(0, pet.hunger - (timeSinceLastFed * 5));
    pet.happiness = Math.max(0, pet.happiness - (timeSinceLastPetted * 3));

    pet.lastFed = now;
    pet.lastPetted = now;
    savePetsData();
}

function getRewardAmount(pet) {
    const petConfig = PET_TYPES[pet.type];
    const baseReward = petConfig.incomeRate * pet.level;
    const multiplier = (pet.hunger + pet.happiness) / (petConfig.maxHunger + petConfig.maxHappiness);
    return Math.floor(baseReward * multiplier);
}

async function collectReward(userId) {
    if (!petsData[userId]) return 0;

    const pet = petsData[userId];
    const now = Date.now();
    const hoursSinceLastReward = (now - pet.lastReward) / (1000 * 60 * 60);

    if (hoursSinceLastReward < 1) return 0;

    const reward = getRewardAmount(pet);
    pet.lastReward = now;
    pet.exp += reward;

    // Level up system
    if (pet.exp >= pet.level * 100) {
        pet.level++;
        pet.exp = 0;
    }

    savePetsData();
    updateBalance(userId, reward);
    return reward;
}

async function showPetStatus(message) {
    const userId = message.author.id;
    updatePetStats(userId);

    if (!petsData[userId]) {
        const embed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('🌟 Thú Cưng')
            .setDescription([
                '```Bạn chưa có thú cưng!```',
                '',
                '**Các loại thú cưng:**',
                '🐕 Chó - Trung thành và năng động',
                '🐱 Mèo - Quý phái và thông minh',
                '🐹 Hamster - Nhỏ bé và đáng yêu',
                '',
                '**Để mua thú cưng:**',
                '`.pet buy` - Xem cửa hàng',
                '`.pet buy <loại>` - Mua thú cưng'
            ].join('\n'))
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    const pet = petsData[userId];
    const petConfig = PET_TYPES[pet.type];
    const moodEmoji = getMoodEmoji((pet.hunger + pet.happiness) / 2);

    const embed = new EmbedBuilder()
        .setColor(0x4ECDC4)
        .setTitle(`${petConfig.emoji} ${pet.name} ${moodEmoji}`)
        .setDescription([
            `🎖️ **Cấp độ ${pet.level}** (${pet.exp}/${pet.level * 100} EXP)`,
            '',
            `**Đói** ${createProgressBar(pet.hunger, petConfig.maxHunger)}`,
            `**Vui** ${createProgressBar(pet.happiness, petConfig.maxHappiness)}`,
            '',
            '```Thông tin thú cưng```',
            `💕 Tình trạng: ${pet.hunger >= 70 && pet.happiness >= 70 ? 'Rất tốt!' : 
                            pet.hunger >= 30 && pet.happiness >= 30 ? 'Bình thường' : 'Cần chăm sóc!'}`,
            `💰 Thu nhập/giờ: ${getRewardAmount(pet)} Nitro`
        ].join('\n'))
        .setFooter({ text: `Sở hữu bởi ${message.author.username}` })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('pet_feed')
                .setLabel(`Cho ăn (${petConfig.foodCost} Nitro)`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🍖'),
            new ButtonBuilder()
                .setCustomId('pet_pet')
                .setLabel('Vuốt ve')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✨'),
            new ButtonBuilder()
                .setCustomId('pet_collect')
                .setLabel('Thu thưởng')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💰')
        );

    const response = await message.reply({ 
        embeds: [embed], 
        components: [row] 
    });

    const filter = i => i.user.id === userId;
    const collector = response.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
        const pet = petsData[userId];
        const petConfig = PET_TYPES[pet.type];
        let replyEmbed;

        switch (interaction.customId) {
            case 'pet_feed':
                if (getBalance(userId) < petConfig.foodCost) {
                    replyEmbed = new EmbedBuilder()
                        .setColor(0xFF6B6B)
                        .setDescription(`❌ Bạn cần ${petConfig.foodCost} Nitro để mua thức ăn!`);
                } else {
                    updateBalance(userId, -petConfig.foodCost);
                    pet.hunger = Math.min(petConfig.maxHunger, pet.hunger + 25);
                    replyEmbed = new EmbedBuilder()
                        .setColor(0x4ECDC4)
                        .setDescription(`🍖 Đã cho ${pet.name} ăn!\n${createProgressBar(pet.hunger, petConfig.maxHunger)}`);
                }
                break;

            case 'pet_pet':
                pet.happiness = Math.min(petConfig.maxHappiness, pet.happiness + 20);
                replyEmbed = new EmbedBuilder()
                    .setColor(0x4ECDC4)
                    .setDescription(`✨ Bạn vuốt ve ${pet.name}! (+20% Hạnh phúc)`);
                break;

            case 'pet_collect':
                const reward = await collectReward(userId);
                if (reward > 0) {
                    replyEmbed = new EmbedBuilder()
                        .setColor(0x4ECDC4)
                        .setDescription(`💰 Thu được ${reward} Nitro từ ${pet.name}!`);
                } else {
                    replyEmbed = new EmbedBuilder()
                        .setColor(0xFF6B6B)
                        .setDescription('⏳ Chưa đến giờ thu thưởng! (1 giờ/lần)');
                }
                break;
        }

        await interaction.reply({ 
            embeds: [replyEmbed], 
            ephemeral: true 
        });
        
        savePetsData();
        await showPetStatus(message);
    });
}


initializePetSystem();

module.exports = {
    name: 'pet',
    description: 'Hệ thống nuôi thú cưng',
    usage: '.pet [status/buy/list]',
    async execute(message, args) {
        try {
            const command = args[0]?.toLowerCase();

       
            if (!command) {
                return showPetStatus(message);
            }

            switch (command) {
                case 'buy':
                    const availablePets = Object.entries(PET_TYPES).map(([type, data]) => 
                        `${data.emoji} ${data.name} - ${data.basePrice} Nitro`
                    ).join('\n');

                    if (!args[1]) {
                        const embed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('🏪 Cửa hàng thú cưng')
                            .setDescription(availablePets)
                            .setFooter({ text: 'Sử dụng .pet buy <dog/cat/hamster> để mua' });

                        return message.reply({ embeds: [embed] });
                    }

                    const petType = args[1].toUpperCase();
                    if (!PET_TYPES[petType]) {
                        return message.reply('❌ Loại thú cưng không hợp lệ! Sử dụng: dog, cat, hoặc hamster');
                    }

                    const userId = message.author.id;
                    if (petsData[userId]) {
                        return message.reply('❌ Bạn đã có thú cưng rồi!');
                    }

                    const price = PET_TYPES[petType].basePrice;
                    const balance = getBalance(userId);
                    
                    if (balance < price) {
                        return message.reply(`❌ Bạn cần ${price} Nitro để mua ${PET_TYPES[petType].name}! (Hiện có: ${balance} Nitro)`);
                    }

                    try {
                        updateBalance(userId, -price);
                        petsData[userId] = createPet(petType);
                        savePetsData();

                        const successEmbed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('✅ Mua thú cưng thành công!')
                            .setDescription([
                                `Bạn đã mua ${PET_TYPES[petType].emoji} ${PET_TYPES[petType].name}`,
                                `Giá: ${price} Nitro`,
                                `Số dư còn lại: ${getBalance(userId)} Nitro`,
                                '',
                                'Sử dụng `.pet` để xem thông tin thú cưng của bạn'
                            ].join('\n'));

                        return message.reply({ embeds: [successEmbed] });
                    } catch (error) {
                        console.error('Error buying pet:', error);
                        updateBalance(userId, price); // Refund if error
                        return message.reply('❌ Đã xảy ra lỗi khi mua thú cưng! Vui lòng thử lại sau.');
                    }

                case 'status':
                    return showPetStatus(message);

                default:
                    return showPetStatus(message);
            }
        } catch (error) {
            console.error('Pet command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh! Vui lòng thử lại sau.');
        }
    }
};
