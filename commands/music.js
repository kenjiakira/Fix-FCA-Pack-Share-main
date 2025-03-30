const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { Shazam } = require('node-shazam');
const { promisify } = require('util');
const streamPipeline = promisify(require('stream').pipeline);

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirsSync(cacheDir);

async function getSpotifyToken() {
    const clientID = '3d659375536044498834cc9012c58c44';
    const clientSecret = '73bc86542acb4593b2b217616189d4dc';
    
    const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({ grant_type: 'client_credentials' }), 
        {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${clientID}:${clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );
    return response.data.access_token;
}

module.exports = {
    name: "music",
    info: "Công cụ nhạc: tìm kiếm, nhận diện, phát preview",
    dev: "HNT",
    category: "Media",
    usages: "[search <tên bài hát>] | [detect <reply audio/video>]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, messageReply } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🎵 Music Tools\n"+
                "➜ search <tên bài>: Tìm và phát preview\n"+
                "➜ detect: Reply audio/video để nhận diện\n"+
                "➜ top: Xem bài hát thịnh hành", 
                threadID
            );
        }

        const command = target[0].toLowerCase();
        const args = target.slice(1);

        let loadingMsg = null;
        try {
            switch(command) {
                case 'search':
                    await handleSpotifySearch(api, event, target, loadingMsg);
                    break;
                    
                case 'detect':
                    await handleShazamDetect(api, event, messageReply, loadingMsg);
                    break;

                default:
                    api.sendMessage("❌ Lệnh không hợp lệ. Gõ 'music' để xem hướng dẫn", threadID);
            }
        } catch (error) {
            console.error('Music Command Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};

async function handleSpotifySearch(api, event, args, loadingMsg) {
    const { threadID, messageID } = event;
    const query = args.join(' ');

    if (!query) {
        return api.sendMessage('❌ Vui lòng nhập tên bài hát cần tìm', threadID, messageID);
    }

    loadingMsg = await api.sendMessage('🔎 Đang tìm kiếm...', threadID);

    try {
        const token = await getSpotifyToken();
        const response = await axios.get('https://api.spotify.com/v1/search', {
            params: { q: query, type: 'track', limit: 1 },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const track = response.data.tracks.items[0];
        if (!track) throw new Error('Không tìm thấy bài hát');

        const duration = `${Math.floor(track.duration_ms/60000)}:${((track.duration_ms/1000)%60).toFixed(0).padStart(2,'0')}`;
        
        if (track.preview_url) {
            const filePath = path.join(cacheDir, `spotify_${track.id}.mp3`);
            await streamPipeline(
                (await axios({url: track.preview_url, responseType: 'stream'})).data,
                fs.createWriteStream(filePath)
            );

            await api.sendMessage({
                body: `🎵 ${track.name}\n`+
                      `👤 ${track.artists.map(a => a.name).join(', ')}\n`+
                      `💿 ${track.album.name}\n`+
                      `⏱️ ${duration}\n`+
                      `🔗 https://open.spotify.com/track/${track.id}`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                fs.unlinkSync(filePath);
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            }, messageID);
        } else {
            throw new Error('Không có bản preview cho bài hát này');
        }
    } catch (error) {
        throw new Error(`Lỗi tìm kiếm: ${error.message}`);
    }
}

async function handleShazamDetect(api, event, messageReply, loadingMsg) {
    const { threadID, messageID } = event;

    if (!messageReply?.attachments?.[0]) {
        return api.sendMessage("❌ Vui lòng reply một audio/video để nhận diện", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];
    if (!['audio', 'video'].includes(attachment.type)) {
        return api.sendMessage("❌ Chỉ hỗ trợ nhận diện audio hoặc video", threadID, messageID);
    }

    loadingMsg = await api.sendMessage("🎵 Đang nhận diện...", threadID);

    try {
        const audioPath = path.join(cacheDir, `shazam_${Date.now()}.mp3`);
        await streamPipeline(
            (await axios({url: attachment.url, responseType: 'stream'})).data,
            fs.createWriteStream(audioPath)
        );

        const shazam = new Shazam();
        const result = await shazam.fromFilePath(audioPath, false, 'vi');

        if (!result?.track) throw new Error("Không nhận diện được bài hát");

        let thumbnailPath = null;
        if (result.track.images?.coverart) {
            thumbnailPath = path.join(cacheDir, `shazam_thumb_${Date.now()}.jpg`);
            await streamPipeline(
                (await axios({url: result.track.images.coverart, responseType: 'stream'})).data,
                fs.createWriteStream(thumbnailPath)
            );
        }

        await api.sendMessage({
            body: `🎵 Đã nhận diện được:\n\n`+
                  `🎤 ${result.track.title}\n`+
                  `👤 ${result.track.subtitle}\n`+
                  `💿 ${result.track.sections?.[0]?.metadata?.find(m => m.title === 'Album')?.text || 'N/A'}\n`+
                  `📅 ${result.track.sections?.[0]?.metadata?.find(m => m.title === 'Released')?.text || 'N/A'}\n`+
                  `🎼 ${result.track.genres?.primary || 'N/A'}\n`+
                  (result.track.hub?.actions?.[1]?.uri ? `🎧 ${result.track.hub.actions[1].uri}\n` : '')+
                  `🌐 ${result.track.url || 'N/A'}`,
            attachment: thumbnailPath ? fs.createReadStream(thumbnailPath) : null
        }, threadID, () => {
            fs.unlinkSync(audioPath);
            if (thumbnailPath) fs.unlinkSync(thumbnailPath);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
        }, messageID);

    } catch (error) {
        throw new Error(`Lỗi nhận diện: ${error.message}`);
    }
}