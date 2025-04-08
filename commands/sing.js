const fs = require('fs-extra');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const { promisify } = require('util');
const streamPipeline = promisify(require('stream').pipeline);

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirsSync(cacheDir);

function createYtdlAgent(cookies = null, proxy = null) {
    if (proxy && cookies) {
        return ytdl.createProxyAgent({ uri: proxy }, cookies);
    } else if (proxy) {
        return ytdl.createProxyAgent({ uri: proxy });
    } else if (cookies) {
        return ytdl.createAgent(cookies);
    }
    return null;
}

function loadCookiesFromFile() {
    const cookiePath = path.join(__dirname, '..', 'youtube_cookies.json');
    if (fs.existsSync(cookiePath)) {
        try {
            return JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
        } catch (err) {
            console.error('Error loading cookies:', err);
        }
    }
    return null;
}

module.exports = {
    name: "sing",
    usedby: 0,
    category: "Media",
    info: "Tìm và phát nhạc từ YouTube",
    onPrefix: true,
    dev: "HNT", 
    cooldowns: 10,

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        if (!global.singCache || !global.singCache[threadID]) return;
        
        const input = body.toLowerCase().trim();
        const { songs, searchMessageID } = global.singCache[threadID];
        const choice = parseInt(input);

        if (isNaN(choice) || choice < 1 || choice > 6) {
            return api.sendMessage("Vui lòng chọn số từ 1 đến 6", threadID, messageID);
        }

        const song = songs[choice - 1];
        const loadingMsg = await api.sendMessage(`⏳ | Đang tải xuống: "${song.title}"...`, threadID, messageID);
        const outputPath = path.resolve(cacheDir, `sing_${Date.now()}.mp3`);

        try {
            const cookies = loadCookiesFromFile();
            const agent = createYtdlAgent(cookies);

            const ytdlOptions = { 
                filter: 'audioonly',
                quality: 'highestaudio',
                format: 'mp3',
                requestOptions: {
                    headers: {
                        'Cookie': 'CONSENT=YES+1',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                    }
                }
            };
            
            if (agent) {
                ytdlOptions.agent = agent;
            }

            const songInfo = await ytdl.getInfo(song.url, ytdlOptions);
            const likes = songInfo.videoDetails.likes || 'Ẩn';
            const views = songInfo.videoDetails.viewCount || '0';
            
            const stream = ytdl(song.url, ytdlOptions);
            
            stream.on('error', (error) => {
                throw new Error(`Lỗi stream: ${error.message}`);
            });

            await streamPipeline(stream, fs.createWriteStream(outputPath));

            if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1024) {
                throw new Error("File tải về không hợp lệ");
            }

            await api.sendMessage({
                body: `🎵 Bài hát: ${song.title}\n👤 Ca sĩ: ${song.author.name}\n⏱️ Thời lượng: ${song.duration.timestamp}\n👍 Lượt thích: ${likes.toLocaleString()}\n👁️ Lượt xem: ${parseInt(views).toLocaleString()}`,
                attachment: fs.createReadStream(outputPath)
            }, threadID, () => {
                api.unsendMessage(loadingMsg.messageID);
                api.unsendMessage(searchMessageID); 
                fs.unlinkSync(outputPath);
            });
            
            delete global.singCache[threadID];
        } catch (error) {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            await api.editMessage(`❌ | Lỗi khi tải bài hát: ${error.message}`, loadingMsg.messageID, threadID);
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        if (!target[0]) {
            return api.sendMessage(`❌ Vui lòng nhập tên bài hát cần tìm!`, threadID);
        }

        try {
            const songQuery = target.join(" ");
            const findingMessage = await api.sendMessage(`🔍 | Đang tìm "${songQuery}". Vui lòng chờ...`, threadID);

            const searchResults = await yts(songQuery);
            const songs = searchResults.videos.slice(0, 6);

            if (!songs.length) {
                return api.editMessage(`❌ | Không tìm thấy bài hát: "${songQuery}"`, findingMessage.messageID, threadID);
            }

            const body = "🎵 Kết quả tìm kiếm:\n\n" + 
                songs.map((song, index) => 
                    `${index + 1}. ${song.title}\n└── 👤 ${song.author.name}\n└── ⏱️ ${song.duration.timestamp}\n\n`
                ).join("") + 
                "💡 Reply số từ 1-6 để chọn bài hát";

            const msg = await api.sendMessage(body, threadID, messageID);
            api.unsendMessage(findingMessage.messageID);

            global.singCache = global.singCache || {};
            global.singCache[threadID] = {
                songs,
                searchMessageID: msg.messageID 
            };

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: event.senderID
            });

        } catch (error) {
            await api.sendMessage(`❌ | Lỗi: ${error.message}`, threadID);
        }
    }
};