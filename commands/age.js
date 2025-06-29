const fs = require('fs');
const path = require('path');
const { Canvas, Image, ImageData, loadImage } = require('canvas');
const faceapi = require('face-api.js');
const axios = require('axios');

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

module.exports = {
  name: "age",
  dev: "HNT",
  usedby: 0,
  category: "Media",
  info: "Đoán tuổi và cảm xúc của người trong ảnh",
  usages: "[reply ảnh]",
  onPrefix: true,
  cooldowns: 5,

  onLaunch: async function({ api, event }) {
    const { threadID, messageID, messageReply } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("Vui lòng reply một ảnh để bot đoán tuổi.", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];
    if (attachment.type === 'video' || attachment.type === 'animated_image') {
      return api.sendMessage("Bot không hỗ trợ phân tích video hoặc GIF. Vui lòng gửi ảnh.", threadID, messageID);
    }

    try {
      const waitMessage = await api.sendMessage("⏳ Đang phân tích khuôn mặt...", threadID);

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk('../assets/models'),
        faceapi.nets.faceLandmark68Net.loadFromDisk('../assets/models'),
        faceapi.nets.faceRecognitionNet.loadFromDisk('../assets/models'),
        faceapi.nets.ageGenderNet.loadFromDisk('../assets/models/'),
        faceapi.nets.faceExpressionNet.loadFromDisk('../assets/models'),
        faceapi.nets.tinyFaceDetector.loadFromDisk('../assets/models')
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
        api.unsendMessage(waitMessage.messageID);
      }, messageID);

    } catch (error) {
      console.error("Lỗi khi phân tích khuôn mặt:", error);
      api.sendMessage("Đã xảy ra lỗi khi phân tích ảnh. Vui lòng thử lại sau.", threadID, messageID);
    }
  }
};

function translateEmotion(emotion) {
  const emotions = {
    'happy': 'Vui vẻ 😊',
    'sad': 'Buồn bã 😢',
    'angry': 'Tức giận 😠',
    'fearful': 'Lo sợ 😨',
    'disgusted': 'Ghê tởm 🤢',
    'surprised': 'Ngạc nhiên 😲',
    'neutral': 'Bình thường 😐'
  };
  return emotions[emotion] || emotion;
}

function getBeautyRating(age, gender) {
  const ratings = [
    "Rất cuốn hút ✨",
    "Xinh đẹp/Đẹp trai 🌟",
    "Dễ thương 💝",
    "Có duyên 🌸",
    "Bình thường 🌼"
  ];
  return ratings[Math.floor(Math.random() * ratings.length)];
}
