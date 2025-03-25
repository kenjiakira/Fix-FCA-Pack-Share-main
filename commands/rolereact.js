const fs = require('fs');
const path = require('path');

const ROLES_DIR = path.join(__dirname, 'json');
const ROLES_FILE = path.join(ROLES_DIR, 'roles.json');
const REACT_FILE = path.join(ROLES_DIR, 'reactions.json');
const USER_DATA_FILE = path.join(__dirname, '../events/cache/userData.json');

// Create directories and files if not exist
if (!fs.existsSync(ROLES_DIR)) {
    fs.mkdirSync(ROLES_DIR, { recursive: true });
}
if (!fs.existsSync(ROLES_FILE)) {
    fs.writeFileSync(ROLES_FILE, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(REACT_FILE)) {
    fs.writeFileSync(REACT_FILE, JSON.stringify({}, null, 2));
}

function getUserName(userID) {
    try {
        const userData = JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf8'));
        // Return name if exists, otherwise keep the ID as fallback
        return userData[userID]?.name || userID;
    } catch (error) {
        console.error("Error reading userData:", error);
        return userID; // Return ID as fallback instead of "Unknown User"
    }
}

function saveReaction(threadID, messageID, emoji, role) {
    try {
        const reactions = JSON.parse(fs.readFileSync(REACT_FILE, 'utf8'));
        if (!reactions[threadID]) reactions[threadID] = {};
        if (!reactions[threadID][messageID]) reactions[threadID][messageID] = {};
        
        reactions[threadID][messageID] = {
            emoji: emoji,
            role: role,
            users: {} // Store users who reacted
        };
        
        fs.writeFileSync(REACT_FILE, JSON.stringify(reactions, null, 2));
    } catch (error) {
        console.error("Error saving reaction:", error);
    }
}

module.exports = {
    name: "rolereact",
    dev: "HNT",
    category: "System",
    info: "Quản lý role reaction",
    usedby: 5,
    onPrefix: true,
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const cmd = target[0]?.toLowerCase();
        
        try {
            let roles = JSON.parse(fs.readFileSync(ROLES_FILE));
            if (!roles[threadID]) roles[threadID] = {};

            switch(cmd) {
                case "add": {
                    const emoji = target[1];
                    const roleName = target.slice(2).join(" ");

                    if (!emoji || !roleName) {
                        return api.sendMessage(
                            "Sử dụng: rolereact add [emoji] [tên role]",
                            threadID, messageID
                        );
                    }

                    roles[threadID][emoji] = {
                        name: roleName,
                        prefix: (userID) => `[${roleName}] ${getUserName(userID)}`  // Make prefix a function that gets current name
                    };

                    fs.writeFileSync(ROLES_FILE, JSON.stringify(roles, null, 2));
                    
                    const msg = await api.sendMessage(
                        `🎭 Role Reaction\n` +
                        `Thả ${emoji} để nhận role "${roleName}"\n` +
                        `Tin nhắn này sẽ được lưu để tái sử dụng.`,
                        threadID
                    );

                    // Save reaction info for reuse
                    saveReaction(threadID, msg.messageID, emoji, roleName);

                    global.client.callReact.push({
                        messageID: msg.messageID,
                        type: "role",
                        emoji: emoji,
                        threadID: threadID
                    });

                    return;
                }

                case "remove": {
                    const emoji = target[1];
                    if (!emoji || !roles[threadID][emoji]) {
                        return api.sendMessage(
                            "⚠️ Vui lòng chọn emoji role hợp lệ!",
                            threadID, messageID
                        );
                    }

                    delete roles[threadID][emoji];
                    fs.writeFileSync(ROLES_FILE, JSON.stringify(roles, null, 2));
                    return api.sendMessage(
                        "✅ Đã xóa role reaction!",
                        threadID, messageID
                    );
                }

                case "list": {
                    const threadRoles = roles[threadID];
                    if (!threadRoles || Object.keys(threadRoles).length === 0) {
                        return api.sendMessage(
                            "📝 Chưa có role reaction nào!",
                            threadID, messageID
                        );
                    }

                    const reactions = JSON.parse(fs.readFileSync(REACT_FILE, 'utf8'));
                    let msg = "📋 Danh sách Role Reactions:\n\n";
                    
                    for (const [emoji, role] of Object.entries(threadRoles)) {
                        msg += `${emoji} » ${role.name}\n`;
                        // Add users who have this role if any
                        const roleUsers = Object.entries(reactions[threadID] || {})
                            .filter(([_, data]) => data.role === role.name)
                            .map(([_, data]) => Object.keys(data.users || {}))
                            .flat()
                            .map(userID => getUserName(userID));
                            
                        if (roleUsers.length > 0) {
                            msg += `└── Thành viên: ${roleUsers.join(", ")}\n`;
                        }
                    }
                    return api.sendMessage(msg, threadID, messageID);
                }

                default: {
                    return api.sendMessage(
                        "🎭 ROLE REACTION SYSTEM\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "1. Thêm role mới:\n" +
                        "   rolereact add [emoji] [tên role]\n\n" +
                        "2. Xóa role:\n" +
                        "   rolereact remove [emoji]\n\n" +
                        "3. Xem danh sách:\n" +
                        "   rolereact list",
                        threadID, messageID
                    );
                }
            }

        } catch (error) {
            console.error("Role reaction error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    }
};
