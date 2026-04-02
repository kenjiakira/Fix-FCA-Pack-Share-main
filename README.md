# FIX-FCA-AKI-2.0 (Vanilla)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/npm-1.0.4-orange.svg)]()

Bot Messenger Facebook (Node.js), nhánh **vanilla**: lõi bot + lệnh, không kèm Dashboard web hay Discord trong repo này.

**Package npm:** `fca-aki` · **Phiên bản:** `1.0.4` (theo `package.json`)

---

## Mục lục

- [English](#english)
- [Tiếng Việt](#tiếng-việt)

---

# English

## Overview

FIX-FCA-AKI-2.0 (vanilla) is a Facebook Messenger bot powered by Node.js. It includes games, economy, VIP helpers, Canvas-based images, and a command system loaded from `commands/`. Login uses Facebook **appstate** (cookie JSON) and a pluggable FCA layer under `logins/<FCA>/`.

## What this branch includes

- **Messenger bot only** — `npm start` runs `index.js`, which starts `main.js`.
- **FCA backends** in `logins/`: e.g. `hut-chat-api`, `meta-messenger`, `meta-messenger-fca`, `ws3-fca-wrapper` (value of `FCA` in `admin.json` must match the folder name).
- **No** bundled Next.js dashboard or `npm run discord:*` scripts in this package (see `package.json`).

## Prerequisites

- Node.js 18+
- npm
- Facebook account used for the bot session
- `utils/prox.txt` — list of proxies (one `host:port` per line). `main.js` reads this file for proxy rotation.

## Installation

```bash
git clone <your-repo-url> FIX-FCA-AKI-2.0
cd FIX-FCA-AKI-2.0
npm install
```

## Configuration

### `admin.json` (project root)

Create or edit `admin.json`. Example shape:

```json
{
  "prefix": ".",
  "adminUIDs": ["your-facebook-uid"],
  "moderatorUIDs": [],
  "supportUIDs": [],
  "feedbackGroupID": [],
  "botName": "Your Bot Name",
  "ownerName": "Your Name",
  "facebookLink": "your-facebook-uid",
  "resend": false,
  "notilogs": true,
  "appstate": "./appstate.json",
  "restart": true,
  "restartTime": 50,
  "FCA": "hut-chat-api",
  "mtnMode": false,
  "gitURL": "optional-override-for-update-command",
  "customCommands": {}
}
```

| Key | Description |
|-----|-------------|
| `prefix` | Command prefix |
| `adminUIDs` / `moderatorUIDs` / `supportUIDs` | Facebook user IDs |
| `appstate` | Path to appstate JSON |
| `FCA` | Subfolder name under `logins/` (must exist) |
| `restart` / `restartTime` | Auto-restart behavior |
| `gitURL` | Optional; used by the `update` command (see `commands/update.js`) |
| `customCommands` | Optional; custom command flags (see your `admin.json`) |

Optional per-FCA settings: `logins/<FCA>/config.json` (e.g. `APPSTATE_PATH`).

### Facebook session (`appstate.json`)

1. Use a trusted method/extension to export Messenger cookies as JSON (appstate).
2. Save as `appstate.json` in the project root (or path set in `admin.json` / FCA config).

See also `appstate.example.json` if present.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | `node index.js` → starts Messenger (`main.js`) |
| `npm run dev` | `NODE_ENV=development node main.js` |
| `npm run watch` | `node main.js --watch` (reload commands on change) |

## Usage

- Start: `npm start`
- Discover commands: use your configured prefix + `help` (e.g. `.help`, `.help all`).
- Economy / games / admin commands live under `commands/` — names match command modules.

## Command module shape

```javascript
module.exports = {
  name: "command_name",
  info: "Description",
  dev: "Author",
  category: "Category",
  usages: ["usage 1"],
  cooldowns: 5,
  onPrefix: true,
  onLaunch: async function ({ api, event, target, actions }) {
    const { threadID, messageID, senderID } = event;
    // ...
  }
};
```

## License

MIT — see [LICENSE](LICENSE).

---

# Tiếng Việt

## Tổng quan

**FIX-FCA-AKI-2.0 (vanilla)** là bot Facebook Messenger chạy bằng Node.js: game, kinh tế, VIP, ảnh Canvas, hệ thống lệnh trong `commands/`. Đăng nhập bằng file **appstate** và lớp FCA trong `logins/<FCA>/`.

## Nhánh vanilla có gì

- **Chỉ bot Messenger** — `npm start` chạy `index.js`, khởi động `main.js`.
- **Nhiều backend FCA** trong `logins/`: ví dụ `hut-chat-api`, `meta-messenger`, `meta-messenger-fca`, `ws3-fca-wrapper` — giá trị `FCA` trong `admin.json` phải **trùng tên thư mục**.
- **Không** gói sẵn Dashboard Next.js và **không** có script Discord trong `package.json` của bản vanilla này.

## Yêu cầu

- Node.js 18+
- npm
- Tài khoản Facebook dùng cho phiên bot
- File `utils/prox.txt` — mỗi dòng một proxy `host:port` (bot đọc file này khi chạy).

## Cài đặt

```bash
git clone <url-repo-của-bạn> FIX-FCA-AKI-2.0
cd FIX-FCA-AKI-2.0
npm install
```

## Cấu hình

### `admin.json`

Tạo/sửa `admin.json` ở thư mục gốc. Ví dụ cấu trúc (xem phần English để biết bảng giải thích từng khóa).

Tùy chọn: `logins/<FCA>/config.json` cho từng backend (ví dụ đường dẫn appstate).

### Phiên Facebook (`appstate.json`)

Xuất cookie/appstate hợp lệ, lưu `appstate.json` ở gốc dự án (hoặc đúng đường dẫn trong cấu hình).

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm start` | `node index.js` → chạy Messenger (`main.js`) |
| `npm run dev` | Chạy `main.js` với `NODE_ENV=development` |
| `npm run watch` | `main.js --watch` — đổi file lệnh thì tải lại |

## Sử dụng

- Chạy bot: `npm start`
- Xem lệnh: prefix + `help` (ví dụ `.help`, `.help all`)

## Giấy phép

MIT — xem [LICENSE](LICENSE).

---

## Hỗ trợ

- **Facebook:** [Kenji Akira](https://www.facebook.com/amfinethankiu.and.u)
- **Email:** kenjiakira2006@gmail.com

## Cảm ơn

- Cộng đồng chatbot và các thư viện FCA / Messenger tương ứng.

---

**Phát triển bởi Kenji Akira**
