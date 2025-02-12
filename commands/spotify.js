const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const streamPipeline = promisify(require('stream').pipeline);

const cacheDir = path.resolve(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirsSync(cacheDir);
}

async function getAccessToken() {
    const clientID = '3d659375536044498834cc9012c58c44';
    const clientSecret = '73bc86542acb4593b2b217616189d4dc';
    
    const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
            grant_type: 'client_credentials'
        }), 
        {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${clientID}:${clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );
    
    return response.data.access_token;
}

async function searchSpotify(query, type = 'track') {
    const accessToken = await getAccessToken();
    
    const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
            q: query,
            type: type,
            limit: 5
        },
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (type === 'track') {
        const tracks = response.data.tracks.items;
        if (!tracks.length) {
            throw new Error('❌ Không tìm thấy bài hát nào với từ khóa này.');
        }
        return tracks.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            preview_url: track.preview_url,
            image_url: track.album.images[0].url,
            duration: Math.floor(track.duration_ms / 1000),
            popularity: track.popularity
        }));
    }
}

async function downloadTrackPreview(url, outputPath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    await streamPipeline(response.data, fs.createWriteStream(outputPath));
}

module.exports = {
    name: "spotify",
    info: "thông tin bài hát Spotify.",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ["sp", "spot"],
    usages: "spotify [từ khóa]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        const query = target && target.length > 0 ? target.join(' ') : null;
        
        if (!query) {
            return api.sendMessage('💫 Hướng dẫn sử dụng:\n\n'+
                                 '🎵 spotify [tên bài hát]\n'+
                                 '🎼 spotify -top [thể loại]\n'+
                                 '🎸 spotify -artist [tên nghệ sĩ]\n'+
                                 '💿 spotify -album [tên album]', threadID, messageID);
        }

        try {
            const tracks = await searchSpotify(query);
            const track = tracks[0]; 
            const filePath = path.resolve(cacheDir, `${track.id}.mp3`);
            
            const duration = `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`;
            const message = `🎵 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗕𝗔̀𝗜 𝗛𝗔́𝗧 🎵\n\n` +
                          `🎤 Tên: ${track.name}\n` +
                          `👥 Ca sĩ: ${track.artists}\n` +
                          `💿 Album: ${track.album}\n` +
                          `⏱️ Thời lượng: ${duration}\n` +
                          `🌟 Độ hot: ${track.popularity}/100\n` +
                          `🔗 Link: https://open.spotify.com/track/${track.id}\n\n`;

            if (track.preview_url) {
                await api.sendMessage(message + '💭 Đang tải preview...', threadID, messageID);
                await downloadTrackPreview(track.preview_url, filePath);
                await api.sendMessage({
                    body: message,
                    attachment: fs.createReadStream(filePath)
                }, threadID, async () => {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (error) {
                        console.error(`Lỗi xóa file: ${error.message}`);
                    }
                }, messageID);
            } else {
                api.sendMessage(message + '❌ Không có bản preview cho bài hát này.', threadID, messageID);
            }
        } catch (error) {
            api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};
