const fs = require("fs");
const path = require("path");
const axios = require("axios");

const jsonDir = path.join(__dirname, "../database/json");
const antiDir = path.join(__dirname, "../database/json/anti");
[jsonDir, antiDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const BANWORDS_FILE = path.join(__dirname, '../database/json/banwords.json');
const WARNINGS_FILE = path.join(__dirname, '../database/json/warnings.json');
[BANWORDS_FILE, WARNINGS_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({}, null, 2));
    }
});

module.exports = {
    name: "security",
    dev: "HNT",
    category: "Groups",
    usedby: 5,
    onPrefix: true,
    cooldowns: 5,
    info: "Bảo vệ nhóm: chống spam, từ cấm, quyền admin,...",
    usages: `Cách dùng:
1. Anti System:
   security anti <tính năng> on/off
   security anti all on/off

2. Quản lý từ cấm:
   security ban add <từ1, từ2,...>
   security ban remove <từ1, từ2,...>
   security ban list
   security ban reset

Tính năng anti:
- spam: chống spam tin nhắn (15 tin/5s)
- role: chống đổi quyền QTV
- out: chống rời nhóm
- join: chống thêm thành viên
- name: chống đổi tên nhóm
- avt: chống đổi ảnh nhóm
- tag: chống tag spam (3 lần/24h)
- admintag: chống tag admin`,

    features: {
        spam: {
            name: "antispam",
            icon: "🛡️",
            desc: "chống spam tin nhắn",
            detail: "15 tin nhắn/5 giây",
            defaultData: { threads: {}, spamData: {} },
        },
        role: {
            name: "antirole",
            icon: "👑",
            desc: "chống đổi quyền QTV",
            detail: "chỉ admin bot được phép",
        },
        out: {
            name: "antiout",
            icon: "🚫",
            desc: "chống rời nhóm",
            detail: "tự thêm lại khi out",
        },
        join: {
            name: "antijoin",
            icon: "🚷",
            desc: "chống thêm thành viên",
            detail: "tự kick thành viên mới",
        },
        name: {
            name: "antiname",
            icon: "✏️",
            desc: "chống đổi tên nhóm",
            detail: "chỉ QTV được phép",
        },
        avt: {
            name: "antiavt",
            icon: "🖼️",
            desc: "chống đổi ảnh nhóm",
            detail: "chỉ QTV được phép",
        },
        tag: {
            name: "antitag",
            icon: "🏷️",
            desc: "chống tag spam",
            detail: "3 lần/24h",
            defaultData: { threads: {}, tagData: {} },
        },
        admintag: {
            name: "antiadmintag",
            icon: "⚔️",
            desc: "chống tag admin",
            detail: "tự động kick khi tag admin",
            defaultData: { threads: {} },
        }
    },

    onLoad: function () {
        if (!fs.existsSync(antiDir)) {
            fs.mkdirSync(antiDir, { recursive: true });
        }

        Object.values(this.features).forEach((feature) => {
            const jsonPath = path.join(antiDir, `${feature.name}.json`);
            if (!fs.existsSync(jsonPath)) {
                fs.writeFileSync(
                    jsonPath,
                    JSON.stringify(feature.defaultData || {}, null, 4)
                );
            }
        });
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        try {
            const threadsDB = JSON.parse(fs.readFileSync("../database/threads.json", "utf8")) || {};
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const isAdminBot = adminConfig.adminUIDs.includes(senderID);
            const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(
                admin => admin.id === senderID || admin === senderID
            );

            if (!isAdminBot && !isGroupAdmin) {
                return api.sendMessage(
                    "⚠️ Chỉ Admin bot hoặc Quản trị viên nhóm mới có thể sử dụng lệnh này!",
                    threadID
                );
            }

            if (!target[0]) {
                return api.sendMessage(this.usages, threadID, messageID);
            }

            const cmd = target[0].toLowerCase();
            const subcmd = target[1]?.toLowerCase();

            switch(cmd) {
                case "anti": {
                    if (!subcmd) {
                        const helpMessage = "🛡️ ANTI SYSTEM GUIDE\n\n"
                            + Object.entries(this.features)
                                .map(([key, feature]) => 
                                    `${feature.icon} ${feature.name}\n`
                                    + `↬ Chức năng: ${feature.desc}\n`
                                    + `↬ Chi tiết: ${feature.detail}\n`
                                ).join('\n')
                            + "\n📝 Cách sử dụng:\n"
                            + "• Bật/tắt một tính năng:\n"
                            + "  .security anti <tính năng> on/off\n"
                            + "• Bật/tắt tất cả tính năng:\n"
                            + "  .security anti all on/off";
                            
                        return api.sendMessage(helpMessage, threadID, messageID);
                    }
                    const feature = subcmd;
                    const action = target[2]?.toLowerCase();

                    if (feature === "all") {
                        if (!action || !["on", "off"].includes(action)) {
                            return api.sendMessage("⚠️ Vui lòng sử dụng: security anti all on/off", threadID);
                        }

                        const isEnable = action === "on";
                        let updatedFeatures = [];

                        for (const [feat, config] of Object.entries(this.features)) {
                            try {
                                const threadInfo = await api.getThreadInfo(threadID);
                                await this.updateFeature(config.name, threadID, isEnable, threadInfo || {});
                                updatedFeatures.push(config.desc);
                            } catch (error) {
                                console.error(`Anti ${feat} update error:`, error);
                            }
                        }

                        return api.sendMessage(
                            `✅ Đã ${isEnable ? "bật" : "tắt"} các tính năng bảo vệ:\n${updatedFeatures.map(desc => `• ${desc}`).join("\n")}`,
                            threadID
                        );
                    }

                    if (!this.features[feature]) {
                        return api.sendMessage("⚠️ Tính năng không hợp lệ!", threadID);
                    }

                    if (!action || !["on", "off"].includes(action)) {
                        return api.sendMessage("⚠️ Vui lòng chọn on hoặc off!", threadID);
                    }

                    const featureConfig = this.features[feature];
                    const isEnable = action === "on";

                    try {
                        const threadInfo = await api.getThreadInfo(threadID);
                        await this.updateFeature(featureConfig.name, threadID, isEnable, threadInfo || {});
                    } catch (error) {
                        console.error(`Anti ${feature} update error:`, error);
                        await this.updateFeature(featureConfig.name, threadID, isEnable, {});
                    }

                    return api.sendMessage(
                        `${featureConfig.icon} ${featureConfig.desc}\n` +
                        `↬ Trạng thái: ${isEnable ? "ON ✅" : "OFF ❌"}\n` +
                        `↬ Chi tiết: ${featureConfig.detail}`,
                        threadID
                    );
                }

                case "ban": {
                    let banwords = JSON.parse(fs.readFileSync(BANWORDS_FILE));
                    if (!banwords[threadID]) banwords[threadID] = [];
                    const words = target.slice(2).join(" ");

                    switch(subcmd) {
                        case "add": {
                            if (!words) {
                                return api.sendMessage("⚠️ Vui lòng nhập từ cần cấm!", threadID, messageID);
                            }

                            const newWords = words.split(",").map(w => w.trim().toLowerCase());
                            const addedWords = newWords.filter(w => !banwords[threadID].includes(w));
                            
                            if (addedWords.length > 0) {
                                banwords[threadID].push(...addedWords);
                                fs.writeFileSync(BANWORDS_FILE, JSON.stringify(banwords, null, 2));
                                return api.sendMessage(
                                    `✅ Đã thêm ${addedWords.length} từ cấm:\n${addedWords.join(", ")}`,
                                    threadID, messageID
                                );
                            }
                            return api.sendMessage("⚠️ Những từ này đã có trong danh sách cấm!", threadID, messageID);
                        }

                        case "remove": {
                            if (!words) {
                                return api.sendMessage("⚠️ Vui lòng nhập từ cần gỡ!", threadID, messageID);
                            }

                            const removeWords = words.split(",").map(w => w.trim().toLowerCase());
                            const removed = removeWords.filter(w => banwords[threadID].includes(w));
                            
                            if (removed.length > 0) {
                                banwords[threadID] = banwords[threadID].filter(w => !removed.includes(w));
                                fs.writeFileSync(BANWORDS_FILE, JSON.stringify(banwords, null, 2));
                                return api.sendMessage(
                                    `✅ Đã gỡ ${removed.length} từ cấm:\n${removed.join(", ")}`,
                                    threadID, messageID
                                );
                            }
                            return api.sendMessage("⚠️ Không tìm thấy từ cần gỡ!", threadID, messageID);
                        }

                        case "list": {
                            const threadBanwords = banwords[threadID];
                            if (!threadBanwords || threadBanwords.length === 0) {
                                return api.sendMessage("📝 Chưa có từ cấm nào trong nhóm!", threadID, messageID);
                            }
                            return api.sendMessage(
                                `📝 Danh sách từ cấm (${threadBanwords.length}):\n${threadBanwords.join(", ")}`,
                                threadID, messageID
                            );
                        }

                        case "reset": {
                            banwords[threadID] = [];
                            let warnings = JSON.parse(fs.readFileSync(WARNINGS_FILE));
                            delete warnings[threadID];
                            
                            fs.writeFileSync(BANWORDS_FILE, JSON.stringify(banwords, null, 2));
                            fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
                            
                            return api.sendMessage("✅ Đã xóa tất cả từ cấm và cảnh báo trong nhóm!", threadID, messageID);
                        }

                        default: {
                            return api.sendMessage("⚠️ Lệnh không hợp lệ! Sử dụng: security ban add/remove/list/reset", threadID, messageID);
                        }
                    }
                }

                default:
                    return api.sendMessage(this.usages, threadID, messageID);
            }
        } catch (error) {
            console.error("Security command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    },

    getFeatureStatus: function (feature, threadID) {
        try {
            const jsonPath = path.join(__dirname, "json", "anti", `${feature}.json`);
            const data = JSON.parse(fs.readFileSync(jsonPath));

            if (feature === "antiavt") {
                return data[threadID]?.enable || false;
            }

            if (["antiout", "antijoin", "antiname"].includes(feature)) {
                if (feature === "antiname") {
                    return data[threadID]?.enable || false;
                }
                return data[threadID] || false;
            }

            return data.threads?.[threadID] || false;
        } catch {
            return false;
        }
    },

    updateFeature: async function (feature, threadID, isEnable, threadInfo) {
        const jsonPath = path.join(__dirname, "json", "anti", `${feature}.json`);
        let data = {};

        try {
            data = JSON.parse(fs.readFileSync(jsonPath));
        } catch {
            data = feature === "antispam"
                ? { threads: {}, spamData: {} }
                : feature === "antitag"
                    ? { threads: {}, tagData: {} }
                    : {};
        }

        switch (feature) {
            case "antiout":
            case "antijoin":
                data[threadID] = isEnable;
                break;

            case "antiname":
                data[threadID] = {
                    enable: isEnable,
                    name: threadInfo.threadName,
                    lastUpdate: Date.now(),
                };
                break;

            case "antiavt":
                if (isEnable && threadInfo.imageSrc) {
                    const imagePath = await this.downloadImage(threadInfo.imageSrc, threadID);
                    data[threadID] = {
                        enable: true,
                        imageUrl: threadInfo.imageSrc,
                        localPath: imagePath,
                        lastUpdate: Date.now(),
                    };
                } else {
                    data[threadID] = { enable: false };
                }
                break;

            default:
                if (!data.threads) data.threads = {};
                data.threads[threadID] = isEnable;
        }

        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4));
    },

    downloadImage: async function (url, threadID) {
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }

        const imagePath = path.join(cacheDir, `thread_${threadID}.jpg`);

        try {
            const response = await axios.get(url, { responseType: "stream" });
            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on("finish", () => resolve(imagePath));
                writer.on("error", reject);
            });
        } catch (err) {
            console.error("Image download error:", err);
            return null;
        }
    },

    noPrefix: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        if (!body) return;

        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            if (adminConfig.adminUIDs.includes(senderID) || 
                (adminConfig.moderatorUIDs && adminConfig.moderatorUIDs.includes(senderID))) {
                return;
            }

            const banwords = JSON.parse(fs.readFileSync(BANWORDS_FILE));
            const threadBanwords = banwords[threadID] || [];
            
            if (threadBanwords.length === 0) return;

            if (threadBanwords.some(word => body.toLowerCase().includes(word.toLowerCase()))) {
                let warnings = JSON.parse(fs.readFileSync(WARNINGS_FILE));
                if (!warnings[threadID]) warnings[threadID] = {};
                if (!warnings[threadID][senderID]) warnings[threadID][senderID] = 0;

                warnings[threadID][senderID]++;
                const warningCount = warnings[threadID][senderID];

                fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));

                if (warningCount >= 3) {
                    warnings[threadID][senderID] = 0;
                    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
                    await api.removeUserFromGroup(senderID, threadID);
                    return api.sendMessage("🚫 Người dùng đã bị kick vì vi phạm 3 lần sử dụng từ cấm!", threadID);
                }

                return api.sendMessage(
                    `⚠️ Cảnh báo ${warningCount}/3:\nTin nhắn của bạn chứa từ cấm!\n${warningCount === 2 ? "❗ Đây là cảnh báo cuối cùng!" : ""}`,
                    threadID
                );
            }
        } catch (error) {
            console.error("Banwords check error:", error);
        }
    }
};
