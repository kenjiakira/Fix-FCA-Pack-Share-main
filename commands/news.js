const axios = require('axios');
const cheerio = require('cheerio');
const { scheduleCron } = require('../utils/scheduler');
const fs = require('fs');
const path = require('path');
const { WEATHER, VNX } = require('../utils/api');

const SETTINGS_FILE = path.join(__dirname, '../database/json/news_settings.json');
const SCHEDULE_INTERVAL = '0 0,6,12,18 * * *';

let newsJob = null;

function loadSettings() {
    try {
        const jsonDir = path.join(__dirname, '../database/json');
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir, { recursive: true });
        }
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE));
        }
        const defaultSettings = { enabledThreads: [] };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
    } catch (err) {
        console.error('Error loading news settings:', err);
        return { enabledThreads: [] };
    }
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (err) {
        console.error('Error saving news settings:', err);
    }
}

async function fetchVnxNews() {
    const response = await axios.get(VNX.BASE_URL);
    const $ = cheerio.load(response.data);
    let news = [];
    $('.item-news').each((i, el) => {
        if (i < 3) {
            const title = $(el).find('.title-news a').text().trim();
            const description = $(el).find('.description a').text().trim();
            const link = $(el).find('.title-news a').attr('href');
            const time = $(el).find('.time-count span').attr('datetime');
            if (title && description) {
                news.push({ title, description, link, time });
            }
        }
    });
    return news;
}

function formatVnxMessage(news) {
    let message = `=== 【 𝗧𝗜𝗡 𝗧𝗨̛́𝗖 𝗩𝗡𝗘𝗫𝗣𝗥𝗘𝗦𝗦 】===\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n\n`;
    news.forEach((item, index) => {
        message += `${index + 1}. 📰 ${item.title}\n`;
        message += `⏰ Thời gian: ${item.time || 'Không có'}\n`;
        message += `📝 ${item.description}\n`;
        message += `🔗 Link: ${item.link}\n\n`;
    });
    return message;
}

const DEFAULT_CITY = 'Hanoi';

async function buildWeatherText(cityName) {
    try {
        const res = await axios.get(
            `${WEATHER.BASE_URL}/weather?q=${cityName}&appid=${WEATHER.API_KEY}&units=metric&lang=vi`
        );
        const d = res.data;
        if (d.cod !== 200) return '';
        let text = `🌍 THỜI TIẾT ${d.name.toUpperCase()}, ${d.sys.country}\n\n`;
        text += getBasicWeatherInfo(d);
        text += await getAQIData(d.coord.lat, d.coord.lon);
        text += await getForecastData(cityName);
        const alerts = await getWeatherAlerts(d.coord.lat, d.coord.lon);
        if (alerts) text += '\n' + alerts;
        return text;
    } catch (e) {
        return '';
    }
}

async function buildAutoMessage() {
    const [weatherText, news] = await Promise.all([
        buildWeatherText(DEFAULT_CITY),
        fetchVnxNews()
    ]);
    let message = '';
    if (weatherText) {
        message += weatherText + '\n\n';
    }
    if (news && news.length) {
        message += formatVnxMessage(news);
    }
    message += `\n⏰ ${new Date().toLocaleString('vi-VN')}`;
    return message || '⚠️ Không lấy được dữ liệu.';
}

async function sendAutoNewsToEnabledThreads(api) {
    try {
        const settings = loadSettings();
        if (settings.enabledThreads.length === 0) return;

        const message = await buildAutoMessage();

        const threads = await api.getThreadList(100, null, ['INBOX']);
        for (const thread of threads) {
            if (thread.isGroup && settings.enabledThreads.includes(thread.threadID)) {
                try {
                    await api.sendMessage(message, thread.threadID);
                    await new Promise(r => setTimeout(r, 500));
                } catch (e) {
                    console.error(`News auto error thread ${thread.threadID}:`, e);
                }
            }
        }
    } catch (error) {
        console.error('News auto schedule error:', error);
    }
}

function startNewsSchedule(api) {
    if (newsJob) newsJob.stop();
    newsJob = scheduleCron(SCHEDULE_INTERVAL, () => sendAutoNewsToEnabledThreads(api));
    console.log('✅ Weather/VNX auto-news schedule started (0h, 6h, 12h, 18h mỗi ngày)');
}

// --- Weather helpers ---
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
        `👀 Tầm nhìn: ${data.visibility / 1000} km\n` +
        `📝 Tình trạng: ${data.weather[0].description}`;
}

async function getAQIData(lat, lon) {
    try {
        const response = await axios.get(`${WEATHER.AQI_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER.API_KEY}`);
        const aqi = response.data.list[0].main.aqi;
        return `\n🌫️ Chất lượng không khí (AQI): ${getAQIDescription(aqi)}`;
    } catch (error) {
        return '\n⚠️ Không thể lấy thông tin chất lượng không khí';
    }
}

function getAQIDescription(aqi) {
    switch (aqi) {
        case 1: return "Rất tốt";
        case 2: return "Tốt";
        case 3: return "Trung bình";
        case 4: return "Kém";
        case 5: return "Rất kém";
        default: return "Không xác định";
    }
}

async function getForecastData(city) {
    try {
        const response = await axios.get(`${WEATHER.BASE_URL}/forecast?q=${city}&appid=${WEATHER.API_KEY}&units=metric&lang=vi`);
        return formatForecast(response.data.list);
    } catch (error) {
        return '\n⚠️ Không thể lấy dự báo thời tiết';
    }
}

async function getWeatherAlerts(lat, lon) {
    try {
        const response = await axios.get(`${WEATHER.BASE_URL}/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,daily&appid=${WEATHER.API_KEY}`);
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

function formatForecast(list) {
    let forecast = '\n\n📅 DỰ BÁO 5 NGÀY TỚI:';
    const dailyForecasts = list.filter((item, index) => index % 8 === 0).slice(0, 5);
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        forecast += `\n${date.toLocaleDateString('vi-VN')}: ${day.main.temp}°C - ${day.weather[0].description}`;
    });
    return forecast;
}

module.exports = {
    name: "news",
    info: "Thời tiết + Tin VnExpress. Bật/tắt tự động gửi tin theo nhóm.",
    dev: "HNT",
    category: "Tiện Ích",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ["news", "forecast", "timenews", "thoitiet", "vnx"],
    usages: `=== THỜI TIẾT & TIN TỨC ===
• .news → Xem thời tiết Hà Nội + tin VnExpress
• .news [thành phố] → Xem thời tiết thành phố (VD: .news Tokyo)
• .news notify → Bật/tắt tự động gửi (thời tiết HN + VNX) mỗi 6 tiếng cho nhóm này
• .news status → Xem trạng thái bật/tắt`,
    cooldowns: 5,

    onLaunch: async function ({ api, event, target = [], actions }) {
        const { threadID, messageID } = event;
        const settings = loadSettings();
        const isEnabled = settings.enabledThreads.includes(threadID);
        const cmd = (target[0] || '').toLowerCase();

        try {
            switch (cmd) {
                case 'notify': {
                    if (isEnabled) {
                        settings.enabledThreads = settings.enabledThreads.filter(id => id !== threadID);
                        saveSettings(settings);
                        return api.sendMessage(
                            "🔕 Đã TẮT gửi tin tự động (thời tiết & VnExpress) cho nhóm này!",
                            threadID,
                            messageID
                        );
                    } else {
                        settings.enabledThreads.push(threadID);
                        saveSettings(settings);
                        return api.sendMessage(
                            "🔔 Đã BẬT gửi tin tự động cho nhóm này!\n" +
                            "💡 Bot sẽ gửi thời tiết Hà Nội + tin VnExpress tự động mỗi 6 tiếng (0h, 6h, 12h, 18h).",
                            threadID,
                            messageID
                        );
                    }
                }

                case 'status': {
                    const status = isEnabled ? "🔔 ĐANG BẬT" : "🔕 ĐANG TẮT";
                    return api.sendMessage(
                        `📊 TRẠNG THÁI TIN TỰ ĐỘNG (THỜI TIẾT / VNX)\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `Nhóm này: ${status}\n` +
                        `Tổng nhóm đã bật: ${settings.enabledThreads.length}\n` +
                        `Chu kỳ: Mỗi 6 tiếng`,
                        threadID,
                        messageID
                    );
                }

                default: {
                    const cityName = target.join(' ').trim();
                    if (!cityName) {
                        const loadingMsg = await actions.reply("⏳ Đang tải thời tiết & tin tức...");
                        try {
                            const message = await buildAutoMessage();
                            await api.sendMessage(message, threadID, messageID);
                            await api.unsendMessage(loadingMsg.messageID);
                        } catch (err) {
                            console.error(err);
                            await api.sendMessage("❌ Không thể tải dữ liệu. Thử lại sau.", threadID, messageID);
                            await api.unsendMessage(loadingMsg.messageID);
                        }
                        return;
                    }

                    try {
                        const weatherResponse = await axios.get(
                            `${WEATHER.BASE_URL}/weather?q=${cityName}&appid=${WEATHER.API_KEY}&units=metric&lang=vi`
                        );
                        const weatherData = weatherResponse.data;

                        if (weatherData.cod !== 200) {
                            return api.sendMessage(`⚠️ Không tìm thấy thành phố "${cityName}"`, threadID, messageID);
                        }

                        let messageBody = `🌍 THỜI TIẾT TẠI ${weatherData.name.toUpperCase()}, ${weatherData.sys.country}\n\n`;
                        messageBody += getBasicWeatherInfo(weatherData);
                        messageBody += await getAQIData(weatherData.coord.lat, weatherData.coord.lon);
                        messageBody += await getForecastData(cityName);
                        const alerts = await getWeatherAlerts(weatherData.coord.lat, weatherData.coord.lon);
                        if (alerts) messageBody += '\n' + alerts;

                        return await api.sendMessage({
                            body: messageBody,
                            location: {
                                latitude: weatherData.coord.lat,
                                longitude: weatherData.coord.lon,
                                current: true
                            }
                        }, threadID, messageID);
                    } catch (error) {
                        if (error.response?.status === 404) {
                            return api.sendMessage(`❌ Không tìm thấy thành phố "${cityName}"`, threadID, messageID);
                        }
                        return api.sendMessage("⚠️ Lỗi thời tiết, vui lòng thử lại sau!", threadID, messageID);
                    }
                }
            }
        } catch (error) {
            console.error('News command error:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi.", threadID, messageID);
        }
    },

    onLoad: async function ({ api }) {
        startNewsSchedule(api);
    }
};
