const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const gradient = require('gradient-string');
const FormData = require('form-data');
const ytdl = require('ytdl-core');
const simpleYT = require('simple-youtube-api');
const youtube = new simpleYT('AIzaSyCMWAbuVEw0H26r94BhyFU4mTaP5oUGWRw');
const getFBInfo = require('@xaviabot/fb-downloader');

const ffmpegPath = 'D:\\ffmpeg\\bin\\ffmpeg.exe';
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const patterns = {
    capcut: /https:\/\/www\.capcut\.com\/t\/\S*/,
    facebook: /https:\/\/www\.facebook\.com\/\S*/,
    tiktok: /(^https:\/\/)((vm|vt|www|v)\.)?(tiktok|douyin)\.com\//,
    youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
};

module.exports = {
    name: 'atd',
    ver: '1.0',
    prog: 'HNT',

    onEvents: async function ({ api, event }) {
        if (event.type !== 'message') return;
        const message = event.body.trim();

        if (patterns.capcut.test(message)) {
            await handleCapCut(message, api, event);
        } else if (patterns.facebook.test(message)) {
            await handleFacebook(message, api, event);
        } else if (patterns.tiktok.test(message)) {
            await handleTikTok(message, api, event);
        } else if (patterns.youtube.test(message)) {
            await handleYouTube(message, api, event);
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
            body: '𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿 𝗔𝘂𝘁𝗼',
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
        const mp3Path = await convertVideoToMp3(videoPath);
        const downloadLink = await uploadToFileIo(mp3Path);

        api.sendMessage({
            body: `🎬 - Tiêu đề: ${tiktok.title}\n🔗 - Link tải MP3: ${downloadLink}`,
            attachment: fs.createReadStream(videoPath),
        }, event.threadID, () => {
            cleanupFiles([videoPath, mp3Path]);
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
                body: `𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿 𝗔𝘂𝘁𝗼\n━━━━━━━━━━━━━━━━━━\nTitle: ${video.title}`,
                attachment: fs.createReadStream(filePath),
            }, event.threadID, () => fs.unlinkSync(filePath));
        });
    } catch (error) {
        console.error('Error with YouTube:', error);
    }
}

async function downloadFile(url, type) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(cacheDir, `${Date.now()}.${type}`);
    fs.writeFileSync(filePath, res.data);
    return filePath;
}

function convertVideoToMp3(videoPath) {
    return new Promise((resolve, reject) => {
        const mp3Path = videoPath.replace(/\.(mp4|avi|mov)$/, '.mp3');
        const ffmpegCmd = `"${ffmpegPath}" -i "${videoPath}" -vn -ar 44100 -ac 2 -b:a 192k "${mp3Path}"`;

        exec(ffmpegCmd, (error) => {
            if (error) reject(error);
            else resolve(mp3Path);
        });
    });
}

async function uploadToFileIo(filePath) {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    const res = await axios.post('https://file.io', form, { headers: form.getHeaders() });
    return res.data.link;
}

function cleanupFiles(paths) {
    paths.forEach((filePath) => fs.existsSync(filePath) && fs.unlinkSync(filePath));
}
