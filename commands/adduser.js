module.exports = {
    name: "adduser",
    credits: "HNT",
    usedby: 1, 
    info: "add người dùng vào nhóm theo ID FB hoặc link profile",
    onPrefix: true,
    usages: "[ID1 ID2...] hoặc [link1 link2...] hoặc mix\nVD: .adduser 123456 fb.com/user2 789012",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID } = event;

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            if (!threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID())) {
                return api.sendMessage("⚠️ Bot cần quyền quản trị viên để thực hiện lệnh này!", threadID);
            }
        } catch (error) {
            console.error('AddUser Error:', error);
            return api.sendMessage("❌ Không thể kiểm tra quyền hạn!", threadID);
        }

        const botID = api.getCurrentUserID();
        const out = msg => api.sendMessage(msg, threadID, messageID);

        try {
        
            const adminConfig = JSON.parse(require('fs').readFileSync('./admin.json', 'utf8'));
            const isAdminBot = adminConfig.adminUIDs.includes(senderID);

            let threadInfo = null;
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    threadInfo = await api.getThreadInfo(threadID);
                    if (threadInfo) break;
                } catch (error) {
                    retryCount++;
                    if (retryCount === maxRetries) {
                        return out("❌ Không thể lấy thông tin nhóm sau nhiều lần thử. Vui lòng thử lại sau!");
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            const isGroupAdmin = threadInfo.adminIDs?.some(admin => admin.id === senderID);

            if (!isAdminBot && !isGroupAdmin) {
                return out("⚠️ Chỉ admin bot hoặc quản trị viên nhóm mới có thể sử dụng lệnh này!");
            }

            if (!target[0]) return out("⚠️ Vui lòng nhập ID hoặc link profile người dùng!");

            let success = 0, failed = 0;
            const results = [];
            const { participantIDs, approvalMode } = threadInfo;

            for (const user of target) {
                try {
                    let uid = user;
                    if (isNaN(user)) {
                       
                        try {
                            if (user.includes('facebook.com') || user.includes('fb.com')) {
                                const axios = require('axios');
                                const response = await axios.get(`https://api.fb.com/profile-to-id?url=${user}`);
                                if (response.data.id) {
                                    uid = response.data.id;
                                }
                            }
                        } catch (e) {
                            failed++;
                            results.push(`❌ Không thể xử lý link: ${user}`);
                            continue;
                        }
                    }

                    uid = String(uid);
                    if (participantIDs.includes(uid)) {
                        failed++;
                        results.push(`⚠️ Người dùng ${uid} đã có trong nhóm`);
                        continue;
                    }

                    await api.addUserToGroup(uid, threadID);
                    success++;
                    results.push(`✅ Đã thêm người dùng ${uid} ${approvalMode ? "vào danh sách phê duyệt" : "vào nhóm"}`);

                } catch (error) {
                    failed++;
                    let errorMsg = `❌ Lỗi thêm ${user}: `;
                    if (error.error === 6) errorMsg += "Người dùng đã chặn bot";
                    else if (error.error === 3252001) errorMsg += "Bot bị Facebook hạn chế";
                    else errorMsg += error.message;
                    results.push(errorMsg);
                }
            }

            return out(
                `📊 Kết quả thêm người dùng:\n` +
                `✅ Thành công: ${success}\n` +
                `❌ Thất bại: ${failed}\n\n` +
                results.join('\n')
            );

        } catch (error) {
            console.error('AddUser Error:', error);
            return out("❌ Đã xảy ra lỗi khi thực hiện lệnh!");
        }
    }
};
