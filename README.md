# 🤖 FIX-FCA-AKI-2.0 - Advanced Facebook Chatbot

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0-orange.svg)]()

---

## 📋 Table of Contents / Mục lục

- [English](#english)
  - [Overview](#overview)
  - [Features](#features)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [Commands](#commands)
  - [API Documentation](#api-documentation)
  - [Contributing](#contributing)
  - [License](#license)

- [Tiếng Việt](#tiếng-việt)
  - [Tổng quan](#tổng-quan)
  - [Tính năng](#tính-năng)
  - [Cài đặt](#cài-đặt)
  - [Cấu hình](#cấu-hình)
  - [Sử dụng](#sử-dụng)
  - [Lệnh](#lệnh)
  - [Tài liệu API](#tài-liệu-api)
  - [Đóng góp](#đóng-góp)
  - [Giấy phép](#giấy-phép)

---

# English

## Overview

FIX-FCA-AKI-2.0 is an advanced Facebook Chatbot built with Node.js, featuring a comprehensive gaming system, VIP management, economy system, and extensive command library. This bot provides a rich interactive experience for Facebook groups and pages.

## Features

### 🎮 Gaming System
- **Fishing Game**: Complete fishing system with different fish types, baits, and rewards
- **Mining Game**: Mining simulation with different tools and resources
- **Casino Games**: Various casino games including slots, dice, and card games
- **Gacha System**: Character collection system with different rarities
- **Pokemon System**: Pokemon collection and battle system
- **Family System**: Virtual family management with jobs and education

### 💎 VIP System
- **Multiple VIP Tiers**: Bronze, Silver, and Gold packages
- **Exclusive Benefits**: Special bonuses, reduced cooldowns, and unique features
- **VIP Management**: Admin tools for managing VIP users
- **Custom Badges**: Special VIP badges and visual indicators

### 💰 Economy System
- **Multi-Currency**: Support for different types of currencies
- **Transaction History**: Complete transaction logging
- **Banking System**: Deposit, withdrawal, and loan features
- **Trading System**: Market-based trading with real-time prices

### 🛠️ Admin Tools
- **User Management**: Kick, ban, warn, and manage users
- **Group Management**: Control group settings and permissions
- **System Monitoring**: Real-time bot status and performance metrics
- **Backup System**: Automatic data backup and restoration

### 🎨 Visual Features
- **Canvas Graphics**: Rich visual elements using Canvas API
- **Custom Fonts**: Multiple font options for different styles
- **Image Generation**: Dynamic image creation for games and stats
- **Responsive Design**: Optimized for different screen sizes

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Facebook account with admin privileges

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/FIX-FCA-AKI-2.0.git
cd FIX-FCA-AKI-2.0
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configuration
1. Copy `config.example.json` to `config.json`
2. Edit `config.json` with your settings:
```json
{
  "prefix": ".",
  "adminUIDs": ["your-facebook-uid"],
  "botName": "Your Bot Name",
  "ownerName": "Your Name"
}
```

### Step 4: Facebook Login
1. **Download Extension**: Download this Chrome extension: [Facebook Appstate Extractor](https://chrome-stats.com/d/nlgehefndkobdignlfhapfpggielmdph/download)
2. **Go to Facebook**: Open your Facebook account in Chrome
3. **Open Extension**: Click on the extension icon in your browser
4. **Copy JSON Code**: Copy the generated JSON code from the extension
5. **Create appstate.json**: 
   - Create a new file named `appstate.json` in the project root
   - Paste the copied JSON code into the file
6. **Start the bot**:
```bash
npm start
```

### Step 5: Start Bot
```bash
npm start
```

## Configuration

### Main Configuration (`config.json`)
```json
{
  "prefix": ".",
  "adminUIDs": ["1000123456789"],
  "botName": "AKI Bot",
  "ownerName": "Admin",
  "autoRestart": true,
  "logLevel": "info",
  "database": {
    "type": "json",
    "path": "./data/"
  }
}
```

### VIP Configuration (`game/vip/vipConfig.js`)
```javascript
const VIP_PACKAGES = {
  GOLD: {
    id: 3,
    name: "VIP Gold",
    price: { original: "59,000", sale: "49,000" },
    benefits: {
      miningBonus: 0.8,
      stolenProtection: 1.0,
      withdrawalBonusLimit: 2.0
    }
  }
  // ... more packages
};
```

## Usage

### Basic Commands
```bash
# Check bot status
.ping

# View balance
.balance

# Daily reward
.daily

# Help menu
.help
```

### Admin Commands
```bash
# Add VIP to user
.setvip add [uid] [days]

# Remove VIP
.setvip remove [uid]

# Check VIP status
.setvip check [uid]
```

### Gaming Commands
```bash
# Start fishing
.fish

# Go mining
.mine

# Play casino
.casino

# Open gacha
.gacha
```

## Commands

### Economy Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `.balance` | Check your balance | `.balance` |
| `.daily` | Get daily reward | `.daily` |
| `.work` | Work for money | `.work` |
| `.transfer` | Transfer money | `.transfer [uid] [amount]` |

### Gaming Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `.fish` | Go fishing | `.fish` |
| `.mine` | Mine resources | `.mine` |
| `.casino` | Play casino games | `.casino` |
| `.gacha` | Open gacha | `.gacha` |

### Admin Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `.setvip` | Manage VIP users | `.setvip add/remove/check` |
| `.kick` | Kick user from group | `.kick [uid]` |
| `.ban` | Ban user | `.ban [uid]` |
| `.warn` | Warn user | `.warn [uid]` |

## API Documentation

### Command Structure
```javascript
module.exports = {
    name: "command_name",
    info: "Command description",
    dev: "Developer name",
    category: "Category",
    usages: ["Usage 1", "Usage 2"],
    cooldowns: 5,
    onPrefix: true,
    
    onLaunch: async function ({ api, event, target, actions }) {
        // Command logic here
    }
};
```

### Event Parameters
```javascript
{
    api: Facebook API object,
    event: {
        threadID: "Group/Page ID",
        senderID: "User ID",
        messageID: "Message ID",
        messageReply: "Reply data if any"
    },
    target: ["command", "arg1", "arg2"],
    actions: {
        reply: "Reply function",
        react: "React function",
        edit: "Edit function"
    }
}
```

### Currency System
```javascript
// Add balance
global.currencies.addBalance(userID, amount);

// Subtract balance
global.currencies.subtractBalance(userID, amount);

// Get balance
const balance = global.currencies.getBalance(userID);
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code structure
- Test your changes thoroughly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

# Tiếng Việt

## Tổng quan

FIX-FCA-AKI-2.0 là một Facebook Chatbot tiên tiến được xây dựng bằng Node.js, có hệ thống game toàn diện, quản lý VIP, hệ thống kinh tế và thư viện lệnh phong phú. Bot này cung cấp trải nghiệm tương tác phong phú cho các nhóm và trang Facebook.

## Tính năng

### 🎮 Hệ thống Game
- **Game Câu cá**: Hệ thống câu cá hoàn chỉnh với nhiều loại cá, mồi và phần thưởng
- **Game Đào mỏ**: Mô phỏng đào mỏ với các công cụ và tài nguyên khác nhau
- **Game Casino**: Nhiều trò chơi casino bao gồm slots, xúc xắc và bài
- **Hệ thống Gacha**: Hệ thống sưu tầm nhân vật với các độ hiếm khác nhau
- **Hệ thống Pokemon**: Sưu tầm và chiến đấu Pokemon
- **Hệ thống Gia đình**: Quản lý gia đình ảo với công việc và giáo dục

### 💎 Hệ thống VIP
- **Nhiều cấp VIP**: Gói Bronze, Silver và Gold
- **Quyền lợi độc quyền**: Bonus đặc biệt, giảm thời gian chờ và tính năng độc đáo
- **Quản lý VIP**: Công cụ admin để quản lý người dùng VIP
- **Huy hiệu tùy chỉnh**: Huy hiệu VIP đặc biệt và chỉ báo trực quan

### 💰 Hệ thống Kinh tế
- **Đa tiền tệ**: Hỗ trợ nhiều loại tiền tệ khác nhau
- **Lịch sử giao dịch**: Ghi log giao dịch hoàn chỉnh
- **Hệ thống Ngân hàng**: Tính năng gửi, rút và vay tiền
- **Hệ thống Giao dịch**: Giao dịch dựa trên thị trường với giá thời gian thực

### 🛠️ Công cụ Admin
- **Quản lý người dùng**: Kick, ban, cảnh cáo và quản lý người dùng
- **Quản lý nhóm**: Kiểm soát cài đặt và quyền nhóm
- **Giám sát hệ thống**: Trạng thái bot thời gian thực và chỉ số hiệu suất
- **Hệ thống sao lưu**: Sao lưu và khôi phục dữ liệu tự động

### 🎨 Tính năng Trực quan
- **Đồ họa Canvas**: Các phần tử trực quan phong phú sử dụng Canvas API
- **Font tùy chỉnh**: Nhiều tùy chọn font cho các kiểu khác nhau
- **Tạo hình ảnh**: Tạo hình ảnh động cho game và thống kê
- **Thiết kế đáp ứng**: Tối ưu cho các kích thước màn hình khác nhau

## Cài đặt

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- Tài khoản Facebook với quyền admin

### Bước 1: Clone Repository
```bash
git clone https://github.com/your-username/FIX-FCA-AKI-2.0.git
cd FIX-FCA-AKI-2.0
```

### Bước 2: Cài đặt Dependencies
```bash
npm install
```

### Bước 3: Cấu hình
1. Sao chép `config.example.json` thành `config.json`
2. Chỉnh sửa `config.json` với cài đặt của bạn:
```json
{
  "prefix": ".",
  "adminUIDs": ["your-facebook-uid"],
  "botName": "Tên Bot Của Bạn",
  "ownerName": "Tên Của Bạn"
}
```

### Bước 4: Đăng nhập Facebook
1. **Tải Extension**: Tải extension Chrome này: [Facebook Appstate Extractor](https://chrome-stats.com/d/nlgehefndkobdignlfhapfpggielmdph/download)
2. **Vào Facebook**: Mở tài khoản Facebook của bạn trong Chrome
3. **Mở Extension**: Nhấp vào biểu tượng extension trong trình duyệt
4. **Sao chép mã JSON**: Sao chép mã JSON được tạo từ extension
5. **Tạo file appstate.json**:
   - Tạo file mới tên `appstate.json` trong thư mục gốc dự án
   - Dán mã JSON đã sao chép vào file
6. **Khởi động bot**:
```bash
npm start
```

### Bước 5: Khởi động Bot
```bash
npm start
```

## Cấu hình

### Cấu hình chính (`config.json`)
```json
{
  "prefix": ".",
  "adminUIDs": ["1000123456789"],
  "botName": "AKI Bot",
  "ownerName": "Admin",
  "autoRestart": true,
  "logLevel": "info",
  "database": {
    "type": "json",
    "path": "./data/"
  }
}
```

### Cấu hình VIP (`game/vip/vipConfig.js`)
```javascript
const VIP_PACKAGES = {
  GOLD: {
    id: 3,
    name: "VIP Gold",
    price: { original: "59,000", sale: "49,000" },
    benefits: {
      miningBonus: 0.8,
      stolenProtection: 1.0,
      withdrawalBonusLimit: 2.0
    }
  }
  // ... thêm các gói khác
};
```

## Sử dụng

### Lệnh cơ bản
```bash
# Kiểm tra trạng thái bot
.ping

# Xem số dư
.balance

# Phần thưởng hàng ngày
.daily

# Menu trợ giúp
.help
```

### Lệnh Admin
```bash
# Thêm VIP cho người dùng
.setvip add [uid] [days]

# Xóa VIP
.setvip remove [uid]

# Kiểm tra trạng thái VIP
.setvip check [uid]
```

### Lệnh Game
```bash
# Bắt đầu câu cá
.fish

# Đi đào mỏ
.mine

# Chơi casino
.casino

# Mở gacha
.gacha
```

## Lệnh

### Lệnh Kinh tế
| Lệnh | Mô tả | Cách dùng |
|------|-------|-----------|
| `.balance` | Kiểm tra số dư | `.balance` |
| `.daily` | Nhận phần thưởng hàng ngày | `.daily` |
| `.work` | Làm việc kiếm tiền | `.work` |
| `.transfer` | Chuyển tiền | `.transfer [uid] [số tiền]` |

### Lệnh Game
| Lệnh | Mô tả | Cách dùng |
|------|-------|-----------|
| `.fish` | Đi câu cá | `.fish` |
| `.mine` | Đào tài nguyên | `.mine` |
| `.casino` | Chơi casino | `.casino` |
| `.gacha` | Mở gacha | `.gacha` |

### Lệnh Admin
| Lệnh | Mô tả | Cách dùng |
|------|-------|-----------|
| `.setvip` | Quản lý người dùng VIP | `.setvip add/remove/check` |
| `.kick` | Kick người dùng khỏi nhóm | `.kick [uid]` |
| `.ban` | Cấm người dùng | `.ban [uid]` |
| `.warn` | Cảnh cáo người dùng | `.warn [uid]` |

## Tài liệu API

### Cấu trúc Lệnh
```javascript
module.exports = {
    name: "tên_lệnh",
    info: "Mô tả lệnh",
    dev: "Tên nhà phát triển",
    category: "Danh mục",
    usages: ["Cách dùng 1", "Cách dùng 2"],
    cooldowns: 5,
    onPrefix: true,
    
    onLaunch: async function ({ api, event, target, actions }) {
        // Logic lệnh ở đây
    }
};
```

### Tham số Sự kiện
```javascript
{
    api: Đối tượng Facebook API,
    event: {
        threadID: "ID Nhóm/Trang",
        senderID: "ID Người dùng",
        messageID: "ID Tin nhắn",
        messageReply: "Dữ liệu reply nếu có"
    },
    target: ["lệnh", "tham số1", "tham số2"],
    actions: {
        reply: "Hàm reply",
        react: "Hàm react",
        edit: "Hàm edit"
    }
}
```

### Hệ thống Tiền tệ
```javascript
// Thêm số dư
global.currencies.addBalance(userID, amount);

// Trừ số dư
global.currencies.subtractBalance(userID, amount);

// Lấy số dư
const balance = global.currencies.getBalance(userID);
```

## Đóng góp

1. Fork repository
2. Tạo nhánh tính năng (`git checkout -b feature/TínhNăngMới`)
3. Commit thay đổi (`git commit -m 'Thêm tính năng mới'`)
4. Push lên nhánh (`git push origin feature/TínhNăngMới`)
5. Mở Pull Request

### Quy tắc Code
- Sử dụng tên biến có ý nghĩa
- Thêm comment cho logic phức tạp
- Tuân theo cấu trúc code hiện có
- Kiểm tra kỹ lưỡng các thay đổi

## Giấy phép

Dự án này được cấp phép theo MIT License - xem file [LICENSE](LICENSE) để biết chi tiết.

---

## 📞 Hỗ trợ / Support
)
- **Facebook**: [Follow us on Facebook](https://www.facebook.com/amfinethankiu.and.u)
- **Email**: kenjiakira2006@gmail.com

## 🙏 Cảm ơn / Acknowledgments

- **Kaguya Teams** - Nguồn cảm hứng ban đầu
- **Cộng đồng Chatbot** - Hỗ trợ và đóng góp
- **Tất cả người dùng** - Phản hồi và đề xuất

---

**Được phát triển bởi Kenji Akira**  
**Developed by Kenji Akira**
