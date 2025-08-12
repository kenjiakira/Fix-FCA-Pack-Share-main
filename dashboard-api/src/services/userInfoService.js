const fs = require('fs');
const path = require('path');

class UserInfoService {
  constructor() {
    this.rankDataPath = path.join(__dirname, '../../../events/cache/rankData.json');
    this.avatarCachePath = path.join(__dirname, '../../../commands/cache/avatars');
  }

  // Lấy thông tin cơ bản của user (ID, name, avatar)
  getUserInfo(userId) {
    try {
      // Đọc dữ liệu từ rankData.json
      if (fs.existsSync(this.rankDataPath)) {
        const data = JSON.parse(fs.readFileSync(this.rankDataPath, 'utf8'));
        const userData = data[userId];
        
        if (userData) {
          return {
            userId,
            name: userData.name || 'Unknown',
            avatar: this.getAvatarUrl(userId)
          };
        }
      }
      
      // Nếu không tìm thấy trong rankData, trả về thông tin mặc định
      return {
        userId,
        name: 'Unknown',
        avatar: this.getAvatarUrl(userId)
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return {
        userId,
        name: 'Unknown',
        avatar: null
      };
    }
  }

  // Lấy thông tin nhiều users cùng lúc
  getUsersInfo(userIds) {
    try {
      const usersInfo = {};
      
      if (fs.existsSync(this.rankDataPath)) {
        const data = JSON.parse(fs.readFileSync(this.rankDataPath, 'utf8'));
        
        userIds.forEach(userId => {
          const userData = data[userId];
          usersInfo[userId] = {
            userId,
            name: userData?.name || 'Unknown',
            avatar: this.getAvatarUrl(userId)
          };
        });
      } else {
        // Nếu không có file rankData, trả về thông tin mặc định
        userIds.forEach(userId => {
          usersInfo[userId] = {
            userId,
            name: 'Unknown',
            avatar: this.getAvatarUrl(userId)
          };
        });
      }
      
      return usersInfo;
    } catch (error) {
      console.error('Error getting users info:', error);
      const usersInfo = {};
      userIds.forEach(userId => {
        usersInfo[userId] = {
          userId,
          name: 'Unknown',
          avatar: null
        };
      });
      return usersInfo;
    }
  }

  // Lấy URL avatar của user
  getAvatarUrl(userId) {
    try {
      const avatarPath = path.join(this.avatarCachePath, `${userId}.jpg`);
      if (fs.existsSync(avatarPath)) {
        return `/api/avatars/${userId}.jpg`;
      }
      return null;
    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return null;
    }
  }

  // Kiểm tra avatar có tồn tại không
  avatarExists(userId) {
    try {
      const avatarPath = path.join(this.avatarCachePath, `${userId}.jpg`);
      return fs.existsSync(avatarPath);
    } catch (error) {
      console.error('Error checking avatar existence:', error);
      return false;
    }
  }

  // Lấy danh sách tất cả users có trong rankData
  getAllUsers() {
    try {
      if (fs.existsSync(this.rankDataPath)) {
        const data = JSON.parse(fs.readFileSync(this.rankDataPath, 'utf8'));
        return Object.keys(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}

module.exports = new UserInfoService();
