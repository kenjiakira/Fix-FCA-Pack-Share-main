// const axios = require('axios');
// const fs = require('fs-extra');
// const path = require('path');
// const { Shazam } = require('node-shazam');
// const { promisify } = require('util');
// const Spotify = require('spotifydl-core').default;
// const ytdl = require("@distube/ytdl-core");
// const streamPipeline = promisify(require('stream').pipeline);

// const cacheDir = path.join(__dirname, 'cache');
// if (!fs.existsSync(cacheDir)) fs.mkdirsSync(cacheDir);

// function createYtdlAgent(cookies = null, proxy = null) {
//     if (proxy && cookies) {
//         return ytdl.createProxyAgent({ uri: proxy }, cookies);
//     } else if (proxy) {
//         return ytdl.createProxyAgent({ uri: proxy });
//     } else if (cookies) {
//         return ytdl.createAgent(cookies);
//     }
//     return null;
// }

// function loadCookiesFromFile() {
//     const cookiePath = path.join(__dirname, 'youtube_cookies.json');
//     if (fs.existsSync(cookiePath)) {
//         try {
//             return JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
//         } catch (err) {
//             console.error('Error loading cookies:', err);
//         }
//     }
//     return null;
// }
// async function getSpotifyToken() {
//     const clientID = '3d659375536044498834cc9012c58c44';
//     const clientSecret = '73bc86542acb4593b2b217616189d4dc';
    
//     const response = await axios.post('https://accounts.spotify.com/api/token', 
//         new URLSearchParams({ grant_type: 'client_credentials' }), 
//         {
//             headers: {
//                 'Authorization': 'Basic ' + Buffer.from(`${clientID}:${clientSecret}`).toString('base64'),
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         }
//     );
//     return response.data.access_token;
// }

// // Add this helper function at the top level
// async function downloadWithRetry(spotify, trackUrl, filePath, maxRetries = 3) {
//     for (let i = 0; i < maxRetries; i++) {
//         try {
//             // Try getting track info first
//             const track = await spotify.getTrack(trackUrl);
//             if (!track) throw new Error("Không thể lấy thông tin bài hát");
            
//             // Try downloading with options
//             await spotify.downloadTrack(trackUrl, filePath, {
//                 shouldAutoCorrect: true,
//                 separate: true, // Try separated download mode
//                 maxTimeout: 30000, // Increase timeout
//             });
            
//             return true;
//         } catch (err) {
//             if (i === maxRetries - 1) throw err;
//             await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
//         }
//     }
//     return false;
// }

// async function handleYouTubeSearch(api, event, args) {
//     const { threadID, messageID } = event;
//     const query = args.join(' ');
    
//     if (!query) return api.sendMessage("❌ Vui lòng nhập tên bài hát cần tìm", threadID, messageID);
    
//     const loadingMsg = await api.sendMessage("🔎 Đang tìm kiếm trên YouTube...", threadID);

//     try {
//         const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
//         const html = (await axios.get(searchUrl)).data;
//         const results = html.match(/\/watch\?v=([^"]+)/g)?.slice(0, 6) || [];
        
//         if (!results.length) throw new Error("Không tìm thấy bài hát");

//         const tracks = await Promise.all(
//             results.map(async url => {
//                 const fullUrl = `https://youtube.com${url}`;
//                 const info = await ytdl.getBasicInfo(fullUrl);
//                 return {
//                     url: fullUrl,
//                     title: info.videoDetails.title,
//                     author: info.videoDetails.author.name,
//                     duration: parseInt(info.videoDetails.lengthSeconds)
//                 };
//             })
//         );

//         const body = "🎵 Kết quả tìm kiếm YouTube:\n\n" + 
//             tracks.map((track, index) => {
//                 const duration = `${Math.floor(track.duration/60)}:${(track.duration%60).toString().padStart(2,'0')}`;
//                 return `${index + 1}. ${track.title}\n└── 👤 ${track.author}\n└── ⏱️ ${duration}\n`;
//             }).join("\n") +
//             "\n💭 Reply số từ 1-6 để tải nhạc";

//         const msg = await api.sendMessage(body, threadID);
//         if (loadingMsg) api.unsendMessage(loadingMsg.messageID);

//         global.musicCache = global.musicCache || {};
//         global.musicCache[threadID] = {
//             tracks,
//             searchMessageID: msg.messageID,
//             type: 'youtube'
//         };

//         global.client.onReply.push({
//             name: "music",
//             messageID: msg.messageID,
//             author: event.senderID
//         });

//     } catch (error) {
//         if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
//         throw new Error(`Lỗi tìm kiếm YouTube: ${error.message}`);
//     }
// }
// async function handleYouTubeDownload(api, event, track, loadingMsg) {
//     const { threadID, messageID } = event;
    
//     try {
//         const filePath = path.join(cacheDir, `youtube_${Date.now()}.mp3`);
        
//         // Use cookies if available
//         const cookies = loadCookiesFromFile();
//         const agent = createYtdlAgent(cookies);
        
//         const ytdlOptions = { 
//             filter: 'audioonly',
//             quality: 'highestaudio',
//             format: 'mp3',
//             requestOptions: {
//                 headers: {
//                     'Cookie': 'CONSENT=YES+1',
//                     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
//                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
//                 }
//             }
//         };
        
//         // Add agent if available
//         if (agent) {
//             ytdlOptions.agent = agent;
//         }
        
//         const stream = ytdl(track.url, ytdlOptions);

//         // Add error handling for the stream
//         stream.on('error', (error) => {
//             throw new Error(`Lỗi stream: ${error.message}`);
//         });

//         // Write to temporary file
//         await streamPipeline(stream, fs.createWriteStream(filePath));

//         // Verify file exists and has content
//         if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1024) {
//             throw new Error("File tải về không hợp lệ");
//         }

//         // Send the file
//         await api.sendMessage({
//             body: `🎵 Đã tải xong:\n\n`+
//                   `🎤 ${track.title}\n`+
//                   `👤 ${track.author}\n`+
//                   `⏱️ ${Math.floor(track.duration/60)}:${(track.duration%60).toString().padStart(2,'0')}`,
//             attachment: fs.createReadStream(filePath)
//         }, threadID, () => {
//             fs.unlinkSync(filePath);
//             if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
//         }, messageID);

//     } catch (error) {
//         if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
//         throw new Error(`Không thể tải nhạc: ${error.message}`);
//     }
// }

// module.exports = {
//     name: "music",
//     info: "Công cụ nhạc: tìm kiếm, nhận diện, phát preview",
//     dev: "HNT",
//     category: "Media",
//     usages: "[search <tên bài hát>] | [youtube search <tên bài hát>] | [youtube url <link>] | [detect <reply audio/video>]",
//     cooldowns: 5,
//     onPrefix: true,

//     onReply: async function({ api, event }) {
//         const { threadID, messageID, body } = event;
//         if (!global.musicCache || !global.musicCache[threadID]) return;
        
//         const input = body.toLowerCase().trim();
//         const { tracks, searchMessageID, type } = global.musicCache[threadID];
//         const choice = parseInt(input);

//         if (isNaN(choice) || choice < 1 || choice > 6) {
//             return api.sendMessage("Vui lòng chọn số từ 1 đến 6", threadID, messageID);
//         }

//         const track = tracks[choice - 1];
//         const loadingMsg = await api.sendMessage("⏳ Đang tải nhạc...", threadID);

//         try {
//             if (type === 'youtube') {
//                 await handleYouTubeDownload(api, event, track, loadingMsg);
//             } else {
//                 const spotify = new Spotify({
//                     clientId: '3d659375536044498834cc9012c58c44',
//                     clientSecret: '73bc86542acb4593b2b217616189d4dc'
//                 });
                
//                 const filePath = path.join(cacheDir, `spotify_dl_${Date.now()}.mp3`);
                
//                 await downloadWithRetry(spotify, track.external_urls.spotify, filePath);
                
//                 if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1024) {
//                     throw new Error("Tải nhạc thất bại, file không hợp lệ");
//                 }

//                 await api.sendMessage({
//                     body: `🎵 Đã tải xong:\n\n`+
//                           `🎤 ${track.name}\n`+
//                           `👤 ${track.artists.map(a => a.name).join(', ')}\n`+
//                           `⏱️ ${Math.floor(track.duration_ms/60000)}:${((track.duration_ms/1000)%60).toFixed(0)}`,
//                     attachment: fs.createReadStream(filePath)
//                 }, threadID, () => {
//                     fs.unlinkSync(filePath);
//                     if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
//                     api.unsendMessage(searchMessageID);
//                     delete global.musicCache[threadID];
//                 }, messageID);
//             }

//         } catch (error) {
//             if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
//             api.sendMessage(`❌ Lỗi tải nhạc: ${error.message}`, threadID, messageID);
//         }
//     },

//     onLaunch: async function({ api, event, target }) {
//         const { threadID, messageID } = event;

//         if (!target[0]) {
//             return api.sendMessage(
//                 "🎵 Music Tools\n"+
//                 "➜ search <tên bài>: Tìm và tải nhạc từ Spotify\n"+
//                 "➜ youtube search <tên bài>: Tìm và tải nhạc từ YouTube\n"+ 
//                 "➜ youtube url <link>: Tải nhạc từ link YouTube\n"+
//                 "➜ detect: Reply audio/video để nhận diện", 
//                 threadID
//             );
//         }

//         const command = target[0].toLowerCase();
//         const args = target.slice(1);

//         try {
//             switch(command) {
//                 case 'search':
//                     const query = args.join(' ');
//                     if (!query) return api.sendMessage('❌ Vui lòng nhập tên bài hát', threadID);

//                     const loadingMsg = await api.sendMessage('🔎 Đang tìm kiếm...', threadID);
//                     const token = await getSpotifyToken();
//                     const response = await axios.get('https://api.spotify.com/v1/search', {
//                         params: { q: query, type: 'track', limit: 6 },
//                         headers: { 'Authorization': `Bearer ${token}` }
//                     });

//                     const tracks = response.data.tracks.items;
//                     if (!tracks.length) throw new Error('Không tìm thấy bài hát');

//                     const body = "🎵 Kết quả tìm kiếm:\n\n" + 
//                         tracks.map((track, index) => {
//                             const duration = `${Math.floor(track.duration_ms/60000)}:${((track.duration_ms/1000)%60).toFixed(0).padStart(2,'0')}`;
//                             return `${index + 1}. ${track.name}\n└── 👤 ${track.artists.map(a => a.name).join(', ')}\n└── ⏱️ ${duration}\n`;
//                         }).join("\n") +
//                         "\n💭 Reply số từ 1-6 để tải nhạc";

//                     const msg = await api.sendMessage(body, threadID, messageID);
//                     api.unsendMessage(loadingMsg.messageID);

//                     global.musicCache = global.musicCache || {};
//                     global.musicCache[threadID] = {
//                         tracks,
//                         searchMessageID: msg.messageID
//                     };

//                     global.client.onReply.push({
//                         name: this.name,
//                         messageID: msg.messageID,
//                         author: event.senderID
//                     });
//                     break;

//                 case 'detect':
//                     await handleShazamDetect(api, event, event.messageReply);
//                     break;

//                 case 'youtube':
//                     if (!args[0]) return api.sendMessage("❌ Vui lòng nhập 'search <tên bài>' hoặc 'url <link>'", threadID);
//                     const subCommand = args[0].toLowerCase();
//                     const subArgs = args.slice(1);
                    
//                     if (subCommand === 'search') {
//                         await handleYouTubeSearch(api, event, subArgs);
//                     } else if (subCommand === 'url') {
//                         const track = {
//                             url: subArgs[0],
//                             title: 'YouTube Video',
//                             author: 'Unknown',
//                             duration: 0
//                         };
//                         await handleYouTubeDownload(api, event, track);
//                     } else {
//                         api.sendMessage("❌ Lệnh không hợp lệ. Sử dụng 'search <tên bài>' hoặc 'url <link>'", threadID);
//                     }
//                     break;

//                 default:
//                     api.sendMessage("❌ Lệnh không hợp lệ. Gõ 'music' để xem hướng dẫn", threadID);
//             }
//         } catch (error) {
//             api.sendMessage(`❌ Lỗi: ${error.message}`, threadID);
//         }
//     }
// };

// async function handleSpotifySearch(api, event, target, loadingMsg) {
//     const { threadID, messageID } = event;
//     const query = target.join(' ');

//     if (!query) {
//         return api.sendMessage('❌ Vui lòng nhập tên bài hát cần tìm', threadID, messageID);
//     }

//     loadingMsg = await api.sendMessage('🔎 Đang tìm kiếm...', threadID);

//     try {
//         const token = await getSpotifyToken();
//         const response = await axios.get('https://api.spotify.com/v1/search', {
//             params: { q: query, type: 'track', limit: 6 },
//             headers: { 'Authorization': `Bearer ${token}` }
//         });

//         const tracks = response.data.tracks.items;
//         if (!tracks.length) throw new Error('Không tìm thấy bài hát');

//         const body = "🎵 Kết quả tìm kiếm:\n\n" + 
//             tracks.map((track, index) => {
//                 const duration = `${Math.floor(track.duration_ms/60000)}:${((track.duration_ms/1000)%60).toFixed(0).padStart(2,'0')}`;
//                 return `${index + 1}. ${track.name}\n└── 👤 ${track.artists.map(a => a.name).join(', ')}\n└── ⏱️ ${duration}\n`;
//             }).join("\n");

//         global.musicCache = global.musicCache || {};
//         global.musicCache[threadID] = tracks;

//         await api.sendMessage(body + "\n💭 Reply số từ 1-6 để tải nhạc", threadID, (err, info) => {
//             if (err) return;
//             global.client.onReply.push({
//                 name: "music",
//                 messageID: info.messageID,
//                 author: event.senderID,
//                 type: "download"
//             });
//         });
//         if (loadingMsg) api.unsendMessage(loadingMsg.messageID);

//     } catch (error) {
//         throw new Error(`Lỗi tìm kiếm: ${error.message}`);
//     }
// }

// async function handleSpotifyDownload(api, event, target, loadingMsg) {
//     const { threadID, messageID } = event;
//     const choice = parseInt(target[0]);

//     if (!global.musicCache?.[threadID]) {
//         return api.sendMessage("❌ Vui lòng tìm kiếm bài hát trước khi tải", threadID, messageID);
//     }

//     if (isNaN(choice) || choice < 1 || choice > 6) {
//         return api.sendMessage("❌ Vui lòng chọn số từ 1 đến 6", threadID, messageID);
//     }

//     const track = global.musicCache[threadID][choice - 1];
//     loadingMsg = await api.sendMessage(`⏳ Đang tải "${track.name}"...`, threadID);

//     try {
//         const spotify = new Spotify({
//             clientId: '3d659375536044498834cc9012c58c44',
//             clientSecret: '73bc86542acb4593b2b217616189d4dc'
//         });
        
//         const filePath = path.join(cacheDir, `spotify_dl_${Date.now()}.mp3`);
        
//         await downloadWithRetry(spotify, track.external_urls.spotify, filePath);
        
//         if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1024) {
//             throw new Error("Tải nhạc thất bại, file không hợp lệ");
//         }

//         await api.sendMessage({
//             body: `🎵 Đã tải xong:\n\n`+
//                   `🎤 ${track.name}\n`+
//                   `👤 ${track.artists.map(a => a.name).join(', ')}\n`+
//                   `⏱️ ${Math.floor(track.duration_ms/60000)}:${((track.duration_ms/1000)%60).toFixed(0)}`,
//             attachment: fs.createReadStream(filePath)
//         }, threadID, () => {
//             fs.unlinkSync(filePath);
//             if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
//             delete global.musicCache[threadID];
//         }, messageID);

//     } catch (error) {
//         throw new Error(`Lỗi tải nhạc: ${error.message}`);
//     }
// }

// async function handleShazamDetect(api, event, messageReply, loadingMsg) {
//     const { threadID, messageID } = event;

//     if (!messageReply?.attachments?.[0]) {
//         return api.sendMessage("❌ Vui lòng reply một audio/video để nhận diện", threadID, messageID);
//     }

//     const attachment = messageReply.attachments[0];
//     if (!['audio', 'video'].includes(attachment.type)) {
//         return api.sendMessage("❌ Chỉ hỗ trợ nhận diện audio hoặc video", threadID, messageID);
//     }

//     loadingMsg = await api.sendMessage("🎵 Đang nhận diện...", threadID);

//     try {
//         const audioPath = path.join(cacheDir, `shazam_${Date.now()}.mp3`);
//         await streamPipeline(
//             (await axios({url: attachment.url, responseType: 'stream'})).data,
//             fs.createWriteStream(audioPath)
//         );

//         const shazam = new Shazam();
//         const result = await shazam.fromFilePath(audioPath, false, 'vi');

//         if (!result?.track) throw new Error("Không nhận diện được bài hát");

//         let thumbnailPath = null;
//         if (result.track.images?.coverart) {
//             thumbnailPath = path.join(cacheDir, `shazam_thumb_${Date.now()}.jpg`);
//             await streamPipeline(
//                 (await axios({url: result.track.images.coverart, responseType: 'stream'})).data,
//                 fs.createWriteStream(thumbnailPath)
//             );
//         }

//         await api.sendMessage({
//             body: `🎵 Đã nhận diện được:\n\n`+
//                   `🎤 ${result.track.title}\n`+
//                   `👤 ${result.track.subtitle}\n`+
//                   `💿 ${result.track.sections?.[0]?.metadata?.find(m => m.title === 'Album')?.text || 'N/A'}\n`+
//                   `📅 ${result.track.sections?.[0]?.metadata?.find(m => m.title === 'Released')?.text || 'N/A'}\n`+
//                   `🎼 ${result.track.genres?.primary || 'N/A'}\n`+
//                   (result.track.hub?.actions?.[1]?.uri ? `🎧 ${result.track.hub.actions[1].uri}\n` : '')+
//                   `🌐 ${result.track.url || 'N/A'}`,
//             attachment: thumbnailPath ? fs.createReadStream(thumbnailPath) : null
//         }, threadID, () => {
//             fs.unlinkSync(audioPath);
//             if (thumbnailPath) fs.unlinkSync(thumbnailPath);
//             if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
//         }, messageID);

//     } catch (error) {
//         throw new Error(`Lỗi nhận diện: ${error.message}`);
//     }
// }