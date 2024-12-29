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
    info: 'Lấy thông tin người dùng Roblox ',
    usages: 'roblox [Tên người dùng]',
    dmUser: false,
    onPrefix: true,
    cooldowns: 10,
    
    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const [username] = target;
    
        if (!username) {
            return api.sendMessage(`⚠️ Vui lòng cung cấp tên người dùng.\nVí dụ: .roblox builderman`, threadID, messageID);
        }
    
        try {
            const userResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [username],
                excludeBannedUsers: false 
            }).catch(err => {
                throw new Error('Không thể kết nối với API Roblox. Vui lòng thử lại sau.');
            });

            if (!userResponse.data || !userResponse.data.data || userResponse.data.data.length === 0) {
                return api.sendMessage(`❌ Không tìm thấy người dùng '${username}'.`, threadID, messageID);
            }

            const userData = userResponse.data.data[0];
            const { name, id, displayName, hasVerifiedBadge } = userData;

            const getApiData = async (url) => {
                try {
                    const response = await axios.get(url);
                    return response.data;
                } catch (error) {
                    console.error(`Error fetching ${url}:`, error.message);
                    return null;
                }
            };

            const [userDetail, badges] = await Promise.all([
                getApiData(`https://users.roblox.com/v1/users/${id}`),
                getApiData(`https://accountinformation.roblox.com/v1/users/${id}/roblox-badges`)
            ]);

            if (!userDetail) {
                throw new Error('Không thể tải thông tin người dùng.');
            }

            let message = `👤 - Tên người dùng: ${name}\n`;
            message += `🌟 - Tên hiển thị: ${displayName}\n`;
            message += `🆔 - ID người dùng: ${id}\n`;

            if (badges) {
                message += `🏅 - Huy hiệu: ${badges.map(b => b.name).join(', ') || 'Không có'}\n`;
            }

            const { description, created, isBanned } = userDetail;
            message += `\n📝 - Mô tả: ${description || 'Chưa có mô tả'}\n`;
            message += `✅ - Đã xác thực: ${hasVerifiedBadge ? 'Có' : 'Không'}\n`;
            message += `📅 - Ngày tạo: ${formatDate(created)}\n`;
            message += `🚫 - Bị cấm: ${isBanned ? 'Có' : 'Không'}\n`;
            message += `🔗 - Hồ sơ: https://roblox.com/users/${id}\n\n`;

            const [friends, followers, following] = await Promise.all([
                getApiData(`https://friends.roblox.com/v1/users/${id}/friends/count`),
                getApiData(`https://friends.roblox.com/v1/users/${id}/followers/count`),
                getApiData(`https://friends.roblox.com/v1/users/${id}/followings/count`)
            ]);

            if (friends && followers && following) {
                message += `👥 - Bạn bè: ${friends.count || 0}\n`;
                message += `👥 - Người theo dõi: ${followers.count || 0}\n`;
                message += `👥 - Đang theo dõi: ${following.count || 0}\n`;
            }

            await api.sendMessage(message, threadID, messageID);

            try {
                const avatarResponse = await axios.get(
                    `https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=png`
                );
                
                if (avatarResponse.data?.data?.[0]?.imageUrl) {
                    const imageStream = await getStreamFromURL(avatarResponse.data.data[0].imageUrl);
                    await api.sendMessage({
                        body: "🎭 Avatar của người dùng:",
                        attachment: imageStream
                    }, threadID);
                }
            } catch (avatarError) {
                console.error('Error fetching avatar:', avatarError.message);
         
            }

        } catch (error) {
            console.error('Lỗi:', error);
            api.sendMessage(
                `❌ ${error.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.'}`,
                threadID,
                messageID
            );
        }
    }
};