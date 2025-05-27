const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');
const axios = require('axios');
const { promisify } = require('util');
const streamPipeline = promisify(require('stream').pipeline);

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirsSync(cacheDir);

const YTMUSIC_API_URL = 'https://api.apify.com/v2/acts/scrapearchitect~youtube-music-downloader/run-sync-get-dataset-items';
const YTMUSIC_API_TOKEN = 'apify_api_GZnFf6RQ4uO7VkLWcYdasbeM4Ce1hi10PXe6';

async function downloadFile(url, outputPath) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    });
    
    return streamPipeline(response.data, fs.createWriteStream(outputPath));
}

async function downloadYoutubeMusic(videoUrl) {
    try {
        const musicUrl = videoUrl.includes('music.youtube.com') 
            ? videoUrl 
            : videoUrl.replace('youtube.com', 'music.youtube.com');
        
        console.log('Downloading music from URL:', musicUrl);
        
        const payload = {
            "music_urls": [
                {
                    "url": musicUrl,
                    "method": "GET"
                }
            ],
            "show_additional_metadata": true
        };
        
        const response = await axios({
            method: 'POST',
            url: YTMUSIC_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${YTMUSIC_API_TOKEN}`
            },
            data: payload
        });
        
        console.log('API response status:', response.status);
        
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            console.error('Invalid API response format:', response.data);
            throw new Error('Định dạng phản hồi API không hợp lệ');
        }
        
        return response.data[0];
    } catch (error) {
        console.error('YouTube Music API Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        }
        throw error;
    }
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

        if (isNaN(choice) || choice < 1 || choice > songs.length) {
            return api.sendMessage(`Vui lòng chọn số từ 1 đến ${songs.length}`, threadID, messageID);
        }

        const song = songs[choice - 1];
        const loadingMsg = await api.sendMessage(`⏳ | Đang tải xuống: "${song.title}"...`, threadID, messageID);
        const outputPath = path.resolve(cacheDir, `sing_${Date.now()}.mp3`);

        try {
            
            let downloadSuccessful = false;
            let musicData = null;
            let downloadLink = null;
            let audioFilePath = outputPath;
            
            try {
                
                musicData = await downloadYoutubeMusic(song.url);
                
                if (musicData && musicData.downloadable_audio_link) {
                    downloadLink = musicData.downloadable_audio_link;
                    await downloadFile(downloadLink, outputPath);
                    downloadSuccessful = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1024;
                    console.log('API mới tải thành công:', downloadSuccessful);
                } else {
                    console.log('API không trả về link tải nhạc, chuyển sang phương thức dự phòng');
                }
            } catch (apiError) {
                console.error('Lỗi khi sử dụng API mới:', apiError.message);
                
            }
            
            if (!downloadSuccessful) {
                throw new Error("Không thể tải nhạc qua API, vui lòng thử lại sau");
            }

            
            const title = musicData?.title || song.title;
            const artist = musicData?.channel || song.author.name;
            const duration = musicData?.duration || song.duration.timestamp;
            const likes = musicData?.additional_metadata?.like_count || 'Ẩn';
            
            await api.sendMessage({
                body: `🎵 Bài hát: ${title}\n👤 Ca sĩ: ${artist}\n⏱️ Thời lượng: ${duration}\n👍 Lượt thích: ${likes}`,
                attachment: fs.createReadStream(audioFilePath)
            }, threadID, () => {
                api.unsendMessage(loadingMsg.messageID);
                api.unsendMessage(searchMessageID);
                fs.unlinkSync(audioFilePath);
            });
            
            delete global.singCache[threadID];
        } catch (error) {
            console.error('Error in sing command:', error);
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