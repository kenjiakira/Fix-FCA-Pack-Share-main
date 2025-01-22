const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
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
    tiktok: /(^https:\/\/)((vm|vt|www|v)\.)?(tiktok|douyin)\.com\//,
    douyin: /https:\/\/(v\.|www\.)?douyin\.com\/\S+/,
    youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
    instagram: /https?:\/\/(www\.)?instagram\.com\/(p|reel|stories)\/\S+/,
    twitter: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\S+/,
    weibo: /https?:\/\/(www\.)?(weibo\.com|weibo\.cn)\/\S+/,
    xiaohongshu: /https?:\/\/(www\.)?(xiaohongshu\.com|xhslink\.com)\/\S+/,
    threads: /https?:\/\/(www\.)?threads\.net\/@?[a-zA-Z0-9._-]+\/post\/[a-zA-Z0-9]+/,
};

module.exports = {
    name: 'atd',
    ver: '1.0',
    prog: 'HNT',

    onEvents: async function ({ api, event }) {
        if (event.type !== 'message') return;
        const message = event.body.trim();

        for (const [platform, pattern] of Object.entries(patterns)) {
            if (pattern.test(message)) {
                const url = message.match(/(https?:\/\/[^\s]+)/)[0];
                let handler;
                
                switch (platform) {
                    case 'capcut': handler = handleCapCut; break;
                    case 'facebook': handler = handleFacebook; break;
                    case 'tiktok':
                    case 'douyin': handler = handleTikTok; break;
                    case 'youtube': handler = handleYouTube; break;
                    case 'instagram': handler = handleInstagram; break;
                    case 'twitter': handler = handleTwitter; break;
                    case 'weibo': handler = handleWeibo; break;
                    case 'xiaohongshu': handler = handleXHS; break;
                    case 'threads': handler = handleThreads; break;
                }

                if (handler) {
                    await handler(url, api, event);
                }
                break;
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
            body: '𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿',
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
        const video = await youtube.getVideo(url);
        const stream = ytdl(url, { quality: 'highest' });

        const fileName = `${event.threadID}.mp4`;
        const filePath = path.join(cacheDir, fileName);

        const file = fs.createWriteStream(filePath);
        stream.pipe(file);

        file.on('finish', () => {
            api.sendMessage({
                body: `𝗬𝗼𝘂𝗧𝘂𝗯𝗲\n━━━━━━━━━━━━━━━━━━\nTitle: ${video.title}`,
                attachment: fs.createReadStream(filePath),
            }, event.threadID, () => fs.unlinkSync(filePath));
        });
    } catch (error) {
        console.error('Error with YouTube:', error);
    }
}

async function handleDouyin(url, api, event) {
    try {
        const { data } = await axios.post(
            `${ZM_API.BASE_URL}/social/autolink`,
            { url },
            { 
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': ZM_API.KEY
                }
            }
        );

        if (!data || data.error) {
            return api.sendMessage('⚠️ Không thể tải nội dung từ URL này.', event.threadID);
        }

        let filePath;
        if (data.medias && data.medias.length > 0) {
          
            const sortedMedia = data.medias.sort((a, b) => {
                const quality = ['hd_no_watermark', 'no_watermark', 'hd', 'HD'];
                return quality.indexOf(b.quality) - quality.indexOf(a.quality);
            });

            filePath = await downloadFile(sortedMedia[0].url, 'mp4');
        }

        if (!filePath) {
            return api.sendMessage('❌ Không tìm thấy media để tải xuống.', event.threadID);
        }

        await api.sendMessage({
            body: `=== 𝗗𝗼𝘂𝘆𝗶𝗻 ===\n\n📝 Title: ${data.title || 'N/A'}\n👤 Author: ${data.author || 'N/A'}`,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));

    } catch (error) {
        console.error('Error with Douyin:', error);
        api.sendMessage('❌ Đã xảy ra lỗi khi tải video Douyin.', event.threadID);
    }
}

async function handleInstagram(url, api, event) {
    try {
        const data = await Downloader.getMediaInfo(url);
        const videos = data.medias.filter(m => m.type === 'video');
        const images = data.medias.filter(m => m.type === 'image');

        if (videos.length > 0) {
            const downloads = await Downloader.downloadMultipleMedia(videos, 'instagram', 2);
            await api.sendMessage({
                body: `=== 𝗜𝗻𝘀𝘁𝗮𝗴𝗿𝗮𝗺 ===\n\n👤 Author: ${data.author}\n📝 Caption: ${data.title}`,
                attachment: downloads.map(d => fs.createReadStream(d.path))
            }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
        } else if (images.length > 0) {
            const downloads = await Downloader.downloadMultipleMedia(images, 'instagram', 10);
            await api.sendMessage({
                body: `=== 𝗜𝗻𝘀𝘁𝗮𝗴𝗿𝗮𝗺 ===\n\n👤 Author: ${data.author}\n📝 Caption: ${data.title}`,
                attachment: downloads.map(d => fs.createReadStream(d.path))
            }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
        }
    } catch (error) {
        console.error('Instagram error:', error);
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
        const downloads = await Downloader.downloadMultipleMedia(data.medias, 'weibo', 10);
        
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
        
        // Separate videos and images
        const videos = mediaItems.filter(m => m.type === 'video');
        const images = mediaItems.filter(m => m.type === 'image');

        // If there are videos, only send videos
        if (videos.length > 0) {
            const downloads = await Downloader.downloadMultipleMedia(videos, 'threads', 2);
            await api.sendMessage({
                body: `=== 𝗧𝗵𝗿𝗲𝗮𝗱𝘀 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}`,
                attachment: downloads.map(d => fs.createReadStream(d.path))
            }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
        }
        // If no videos, then send images
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

async function downloadFile(url, type) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(cacheDir, `${Date.now()}.${type}`);
    fs.writeFileSync(filePath, res.data);
    return filePath;
}