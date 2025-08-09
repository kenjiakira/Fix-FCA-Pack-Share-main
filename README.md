# Hướng Dẫn Cơ Bản

## Cấu trúc lệnh

```javascript
module.exports = {
    name: "Tên lệnh",
    info: "Mô tả lệnh",
    dev: "Tác giả",
    onPrefix: true, // Lệnh có yêu cầu tiền tố (true) hay không (false)
    dmUser: false, // Có thể chạy trong tin nhắn trực tiếp (true) hay không (false)
    nickName: ["bí danh1", "bí danh2"], // Các tên gọi khác của lệnh
    usages: "Hướng dẫn sử dụng",
    cooldowns: 10, // Thời gian hồi (cooldown) tính bằng giây
    onLaunch: async function ({ api, event, actions }) {
        // Logic chính của lệnh
    }
};
```
## Mô tả hàm

### `onLaunch`
Hàm chính được gọi khi lệnh kích hoạt. Dùng để xử lý và gửi phản hồi theo ngữ cảnh.

**Ví dụ:**
```javascript
onLaunch: async function ({ api, event, target }) {
    const userInput = target[0];
    if (!userInput) {
        return actions.reply("Vui lòng cung cấp thông tin cần thiết.");
    }
    await actions.reply(`Bạn đã nhập: ${userInput}`);
}
```

### `onEvents`
Hàm này xử lý các sự kiện bổ sung, ví dụ như các đối số hoặc thao tác từ người dùng.

**Ví dụ:**
```javascript
onEvents: async function ({ api, event, target }) {
    if (target.length === 0) {
        return actions.reply("Bạn cần nhập thêm thông tin.");
    }
    await actions.reply(`Thông tin nhận được: ${target.join(", ")}`);
}
```

### `onReply`
Hàm này kích hoạt khi người dùng phản hồi một tin nhắn cụ thể. 

**Ví dụ:**
```javascript
onReply: async function ({ reply, api, event }) {
    const userResponse = reply.body;
    await actions.reply(`Bạn vừa phản hồi: ${userResponse}`);
}
```

### `callReact`
Hàm thực hiện các hành động khi người dùng thả biểu cảm (reaction) vào tin nhắn bot.

**Ví dụ:**
```javascript
callReact: async function ({ reaction, event, api }) {
    if (reaction === '👍') {
        await actions.reply("Cảm ơn bạn đã ủng hộ!");
    } else {
        await actions.reply("Phản hồi của bạn đã được ghi nhận.");
    }
}
```

### `noPrefix`
Hàm cho phép lệnh hoạt động mà không cần dùng tiền tố.

**Ví dụ:**
```javascript
noPrefix: async function ({ api, event }) {
    await actions.reply("Lệnh này không yêu cầu tiền tố để chạy.");
}
```

## **Cấu trúc `Currencies`**

Đối tượng `Currencies` được sử dụng để quản lý số dư và giao dịch của người dùng. Thường được dùng trong các lệnh như `daily`, `balance`, hoặc các hệ thống giao dịch khác trong bot.

### **Thuộc tính chính**

```javascript
global.currencies = {
    userID: {
        balance: 0, // Số Gems hiện tại của người dùng
        lastTransaction: 0, // Thời điểm giao dịch gần nhất (Unix timestamp)
        transactions: [] // Danh sách lịch sử giao dịch
    },
    saveData: function() {
        // Lưu trạng thái hiện tại của currencies vào tệp JSON
    },
    loadData: function() {
        // Tải dữ liệu currencies từ tệp JSON
    }
};
```

### **Các phương thức hỗ trợ**

#### **Thêm số dư**
```javascript
function addBalance(userID, amount) {
    if (!global.currencies[userID]) {
        global.currencies[userID] = { balance: 0, lastTransaction: 0, transactions: [] };
    }
    global.currencies[userID].balance += amount;
    global.currencies[userID].lastTransaction = Date.now();
    global.currencies[userID].transactions.push({ type: "add", amount, timestamp: Date.now() });
    global.currencies.saveData();
}
```

#### **Trừ số dư**
```javascript
function subtractBalance(userID, amount) {
    if (!global.currencies[userID] || global.currencies[userID].balance < amount) {
        throw new Error("Số dư không đủ!");
    }
    global.currencies[userID].balance -= amount;
    global.currencies[userID].lastTransaction = Date.now();
    global.currencies[userID].transactions.push({ type: "subtract", amount, timestamp: Date.now() });
    global.currencies.saveData();
}
```

#### **Lấy số dư**
```javascript
function getBalance(userID) {
    return global.currencies[userID]?.balance || 0;
}
```

#### **Xem lịch sử giao dịch**
```javascript
function getTransactions(userID) {
    return global.currencies[userID]?.transactions || [];
}
```

### **Sử dụng trong lệnh**
#### **Ví dụ lệnh `balance`**
```javascript
module.exports = {
    name: "balance",
    info: "Kiểm tra số dư Gems",
    onLaunch: async function({ api, event }) {
        const { threadID, senderID } = event;
        const balance = getBalance(senderID);
        return api.sendMessage(`» Số dư hiện tại của bạn: ${balance.toLocaleString('vi-VN')} Gems.`, threadID);
    }
};
```

## Cách sử dụng

### Ví dụ thực tế

### Lệnh `ping`
**Cấu trúc:**
```javascript
module.exports = {
    name: "ping",
    info: "Kiểm tra tốc độ phản hồi của bot",
    dev: "Bot Team",
    onPrefix: true,
    usages: "ping",
    cooldowns: 3,
    onLaunch: async function ({ actions }) {
        const startTime = Date.now();
        await actions.reply("🏓 Pong!");
        const endTime = Date.now();
        const latency = endTime - startTime;
        await actions.reply(`⏱️ Độ trễ: ${latency}ms`);
    }
};
```

## Tùy chọn bổ sung

### Thuộc tính toàn cục (Global Options)
```javascript
global.cc.prefix // Tiền tố mặc định của bot
global.cc.botName // Tên bot
global.cc.ownerName // Tên chủ sở hữu bot
global.cc.adminUIDs // Danh sách UID của quản trị viên
global.cc.proxy // Proxy nếu cần thiết
```

### Tùy chỉnh phông chữ
```javascript
const bold = global.fonts.bold("Văn bản đậm");
actions.reply(bold);
```

## Tóm tắt
- Cấu trúc lệnh: Tạo module với các thuộc tính cơ bản (`name`, `info`, `onLaunch`, v.v.).
- Hỗ trợ các sự kiện như phản hồi (`onReply`), thả reaction (`callReact`).
- Hành động hỗ trợ: `reply`, `react`, `edit`, `kick`, `leave`, và nhiều hơn nữa.
- Dễ dàng mở rộng với các tùy chỉnh toàn cục và bí danh (`nickName`).
Được tạo bởi Kenji Akira
Cảm ơn Kaguya Teams và cộng đồng phát triển Chatbot vì đã tạo nguồn cảm hứng!
