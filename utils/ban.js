const fs = require("fs");

let bannedUsers = {};
let bannedThreads = {};

try {
    bannedUsers = JSON.parse(fs.readFileSync('./database/ban/users.json'));
} catch (err) {
    console.error("Lỗi đọc tệp dữ liệu người dùng bị cấm:", err);
}

try {
    bannedThreads = JSON.parse(fs.readFileSync('./database/ban/threads.json'));
} catch (err) {
    console.error("Lỗi đọc tệp dữ liệu chủ đề bị cấm:", err);
}

const saveBannedData = () => {
    try {
        fs.writeFileSync('./database/ban/users.json', JSON.stringify(bannedUsers, null, 2));
        fs.writeFileSync('./database/ban/threads.json', JSON.stringify(bannedThreads, null, 2));
    } catch (err) {
        console.error("Lỗi lưu dữ liệu bị cấm:", err);
    }
};

module.exports = { bannedUsers, bannedThreads, saveBannedData };
