const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const simpleYT = require('simple-youtube-api');
const getFBInfo = require('@xaviabot/fb-downloader');
const { ZM_API, YOUTUBE, TIKTOK_API } = require('../utils/api');
const Downloader = require('../utils/downloader');
const vipService = require('../game/vip/vipService');
const { pro } = require('./thread');

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

function isValidTikTokUrl(url) {
    const urlWithoutQuery = url.split('?')[0];
    console.log("Validating TikTok URL:", url);
    console.log("URL without query params:", urlWithoutQuery);

    const isValid = /^(https?:\/\/)?(www\.|vm\.|vt\.|m\.)?tiktok\.com(\/[@\w.]+\/(?:video|photo)\/\d+|\/@[\w.]+\/video\/\d+|\/v\/\d+|\/.+)?/.test(url);

    console.log("TikTok URL validation result:", isValid);
    return isValid;
}

async function resolveTikTokShortUrl(url) {
    try {
        if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
            const response = await axios.get(url, {
                maxRedirects: 5,
                validateStatus: null,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (response.request.res.responseUrl) {
                return response.request.res.responseUrl;
            }

            if (response.headers.location) {
                return response.headers.location;
            }
        }

        return url;
    } catch (error) {
        console.error("Lỗi khi giải quyết link TikTok:", error);
        return url;
    }
}

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

function requiresVIP(platform) {
    return false;
}

async function checkVIPAccess(userId, platform) {
    return true;
}

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
    let processingMsg = null;
    try {
        const { threadID } = event;

        if (!isValidTikTokUrl(url)) {
            return api.sendMessage("⚠️ URL không hợp lệ! Vui lòng nhập đúng URL video TikTok.", threadID);
        }

        processingMsg = await sendProcessingMessage(api, threadID, "⏳ Đang xử lý video TikTok, vui lòng đợi...");

        const response = await axios.post(TIKTOK_API.BASE_URL,
            { url: resolvedUrl },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        if (response.data && response.data.code === 0 && response.data.data) {
            const data = response.data.data;
            const videoUrl = data.play || data.wmplay;

            if (!videoUrl) {
                await processingMsg.remove();
                return api.sendMessage("❌ Không thể tải video, vui lòng thử lại sau!", threadID);
            }

            const title = data.title || "TikTok Video";
            const author = data.author && data.author.nickname ? data.author.nickname : "Unknown";

            const videoResponse = await axios({
                method: 'GET',
                url: videoUrl,
                responseType: 'stream'
            });

            const timestamp = Date.now();
            const videoPath = path.join(cacheDir, `tiktok_${timestamp}.mp4`);

            const writer = fs.createWriteStream(videoPath);
            videoResponse.data.pipe(writer);

            writer.on('finish', async () => {
                await processingMsg.remove();
                
                api.sendMessage({
                    body: `=== 𝗧𝗶𝗸𝗧𝗼𝗸 ===\n\n👤 Tác giả: ${author}\n📝 Tiêu đề: ${title}`,
                    attachment: fs.createReadStream(videoPath)
                }, threadID, (err) => {
                    if (err) {
                        api.sendMessage("❌ Có lỗi khi gửi video, vui lòng thử lại sau!", threadID);
                        console.error(err);
                    }

                    fs.unlink(videoPath, (err) => {
                        if (err) console.error("Error deleting file:", err);
                    });
                });
            });

            writer.on('error', async (err) => {
                console.error("Error writing file:", err);
                await processingMsg.remove();
                api.sendMessage("❌ Có lỗi khi lưu video, vui lòng thử lại sau!", threadID);
            });

        } else {
            await processingMsg.remove();
            const errorMsg = response.data && response.data.msg ? response.data.msg : "Không thể xử lý video TikTok";
            api.sendMessage(`❌ ${errorMsg}, vui lòng thử URL khác!`, threadID);
        }
    } catch (error) {
        console.error('Error with TikTok:', error);
        if (processingMsg) await processingMsg.remove();
        api.sendMessage(`❌ Đã xảy ra lỗi khi tải TikTok: ${error.message || "Không xác định"}`, event.threadID);
    }
}

async function handleYouTube(url, api, event) {
    try {
        const processingMsg = await sendProcessingMessage(api, event.threadID, "⏳ Đang tải video từ YouTube...");

        const videoInfo = await ytdl.getInfo(url);
        const title = videoInfo.videoDetails.title;
        const duration = parseInt(videoInfo.videoDetails.lengthSeconds);

        if (duration > 900) {
            await processingMsg.remove();
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

        if (fileSizeInMB > 45) {
            fs.unlinkSync(filePath);
            await processingMsg.remove();
            return api.sendMessage(`❌ Video quá lớn (${fileSizeInMB.toFixed(2)}MB). Giới hạn là 45MB.`, event.threadID);
        }

        await processingMsg.remove();
        await api.sendMessage({
            body: `🎥 Video: ${title}\n⏱️ Thời lượng: ${Math.floor(duration / 60)}:${duration % 60}`,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error('YouTube error:', error);
        api.sendMessage('❌ Lỗi khi tải video từ YouTube: ' + error.message, event.threadID);
    }
}

async function sendProcessingMessage(api, threadID, message = "⏳ Đang xử lý...") {
    try {
        const sentMessage = await api.sendMessage(message, threadID);
        return {
            messageID: sentMessage.messageID,
            remove: async () => {
                try {
                    await api.unsendMessage(sentMessage.messageID);
                } catch (err) {
                    console.error("Error removing processing message:", err);
                }
            }
        };
    } catch (err) {
        console.error("Error sending processing message:", err);
        return {
            messageID: null,
            remove: async () => { }
        }
    }
}
async function handleDouyin(url, api, event) {
    let loadingMsg = null;
    try {
        const processingMsg = await sendProcessingMessage(api, event.threadID, "⏳ Đang tải video từ Douyin...");

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
        await processingMsg.remove();
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
        await processingMsg.remove();
        api.sendMessage('❌ Đã xảy ra lỗi khi tải nội dung từ Douyin.', event.threadID);
    }
}

async function handleInstagram(url, api, event) {
    let loadingMsg = null;
    try {
        const processingMsg = await sendProcessingMessage(api, event.threadID, "⏳ Đang tải video từ IG...");

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
        await processingMsg.remove();
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
        await processingMsg.remove();
        api.sendMessage('❌ Lỗi khi tải nội dung từ Instagram', event.threadID);
    }
}

async function handleTwitter(url, api, event) {
    let processingMsg = null;
    try {
        processingMsg = await sendProcessingMessage(api, event.threadID, "⏳ Đang tải nội dung từ Twitter...");
        
        const data = await Downloader.getMediaInfo(url);
        const downloads = await Downloader.downloadMultipleMedia(data.medias, 'twitter', 4);

        await processingMsg.remove();
        await api.sendMessage({
            body: `=== 𝗫/𝗧𝘄𝗶𝘁𝘁𝗲𝗿 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}\n📊 Media: ${downloads.length} files`,
            attachment: downloads.map(d => fs.createReadStream(d.path))
        }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
    } catch (error) {
        console.error('Twitter error:', error);
        if (processingMsg) await processingMsg.remove();
        api.sendMessage('❌ Lỗi khi tải nội dung từ Twitter', event.threadID);
    }
}

async function handleWeibo(url, api, event) {
    let processingMsg = null;
    try {
        processingMsg = await sendProcessingMessage(api, event.threadID, "⏳ Đang tải nội dung từ Weibo...");
        
        const data = await Downloader.getMediaInfo(url);
        const downloads = await Downloader.downloadMultipleMedia(data.medias, 'weibo', 20);

        await processingMsg.remove();
        await api.sendMessage({
            body: `=== 𝗪𝗲𝗶𝗯𝗼 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}\n📊 Media: ${downloads.length} files`,
            attachment: downloads.map(d => fs.createReadStream(d.path))
        }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
    } catch (error) {
        console.error('Weibo error:', error);
        if (processingMsg) await processingMsg.remove();
        api.sendMessage('❌ Lỗi khi tải nội dung từ Weibo', event.threadID);
    }
}

async function handleXHS(url, api, event) {
    let processingMsg = null;
    try {
        processingMsg = await sendProcessingMessage(api, event.threadID, "⏳ Đang tải nội dung từ Xiaohongshu...");
        
        const data = await Downloader.getMediaInfo(url);
        const downloads = await Downloader.downloadMultipleMedia(data.medias, 'xhs', 10);

        await processingMsg.remove();
        await api.sendMessage({
            body: `=== 𝗫𝗶𝗮𝗼𝗵𝗼𝗻𝗴𝘀𝗵𝘂 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}\n📊 Media: ${downloads.length} files`,
            attachment: downloads.map(d => fs.createReadStream(d.path))
        }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
    } catch (error) {
        console.error('XHS error:', error);
        if (processingMsg) await processingMsg.remove();
        api.sendMessage('❌ Lỗi khi tải nội dung từ Xiaohongshu', event.threadID);
    }
}

async function handleThreads(url, api, event) {
    let processingMsg = null;
    try {
        processingMsg = await sendProcessingMessage(api, event.threadID, "⏳ Đang tải nội dung từ Threads...");
        
        const data = await Downloader.getMediaInfo(url);
        const mediaItems = data.medias || [];

        const videos = mediaItems.filter(m => m.type === 'video');
        const images = mediaItems.filter(m => m.type === 'image');

        if (videos.length > 0) {
            const downloads = await Downloader.downloadMultipleMedia(videos, 'threads', 2);
            await processingMsg.remove();
            await api.sendMessage({
                body: `=== 𝗧𝗵𝗿𝗲𝗮𝗱𝘀 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}`,
                attachment: downloads.map(d => fs.createReadStream(d.path))
            }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
        }
        else if (images.length > 0) {
            const downloads = await Downloader.downloadMultipleMedia(images, 'threads', 10);
            await processingMsg.remove();
            await api.sendMessage({
                body: `=== 𝗧𝗵𝗿𝗲𝗮𝗱𝘀 ===\n\n👤 Author: ${data.author}\n💬 Content: ${data.title}`,
                attachment: downloads.map(d => fs.createReadStream(d.path))
            }, event.threadID, () => downloads.forEach(d => fs.unlinkSync(d.path)));
        }
    } catch (error) {
        console.error('Threads error:', error);
        if (processingMsg) await processingMsg.remove();
        api.sendMessage('❌ Lỗi khi tải nội dung từ Threads', event.threadID);
    }
}

async function handlePinterest(url, api, event) {
    let processingMsg = null;
    try {
        processingMsg = await sendProcessingMessage(api, event.threadID, "⏳ Đang tải nội dung từ Pinterest...");
        const { data } = await axios.post(
            `${ZM_API.BASE_URL}/social/pinterest`,
            { url },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': ZM_API.KEY
                }
            }
        );

        if (!data || data.error) {
            await processingMsg.remove();
            return api.sendMessage('⚠️ Không thể tải nội dung từ Pinterest này.', event.threadID);
        }

        let mediaUrl = data.url;
        if (!mediaUrl) {
            await processingMsg.remove();
            return api.sendMessage('❌ Không tìm thấy media để tải xuống.', event.threadID);
        }

        const filePath = await downloadFile(mediaUrl, data.type || 'jpg');

        await processingMsg.remove();
        await api.sendMessage({
            body: `=== 𝗣𝗶𝗻𝘁𝗲𝗿𝗲𝘀𝘁 ===\n\n📌 Title: ${data.title || 'N/A'}\n👤 Author: ${data.author || 'N/A'}`,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));

    } catch (error) {
        console.error('Pinterest error:', error);
        if (processingMsg) 
        await processingMsg.remove();
        api.sendMessage('❌ Đã xảy ra lỗi khi tải nội dung từ Pinterest.', event.threadID);
    }
}

async function downloadFile(url, type) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(cacheDir, `${Date.now()}.${type}`);
    fs.writeFileSync(filePath, res.data);
    return filePath;
}