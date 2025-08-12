# Bot Dashboard API

API server cho Bot Dashboard, cung cấp các endpoint để quản lý và theo dõi bot.

## 🚀 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy ở chế độ development
npm run dev

# Chạy ở chế độ production
npm run prod
```

## 📊 Cấu trúc API

### Bot Endpoints
- `GET /api/bot/status` - Trạng thái bot
- `GET /api/bot/uptime-history` - Lịch sử uptime
- `GET /api/bot/logs` - System logs
- `POST /api/bot/restart` - Khởi động lại bot
- `POST /api/bot/update-stats` - Cập nhật thống kê

### User Endpoints
- `GET /api/users` - Thống kê người dùng
- `GET /api/users/top` - Top users
- `GET /api/users/active` - Người dùng hoạt động
- `GET /api/users/rank/:rank` - Users theo rank
- `GET /api/users/:userId` - Thông tin user cụ thể

### Command Endpoints
- `GET /api/commands` - Tất cả commands
- `GET /api/commands/stats` - Thống kê commands
- `GET /api/commands/top` - Top commands
- `GET /api/commands/category/:category` - Commands theo category
- `GET /api/commands/permission/:permission` - Commands theo permission
- `GET /api/commands/errors` - Commands có lỗi cao
- `GET /api/commands/recent` - Commands mới nhất
- `POST /api/commands/refresh` - Refresh command cache

### System Endpoints
- `GET /api/system/info` - Thông tin hệ thống
- `GET /api/system/memory` - Sử dụng memory
- `GET /api/system/cpu` - Thông tin CPU
- `GET /api/system/network` - Thông tin network

### Health Check
- `GET /api/health` - Kiểm tra sức khỏe API

## 🔧 Cấu hình

### Environment Variables
- `NODE_ENV` - Môi trường (development/production)
- `DASHBOARD_PORT` - Port cho API server (mặc định: 3002)

### Cấu trúc thư mục
```
dashboard-api/
├── src/
│   ├── app.js              # Main application
│   ├── controllers/        # API controllers
│   │   ├── botController.js
│   │   ├── userController.js
│   │   ├── commandController.js
│   │   └── systemController.js
│   └── services/          # Business logic
│       ├── botService.js
│       ├── userService.js
│       ├── commandService.js
│       └── systemService.js
├── server.js              # Entry point
├── package.json
└── README.md
```

## 🛠️ Development

### Scripts
- `npm start` - Chạy server
- `npm run dev` - Chạy với nodemon (auto-reload)
- `npm run prod` - Chạy production mode
- `npm run clean` - Xóa node_modules
- `npm run reinstall` - Reinstall dependencies

### Logs
Server sẽ hiển thị:
- Thông tin khởi động
- Danh sách endpoints
- Error handling
- Graceful shutdown

## 🔍 Troubleshooting

### Lỗi thường gặp

1. **Port đã được sử dụng**
   ```bash
   # Kiểm tra port
   netstat -an | grep 3002
   
   # Kill process
   kill -9 <PID>
   ```

2. **Dependencies missing**
   ```bash
   npm install
   ```

3. **File không tồn tại**
   - Kiểm tra đường dẫn `src/app.js`
   - Đảm bảo cấu trúc thư mục đúng

### Debug Mode
```bash
# Chạy với debug logs
DEBUG=* npm run dev
```

## 📝 API Response Format

### Success Response
```json
{
  "status": "success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": 500,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Security

- CORS được cấu hình cho development
- Không có authentication (có thể thêm sau)
- Rate limiting (có thể thêm sau)

## 📈 Performance

- Command cache với TTL 5 phút
- Lazy loading cho user data
- Optimized file reading
- Memory efficient

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request
