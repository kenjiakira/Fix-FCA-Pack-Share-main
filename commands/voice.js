const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const ffmpegPath = 'D:\\ffmpeg\\bin\\ffmpeg.exe';

module.exports = {
    name: "voice",
    info: "Chuyển văn bản thành giọng nó",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ["voice", "voic"],
    usages: "[giọng] [văn bản]",
    cooldowns: 5,

    onLaunch: async function ({ event, target, actions }) {
        try {
            const { createReadStream, unlinkSync } = require("fs-extra");

            const content = (event.type == "message_reply") ? event.messageReply.body : target.join(" ").trim();
            if (!content) {
                return await actions.reply("Vui lòng nhập văn bản cần chuyển thành giọng nói!");
            }

            const voiceOptions = {
                "1": "vi-VN-Standard-A", 
                "2": "vi-VN-Standard-B", 
                "3": "vi-VN-Standard-C",
                "4": "vi-VN-Standard-D"  
            };

            const selectedVoice = ["1", "2", "3", "4"].includes(target[0]) ? voiceOptions[target[0]] : voiceOptions["1"];
            const textToSynthesize = (["1", "2", "3", "4"].includes(target[0]))
                ? content.slice(2).trim()
                : content;

            if (!textToSynthesize) {
                return await actions.reply("Văn bản đầu vào không được để trống.");
            }

            const chunks = splitTextIntoChunks(textToSynthesize, 200);
            const tempFiles = [];
            const finalPath = path.join(__dirname, 'cache', `${event.threadID}_${event.senderID}.mp3`);

            for (let i = 0; i < chunks.length; i++) {
                const chunkPath = path.join(__dirname, 'cache', `chunk_${i}_${event.threadID}.mp3`);
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunks[i])}&tl=vi&client=tw-ob`;
                
                await downloadAudio(url, chunkPath);
                tempFiles.push(chunkPath);
            }

            if (tempFiles.length === 1) {
                // If only one chunk, just rename it
                fs.renameSync(tempFiles[0], finalPath);
            } else {
                // Create file list for ffmpeg
                const fileList = tempFiles.map(file => `file '${file}'`).join('\n');
                const listPath = path.join(__dirname, 'cache', `list_${event.threadID}.txt`);
                fs.writeFileSync(listPath, fileList);

                // Combine audio files using ffmpeg
                await execAsync(`"${ffmpegPath}" -f concat -safe 0 -i "${listPath}" -c copy "${finalPath}"`);
                unlinkSync(listPath);
            }

            tempFiles.forEach(file => {
                if (fs.existsSync(file)) unlinkSync(file);
            });

            await actions.reply({ attachment: createReadStream(finalPath) });
            unlinkSync(finalPath);

        } catch (error) {
            console.error("Unexpected Error:", error.message);
            await actions.reply("Đã xảy ra lỗi khi thực hiện chuyển văn bản thành giọng nói.");
        }
    }
};

function splitTextIntoChunks(text, maxLength) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length <= maxLength) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = sentence;
        }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

async function downloadAudio(url, outputPath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
