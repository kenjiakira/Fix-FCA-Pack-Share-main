const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const simpleYT = require('simple-youtube-api');
const getFBInfo = require('@xaviabot/fb-downloader');
const { ZM_API, YOUTUBE } = require('../config/api');
const Downloader = require('../utils/downloader');

const youtube = new simpleYT(YOUTUBE.API_KEY);
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const patterns = {
    capcut: /https:\/\/www\.capcut\.com\/t\/\S*/,
    facebook: /https:\/\/www\.facebook\.com\/\S*/,
    tiktok: /https:\/\/(vm|vt|www|v)?\.?tiktok\.com\/.+/, 
    douyin: /https:\/\/(v\.|www\.)?(douyin\.com|iesdouyin\.com)\/.+/,
    youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
    instagram: /https?:\/\/(www\.)?instagram\.com\/(p|reel|stories)\/\S+/,
    twitter: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\S+/,
    weibo: /https?:\/\/(www\.)?(weibo\.com|weibo\.cn)\/\S+/,
    xiaohongshu: /https?:\/\/(www\.)?(xiaohongshu\.com|xhslink\.com)\/\S+/,
    threads: /https?:\/\/(www\.)?threads\.net\/@?[a-zA-Z0-9._-]+\/post\/[a-zA-Z0-9]+/,
    pinterest: /https?:\/\/(www\.)?pinterest\.(com|ca|fr|jp|co\.uk)\/pin\/[0-9]+/,
};

module.exports = {
    name: 'atd',
    ver: '1.0',
    prog: 'HNT',

    onEvents: async function ({ api, event }) {
        if (event.type !== 'message') return;
        const message = event.body;
        
        if (message.toLowerCase().startsWith('down ')) return;
        
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = message.match(urlRegex);
        
        if (!urls) return;

        for (const url of urls) {
            for (const [platform, pattern] of Object.entries(patterns)) {
                if (pattern.test(url)) {
               
                    if (platform === 'douyin' && !url.includes('douyin.com')) continue;
                    
                    let handler;
                    
                    switch (platform) {
                        case 'capcut': handler = handleCapCut; break;
                        case 'facebook': handler = handleFacebook; break;
                        case 'tiktok': handler = handleTikTok; break; 
                        case 'douyin': handler = handleDouyin; break;
                        case 'youtube': handler = handleYouTube; break;
                        case 'instagram': handler = handleInstagram; break;
                        case 'twitter': handler = handleTwitter; break;
                        case 'weibo': handler = handleWeibo; break;
                        case 'xiaohongshu': handler = handleXHS; break;
                        case 'threads': handler = handleThreads; break;
                        case 'pinterest': handler = handlePinterest; break;
                    }

                    if (handler) {
                        await handler(url, api, event);
                    }
                    break;
                }
            }
        }
    },
};
    
async function handleCapCut(url, api, event) {
    try {
        const response = await axios.get(`https://jonellccapisprojectv2-a62001f39859.herokuapp.com/api/capcut?url=${url}`);
        const { result } = response.data;

        const filePath = await downloadFile(result.video_ori, 'mp4');

        api.sendMessage({
            body: `𝗧𝗶𝘁𝗹𝗲: ${result.title}\n\n𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${result.description}`,
            attachment: fs.createReadStream(filePath),
        }, event.threadID, () => fs.unlinkSync(filePath));
    } catch (error) {
        console.error('Error with CapCut:', error);
    }
}

async function handleFacebook(url, api, event) {
    try {
        const result = await getFBInfo(url);
        const filePath = await downloadFile(result.sd, 'mp4');

        api.sendMessage({
            body: '𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 𝗗𝗼𝘄𝗻𝗼𝗮𝗱𝗲𝗿',
            attachment: fs.createReadStream(filePath),
        }, event.threadID, () => fs.unlinkSync(filePath));
    } catch (error) {
        console.error('Error with Facebook:', error);
    }
}

async function handleTikTok(url, api, event) {
    try {
        const res = await axios.post('https://www.tikwm.com/api/', { url });
        if (res.data.code !== 0) {
            return api.sendMessage('⚠️ Không thể tải nội dung từ URL này.', event.threadID);
        }

        const tiktok = res.data.data;
        const videoPath = await downloadFile(tiktok.play, 'mp4');

        api.sendMessage({
            body: `🎬 - Tiêu đề: ${tiktok.title}`,
            attachment: fs.createReadStream(videoPath),
        }, event.threadID, () => {
            fs.unlinkSync(videoPath);
        });
    } catch (error) {
        console.error('Error with TikTok:', error);
    }
}

async function handleYouTube(url, api, event) {
    try {
        const loadingMsg = await api.sendMessage("⏳ Đang tải video từ YouTube...", event.threadID);
        
        const videoInfo = await ytdl.getInfo(url);
        const title = videoInfo.videoDetails.title;
        const duration = parseInt(videoInfo.videoDetails.lengthSeconds);

        if (duration > 900) {
            api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage("❌ Video có độ dài hơn 15 phút không được hỗ trợ", event.threadID);
        }

        const fileName = `youtube_${Date.now()}.mp4`;
        const filePath = path.join(cacheDir, fileName);

        await new Promise((resolve, reject) => {
            ytdl(url, {
                quality: '18',
                filter: format => format.container === 'mp4'
            })
            .pipe(fs.createWriteStream(filePath))
            .on('finish', resolve)
            .on('error', reject);
        });

        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        if (fileSizeInMB > 25) {
            fs.unlinkSync(filePath);
            api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(`❌ Video quá lớn (${fileSizeInMB.toFixed(2)}MB). Giới hạn là 25MB.`, event.threadID);
        }

        await api.sendMessage({
            body: `🎥 Video: ${title}\n⏱️ Thời lượng: ${Math.floor(duration/60)}:${duration%60}`,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
            api.unsendMessage(loadingMsg.messageID);
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error('YouTube error:', error);
        api.sendMessage('❌ Lỗi khi tải video từ YouTube: ' + error.message, event.threadID);
    }
}

async function handleDouyin(url, api, event) {
    let loadingMsg = null;
    try {
        loadingMsg = await api.sendMessage("⏳ Đang tải media từ Douyin...", event.threadID);
        
        const cleanUrl = url.split('?')[0];
        
        const data = await Downloader.getMediaInfo(cleanUrl);
        const mediaDownloads = [];

        if (data.medias && data.medias.length > 0) {

            const videos = data.medias.filter(m => m.type === 'video');
            if (videos.length > 0) {
                const sortedVideos = Downloader.sortMediaByQuality(videos);
                const bestVideo = sortedVideos[0];
                const download = await Downloader.downloadMedia(bestVideo, 'douyin_video');
                mediaDownloads.push(download);
            }
            const images = data.medias.filter(m => m.type === 'image');
            for (const image of images) {
                if (mediaDownloads.length >= 20) break;
                const download = await Downloader.downloadMedia(image, 'douyin_image');
                mediaDownloads.push(download);
            }
        }

        if (mediaDownloads.length === 0) {
            throw new Error('Không tìm thấy media để tải');
        }

        await api.sendMessage({
            body: `=== 𝗗𝗼𝘂𝘆𝗶𝗻 ===\n\n` +
                  `👤 Tác giả: ${data.author || 'Không xác định'}\n` +
                  `💬 Nội dung: ${data.title || 'Không có nội dung'}\n` +
                  `📊 Đã tải: ${mediaDownloads.length} file\n` +
                  (mediaDownloads.find(m => m.type === 'video') ? '🎥 Bao gồm video\n' : '') +
                  (mediaDownloads.find(m => m.type === 'image') ? '🖼️ Bao gồm hình ảnh\n' : ''),
            attachment: mediaDownloads.map(m => fs.createReadStream(m.path))
        }, event.threadID, () => {
            mediaDownloads.forEach(m => fs.unlinkSync(m.path));
        console.error('Instagram error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
        });

    } catch (error) {
        console.error('Douyin error:', error);
        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
        api.sendMessage('❌ Đã xảy ra lỗi khi tải nội dung từ Douyin.', event.threadID);
    }
}

async function handleInstagram(url, api, event) {
    let loadingMsg = null;
    try {
        loadingMsg = await api.sendMessage("⏳ Đang tải media từ Instagram...", event.threadID);
        
        const data = await Downloader.getMediaInfo(url);
        const mediaDownloads = [];

        if (data.medias && data.medias.length > 0) {
            const sortedMedias = Downloader.sortMediaByQuality(data.medias);
            for (const media of sortedMedias) {
                if (mediaDownloads.length >= 10) break;
                const download = await Downloader.downloadMedia(media, 'instagram');
                mediaDownloads.push(download);
            }
        }

        if (mediaDownloads.length === 0) {
            throw new Error('Không tìm thấy media để tải');
        }

        await api.sendMessage({
            body: `=== 𝗜𝗻𝘀𝘁𝗮𝗴𝗿𝗮𝗺 ===\n\n` +
                  `👤 Author: ${data.author || 'Không xác định'}\n` +
                  `💬 Caption: ${data.title || 'Không có caption'}\n` +
                  `📊 Media: ${mediaDownloads.length} files\n` +
                  `🔗 Link: ${data.url}`,
            attachment: mediaDownloads.map(d => fs.createReadStream(d.path))
        }, event.threadID, () => {
            mediaDownloads.forEach(d => fs.unlinkSync(d.path));
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
        });

    } catch (error) {
        console.error('Instagram error:', error);
        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
        api.sendMessage('❌ Lỗi khi tải nội dung từ Instagram', event.threadID);
    }
}

async function handleTwitter(url, api, event) {
    try {
        const data = await Downloader.getMediaInfo(url);
        const downloads = await Downloader.downloadMultipleMedia(data.medias, 'twitter', 4);
        
        await api.sendMessage({
            body: `=== 𝗫/𝗧𝘄𝗶𝘁𝘁𝗲𝗿 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}\n📊 Media: ${downloads.length} files`,
            attachment: downloads.map(d => fs.createReadStream(d.path))
        }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
    } catch (error) {
        console.error('Twitter error:', error);
        api.sendMessage('❌ Lỗi khi tải nội dung từ Twitter', event.threadID);
    }
}

async function handleWeibo(url, api, event) {
    try {
        const data = await Downloader.getMediaInfo(url);
        const downloads = await Downloader.downloadMultipleMedia(data.medias, 'weibo', 20);
        
        await api.sendMessage({
            body: `=== 𝗪𝗲𝗶𝗯𝗼 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}\n📊 Media: ${downloads.length} files`,
            attachment: downloads.map(d => fs.createReadStream(d.path))
        }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
    } catch (error) {
        console.error('Weibo error:', error);
        api.sendMessage('❌ Lỗi khi tải nội dung từ Weibo', event.threadID);
    }
}

async function handleXHS(url, api, event) {
    try {
        const data = await Downloader.getMediaInfo(url);
        const downloads = await Downloader.downloadMultipleMedia(data.medias, 'xhs', 10);
        
        await api.sendMessage({
            body: `=== 𝗫𝗶𝗮𝗼𝗵𝗼𝗻𝗴𝘀𝗵𝘂 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}\n📊 Media: ${downloads.length} files`,
            attachment: downloads.map(d => fs.createReadStream(d.path))
        }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
    } catch (error) {
        console.error('XHS error:', error);
        api.sendMessage('❌ Lỗi khi tải nội dung từ Xiaohongshu', event.threadID);
    }
}

async function handleThreads(url, api, event) {
    try {
        const data = await Downloader.getMediaInfo(url);
        const mediaItems = data.medias || [];
        
        const videos = mediaItems.filter(m => m.type === 'video');
        const images = mediaItems.filter(m => m.type === 'image');

        if (videos.length > 0) {
            const downloads = await Downloader.downloadMultipleMedia(videos, 'threads', 2);
            await api.sendMessage({
                body: `=== 𝗧𝗵𝗿𝗲𝗮𝗱𝘀 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}`,
                attachment: downloads.map(d => fs.createReadStream(d.path))
            }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
        }
        else if (images.length > 0) {
            const downloads = await Downloader.downloadMultipleMedia(images, 'threads', 10);
            await api.sendMessage({
                body: `=== 𝗧𝗵𝗿𝗲𝗮𝗱𝘀 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}`,
                attachment: downloads.map(d => fs.createReadStream(d.path))
            }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
        }
    } catch (error) {
        console.error('Threads error:', error);
        api.sendMessage('❌ Lỗi khi tải nội dung từ Threads', event.threadID);
    }
}

async function handlePinterest(url, api, event) {
    try {
        const { data } = await axios.post(
            `${ZM_API.BASE_URL}/social/pinterest`, 
            { url },
            { 
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': ZM_API.KEY
                }            }
        );

        if (!data || data.error) {
            return api.sendMessage('⚠️ Không thể tải nội dung từ Pinterest này.', event.threadID);
        }

        let mediaUrl = data.url;
        if (!mediaUrl) {
            return api.sendMessage('❌ Không tìm thấy media để tải xuống.', event.threadID);
        }

        const filePath = await downloadFile(mediaUrl, data.type || 'jpg');

        await api.sendMessage({
            body: `=== 𝗣𝗶𝗻𝘁𝗲𝗿𝗲𝘀𝘁 ===\n\n📌 Title: ${data.title || 'N/A'}\n👤 Author: ${data.author || 'N/A'}`,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));

    } catch (error) {
        console.error('Pinterest error:', error);
        api.sendMessage('❌ Đã xảy ra lỗi khi tải nội dung từ Pinterest.', event.threadID);
    }
}

async function downloadFile(url, type) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(cacheDir, `${Date.now()}.${type}`);
    fs.writeFileSync(filePath, res.data);
    return filePath;
}