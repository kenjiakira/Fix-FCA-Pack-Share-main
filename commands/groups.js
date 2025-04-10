const fs = require('fs');
const path = require('path');
const threadInfoCache = new Map();
const getThreadParticipantIDs = require("../utils/getParticipantIDs");

const nicknameConfigPath = path.join(__dirname, "../database/json/setname/nicknames.json");
const setnameStatusPath = path.join(__dirname, "../database/json/setname/setnameStatus.json");

// Create config files if they don't exist
[nicknameConfigPath, setnameStatusPath].forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
});

module.exports = {
    name: "groups",
    dev: "HNT",
    category: "Groups",
    info: "Quản lý nhóm: thêm/xóa thành viên, đặt biệt danh....",
    usages: `Cách dùng:
1. Thêm thành viên:
   groups add <ID/link profile>
   
2. Kick thành viên:
   groups kick [reply/tag/uid]
   
3. Đặt biệt danh:
   groups name <biệt danh> (reply/tag)
   groups name auto <mẫu biệt danh>
   groups name on/off
   groups name all <biệt danh>`,
    onPrefix: true,
    usedby: 5,
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, type, messageReply, mentions } = event;
        const botID = api.getCurrentUserID();

        if (!target[0]) {
            return api.sendMessage(this.usages, threadID, messageID);
        }

        const cmd = target[0].toLowerCase();
        const args = target.slice(1);

        try {
            switch (cmd) {
                case "add": {
                    let participantIDs = [];
                    try {
                        participantIDs = await getThreadParticipantIDs(api, threadID);
                        if (!participantIDs || participantIDs.length === 0) {
                            throw new Error("Không thể lấy danh sách thành viên nhóm");
                        }
                    } catch (error) {
                        console.error("Error getting participants:", error);
                        return api.sendMessage(`❌ ${error.message}`, threadID, messageID);
                    }

                    if (!args[0]) return api.sendMessage("⚠️ Vui lòng nhập ID hoặc link profile người dùng cần thêm!", threadID, messageID);

                    async function getUID(url, api) {
                        if (!isNaN(url)) return [url, null, false];
                        url = url.replace(/\/$/, '');
                        const segments = url.split('/');
                        const lastSegment = segments[segments.length - 1];
                        try {
                            const userInfo = await api.getUserID(lastSegment);
                            if (userInfo && userInfo[0]) {
                                return [userInfo[0].userID.toString(), userInfo[0].name, false];
                            }
                        } catch (err) {
                            console.error("Error getting user info:", err);
                            return [null, null, true];
                        }
                        return [null, null, true];
                    }

                    async function adduser(id, name) {
                        id = parseInt(id);
                        if (participantIDs.includes(id.toString())) {
                            return api.sendMessage(`⚠️ ${name ? name : "Người dùng"} đã có trong nhóm!`, threadID, messageID);
                        }

                        try {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await api.addUserToGroup(id, threadID);
                            threadInfoCache.delete(threadID);
                            return api.sendMessage(`✅ Đã thêm ${name ? name : "người dùng"} vào nhóm!`, threadID, messageID);
                        } catch (error) {
                            console.error("Add user error:", error);
                            return api.sendMessage(`❌ Không thể thêm ${name ? name : "người dùng"} vào nhóm!`, threadID, messageID);
                        }
                    }

                    if (!isNaN(args[0])) {
                        return adduser(args[0], undefined);
                    } else {
                        try {
                            var [id, name, fail] = await getUID(args[0], api);
                            if (fail && id) return api.sendMessage(id, threadID, messageID);
                            if (fail && !id) return api.sendMessage("❌ Không tìm thấy ID người dùng!", threadID, messageID);
                            await adduser(id, name || "Người dùng Facebook");
                        } catch (e) {
                            console.error("Error processing user input:", e);
                            return api.sendMessage(`❌ Lỗi xử lý: ${e.message || "Không xác định"}`, threadID, messageID);
                        }
                    }
                    break;
                }

                case "kick": {
                    try {
                        let threadAdmins = [];
                        try {
                            const threadInfo = await api.getThreadInfo(threadID);
                            if (threadInfo?.adminIDs) {
                                threadAdmins = threadInfo.adminIDs.map(admin => admin.id);
                                if (!threadAdmins.includes(botID)) {
                                    return api.sendMessage("❌ Bot cần quyền quản trị viên!", threadID, messageID);
                                }
                            }
                        } catch (error) {
                            console.error("Thread info fetch error:", error);
                        }

                        const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
                        const botAdmins = adminConfig.adminUIDs || [];

                        let userIDs = [];
                        if (messageReply) {
                            userIDs.push(messageReply.senderID);
                        } else if (Object.keys(mentions || {}).length > 0) {
                            userIDs = Object.keys(mentions);
                        } else if (args[0]) {
                            if (isNaN(args[0])) {
                                return api.sendMessage("⚠️ ID không hợp lệ!", threadID, messageID);
                            }
                            userIDs.push(args[0]);
                        } else {
                            return api.sendMessage("⚠️ Vui lòng tag hoặc reply người cần kick!", threadID, messageID);
                        }

                        for (const uid of userIDs) {
                            if (botAdmins.includes(uid)) {
                                api.sendMessage("⚠️ Không thể kick Admin Bot!", threadID, messageID);
                                continue;
                            }
                            if (uid === botID || threadAdmins.includes(uid)) continue;
                            try {
                                await api.removeUserFromGroup(uid, threadID);
                            } catch (error) {
                                console.error(`Kick error for ${uid}:`, error);
                            }
                        }
                    } catch (error) {
                        console.error("Kick command error:", error);
                        return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
                    }
                    break;
                }

                case "name": {
                    if (args[0] === "on" || args[0] === "off") {
                        let setnameStatus = {};
                        try {
                            setnameStatus = JSON.parse(fs.readFileSync(setnameStatusPath));
                        } catch (err) {
                            console.error("Error loading setname status:", err);
                        }

                        setnameStatus[threadID] = args[0] === "on";
                        fs.writeFileSync(setnameStatusPath, JSON.stringify(setnameStatus, null, 2));

                        return api.sendMessage(
                            `Đã ${args[0] === "on" ? "bật" : "tắt"} chức năng đổi biệt danh trong nhóm này`,
                            threadID,
                            messageID
                        );
                    }

                    if (args[0] === "all") {
                        const newNickname = args.slice(1).join(" ");
                        if (!newNickname || newNickname.length > 50) {
                            return api.sendMessage("Biệt danh không hợp lệ!", threadID, messageID);
                        }

                        const participantIDs = await getThreadParticipantIDs(api, threadID);
                        if (!participantIDs || participantIDs.length === 0) {
                            return api.sendMessage("Không thể lấy danh sách thành viên!", threadID, messageID);
                        }

                        await api.sendMessage("Đang thực hiện đổi biệt danh cho tất cả thành viên...", threadID, messageID);

                        for (const participantID of participantIDs) {
                            try {
                                await api.changeNickname(newNickname, threadID, participantID);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } catch (error) {
                                console.error(`Error setting nickname for ${participantID}:`, error);
                            }
                        }

                        return api.sendMessage(`✅ Đã đổi biệt danh cho tất cả thành: ${newNickname}`, threadID, messageID);
                    }

                    if (args[0] === "auto") {
                        const nickConfig = JSON.parse(fs.readFileSync(nicknameConfigPath));

                        if (args[1] === "off") {
                            delete nickConfig[threadID];
                            fs.writeFileSync(nicknameConfigPath, JSON.stringify(nickConfig, null, 2));
                            return api.sendMessage("✅ Đã tắt auto setname", threadID, messageID);
                        }

                        const pattern = args.slice(1).join(" ");
                        if (!pattern) {
                            return api.sendMessage("⚠️ Vui lòng nhập mẫu biệt danh!\nVí dụ: groups name auto Member {name}", threadID, messageID);
                        }

                        nickConfig[threadID] = pattern;
                        fs.writeFileSync(nicknameConfigPath, JSON.stringify(nickConfig, null, 2));
                        return api.sendMessage(`✅ Đã set mẫu biệt danh: ${pattern}`, threadID, messageID);
                    }

                    let uid, newNickname;
                    if (type === "message_reply") {
                        uid = messageReply.senderID;
                        newNickname = args.join(" ");
                    } else if (Object.keys(mentions).length > 0) {
                        uid = Object.keys(mentions)[0];
                        newNickname = args.join(" ").replace(mentions[uid], "").trim();
                    } else {
                        return api.sendMessage("⚠️ Vui lòng tag hoặc reply người muốn đổi biệt danh", threadID, messageID);
                    }

                    if (!newNickname || newNickname.length > 50) {
                        return api.sendMessage("Biệt danh không hợp lệ!", threadID, messageID);
                    }

                    try {
                        await api.changeNickname(newNickname, threadID, uid);
                        return api.sendMessage(`✅ Đã đổi biệt danh thành: ${newNickname}`, threadID, messageID);
                    } catch (error) {
                        console.error("Setname error:", error);
                        return api.sendMessage("❌ Lỗi đổi biệt danh! Bot cần là quản trị viên.", threadID, messageID);
                    }
                    break;
                }

                default:
                    return api.sendMessage(this.usages, threadID, messageID);
            }
        } catch (error) {
            console.error("Groups command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    },

    handleNewMember: async (api, event) => {
        try {
            const setnameStatus = JSON.parse(fs.readFileSync(setnameStatusPath));
            if (setnameStatus[event.threadID] === false) return;

            const { threadID, participantIDs } = event;
            const nickConfig = JSON.parse(fs.readFileSync(nicknameConfigPath));
            const pattern = nickConfig[threadID];
            if (!pattern) return;

            const userInfo = await api.getUserInfo(participantIDs[0]);
            const userName = userInfo[participantIDs[0]].name;
            const newNickname = pattern.replace("{name}", userName);

            await api.changeNickname(newNickname, threadID, participantIDs[0]);
        } catch (error) {
            console.error("Error setting auto nickname:", error);
        }
    }
};
