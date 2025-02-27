const axios = require('axios');
const { COC_API } = require('../config/api');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "coc",
    dev: "HNT",
    category: "Tiện Ích",
    info: "Xem thông tin Clash of Clans",
    usages: "coc [player/clan] [tag]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        let loadingMsg;

        if (!target[0]) {
            return api.sendMessage(
                "🎮 Clash of Clans Info\n\n" +
                "1. Xem thông tin người chơi:\n" +
                "→ coc player #TAG\n" +
                "VD: coc player #2Y2L9CQ8L\n\n" +
                "2. Xem thông tin clan:\n" +
                "→ coc clan #TAG\n" +
                "VD: coc clan #2L2QQCR2G\n\n" +
                "3. Xem war hiện tại:\n" +
                "→ coc war #TAG_CLAN\n\n" +
                "4. Xem thành viên clan:\n" +
                "→ coc members #TAG_CLAN\n\n" +
                "5. Xem lịch sử war:\n" +
                "→ coc warlog #TAG_CLAN\n\n" +
                "Lưu ý: Tag không chứa ký tự O, chỉ có số 0",
                threadID, messageID
            );
        }

        try {
            const command = target[0].toLowerCase();
            const tag = (target[1] || "").replace('#', '');

            if (!tag) {
                throw new Error("Vui lòng nhập tag!");
            }

            const headers = {
                'Authorization': `Bearer ${COC_API.TOKEN}`,
                'Accept': 'application/json'
            };

            loadingMsg = await api.sendMessage("⏳ Đang tải thông tin...", threadID);

            switch (command) {
                case "player": {
                    const response = await axios.get(
                        `${COC_API.BASE_URL}/players/%23${tag}`,
                        { headers }
                    );
                    const player = response.data;

                    let message = `👤 Thông tin người chơi:\n\n`;
                    message += `Tên: ${player.name}\n`;
                    message += `Tag: #${player.tag}\n`;
                    message += `Town Hall: ${player.townHallLevel}\n`;
                    message += `Level: ${player.expLevel}\n`;
                    message += `Trophies: ${player.trophies}\n`;
                    message += `War Stars: ${player.warStars}\n`;
                    message += `Clan: ${player.clan ? player.clan.name : 'Không có'}\n`;
                    message += `Role: ${player.role ? translateRole(player.role) : 'Không có'}\n\n`;
                    
                    message += `🏆 Thành tích:\n`;
                    message += `→ Best Trophies: ${player.bestTrophies}\n`;
                    message += `→ War Stars: ${player.warStars}\n`;
                    message += `→ Attack Wins: ${player.attackWins}\n`;
                    message += `→ Defense Wins: ${player.defenseWins}\n`;

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "clan": {
                    const response = await axios.get(
                        `${COC_API.BASE_URL}/clans/%23${tag}`,
                        { headers }
                    );
                    const clan = response.data;

                    let message = `⚔️ Thông tin clan:\n\n`;
                    message += `Tên: ${clan.name}\n`;
                    message += `Tag: #${clan.tag}\n`;
                    message += `Level: ${clan.clanLevel}\n`;
                    message += `Points: ${clan.clanPoints}\n`;
                    message += `Members: ${clan.members}/50\n`;
                    message += `War Win Streak: ${clan.warWinStreak}\n`;
                    message += `War Wins: ${clan.warWins}\n`;
                    message += `War League: ${clan.warLeague?.name || 'Không có'}\n\n`;
                    
                    message += `📝 Yêu cầu:\n`;
                    message += `→ Trophy: ${clan.requiredTrophies}\n`;
                    message += `→ TH: ${clan.requiredTownhallLevel || 'Không giới hạn'}\n`;
                    message += `→ Type: ${translateType(clan.type)}\n\n`;
                    
                    message += `📢 Mô tả:\n${clan.description}`;

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "war": {
                    const response = await axios.get(
                        `${COC_API.BASE_URL}/clans/%23${tag}/currentwar`,
                        { headers }
                    );
                    const war = response.data;

                    if (war.state === 'notInWar') {
                        throw new Error('Clan không trong trận war nào!');
                    }

                    let message = `⚔️ Thông tin war:\n\n`;
                    message += `Trạng thái: ${translateWarState(war.state)}\n`;
                    message += `Team Size: ${war.teamSize}\n\n`;
                    
                    message += `🏠 Clan:\n`;
                    message += `→ ${war.clan.name}\n`;
                    message += `→ Stars: ${war.clan.stars}\n`;
                    message += `→ Attacks: ${war.clan.attacks}\n`;
                    message += `→ Destruction: ${war.clan.destructionPercentage.toFixed(2)}%\n\n`;
                    
                    message += `🏰 Đối thủ:\n`;
                    message += `→ ${war.opponent.name}\n`;
                    message += `→ Stars: ${war.opponent.stars}\n`;
                    message += `→ Attacks: ${war.opponent.attacks}\n`;
                    message += `→ Destruction: ${war.opponent.destructionPercentage.toFixed(2)}%\n\n`;

                    if (war.state === 'preparation') {
                        message += `⏳ War bắt đầu sau: ${formatTime(war.startTime)}`;
                    } else if (war.state === 'inWar') {
                        message += `⏳ War kết thúc sau: ${formatTime(war.endTime)}`;
                    }

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "members": {
                    const response = await axios.get(
                        `${COC_API.BASE_URL}/clans/%23${tag}/members`,
                        { headers }
                    );
                    const members = response.data.items;

                    let message = `👥 Danh sách thành viên:\n\n`;
                    members.forEach((member, index) => {
                        message += `${index + 1}. ${member.name}\n`;
                        message += `→ Role: ${translateRole(member.role)}\n`;
                        message += `→ TH: ${member.townHallLevel}\n`;
                        message += `→ Trophy: ${member.trophies}\n`;
                        message += `→ Donations: ${member.donations}\n\n`;
                    });

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "warlog": {
                    const response = await axios.get(
                        `${COC_API.BASE_URL}/clans/%23${tag}/warlog`,
                        { headers }
                    );
                    const wars = response.data.items.slice(0, 5);

                    let message = `📜 Lịch sử war gần đây:\n\n`;
                    wars.forEach((war, index) => {
                        message += `${index + 1}. VS ${war.opponent.name}\n`;
                        message += `→ Kết quả: ${translateResult(war.result)}\n`;
                        message += `→ Team Size: ${war.teamSize}\n`;
                        message += `→ Stars: ${war.clan.stars} - ${war.opponent.stars}\n`;
                        message += `→ Destruction: ${war.clan.destructionPercentage.toFixed(2)}% - ${war.opponent.destructionPercentage.toFixed(2)}%\n\n`;
                    });

                    await api.sendMessage(message, threadID, messageID);
                    break;
                }

                default:
                    throw new Error("Lệnh không hợp lệ! Gõ 'coc' để xem hướng dẫn.");
            }

            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);

        } catch (error) {
            console.error('CoC Error:', error.response?.data || error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.response?.data?.message || error.message}`,
                threadID, messageID
            );
        }
    }
};

function translateRole(role) {
    const roles = {
        'leader': 'Chủ clan',
        'coLeader': 'Phó chủ',
        'admin': 'Trưởng lão',
        'member': 'Thành viên'
    };
    return roles[role] || role;
}

function translateType(type) {
    const types = {
        'inviteOnly': 'Chỉ mời',
        'closed': 'Đóng',
        'open': 'Mở'
    };
    return types[type] || type;
}

function translateWarState(state) {
    const states = {
        'preparation': 'Chuẩn bị',
        'inWar': 'Đang war',
        'ended': 'Kết thúc'
    };
    return states[state] || state;
}

function translateResult(result) {
    const results = {
        'win': 'Thắng ✅',
        'lose': 'Thua ❌',
        'tie': 'Hòa 🤝'
    };
    return results[result] || result;
}

function formatTime(timestamp) {
    const time = new Date(timestamp) - new Date();
    const hours = Math.floor(time / (1000 * 60 * 60));
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes}m`;
}
