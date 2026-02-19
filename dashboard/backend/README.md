# CMS Backend

Backend cho CMS Dashboard với cấu trúc module chuyên nghiệp (theo mô hình NestJS).

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── modules/           # Các module chức năng
│   │   ├── users/        # Module quản lý người dùng
│   │   ├── vip/          # Module quản lý VIP
│   │   ├── threads/      # Module quản lý nhóm
│   │   ├── economy/      # Module quản lý kinh tế
│   │   ├── system/       # Module quản lý hệ thống
│   │   └── overview/     # Module tổng quan
│   ├── common/           # Code dùng chung
│   │   ├── middleware/   # Middleware (error handler, logger, validator)
│   │   └── dto/          # Data Transfer Objects
│   ├── config/          # Cấu hình (database, etc.)
│   └── app.js           # Main application class
└── server.js            # Entry point
```

## Kiến trúc

### Module Structure
Mỗi module có cấu trúc:
- `*.service.js` - Business logic
- `*.controller.js` - HTTP request handling
- `*.routes.js` - Route definitions

### Common Components
- **Middleware**: Error handling, logging, validation
- **DTOs**: Pagination, Response formatting
- **Config**: Database service

## API Endpoints

### Overview
- `GET /api/overview` - Lấy thống kê tổng quan

### Users
- `GET /api/users` - Lấy danh sách users (có pagination)
- `GET /api/users/:uid` - Lấy thông tin user
- `POST /api/users/:uid/balance` - Cập nhật số dư

### VIP
- `GET /api/vip` - Lấy danh sách VIP users
- `POST /api/vip` - Thêm VIP
- `DELETE /api/vip/:userId` - Xóa VIP

### Threads
- `GET /api/threads` - Lấy danh sách threads (có pagination)
- `GET /api/threads/:threadID` - Lấy thông tin thread

### Economy
- `GET /api/economy` - Lấy thống kê kinh tế

### System
- `GET /api/system/status` - Trạng thái hệ thống
- `GET /api/system/info` - Thông tin chi tiết hệ thống
- `POST /api/system/restart` - Khởi động lại bot
- `POST /api/system/backup` - Tạo backup

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Chạy server

```bash
node dashboard/backend/server.js
```

Hoặc thông qua `index.js`:
```bash
node index.js
```

