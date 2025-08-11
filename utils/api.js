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
    },
    XSMB: {
        BASE_URL: 'https://api-xsmb-today.onrender.com/api/v1'
    },
    WIKIPEDIA: {
        BASE_URL: 'https://wikipedia.org/api/rest_v1',
        VI_URL: 'https://vi.wikipedia.org/api/rest_v1',
        EN_URL: 'https://en.wikipedia.org/api/rest_v1'
    },
    WEATHER: {
        API_KEY: process.env.OPENWEATHER_API_KEY,
        BASE_URL: 'https://api.openweathermap.org/data/2.5',
        AQI_URL: 'http://api.openweathermap.org/data/2.5/air_pollution'
    },
    WAIFU: {
        BASE_URL: 'https://api.waifu.im/search'
    },
    VNX: {
        BASE_URL: 'https://vnexpress.net/tin-tuc-24h'
    },
    UPSCALE: {
        API_KEY: '81877a1e333d6976ef9eb75df402046be41681edc4456176555b0f28f5f49eb0cb3e46a5c8a96ed2255714e02bbe7cd7',
        BASE_URL: 'https://clipdrop-api.co/image-upscaling/v1/upscale'
    },
    ROBLOX: {
        USERS_URL: 'https://users.roblox.com/v1/usernames/users',
        USER_DETAIL_URL: 'https://users.roblox.com/v1/users',
        BADGES_URL: 'https://accountinformation.roblox.com/v1/users',
        PRESENCE_URL: 'https://presence.roblox.com/v1/presence/users',
        INVENTORY_URL: 'https://inventory.roblox.com/v2/users',
        GROUPS_URL: 'https://groups.roblox.com/v2/users',
        THUMBNAILS_URL: 'https://thumbnails.roblox.com/v1/users/avatar-headshot'
    },
    POKEMON: {
        BASE_URL: 'https://pokeapi.co/api/v2',
        SPRITES_URL: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
    },
    MOVIE: {
        OMDB_API_KEY: process.env.OMDB_API_KEY || 'db4f9cfb',
        OMDB_BASE_URL: 'http://www.omdbapi.com',
        YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
        YOUTUBE_BASE_URL: 'https://www.googleapis.com/youtube/v3'
    },
    ONEPIECE: {
        BASE_URL: 'https://api.api-onepiece.com/v2'
    },
    MANGAINFO: {
        BASE_URL: 'https://api.jikan.moe/v4'
    },
    IMAGE: {
        UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
        UNSPLASH_BASE_URL: 'https://api.unsplash.com',
        IMGUR_CLIENT_ID: process.env.IMGUR_CLIENT_ID,
        IMGUR_BASE_URL: 'https://api.imgur.com/3',
        REMOVE_BG_API_KEYS: process.env.REMOVE_BG_API_KEYS ? process.env.REMOVE_BG_API_KEYS.split(',').map(key => key.trim()) : [],
        REMOVE_BG_BASE_URL: 'https://api.remove.bg/v1.0/removebg',
        PINTEREST_BASE_URL: 'https://ccexplorerapisjonell.vercel.app/api/pin'
    },
    HOLIDAY: {
        BASE_URL: 'https://date.nager.at/api/v3'
    },
    CRYPTO: {
        COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
        EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY,
        EXCHANGE_RATE_BASE_URL: 'https://openexchangerates.org/api'
    }
}