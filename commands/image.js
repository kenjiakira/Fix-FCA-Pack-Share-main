const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { Canvas, Image, ImageData, loadImage, createCanvas } = require('canvas');
const faceapi = require('face-api.js');
const { ZM_API, IMAGE } = require('../utils/api');

require('dotenv').config();

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

module.exports = {
  name: "image",
  category: "Media",
  info: "Công cụ xử lý hình ảnh",
  dev: "Merged by HNT",
  usages: "[subcommand] [options]",
  cooldowns: 5,
  onPrefix: true,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, messageReply } = event;
    const subcommand = target[0]?.toLowerCase();

    switch (subcommand) {
      case "search":
        await this.handleSearch(api, event, target.slice(1));
        break;
      case "pin":
        await this.handlePinterest(api, event, target.slice(1));
        break;
      case "wall":
        await this.handleWallpaper(api, event);
        break;
      case "face":
        await this.analyzeFace({ api, event, messageReply });
        break;
      case "album":
        await this.createAlbum({ api, event, messageReply, target: target.slice(1) });
        break;
      case "removebg":
        await this.removeBackground({ api, event, messageReply });
        break;
      default:
        api.sendMessage(
          "📸 Image Tools\n" +
          "➜ search <từ khóa> -<số lượng>: Tìm ảnh (VD: search mèo -5)\n" +
          "➜ pin <link>: Tải ảnh từ Pinterest\n" +
          "➜ wall: Lấy hình nền ngẫu nhiên\n" +
          "➜ face: Phân tích khuôn mặt\n" +
          "➜ album: Tạo album ảnh\n" +
          "➜ removebg: Xóa nền ảnh",
          threadID, messageID
        );
    }
  },

  handleSearch: async function (api, event, target) {
    const keySearch = target.join(" ");
    if (!keySearch.includes("-")) {
        return api.sendMessage("⛔ Vui lòng nhập theo định dạng: image search <từ khóa> -<số lượng>", event.threadID);
    }

    const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim();
    let numberSearch = parseInt(keySearch.split("-").pop().trim()) || 10;
    numberSearch = Math.min(Math.max(numberSearch, 1), 10);

    const loadingMsg = await api.sendMessage("⏳ Đang tìm kiếm...", event.threadID);
    
    try {
        const res = await axios.get(`${IMAGE.PINTEREST_BASE_URL}?title=${keySearchs}&count=${numberSearch}`);
        const data = res.data.data;

        if (!data || data.length === 0) {
            throw new Error(`Không tìm thấy kết quả cho "${keySearchs}"`);
        }

        const imgData = [];
        for (let i = 0; i < Math.min(numberSearch, data.length); i++) {
            const imgResponse = await axios.get(data[i], { responseType: "arraybuffer" });
            const imgPath = path.join(cacheDir, `search_${i + 1}.jpg`);
            await fs.outputFile(imgPath, imgResponse.data);
            imgData.push(fs.createReadStream(imgPath));
        }

        await api.sendMessage({
            body: `📸 Kết quả tìm kiếm cho "${keySearchs}"`,
            attachment: imgData
        }, event.threadID);

        api.unsendMessage(loadingMsg.messageID);
        await fs.remove(path.join(cacheDir, "search_*.jpg"));
    } catch (error) {
        throw new Error(`Lỗi tìm kiếm: ${error.message}`);
    }
  },

  handlePinterest: async function (api, event, target) {
    if (!target[0]) {
        return api.sendMessage("❌ Vui lòng nhập link Pinterest", event.threadID);
    }

    const url = target[0];
    if (!url.match(/https?:\/\/(www\.)?pinterest\.(com|ca|fr|jp|co\.uk)\/pin\/[0-9]+/)) {
        return api.sendMessage("❌ Link Pinterest không hợp lệ!", event.threadID);
    }

    const loadingMsg = await api.sendMessage("⏳ Đang tải...", event.threadID);

    try {
        const { data } = await axios.post(
            `${ZM_API.BASE_URL}/social/pinterest`,
            { url },
            { headers: { 'Content-Type': 'application/json', 'apikey': ZM_API.KEY } }
        );

        if (!data || data.error || !data.url) {
            throw new Error('Không thể tải nội dung');
        }

        const response = await axios.get(data.url, { responseType: 'arraybuffer' });
        const tempPath = path.join(cacheDir, `pin_${Date.now()}.${data.type || 'jpg'}`);
        fs.writeFileSync(tempPath, response.data);

        await api.sendMessage({
            body: `📍 Pinterest\n👤 Author: ${data.author || 'N/A'}`,
            attachment: fs.createReadStream(tempPath)
        }, event.threadID, () => {
            fs.unlinkSync(tempPath);
            api.unsendMessage(loadingMsg.messageID);
        });
    } catch (error) {
        throw new Error(`Lỗi tải Pinterest: ${error.message}`);
    }
  },

  handleWallpaper: async function (api, event) {
    const loadingMsg = await api.sendMessage("⏳ Đang tải hình nền...", event.threadID);

    try {
        const response = await axios.get(`${IMAGE.UNSPLASH_BASE_URL}/photos/random`, {
            params: { count: 4, orientation: 'landscape', query: 'wallpaper' },
            headers: { 'Authorization': `Client-ID ${IMAGE.UNSPLASH_ACCESS_KEY}` }
        });

        if (!response.data || response.data.length === 0) {
            throw new Error('Không tìm thấy hình nền.');
        }

        const imageUrls = response.data.map(photo => photo.urls.full);
        const attachments = [];

        for (let i = 0; i < imageUrls.length; i++) {
            const tempPath = path.join(cacheDir, `wall_${i + 1}.jpg`);
            const imgResponse = await axios.get(imageUrls[i], { responseType: 'arraybuffer' });
            fs.writeFileSync(tempPath, imgResponse.data);
            attachments.push(fs.createReadStream(tempPath));
            if (i < imageUrls.length - 1) await delay(1000);
        }

        await api.sendMessage({
            body: "🌟 Hình nền đẹp cho bạn!",
            attachment: attachments
        }, event.threadID, () => {
            fs.readdirSync(cacheDir)
                .filter(file => file.startsWith('wall_'))
                .forEach(file => fs.unlinkSync(path.join(cacheDir, file)));
            api.unsendMessage(loadingMsg.messageID);
        });
    } catch (error) {
        throw new Error(`Lỗi tải hình nền: ${error.message}`);
    }
  },

  analyzeFace: async function ({ api, event, messageReply }) {
    const { threadID, messageID } = event;
    const attachment = messageReply.attachments[0];

    if (attachment.type === 'video' || attachment.type === 'animated_image') {
      return api.sendMessage("Bot không hỗ trợ phân tích video hoặc GIF. Vui lòng gửi ảnh.", threadID, messageID);
    }

    try {
      const waitMessage = await api.sendMessage("⏳ Đang phân tích khuôn mặt...", threadID);

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk('./commands/models'),
        faceapi.nets.faceLandmark68Net.loadFromDisk('./commands/models'),
        faceapi.nets.faceRecognitionNet.loadFromDisk('./commands/models'),
        faceapi.nets.ageGenderNet.loadFromDisk('./commands/models/'),
        faceapi.nets.faceExpressionNet.loadFromDisk('./commands/models'),
        faceapi.nets.tinyFaceDetector.loadFromDisk('./commands/models')
      ]);

      const imageUrl = attachment.url;
      const imageFileName = `image_${Date.now()}.jpg`;
      const imagePath = path.join(cacheDir, imageFileName);

      const response = await axios({
        url: imageUrl,
        responseType: 'stream',
      });

      await new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(imagePath))
          .on('finish', resolve)
          .on('error', reject);
      });

      const imgBuffer = fs.readFileSync(imagePath);
      const image = await loadImage(imgBuffer);

      const detections = await faceapi
        .detectAllFaces(image)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      if (detections.length === 0) {
        fs.unlinkSync(imagePath);
        return api.sendMessage("Bot không phát hiện khuôn mặt nào trong ảnh. Vui lòng gửi ảnh khác.", threadID, messageID);
      }

      const canvas = faceapi.createCanvasFromMedia(image);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      detections.forEach(detection => {
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: `${Math.round(detection.age)}T (${detection.gender})`,
          boxColor: detection.gender === 'male' ? '#00ff00' : '#ff00ff'
        });
        drawBox.draw(canvas);

        const expressions = detection.expressions;
        const mainExpression = Object.entries(expressions)
          .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${mainExpression} (${Math.round(expressions[mainExpression] * 100)}%)`, 
          box.x, box.y - 5);
      });

      const outputPath = path.join(cacheDir, `analyzed_${Date.now()}.jpg`);
      const stream = canvas.createJPEGStream();
      await new Promise((resolve, reject) => {
        stream.pipe(fs.createWriteStream(outputPath))
          .on('finish', resolve)
          .on('error', reject);
      });

      let analysis = `📊 Kết quả phân tích:\n\n`;
      detections.forEach((detection, index) => {
        const age = Math.round(detection.age);
        const gender = detection.gender === 'male' ? 'Nam' : 'Nữ';
        const mainEmotion = Object.entries(detection.expressions)
          .reduce((a, b) => a[1] > b[1] ? a : b)[0];

        analysis += `👤 Người ${index + 1}:\n`;
        analysis += `├─ Tuổi: ${age}\n`;
        analysis += `├─ Giới tính: ${gender}\n`;
        analysis += `├─ Cảm xúc: ${translateEmotion(mainEmotion)}\n`;
        analysis += `└─ Đánh giá: ${getBeautyRating(age, gender)}\n\n`;
      });

      await api.sendMessage({
        body: analysis,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        fs.unlinkSync(outputPath);
        fs.unlinkSync(imagePath);
        api.unsendMessage(waitMessage.messageID);
      }, messageID);

    } catch (error) {
      console.error("Lỗi khi phân tích khuôn mặt:", error);
      api.sendMessage("Đã xảy ra lỗi khi phân tích ảnh. Vui lòng thử lại sau.", threadID, messageID);
    }
  },

  createAlbum: async function ({ api, event, messageReply, target }) {
    const { threadID, messageID } = event;

    let backgroundColor = '#121212';
    let layoutType = 'auto';
    let filter = 'none';
    let caption = '';

    for (const arg of target) {
      if (arg.startsWith('bg:')) {
        backgroundColor = arg.substring(3).trim() || backgroundColor;
      } else if (arg.startsWith('layout:')) {
        layoutType = arg.substring(7).trim() || layoutType;
      } else if (arg.startsWith('filter:')) {
        filter = arg.substring(7).trim() || filter;
      } else if (arg.startsWith('caption:')) {
        caption = arg.substring(8).trim() || caption;
      }
    }

    if (!messageReply.attachments || messageReply.attachments.length < 2) {
      return api.sendMessage("Vui lòng reply nhiều ảnh để ghép album (ít nhất 2 ảnh).", threadID, messageID);
    }

    const attachments = messageReply.attachments.filter(att => att.type === 'photo');
    if (attachments.length < 2) {
      return api.sendMessage("Cần ít nhất 2 ảnh để tạo album.", threadID, messageID);
    }

    api.sendMessage("⏳ Đang xử lý ghép ảnh...", threadID, messageID);

    try {
      const images = await Promise.all(
        attachments.map(async (attachment) => {
          try {
            const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            return await loadImage(Buffer.from(response.data));
          } catch (err) {
            console.error("Error loading image:", err);
            return null;
          }
        })
      );

      const validImages = images.filter(img => img !== null);

      if (validImages.length < 2) {
        return api.sendMessage("❌ Không đủ ảnh hợp lệ để tạo album (cần ít nhất 2 ảnh).", threadID, messageID);
      }

      const config = getLayoutConfig(validImages.length, layoutType);

      if (backgroundColor) {
        config.background = backgroundColor;
      }

      const imageSize = Math.min(
        Math.floor((config.maxSize - config.padding * (config.cols + 1)) / config.cols),
        Math.floor((config.maxSize - config.padding * (config.rows + 1)) / config.rows)
      );

      const canvasWidth = imageSize * config.cols + config.padding * (config.cols + 1);
      const canvasHeight = imageSize * config.rows + config.padding * (config.rows + 1);

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = config.background;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      let x = config.padding;
      let y = config.padding;
      let col = 0;

      for (let i = 0; i < validImages.length; i++) {
        const img = validImages[i];

        ctx.save();
        applyEffects(ctx, x, y, imageSize, imageSize, config.effects);

        const aspectRatio = img.width / img.height;
        let drawWidth = imageSize;
        let drawHeight = imageSize;

        if (aspectRatio > 1) {
          drawHeight = drawWidth / aspectRatio;
        } else {
          drawWidth = drawHeight * aspectRatio;
        }

        const offsetX = (imageSize - drawWidth) / 2;
        const offsetY = (imageSize - drawHeight) / 2;

        ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);

        applyFilter(ctx, x, y, imageSize, imageSize, filter);

        if (i === 0 && caption) {
          addCaption(ctx, caption, x, y + imageSize - 80, imageSize);
        }

        ctx.restore();

        col++;
        if (col >= config.cols) {
          col = 0;
          x = config.padding;
          y += imageSize + config.padding;
        } else {
          x += imageSize + config.padding;
        }
      }

      const outputPath = path.join(cacheDir, `album_${Date.now()}.${config.optimization.format}`);
      const out = fs.createWriteStream(outputPath);

      if (config.optimization.format === 'jpg') {
        const stream = canvas.createJPEGStream({
          quality: config.optimization.quality,
          chromaSubsampling: true
        });
        stream.pipe(out);
      } else {
        const stream = canvas.createPNGStream();
        stream.pipe(out);
      }

      out.on('finish', () => {
        api.sendMessage(
          {
            body: `✅ Album đã được tạo thành công!\n${filter !== 'none' ? `• Bộ lọc: ${filter}\n` : ''}${caption ? `• Chú thích: "${caption}"\n` : ''}• Bố cục: ${layoutType !== 'auto' ? layoutType : 'tự động'}`,
            attachment: fs.createReadStream(outputPath)
          },
          threadID,
          () => fs.unlinkSync(outputPath),
          messageID
        );
      });

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Có lỗi xảy ra khi ghép ảnh: " + error.message, threadID, messageID);
    }
  },

  removeBackground: async function ({ api, event, messageReply }) {
    const { threadID, messageID } = event;

    const successMessage = `━━『 TÁCH NỀN ẢNH 』━━
[🎯] → Tách nền ảnh thành công!
[💝] → Ảnh đã được xử lý và loại bỏ background
[⚜️] → Chúc bạn một ngày tốt lành!`;

    const inputPath = path.join(cacheDir, `photo_${Date.now()}.png`);
    const outputPath = path.join(cacheDir, `photo_nobg_${Date.now()}.png`);

    try {
      const waitMessage = await api.sendMessage("━━『 ĐANG XỬ LÝ 』━━\n[⏳] → Đang tách nền ảnh...\n[💫] → Vui lòng chờ trong giây lát!", threadID);

      const response = await axios.get(messageReply.attachments[0].url, { responseType: 'arraybuffer' });
      fs.writeFileSync(inputPath, Buffer.from(response.data));

      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('image_file', fs.createReadStream(inputPath), path.basename(inputPath));

      const apiKey = IMAGE.REMOVE_BG_API_KEYS[Math.floor(Math.random() * IMAGE.REMOVE_BG_API_KEYS.length)];
      
      if (!apiKey) {
        throw new Error('Không có API key Remove.bg hợp lệ');
      }

      const removeResponse = await axios({
        method: 'post',
        url: IMAGE.REMOVE_BG_BASE_URL,
        data: formData,
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': apiKey,
        },
        encoding: null
      });

      if (removeResponse.status !== 200) {
        throw new Error(`Error: ${removeResponse.status} - ${removeResponse.statusText}`);
      }

      fs.writeFileSync(outputPath, removeResponse.data);

      await api.sendMessage(
        { 
          body: successMessage, 
          attachment: fs.createReadStream(outputPath) 
        }, 
        threadID, 
        () => {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
          api.unsendMessage(waitMessage.messageID);
        },
        messageID
      );

    } catch (error) {
      console.error('Lỗi:', error);
      api.sendMessage(`━━『 LỖI XỬ LÝ 』━━\n[❗] → Đã xảy ra lỗi: ${error.message}\n[💠] → Vui lòng thử lại sau hoặc liên hệ admin.`, threadID, messageID);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  },

  onLaunch: async function ({ api, event, actions }) {
    const { threadID, messageID, messageReply } = event;
    
    // Đường dẫn đến file JSON lưu trữ các link ảnh
    const jsonPath = path.join(__dirname, '../database/json/communityImages.json');
    
    // Đảm bảo file JSON tồn tại
    if (!fs.existsSync(jsonPath)) {
        fs.writeFileSync(jsonPath, JSON.stringify({
            images: [],
            contributors: {}
        }, null, 2));
    }

    // Đọc dữ liệu từ file JSON
    let imageData;
    try {
        imageData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (error) {
        console.error('Lỗi khi đọc file communityImages.json:', error);
        imageData = { images: [], contributors: {} };
    }

    // Nếu người dùng reply một ảnh, thêm vào kho ảnh
    if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
        const attachments = messageReply.attachments.filter(att => att.type === 'photo');
        
        if (attachments.length === 0) {
            return actions.reply("Vui lòng reply một hình ảnh để thêm vào kho ảnh cộng đồng.", threadID, messageID);
        }

        let uploadPromises = attachments.map(async (attachment) => {
            const fileUrl = attachment.url;
            const tempFilePath = path.join(__dirname, 'cache', `temp_image_${Date.now()}.jpg`);

            try {
                const response = await axios({
                    url: fileUrl,
                    responseType: 'stream',
                    timeout: 15000
                });

                const writer = fs.createWriteStream(tempFilePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const form = new FormData();
                form.append('image', fs.createReadStream(tempFilePath));

                const imgurResponse = await axios.post(`${IMAGE.IMGUR_BASE_URL}/image`, form, {
                    headers: {
                        ...form.getHeaders(),
                        Authorization: `Client-ID ${IMAGE.IMGUR_CLIENT_ID}`
                    },
                    timeout: 30000
                });

                const imgurUrl = imgurResponse.data.data.link;

                // Xóa file tạm
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }

                return imgurUrl;
            } catch (error) {
                console.error(`Lỗi khi xử lý tệp ${fileUrl}:`, error);
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
                throw error;
            }
        });

        try {
            const results = await Promise.all(uploadPromises);
            let successCount = 0;
            
            for (const imgurUrl of results) {
                if (imgurUrl && imgurUrl.startsWith('http')) {
                    // Thêm ảnh vào kho dữ liệu
                    const contributorId = event.senderID;
                    imageData.images.push({
                        url: imgurUrl,
                        contributorId: contributorId,
                        timestamp: Date.now()
                    });
                    
                    // Cập nhật thông tin người đóng góp
                    if (!imageData.contributors[contributorId]) {
                        imageData.contributors[contributorId] = {
                            count: 0,
                            lastContribution: null
                        };
                    }
                    imageData.contributors[contributorId].count++;
                    imageData.contributors[contributorId].lastContribution = Date.now();
                    
                    successCount++;
                }
            }

            // Lưu dữ liệu cập nhật
            fs.writeFileSync(jsonPath, JSON.stringify(imageData, null, 2));
            
            await actions.reply(`Đã thêm ${successCount} ảnh vào kho ảnh cộng đồng. Cảm ơn bạn đã đóng góp!`, threadID, messageID);
            
        } catch (error) {
            console.error('Lỗi khi tải ảnh lên Imgur:', error);
            await actions.reply("Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại sau.", threadID, messageID);
        }
    } 
    // Nếu người dùng chỉ gõ lệnh, hiển thị một ảnh ngẫu nhiên
    else {
        if (imageData.images.length === 0) {
            return actions.reply("Hiện chưa có ảnh nào trong kho ảnh cộng đồng. Hãy là người đầu tiên đóng góp ảnh!", threadID, messageID);
        }

        try {
            // Chọn ngẫu nhiên một ảnh từ kho
            const randomIndex = Math.floor(Math.random() * imageData.images.length);
            const randomImage = imageData.images[randomIndex];
            
            // Lấy thông tin người đóng góp
            let contributorInfo = "Một thành viên cộng đồng";
            try {
                const userInfo = await api.getUserInfo(randomImage.contributorId);
                if (userInfo && userInfo[randomImage.contributorId]) {
                    contributorInfo = userInfo[randomImage.contributorId].name || "Một thành viên cộng đồng";
                }
            } catch (error) {
                console.error('Không thể lấy thông tin người đóng góp:', error);
            }
            
            // Tải ảnh từ Imgur
            const tempPath = path.join(__dirname, 'cache', `community_image_${Date.now()}.jpg`);
            
            const imageResponse = await axios({
                method: 'get',
                url: randomImage.url,
                responseType: 'stream',
                timeout: 15000
            });

            const writer = fs.createWriteStream(tempPath);
            imageResponse.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            
            // Gửi ảnh cho người dùng với thêm hướng dẫn sử dụng
            await api.sendMessage({
                body: `『 🌸 』→ Ảnh từ kho ảnh cộng đồng\n『 💓 』→ Đóng góp bởi: ${contributorInfo}\n『 📊 』→ Tổng số ảnh: ${imageData.images.length}\n\n『 📝 』→ Các lệnh khác:\n• image search <từ khóa> -<số lượng>: Tìm ảnh\n• image pin <link>: Tải ảnh từ Pinterest\n• image wall: Lấy hình nền ngẫu nhiên\n• image face: Phân tích khuôn mặt\n• image album: Tạo album ảnh\n• image removebg: Xóa nền ảnh`,
                attachment: fs.createReadStream(tempPath)
            }, threadID, () => {
                // Xóa file tạm sau khi gửi
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            });

        } catch (error) {
            console.error('Lỗi khi gửi ảnh:', error);
            await actions.reply("Có lỗi xảy ra khi lấy ảnh. Vui lòng thử lại sau.", threadID, messageID);
        }
    }
  }
};
