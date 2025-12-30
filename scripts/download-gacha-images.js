const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Import CUSTOM_CHARACTER_IMAGES_URLS từ gacha.js
const gachaPath = path.join(__dirname, '../commands/gacha.js');
const gachaContent = fs.readFileSync(gachaPath, 'utf8');

// Extract CUSTOM_CHARACTER_IMAGES_URLS object
const imagesMatch = gachaContent.match(/const CUSTOM_CHARACTER_IMAGES_URLS = \{([\s\S]*?)\};/);
if (!imagesMatch) {
  console.error('❌ Không tìm thấy CUSTOM_CHARACTER_IMAGES_URLS trong gacha.js');
  process.exit(1);
}

// Parse the object manually
const imagesContent = imagesMatch[1];
const imageEntries = [];
const regex = /(\w+|"[^"]+"):\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(imagesContent)) !== null) {
  const charName = match[1].replace(/"/g, '');
  const imageUrl = match[2];
  imageEntries.push({ charName, imageUrl });
}

const assetsDir = path.join(__dirname, '../assets/gacha');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('✅ Đã tạo thư mục assets/gacha/');
}

async function downloadImage(charName, imageUrl) {
  try {
    // Normalize URL - imgur URLs có thể cần .png extension
    let url = imageUrl;
    if (url.includes('imgur.com/') && !url.endsWith('.png') && !url.endsWith('.jpg') && !url.endsWith('.jpeg')) {
      url = url + '.png';
    }
    
    // Normalize URL format
    if (url.startsWith('https://imgur.com/')) {
      url = url.replace('https://imgur.com/', 'https://i.imgur.com/');
    }

    const fileName = `${charName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    const filePath = path.join(assetsDir, fileName);

    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  Đã tồn tại: ${charName} -> ${fileName}`);
      return { charName, fileName, success: true, skipped: true };
    }

    console.log(`⬇️  Đang tải: ${charName}...`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    fs.writeFileSync(filePath, response.data);
    console.log(`✅ Đã tải: ${charName} -> ${fileName}`);
    return { charName, fileName, success: true, skipped: false };
  } catch (error) {
    console.error(`❌ Lỗi khi tải ${charName}:`, error.message);
    return { charName, fileName: null, success: false, error: error.message };
  }
}

async function downloadAllImages() {
  console.log(`📥 Bắt đầu tải ${imageEntries.length} hình ảnh...\n`);

  const results = [];
  for (let i = 0; i < imageEntries.length; i++) {
    const { charName, imageUrl } = imageEntries[i];
    const result = await downloadImage(charName, imageUrl);
    results.push(result);
    
    // Delay để tránh rate limit
    if (i < imageEntries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n📊 Kết quả:');
  const successful = results.filter(r => r.success && !r.skipped);
  const skipped = results.filter(r => r.success && r.skipped);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Thành công: ${successful.length}`);
  console.log(`⏭️  Đã có sẵn: ${skipped.length}`);
  console.log(`❌ Thất bại: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Các hình ảnh thất bại:');
    failed.forEach(r => console.log(`   - ${r.charName}: ${r.error}`));
  }

  return results;
}

// Run script
if (require.main === module) {
  downloadAllImages()
    .then(() => {
      console.log('\n✅ Hoàn thành!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Lỗi:', error);
      process.exit(1);
    });
}

module.exports = { downloadAllImages, downloadImage };

