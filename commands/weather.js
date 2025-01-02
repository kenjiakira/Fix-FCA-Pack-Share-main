const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const AQI_TOKEN = process.env.AQI_TOKEN;

module.exports = {
    name: "weather",
    info: "Xem thông tin thời tiết chi tiết của một địa điểm",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ["weather", "forecast", "timeweather", "thoitiet"],
    usages: "weather [options] [tên thành phố]\n\n" +
            "Hướng dẫn sử dụng:\n" +
            "- `weather [tên thành phố]`: Xem thời tiết cơ bản và chất lượng không khí kèm dự báo\n" +
            "- `weather`: Xem thời tiết của vị trí hiện tại\n" +
            "- Ví dụ: weather Hanoi, weather Tokyo",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        let cityName;

        if (!Array.isArray(target) || target.length === 0) {
            try {
                const ipResponse = await axios.get('https://ipapi.co/json/');
                cityName = ipResponse.data.city;
            } catch (error) {   
                return await api.sendMessage("❎ Vui lòng nhập tên thành phố", threadID, messageID);
            }
        } else {
            cityName = target.join(' ');
        }

        try {
            const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric&lang=vi`);
            const weatherData = weatherResponse.data;

            if (weatherData.cod !== 200) {
                return await api.sendMessage(`⚠️ Lỗi: Không tìm thấy thành phố "${cityName}"`, threadID, messageID);
            }

            let messageBody = `🌍 THỜI TIẾT TẠI ${weatherData.name.toUpperCase()}, ${weatherData.sys.country}\n\n`;
            messageBody += getBasicWeatherInfo(weatherData);
            
            const aqiData = await getAQIData(weatherData.coord.lat, weatherData.coord.lon);
            messageBody += `\n${aqiData}`;

            const forecastData = await getForecastData(cityName);
            messageBody += `\n${forecastData}`;

            const alerts = await getWeatherAlerts(weatherData.coord.lat, weatherData.coord.lon);
            if (alerts) messageBody += `\n${alerts}`;

            return await api.sendMessage({
                body: messageBody,
                location: {
                    latitude: weatherData.coord.lat,
                    longitude: weatherData.coord.lon,
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

function getBasicWeatherInfo(data) {
    const windDirection = getWindDirection(data.wind.deg);
    return `🌡️ Nhiệt độ: ${data.main.temp}°C\n` +
           `↗️ Cao nhất: ${data.main.temp_max}°C\n` +
           `↘️ Thấp nhất: ${data.main.temp_min}°C\n` +
           `🤔 Cảm giác như: ${data.main.feels_like}°C\n` +
           `💧 Độ ẩm: ${data.main.humidity}%\n` +
           `🌪️ Áp suất: ${data.main.pressure} hPa\n` +
           `🌬️ Gió: ${data.wind.speed} m/s - ${windDirection}\n` +
           `☁️ Mây che phủ: ${data.clouds.all}%\n` +
           `👀 Tầm nhìn: ${data.visibility/1000} km\n` +
           `📝 Tình trạng: ${data.weather[0].description}`;
}

async function getAQIData(lat, lon) {
    try {
        const response = await axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQI_TOKEN}`);
        const aqi = response.data.data.aqi;
        return `\n🌫️ Chất lượng không khí (AQI): ${aqi} - ${getAQILevel(aqi)}`;
    } catch (error) {
        return '\n⚠️ Không thể lấy thông tin chất lượng không khí';
    }
}

async function getForecastData(city) {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=vi`);
        return formatForecast(response.data.list);
    } catch (error) {
        return '\n⚠️ Không thể lấy dự báo thời tiết';
    }
}

async function getWeatherAlerts(lat, lon) {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,daily&appid=${API_KEY}`);
        if (response.data.alerts && response.data.alerts.length > 0) {
            return `\n⚠️ CẢNH BÁO: ${response.data.alerts[0].event}`;
        }
        return '';
    } catch (error) {
        return '';
    }
}

function getWindDirection(degrees) {
    const directions = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
    return directions[Math.round(degrees / 45) % 8];
}

function getAQILevel(aqi) {
    if (aqi <= 50) return 'Tốt';
    if (aqi <= 100) return 'Trung bình';
    if (aqi <= 150) return 'Không tốt cho nhóm nhạy cảm';
    if (aqi <= 200) return 'Không tốt';
    if (aqi <= 300) return 'Rất không tốt';
    return 'Nguy hiểm';
}

function formatForecast(list) {
    let forecast = '\n\n📅 DỰ BÁO 5 NGÀY TỚI:';
    const dailyForecasts = list.filter((item, index) => index % 8 === 0).slice(0, 5);
    
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        forecast += `\n${date.toLocaleDateString('vi-VN')}: ${day.main.temp}°C - ${day.weather[0].description}`;
    });
    
    return forecast;
}
