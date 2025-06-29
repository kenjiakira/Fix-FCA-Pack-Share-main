require('dotenv').config();

module.exports = {
    ZM_API: {
        BASE_URL: process.env.ZM_API_BASE_URL,
        KEY: process.env.ZM_API_KEY
    },
    CAPCUT_API: {
        BASE_URL: process.env.CAPCUT_API_BASE_URL
    },
    TIKTOK_API: {
        BASE_URL: process.env.TIKTOK_API_BASE_URL
    },
    YOUTUBE: {
        API_KEY: process.env.YOUTUBE_API_KEY
    },
    DISCORD: {
        TOKEN: process.env.DISCORD_TOKEN,
        CLIENT_ID: process.env.DISCORD_CLIENT_ID,
        SERVER_ID: process.env.DISCORD_SERVER_ID,
        PREFIX: process.env.DISCORD_PREFIX
    },
    COC_API: {
        TOKEN: process.env.COC_API_TOKEN,
        BASE_URL: process.env.COC_API_BASE_URL
    },
    GEMINI: {
        API_KEY: process.env.GEMINI_API_KEY
    }
}