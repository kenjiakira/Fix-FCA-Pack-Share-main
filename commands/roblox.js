const axios = require('axios');
const stream = require('stream');
const { promisify } = require('util');

const getStreamFromURL = async (url) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    const buffer = Buffer.from(response.data, 'utf-8');
    const streamPass = new stream.PassThrough();
    streamPass.end(buffer);
    return streamPass;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = String(date.getUTCFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

module.exports = {
    name: 'roblox',
    dev: 'HNT',
    usedby: 0,
    info: 'Lấy thông tin chi tiết người dùng Roblox',
    usages: 'roblox [Tên người dùng]',
    dmUser: false,
    onPrefix: true,
    cooldowns: 10,
    
    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const [username] = target;
    
        if (!username) {
            return api.sendMessage(`⚠️ Vui lòng nhập tên người dùng\n📝 Cách dùng: .roblox [tên người dùng]`, threadID, messageID);
        }
    
        try {
            // Basic user info fetch
            const userResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [username],
                excludeBannedUsers: false 
            }).catch(() => {
                throw new Error('⚠️ Lỗi kết nối với API Roblox. Vui lòng thử lại sau!');
            });

            if (!userResponse.data?.data?.[0]) {
                return api.sendMessage(`❌ Không tìm thấy người dùng: "${username}"`, threadID, messageID);
            }

            const userData = userResponse.data.data[0];
            const { name, id, displayName } = userData;

            // Fetch all user data in parallel
            const [userDetail, badges, presence, inventory, groups] = await Promise.all([
                axios.get(`https://users.roblox.com/v1/users/${id}`).then(r => r.data).catch(() => null),
                axios.get(`https://accountinformation.roblox.com/v1/users/${id}/roblox-badges`).then(r => r.data).catch(() => []),
                axios.get(`https://presence.roblox.com/v1/presence/users/${id}`).then(r => r.data).catch(() => null),
                axios.get(`https://inventory.roblox.com/v2/users/${id}/inventory/count`).then(r => r.data).catch(() => null),
                axios.get(`https://groups.roblox.com/v2/users/${id}/groups/roles`).then(r => r.data).catch(() => null)
            ]);

            // Format user info message
            let message = `📊 THÔNG TIN NGƯỜI DÙNG ROBLOX 📊\n\n`;
            message += `👤 Tên tài khoản: ${name}\n`;
            message += `🌟 Tên hiển thị: ${displayName}\n`;
            message += `🆔 ID: ${id}\n\n`;

            if (userDetail) {
                message += `📝 Giới thiệu: ${userDetail.description || 'Không có'}\n`;
                message += `📅 Ngày tạo: ${formatDate(userDetail.created)}\n`;
                message += `🚫 Trạng thái: ${userDetail.isBanned ? 'Đã bị cấm' : 'Hoạt động'}\n\n`;
            }

            if (presence?.userPresenceType) {
                const status = {
                    0: 'Ngoại tuyến',
                    1: 'Trực tuyến',
                    2: 'Đang chơi game',
                    3: 'Đang Studio',
                    4: 'Đang tạo game'
                }[presence.userPresenceType];
                message += `⭐ Trạng thái: ${status}\n`;
                if (presence.lastLocation) {
                    message += `🎮 Hoạt động: ${presence.lastLocation}\n\n`;
                }
            }

            if (inventory) {
                message += `📦 KHO ĐỒ:\n`;
                message += `🎮 Game: ${inventory.places || 0}\n`;
                message += `👕 Quần áo: ${inventory.wearables || 0}\n`;
                message += `🎵 Âm thanh: ${inventory.audio || 0}\n`;
                message += `🎨 Ảnh: ${inventory.images || 0}\n\n`;
            }

            if (groups?.data?.length) {
                message += `👥 NHÓM (${groups.data.length}):\n`;
                groups.data.slice(0, 3).forEach(g => {
                    message += `• ${g.group.name} (${g.role.name})\n`;
                });
                if (groups.data.length > 3) message += `• ... và ${groups.data.length - 3} nhóm khác\n`;
                message += '\n';
            }

            if (badges?.length) {
                message += `🏅 HUY HIỆU (${badges.length}):\n`;
                badges.slice(0, 3).forEach(b => message += `• ${b.name}\n`);
                if (badges.length > 3) message += `• ... và ${badges.length - 3} huy hiệu khác\n`;
            }

            message += `\n🔗 Link hồ sơ: https://roblox.com/users/${id}`;

            await api.sendMessage(message, threadID, messageID);

            // Send avatar image
            const avatarResponse = await axios.get(
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=png`
            ).catch(() => null);

            if (avatarResponse?.data?.data?.[0]?.imageUrl) {
                const imageStream = await getStreamFromURL(avatarResponse.data.data[0].imageUrl);
                await api.sendMessage({
                    body: "🎭 Avatar của người dùng:",
                    attachment: imageStream
                }, threadID);
            }

        } catch (error) {
            api.sendMessage(
                `❌ Lỗi: ${error.message || 'Đã xảy ra lỗi không xác định'}`,
                threadID,
                messageID
            );
        }
    }
};