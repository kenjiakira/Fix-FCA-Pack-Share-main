const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

module.exports = {
    name: "video",
    usedby: 0,
    category: "Media",
    info: "Tải video từ Youtube",
    onPrefix: true,
    dev: "HNT",
    cooldowns: 10,

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        if (!global.pyVideoCache || !global.pyVideoCache[threadID]) return;
        
        const input = body.toLowerCase().trim();
        const { videos, searchMessageID } = global.pyVideoCache[threadID];
        const choice = parseInt(input);

        if (isNaN(choice) || choice < 1 || choice > 6) {
            return api.sendMessage("Vui lòng chọn số từ 1 đến 6", threadID, messageID);
        }

        const video = videos[choice - 1];
        const findingMessage = await api.sendMessage(`⏳ | Đang tải xuống: "${video.title}"...`, threadID, messageID);
        const outputPath = path.resolve(__dirname, 'cache', `pyvideo_${Date.now()}.%(ext)s`);
        const finalPath = outputPath.replace('.%(ext)s', '.mp4');

        try {
            const pythonScript = path.resolve(__dirname, '..', 'python', 'video_downloader.py');
            
            const result = await new Promise((resolve, reject) => {
                const python = spawn('python', [pythonScript, 'download', video.url, finalPath, '720p'], {
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
                await api.editMessage(`❌ | Lỗi: ${result.error}`, findingMessage.messageID, threadID);
                return;
            }

            const { data } = result;
            const views = data.view_count ? data.view_count.toLocaleString() : '0';
            const likes = data.like_count ? data.like_count.toLocaleString() : 'Ẩn';

            if (fs.existsSync(finalPath)) {
                await api.sendMessage({
                    body: `🎥 Video: ${data.title}\n⏱️ Thời lượng: ${data.duration}\n👤 Kênh: ${data.uploader}\n👍 Lượt thích: ${likes}\n👁️ Lượt xem: ${views}\n📁 Kích thước: ${data.file_size.toFixed(2)}MB`,
                    attachment: fs.createReadStream(finalPath)
                }, threadID, () => {
                    api.unsendMessage(findingMessage.messageID);
                    api.unsendMessage(searchMessageID);
                    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
                });
            } else {
                await api.editMessage(`❌ | Không thể tải video`, findingMessage.messageID, threadID);
            }

            delete global.pyVideoCache[threadID];
        } catch (error) {
            if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
            await api.editMessage(`❌ | Lỗi khi tải video: ${error.message}`, findingMessage.messageID, threadID);
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        if (!target[0]) {
            return api.sendMessage(`❌ Vui lòng nhập tên video!`, threadID);
        }

        try {
            const videoQuery = target.join(" ");
            const findingMessage = await api.sendMessage(`🔍 | Đang tìm "${videoQuery}". Vui lòng chờ...`, threadID);

            const pythonScript = path.resolve(__dirname, '../python/video_downloader.py');
            
            const result = await new Promise((resolve, reject) => {
                const python = spawn('python', [pythonScript, 'search', videoQuery], {
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
                return api.editMessage(`❌ | Không tìm thấy video: "${videoQuery}"`, findingMessage.messageID, threadID);
            }

            const body = "🎥 Kết quả tìm kiếm (Python):\n\n" + 
                videos.map((video, index) => 
                    `${index + 1}. ${video.title}\n└── 👤 ${video.uploader}\n└── ⏱️ ${video.duration}\n└── 👁️ ${video.view_count.toLocaleString()} lượt xem\n\n`
                ).join("") + 
                "💡 Reply số từ 1-6 để chọn video";

            const msg = await api.sendMessage(body, threadID, messageID);

            global.pyVideoCache = global.pyVideoCache || {};
            global.pyVideoCache[threadID] = {
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
