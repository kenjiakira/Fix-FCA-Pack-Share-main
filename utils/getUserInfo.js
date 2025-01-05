const userNameCache = new Map();

async function getUserName(api, uid) {
    try {
  
        if (userNameCache.has(uid)) {
            return userNameCache.get(uid);
        }

        const userInfo = await api.getUserInfo(uid);
        if (userInfo && userInfo[uid]) {
            const name = userInfo[uid].name || `FB.${uid}`;
            userNameCache.set(uid, name);
            return name;
        }
    } catch (err) {
        console.error(`Lỗi khi lấy tên của userID: ${uid}`, err);
    }

    return `FB.${uid}`;
}

module.exports = { getUserName, userNameCache };
