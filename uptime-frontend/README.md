# Bot Dashboard Frontend

Dashboard quản lý bot với giao diện hiện đại, tích hợp đầy đủ các UI components và kết nối với API Dashboard.

## 🚀 Tính năng

### 📊 **Dashboard Chính**
- **Status Cards**: Hiển thị uptime, người dùng hoạt động, tổng lệnh, thời gian phản hồi
- **Real-time Updates**: Cập nhật dữ liệu theo thời gian thực
- **Bot Control**: Khởi động lại bot, kiểm tra trạng thái

### 🖥️ **Thông tin Hệ thống**
- **System Info**: CPU, RAM, Platform, Architecture
- **Network Info**: Thông tin mạng, hostname, interfaces
- **Resource Monitoring**: Progress bars cho CPU và RAM usage
- **Quick Actions**: Các hành động nhanh cho hệ thống

### 📈 **Thống kê Lệnh**
- **Command Analytics**: Biểu đồ sử dụng lệnh theo thời gian
- **Category Stats**: Phân tích theo danh mục lệnh
- **Top Commands**: Bảng xếp hạng lệnh được sử dụng nhiều nhất
- **Command Details**: Chi tiết từng lệnh với search và filter

### 👥 **Thống kê Người dùng**
- **User Overview**: Tổng quan người dùng, hoạt động
- **Leaderboard**: Bảng xếp hạng người dùng
- **Rank Distribution**: Phân bố rank (Bronze, Silver, Gold, Platinum, Diamond)
- **User Analytics**: Thống kê level, experience

### 🎨 **UI Components**
- **Modern Design**: Sử dụng shadcn/ui components
- **Responsive**: Tương thích mobile và desktop
- **Dark/Light Mode**: Hỗ trợ theme switching
- **Interactive**: Tabs, dialogs, dropdowns, tables

## 🛠️ Cài đặt

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn
- API Dashboard đang chạy

### Bước 1: Clone và cài đặt dependencies
```bash
cd uptime-frontend
npm install
```

### Bước 2: Cấu hình môi trường
Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

### Bước 3: Chạy development server
```bash
npm run dev
```

Truy cập: http://localhost:3000

## 🔌 Kết nối API

### API Endpoints được sử dụng:

#### Bot Status
- `GET /api/bot/status` - Trạng thái bot
- `POST /api/bot/restart` - Khởi động lại bot
- `GET /api/bot/uptime-history` - Lịch sử uptime
- `GET /api/bot/logs` - System logs

#### System Info
- `GET /api/system/info` - Thông tin hệ thống chi tiết
- `GET /api/system/memory` - Thông tin bộ nhớ
- `GET /api/system/cpu` - Thông tin CPU
- `GET /api/system/network` - Thông tin mạng

#### Commands
- `GET /api/commands` - Danh sách lệnh
- `GET /api/commands/stats` - Thống kê lệnh
- `POST /api/commands/refresh` - Làm mới cache

#### Users
- `GET /api/users` - Thống kê người dùng
- `GET /api/users/top` - Top users
- `GET /api/users/active` - Active users

### Cấu trúc API Response

#### Bot Status Response
```json
{
  "isRunning": true,
  "uptime": 3600,
  "startTime": "2024-01-15T10:00:00Z",
  "lastRestart": "2024-01-15T10:00:00Z",
  "totalCommands": 1250,
  "activeUsers": 890,
  "memoryUsage": 65.5,
  "cpuUsage": 25.3,
  "responseTime": 150
}
```

#### System Info Response
```json
{
  "platform": "linux",
  "arch": "x64",
  "nodeVersion": "v18.17.0",
  "uptime": 86400,
  "totalMemory": 8589934592,
  "freeMemory": 4294967296,
  "usedMemory": 4294967296,
  "memoryUsage": 50.0,
  "cpuUsage": 25.3,
  "cpuCount": 8,
  "loadAverage": [1.2, 1.1, 0.9],
  "hostname": "server-01",
  "networkInterfaces": {...}
}
```

## 📁 Cấu trúc Project

```
uptime-frontend/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── StatusCard.tsx         # Status cards
│   ├── SystemInfo.tsx         # System information
│   ├── CommandStats.tsx       # Command statistics
│   ├── CommandDetails.tsx     # Command details
│   ├── UserStats.tsx          # User statistics
│   └── UptimeChart.tsx        # Uptime chart
├── src/
│   ├── hooks/
│   │   └── useBotStatus.ts    # Bot status hook
│   └── services/
│       └── api.ts             # API service
├── lib/
│   └── utils.ts               # Utility functions
└── package.json
```

## 🎨 UI Components được sử dụng

### Layout & Structure
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`

### Interactive Elements
- `Button` với variants
- `Input` với search functionality
- `Select` cho dropdowns
- `Dialog` cho modals
- `DropdownMenu` cho context menus

### Visual Elements
- `Badge` cho status và categories
- `Avatar` cho user profiles
- `Progress` cho usage indicators
- `Skeleton` cho loading states
- `Alert` cho notifications

### Data Display
- `Table` cho structured data
- `Tabs` cho organized content
- `Card` layouts cho information grouping

## 🔧 Customization

### Thêm component mới
1. Tạo file trong `components/`
2. Import UI components từ `@/components/ui/`
3. Sử dụng API services từ `@/src/services/api.ts`
4. Thêm vào main page hoặc tạo tab mới

### Thay đổi theme
Chỉnh sửa `app/globals.css`:
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other variables */
  }
}
```

### Thêm API endpoint mới
1. Thêm vào `src/services/api.ts`
2. Tạo hook mới trong `src/hooks/`
3. Sử dụng trong component

## 🚀 Deployment

### Build cho production
```bash
npm run build
npm start
```

### Environment Variables cho Production
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## 📊 Monitoring

### Performance
- Sử dụng React DevTools để debug
- Monitor API response times
- Check bundle size với `npm run build`

### Error Handling
- Tất cả API calls có error handling
- Loading states cho user experience
- Fallback UI khi không có data

## 🤝 Contributing

1. Fork project
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📝 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 🆘 Support

Nếu gặp vấn đề:
1. Kiểm tra API Dashboard có đang chạy không
2. Verify environment variables
3. Check browser console cho errors
4. Tạo issue với log chi tiết
