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
    name: "sing",
    info: "Công cụ nhạc: tìm kiếm, nhận diện, phát preview",
    dev: "HNT",
    category: "Media",
    usages: "[search <tên bài hát>] | [detect <reply audio/video>]",
    cooldowns: 5,
    onPrefix: true,

    onReply: async function({ api, event }) {
        const { threadID, messageID, body } = event;
        if (!global.musicCache || !global.musicCache[threadID]) return;
        
        const input = body.toLowerCase().trim();
        const { tracks, searchMessageID } = global.musicCache[threadID];
        const choice = parseInt(input);

        if (isNaN(choice) || choice < 1 || choice > 6) {
            return api.sendMessage("Vui lòng chọn số từ 1 đến 6", threadID, messageID);
        }

        const track = tracks[choice - 1];
        const loadingMsg = await api.sendMessage(`⏳ Đang tải "${track.name}"...`, threadID);

        try {
            const spotifyUrl = `https://open.spotify.com/track/${track.id}`;
            const downloadResponse = await axios.get(`http://87.106.100.187:6312/download/spotify?url=${spotifyUrl}`);
            
            if (!downloadResponse.data.status) {
                throw new Error("Không thể tải bài hát");
            }

            const result = downloadResponse.data.result;
            const filePath = path.join(cacheDir, `spotify_dl_${Date.now()}.mp3`);
            
            await streamPipeline(
                (await axios({url: result.download_url, responseType: 'stream'})).data,
                fs.createWriteStream(filePath)
            );

            await api.sendMessage({
                body: `🎵 Đã tải xong:\n\n`+
                      `🎤 ${result.title}\n`+
                      `👤 ${result.artist}\n`+
                      `⏱️ ${Math.floor(result.duration/1000/60)}:${Math.floor(result.duration/1000)%60}`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                fs.unlinkSync(filePath);
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
                api.unsendMessage(searchMessageID);
                delete global.musicCache[threadID];
            }, messageID);

        } catch (error) {
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            api.sendMessage(`❌ Lỗi tải nhạc: ${error.message}`, threadID, messageID);
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🎵 Music Tools\n"+
                "➜ search <tên bài>: Tìm và tải nhạc\n"+
                "➜ detect: Reply audio/video để nhận diện", 
                threadID
            );
        }

        const command = target[0].toLowerCase();
        const args = target.slice(1);

        try {
            switch(command) {
                case 'search':
                    const query = args.join(' ');
                    if (!query) return api.sendMessage('❌ Vui lòng nhập tên bài hát', threadID);

                    const loadingMsg = await api.sendMessage('🔎 Đang tìm kiếm...', threadID);
                    const token = await getSpotifyToken();
                    const response = await axios.get('https://api.spotify.com/v1/search', {
                        params: { q: query, type: 'track', limit: 6 },
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const tracks = response.data.tracks.items;
                    if (!tracks.length) throw new Error('Không tìm thấy bài hát');

                    const body = "🎵 Kết quả tìm kiếm:\n\n" + 
                        tracks.map((track, index) => {
                            const duration = `${Math.floor(track.duration_ms/60000)}:${((track.duration_ms/1000)%60).toFixed(0).padStart(2,'0')}`;
                            return `${index + 1}. ${track.name}\n└── 👤 ${track.artists.map(a => a.name).join(', ')}\n└── ⏱️ ${duration}\n`;
                        }).join("\n") +
                        "\n💭 Reply số từ 1-6 để tải nhạc";

                    const msg = await api.sendMessage(body, threadID, messageID);
                    api.unsendMessage(loadingMsg.messageID);

                    global.musicCache = global.musicCache || {};
                    global.musicCache[threadID] = {
                        tracks,
                        searchMessageID: msg.messageID
                    };

                    global.client.onReply.push({
                        name: this.name,
                        messageID: msg.messageID,
                        author: event.senderID
                    });
                    break;

                case 'detect':
                    await handleShazamDetect(api, event, event.messageReply);
                    break;

                default:
                    api.sendMessage("❌ Lệnh không hợp lệ. Gõ 'music' để xem hướng dẫn", threadID);
            }
        } catch (error) {
            api.sendMessage(`❌ Lỗi: ${error.message}`, threadID);
        }
    }
};

async function handleSpotifySearch(api, event, target, loadingMsg) {
    const { threadID, messageID } = event;
    const query = target.join(' ');

    if (!query) {
        return api.sendMessage('❌ Vui lòng nhập tên bài hát cần tìm', threadID, messageID);
    }

    loadingMsg = await api.sendMessage('🔎 Đang tìm kiếm...', threadID);

    try {
        const token = await getSpotifyToken();
        const response = await axios.get('https://api.spotify.com/v1/search', {
            params: { q: query, type: 'track', limit: 6 },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const tracks = response.data.tracks.items;
        if (!tracks.length) throw new Error('Không tìm thấy bài hát');

        const body = "🎵 Kết quả tìm kiếm:\n\n" + 
            tracks.map((track, index) => {
                const duration = `${Math.floor(track.duration_ms/60000)}:${((track.duration_ms/1000)%60).toFixed(0).padStart(2,'0')}`;
                return `${index + 1}. ${track.name}\n└── 👤 ${track.artists.map(a => a.name).join(', ')}\n└── ⏱️ ${duration}\n`;
            }).join("\n");

        global.musicCache = global.musicCache || {};
        global.musicCache[threadID] = tracks;

        await api.sendMessage(body + "\n💭 Reply số từ 1-6 để tải nhạc", threadID, (err, info) => {
            if (err) return;
            global.client.onReply.push({
                name: "music",
                messageID: info.messageID,
                author: event.senderID,
                type: "download"
            });
        });
        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);

    } catch (error) {
        throw new Error(`Lỗi tìm kiếm: ${error.message}`);
    }
}

async function handleSpotifyDownload(api, event, target, loadingMsg) {
    const { threadID, messageID } = event;
    const choice = parseInt(target[0]);

    if (!global.musicCache?.[threadID]) {
        return api.sendMessage("❌ Vui lòng tìm kiếm bài hát trước khi tải", threadID, messageID);
    }

    if (isNaN(choice) || choice < 1 || choice > 6) {
        return api.sendMessage("❌ Vui lòng chọn số từ 1 đến 6", threadID, messageID);
    }

    const track = global.musicCache[threadID][choice - 1];
    loadingMsg = await api.sendMessage(`⏳ Đang tải "${track.name}"...`, threadID);

    try {
        const spotifyUrl = `https://open.spotify.com/track/${track.id}`;
        const downloadResponse = await axios.get(`http://87.106.100.187:6312/download/spotify?url=${spotifyUrl}`);
        
        if (!downloadResponse.data.status) {
            throw new Error("Không thể tải bài hát");
        }

        const result = downloadResponse.data.result;
        const filePath = path.join(cacheDir, `spotify_dl_${Date.now()}.mp3`);
        
        await streamPipeline(
            (await axios({url: result.download_url, responseType: 'stream'})).data,
            fs.createWriteStream(filePath)
        );

        await api.sendMessage({
            body: `🎵 Đã tải xong:\n\n`+
                  `🎤 ${result.title}\n`+
                  `👤 ${result.artist}\n`+
                  `⏱️ ${Math.floor(result.duration/1000/60)}:${Math.floor(result.duration/1000)%60}`,
            attachment: fs.createReadStream(filePath)
        }, threadID, () => {
            fs.unlinkSync(filePath);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            delete global.musicCache[threadID];
        }, messageID);

    } catch (error) {
        throw new Error(`Lỗi tải nhạc: ${error.message}`);
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