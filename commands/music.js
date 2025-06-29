const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

module.exports = {
    name: "music",
    usedby: 0,
    category: "Media",
    info: "Tải nhạc từ Youtube dạng MP3",
    onPrefix: true,
    dev: "HNT",
    cooldowns: 10,

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        if (!global.pyMusicCache || !global.pyMusicCache[threadID]) return;
        
        const input = body.toLowerCase().trim();
        const { videos, searchMessageID } = global.pyMusicCache[threadID];
        const choice = parseInt(input);

        if (isNaN(choice) || choice < 1 || choice > 6) {
            return api.sendMessage("Vui lòng chọn số từ 1 đến 6", threadID, messageID);
        }

        const video = videos[choice - 1];
        const findingMessage = await api.sendMessage(`🎵 | Đang tải nhạc: "${video.title}"...`, threadID, messageID);
        const outputPath = path.resolve(__dirname, 'cache', `pymusic_${Date.now()}.%(ext)s`);
        const finalPath = outputPath.replace('.%(ext)s', '.mp3');

        try {
            const pythonScript = path.resolve(__dirname, '..', 'python', 'video_downloader.py');
            
            const result = await new Promise((resolve, reject) => {
                const python = spawn('python', [pythonScript, 'audio', video.url, outputPath, '128'], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                let output = '';
                let error = '';

                python.stdout.on('data', (data) => {
                    output += data.toString();
                });

                python.stderr.on('data', (data) => {
                    error += data.toString();
                });

                python.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const lines = output.trim().split('\n');
                            let jsonLine = '';
                            
                            for (let i = lines.length - 1; i >= 0; i--) {
                                const line = lines[i].trim();
                                if (line.startsWith('{') && line.endsWith('}')) {
                                    jsonLine = line;
                                    break;
                                }
                            }
                            
                            if (!jsonLine) {
                                reject(new Error(`No valid JSON found in output: "${output}"`));
                                return;
                            }
                            
                            const parsed = JSON.parse(jsonLine);
                            resolve(parsed);
                        } catch (e) {
                            reject(new Error(`Failed to parse Python output. Raw output: "${output}". Parse error: ${e.message}`));
                        }
                    } else {
                        reject(new Error(`Python script failed with code ${code}. Error: ${error || 'Unknown error'}`));
                    }
                });
            });

            if (!result.success) {
                let errorMessage = result.error;
                if (errorMessage.includes('FFmpeg') || errorMessage.includes('ffmpeg')) {
                    errorMessage = `${errorMessage}\n\n💡 Hướng dẫn cài FFmpeg:\n` +
                        '• Windows: Tải từ https://ffmpeg.org và thêm vào PATH\n' +
                        '• Hoặc dùng Chocolatey: choco install ffmpeg\n' +
                        '• Hoặc dùng Winget: winget install ffmpeg\n\n' +
                        '⚠️ Không có FFmpeg sẽ tải file audio gốc (M4A/WEBM)';
                }
                await api.editMessage(`❌ | ${errorMessage}`, findingMessage.messageID, threadID);
                return;
            }

            const { data } = result;
            const views = data.view_count ? data.view_count.toLocaleString() : '0';
            const likes = data.like_count ? data.like_count.toLocaleString() : 'Ẩn';
            const audioPath = data.file_path || finalPath;

            // Clean up any leftover files with different extensions
            const basePath = outputPath.replace('.%(ext)s', '');
            const possibleFiles = [
                basePath + '.mp3',
                basePath + '.m4a', 
                basePath + '.webm',
                basePath + '.ogg',
                basePath + '.aac',
                finalPath
            ];

            let actualFile = audioPath;
            if (!fs.existsSync(actualFile)) {
                // Find any existing file
                for (const file of possibleFiles) {
                    if (fs.existsSync(file)) {
                        actualFile = file;
                        break;
                    }
                }
            }

            if (actualFile && fs.existsSync(actualFile)) {
                const formatInfo = data.format ? ` | Format: ${data.format}` : '';
                const fileExt = path.extname(actualFile).toUpperCase().substring(1);
                
                await api.sendMessage({
                    body: `🎵 ${data.title}\n⏱️ Thời lượng: ${data.duration}\n👤 Kênh: ${data.uploader}\n👍 Lượt thích: ${likes}\n👁️ Lượt xem: ${views}\n📁 Kích thước: ${data.file_size.toFixed(2)}MB${formatInfo || ` | ${fileExt}`}`,
                    attachment: fs.createReadStream(actualFile)
                }, threadID, () => {
                    api.unsendMessage(findingMessage.messageID);
                    api.unsendMessage(searchMessageID);
                    
                    // Clean up all possible files
                    possibleFiles.forEach(file => {
                        if (fs.existsSync(file)) {
                            try { fs.unlinkSync(file); } catch(e) {}
                        }
                    });
                });
            } else {
                await api.editMessage(`❌ | Không thể tìm thấy file audio đã tải`, findingMessage.messageID, threadID);
            }

            delete global.pyMusicCache[threadID];
        } catch (error) {
            // Clean up any files on error
            const basePath = outputPath.replace('.%(ext)s', '');
            const possibleFiles = [
                basePath + '.mp3',
                basePath + '.m4a', 
                basePath + '.webm',
                basePath + '.ogg',
                basePath + '.aac',
                finalPath
            ];
            
            possibleFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    try { fs.unlinkSync(file); } catch(e) {}
                }
            });
            
            await api.editMessage(`❌ | Lỗi khi tải nhạc: ${error.message}`, findingMessage.messageID, threadID);
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        if (!target[0]) {
            return api.sendMessage(`❌ Vui lòng nhập tên bài hát!`, threadID);
        }

        try {
            const musicQuery = target.join(" ");
            const findingMessage = await api.sendMessage(`🔍 | Đang tìm "${musicQuery}". Vui lòng chờ...`, threadID);

            const pythonScript = path.resolve(__dirname, '..', 'python', 'video_downloader.py');
            
            const result = await new Promise((resolve, reject) => {
                const python = spawn('python', [pythonScript, 'search', musicQuery], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                let output = '';
                let error = '';

                python.stdout.on('data', (data) => {
                    output += data.toString();
                });

                python.stderr.on('data', (data) => {
                    error += data.toString();
                });

                python.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const lines = output.trim().split('\n');
                            let jsonLine = '';
                            
                            for (let i = lines.length - 1; i >= 0; i--) {
                                const line = lines[i].trim();
                                if (line.startsWith('{') && line.endsWith('}')) {
                                    jsonLine = line;
                                    break;
                                }
                            }
                            
                            if (!jsonLine) {
                                reject(new Error(`No valid JSON found in output: "${output}"`));
                                return;
                            }
                            
                            const parsed = JSON.parse(jsonLine);
                            resolve(parsed);
                        } catch (e) {
                            reject(new Error(`Failed to parse Python output. Raw output: "${output}". Parse error: ${e.message}`));
                        }
                    } else {
                        reject(new Error(`Python script failed with code ${code}. Error: ${error || 'Unknown error'}`));
                    }
                });
            });

            if (!result.success) {
                return api.editMessage(`❌ | Lỗi tìm kiếm: ${result.error}`, findingMessage.messageID, threadID);
            }

            const videos = result.videos;
            if (!videos.length) {
                return api.editMessage(`❌ | Không tìm thấy bài hát: "${musicQuery}"`, findingMessage.messageID, threadID);
            }

            const body = "🎵 Kết quả tìm kiếm nhạc:\n\n" + 
                videos.map((video, index) => 
                    `${index + 1}. ${video.title}\n└── 👤 ${video.uploader}\n└── ⏱️ ${video.duration}\n└── 👁️ ${video.view_count.toLocaleString()} lượt xem\n\n`
                ).join("") + 
                "💡 Reply số từ 1-6 để chọn bài hát";

            const msg = await api.sendMessage(body, threadID, messageID);

            global.pyMusicCache = global.pyMusicCache || {};
            global.pyMusicCache[threadID] = {
                videos,
                searchMessageID: msg.messageID 
            };

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: event.senderID
            });

            api.unsendMessage(findingMessage.messageID);

        } catch (error) {
            await api.sendMessage(`❌ | Lỗi: ${error.message}`, threadID);
        }
    }
};