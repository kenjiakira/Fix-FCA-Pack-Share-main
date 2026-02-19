"use strict";

/**
 * FCA-style wrapper for meta-messenger.js (CommonJS - không nằm trong folder ESM).
 * Cho phép dùng meta-messenger với cùng cách gọi login/API như hut-chat-api.
 * Lưu ý: removeUserFromGroup chưa được meta-messenger hỗ trợ (sẽ trả lỗi).
 */

function appStateToCookies(appState) {
    if (!appState) {
        throw { error: "appState required for meta-messenger. Use same appstate.json as hut-chat-api." };
    }
    const out = {};
    if (Array.isArray(appState)) {
        for (const c of appState) {
            const name = c.name || c.key;
            const val = c.value;
            if (name && val != null) out[name] = String(val);
        }
    } else if (appState.cookies && Array.isArray(appState.cookies)) {
        for (const c of appState.cookies) {
            const name = c.name || c.key;
            const val = c.value;
            if (name && val != null) out[name] = String(val);
        }
    } else if (typeof appState === "object" && !Array.isArray(appState)) {
        for (const [k, v] of Object.entries(appState)) {
            if (v != null && typeof v === "string") out[k] = v;
        }
    }
    if (!out.c_user || !out.xs) {
        throw { error: "appState must contain c_user and xs cookies for meta-messenger." };
    }
    return out;
}

function toBigInt(v) {
    if (v == null) return null;
    if (typeof v === "bigint") return v;
    return BigInt(String(v).replace(/^\D+/, ""));
}

function toStringId(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "bigint") return String(v);
    return String(v);
}

function buildFCAWrapper(client) {
    const botID = toStringId(client.currentUserId);
    const botAdminItem = { id: botID };
    const threadsCache = new Map();
    if (client.initialData && client.initialData.threads) {
        for (const t of client.initialData.threads) {
            const id = String(t.id);
            const isGroup = t.type != null && Number(t.type) !== 1;
            const name = t.name || `Thread ${id}`;
            threadsCache.set(id, {
                name,
                threadName: name,
                participantIDs: [],
                adminIDs: isGroup ? [botAdminItem] : [],
                isGroup: !!isGroup
            });
        }
    }

    const api = {
        setOptions() {},
        listenMqtt(callback) {
            client.on("fullyReady", () => {
                if (callback) callback(null, { type: "ready" });
            });
            client.on("message", (msg) => {
                if (!msg || msg.senderId === client.currentUserId) return;
                const event = {
                    type: "message",
                    senderID: toStringId(msg.senderId),
                    threadID: toStringId(msg.threadId),
                    body: msg.text || "",
                    messageID: msg.id,
                    attachments: (msg.attachments || []).map((a) => ({
                        type: a.type || "file",
                        url: a.url,
                        filename: a.fileName
                    })),
                    messageReply: msg.replyTo
                        ? {
                            senderID: toStringId(msg.replyTo.senderId),
                            body: msg.replyTo.text,
                            messageID: msg.replyTo.messageId
                        }
                        : null,
                    mentions: (msg.mentions || []).reduce((o, m) => {
                        o[toStringId(m.userId)] = "@" + toStringId(m.userId);
                        return o;
                    }, {}),
                    participantIDs: []
                };
                if (callback) callback(null, event);
            });
            client.on("error", (err) => {
                if (callback) callback(err);
            });
        },
        sendMessage(body, threadID, messageIDOrCallback, callback) {
            const cb = typeof messageIDOrCallback === "function" ? messageIDOrCallback : callback;
            const tid = toBigInt(threadID);
            if (!tid) {
                if (cb) cb({ error: "Invalid threadID" });
                return;
            }
            const text = typeof body === "string" ? body : (body && body.body) || "";
            client
                .sendMessage(tid, text)
                .then(() => {
                    if (cb) cb(null, { messageID: "" });
                })
                .catch((err) => {
                    if (cb) cb(err);
                });
        },
        getCurrentUserID() {
            return toStringId(client.currentUserId);
        },
        async getThreadInfo(threadID) {
            const id = toStringId(threadID);
            const cached = threadsCache.get(id);
            if (cached) return cached;
            if (client.initialData && client.initialData.threads) {
                const t = client.initialData.threads.find((x) => String(x.id) === id);
                if (t) {
                    const isGroup = t.type != null && Number(t.type) !== 1;
                    const name = t.name || `Nhóm ${id}`;
                    const info = {
                        name,
                        threadName: name,
                        participantIDs: [],
                        adminIDs: isGroup ? [botAdminItem] : [],
                        isGroup: !!isGroup
                    };
                    threadsCache.set(id, info);
                    return info;
                }
            }
            return {
                name: `Nhóm ${id}`,
                threadName: `Nhóm ${id}`,
                participantIDs: [],
                adminIDs: [botAdminItem],
                isGroup: true
            };
        },
        async getThreadList(limit, cursor, tags) {
            const list = (client.initialData && client.initialData.threads) || [];
            return list.slice(0, limit || 100).map((t) => ({
                threadID: String(t.id),
                name: t.name,
                isGroup: (t.type && Number(t.type) !== 1) || false
            }));
        },
        async getUserInfo(uid) {
            try {
                const id = toBigInt(uid);
                if (!id) return {};
                const info = await client.getUserInfo(id);
                return { [toStringId(uid)]: { name: info.name || "User" } };
            } catch (e) {
                return { [toStringId(uid)]: { name: "User" } };
            }
        },
        removeUserFromGroup(userID, threadID, callback) {
            const cb = typeof callback === "function" ? callback : () => {};
            setImmediate(() => {
                cb({ error: "meta-messenger chưa hỗ trợ removeUserFromGroup (kick). Hãy dùng hut-chat-api hoặc reply để kick." });
            });
        },
        unsendMessage(messageID, callback) {
            const cb = typeof callback === "function" ? callback : () => {};
            client
                .unsendMessage(messageID)
                .then(() => cb())
                .catch((err) => cb(err));
        }
    };
    return api;
}

function login(loginData, options, callback) {
    if (typeof options === "function" || typeof options === "AsyncFunction") {
        callback = options;
        options = {};
    }
    if (typeof callback !== "function") {
        return Promise.reject(new Error("callback required"));
    }

    (async () => {
        try {
            const cookies = appStateToCookies(loginData.appState);
            const { login: mmLogin } = await import("meta-messenger.js");
            const client = await mmLogin(cookies, {
                enableE2EE: false,
                logLevel: "none",
                ...options
            });
            const api = buildFCAWrapper(client);
            callback(null, api);
        } catch (err) {
            callback(err && err.error ? err : { error: (err && err.message) || String(err) });
        }
    })();
}

module.exports = login;
