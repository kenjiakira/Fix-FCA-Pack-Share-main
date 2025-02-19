const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const CACHE_DURATION = 300000; 
const weatherCache = new Map();

module.exports = {
    name: 'weather',
    description: 'Xem thông tin thời tiết',
    usage: 'weather <tên thành phố>',
    cooldown: 5,

    execute: async function(message, args) {
        try {
            if (!args.length) {
                return message.reply('❌ Vui lòng nhập tên thành phố!\nVí dụ: `weather Hanoi`');
            }

            const city = args.join(' ');
            const cacheKey = `${city.toLowerCase()}_${Math.floor(Date.now() / CACHE_DURATION)}`;
            
            let weatherData = weatherCache.get(cacheKey);

            if (!weatherData) {
                const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=vi`);
                weatherData = response.data;
                weatherCache.set(cacheKey, weatherData);
            }

            const embed = new EmbedBuilder()
                .setColor(this.getWeatherColor(weatherData.main.temp))
                .setTitle(`🌍 Thời tiết tại ${weatherData.name}, ${weatherData.sys.country}`)
                .setDescription(`🌤️ ${weatherData.weather[0].description}`)
                .addFields([
                    {
                        name: '🌡️ Nhiệt độ',
                        value: `${weatherData.main.temp}°C`,
                        inline: true
                    },
                    {
                        name: '🤔 Cảm giác như',
                        value: `${weatherData.main.feels_like}°C`,
                        inline: true
                    },
                    {
                        name: '💧 Độ ẩm',
                        value: `${weatherData.main.humidity}%`,
                        inline: true
                    },
                    {
                        name: '🌪️ Áp suất',
                        value: `${weatherData.main.pressure} hPa`,
                        inline: true
                    },
                    {
                        name: '🌬️ Gió',
                        value: `${weatherData.wind.speed} m/s`,
                        inline: true
                    },
                    {
                        name: '☁️ Mây che phủ',
                        value: `${weatherData.clouds.all}%`,
                        inline: true
                    }
                ])
                .setThumbnail(`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`)
                .setFooter({ text: 'Cập nhật' })
                .setTimestamp();

            const forecastButton = new ButtonBuilder()
                .setCustomId(`forecast_${weatherData.id}`)
                .setLabel('Dự báo 5 ngày')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📅');

            const aqiButton = new ButtonBuilder()
                .setCustomId(`aqi_${weatherData.id}`)
                .setLabel('Chất lượng không khí')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🌫️');

            const row = new ActionRowBuilder().addComponents(forecastButton, aqiButton);

            const response = await message.reply({
                embeds: [embed],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: '❌ Chỉ người yêu cầu mới có thể sử dụng nút này!',
                        ephemeral: true
                    });
                }

                if (interaction.customId.startsWith('forecast_')) {
                    await this.showForecast(interaction, city);
                } else if (interaction.customId.startsWith('aqi_')) {
                    await this.showAQI(interaction, weatherData.coord);
                }
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('[WEATHER] Error:', error);
            if (error.response?.status === 404) {
                return message.reply('❌ Không tìm thấy thành phố! Vui lòng kiểm tra lại tên thành phố.');
            }
            return message.reply('❌ Đã xảy ra lỗi khi lấy thông tin thời tiết!');
        }
    },

    getWeatherColor: function(temp) {
        if (temp <= 0) return 0x7CB9E8;  // Cold blue
        if (temp <= 15) return 0x00FF00; // Cool green
        if (temp <= 25) return 0xFFFF00; // Warm yellow
        return 0xFF0000; // Hot red
    },

    showForecast: async function(interaction, city) {
        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=vi`);
            const forecast = response.data.list
                .filter((item, index) => index % 8 === 0)
                .slice(0, 5);

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle(`📅 Dự báo 5 ngày tới - ${response.data.city.name}`)
                .setDescription(
                    forecast.map(day => {
                        const date = new Date(day.dt * 1000);
                        return `**${date.toLocaleDateString('vi-VN')}**\n` +
                               `🌡️ ${day.main.temp}°C | ${day.weather[0].description}\n` +
                               `💧 ${day.main.humidity}% | 🌬️ ${day.wind.speed}m/s\n`;
                    }).join('\n')
                )
                .setTimestamp();

            await interaction.update({ embeds: [embed] });
        } catch (error) {
            console.error('[WEATHER] Forecast error:', error);
            await interaction.reply({
                content: '❌ Không thể lấy dự báo thời tiết!',
                ephemeral: true
            });
        }
    },

    showAQI: async function(interaction, coord) {
        try {
            const response = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${API_KEY}`);
            const aqi = response.data.list[0];
            
            const aqiLevels = {
                1: ['Rất tốt', '💚'],
                2: ['Tốt', '💚'],
                3: ['Trung bình', '💛'],
                4: ['Kém', '🟧'],
                5: ['Rất kém', '❤️']
            };

            const [aqiText, aqiEmoji] = aqiLevels[aqi.main.aqi];

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('🌫️ Chất lượng không khí')
                .addFields([
                    {
                        name: 'Chỉ số AQI',
                        value: `${aqiEmoji} ${aqiText}`,
                        inline: false
                    },
                    {
                        name: 'Chi tiết',
                        value: [
                            `CO: ${aqi.components.co} μg/m³`,
                            `NO: ${aqi.components.no} μg/m³`,
                            `NO2: ${aqi.components.no2} μg/m³`,
                            `O3: ${aqi.components.o3} μg/m³`,
                            `SO2: ${aqi.components.so2} μg/m³`,
                            `PM2.5: ${aqi.components.pm2_5} μg/m³`,
                            `PM10: ${aqi.components.pm10} μg/m³`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setTimestamp();

            await interaction.update({ embeds: [embed] });
        } catch (error) {
            console.error('[WEATHER] AQI error:', error);
            await interaction.reply({
                content: '❌ Không thể lấy thông tin chất lượng không khí!',
                ephemeral: true
            });
        }
    }
};
