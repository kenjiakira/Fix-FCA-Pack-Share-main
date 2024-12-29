const axios = require('axios');

const API_KEY = '1230a8fdc6457603234c68ead5f3f967';

module.exports = {
    name: "weather",
    info: "Xem thông tin thời tiết chi tiết của một địa điểm",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ["weather", "forecast", "timeweather", "thoitiet"],
    usages: "weather [tên thành phố]\n\n" +
            "Hướng dẫn sử dụng:\n" +
            "- `weather [tên thành phố]`: Xem thời tiết của thành phố cụ thể\n" +
            "- `weather`: Xem thời tiết của vị trí hiện tại\n" +
            "- Ví dụ: weather Hanoi, weather Tokyo",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        let cityName;
        
        if (!Array.isArray(target) || target.length === 0) {
            return await api.sendMessage("❎ Vui lòng nhập tên thành phố (VD: weather Hanoi)\n💡 Lưu ý: Có thể dùng tên tiếng Việt hoặc tiếng Anh", threadID, messageID);
        } else {
            cityName = target.join(' ');
        }

        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric&lang=vi`);
            const weatherData = response.data;

            if (weatherData.cod !== 200) {
                return await api.sendMessage(`⚠️ Lỗi: Không tìm thấy thành phố "${cityName}"`, threadID, messageID);
            }

            const {
                main: { temp, feels_like, temp_min, temp_max, humidity, pressure },
                wind: { speed },
                weather: [{ description }],
                name: city,
                sys: { country },
                coord: { lat, lon },
                visibility,
                clouds: { all: clouds }
            } = weatherData;

            const messageBody = `🌍 THỜI TIẾT TẠI ${city.toUpperCase()}, ${country}\n\n` +
                              `🌡️ Nhiệt độ: ${temp}°C\n` +
                              `↗️ Cao nhất: ${temp_max}°C\n` +
                              `↘️ Thấp nhất: ${temp_min}°C\n` +
                              `🤔 Cảm giác như: ${feels_like}°C\n` +
                              `💧 Độ ẩm: ${humidity}%\n` +
                              `🌪️ Áp suất: ${pressure} hPa\n` +
                              `🌬️ Tốc độ gió: ${speed} m/s\n` +
                              `☁️ Mây che phủ: ${clouds}%\n` +
                              `👀 Tầm nhìn: ${visibility/1000} km\n` +
                              `📝 Tình trạng: ${description}\n\n` +
                              `🗺️ Vị trí: ${lat}°B, ${lon}°Đ`;

            return await api.sendMessage({
                body: messageBody,
                location: {
                    latitude: lat,
                    longitude: lon,
                    current: true
                }
            }, threadID, messageID);

        } catch (error) {
            console.error(error);
            if (error.response?.status === 404) {
                return await api.sendMessage(`❌ Không tìm thấy thành phố "${cityName}"\n💡 Vui lòng kiểm tra lại tên thành phố`, threadID, messageID);
            }
            return await api.sendMessage("⚠️ Đã có lỗi xảy ra, vui lòng thử lại sau!", threadID, messageID);
        }
    }
};
