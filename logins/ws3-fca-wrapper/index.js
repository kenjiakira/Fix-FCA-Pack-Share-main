"use strict";

const fs = require("fs");
const path = require("path");

// ws3-fca exports an object with 'login' method
const ws3Module = require("ws3-fca");
const ws3Login = ws3Module.login || ws3Module;

if (typeof ws3Login !== 'function') {
    throw new Error("ws3-fca.login is not a function. Export keys: " + JSON.stringify(Object.keys(ws3Module || {})));
}

// Load config
const configPath = path.join(__dirname, "../hut-chat-api/config.json");
let config = {};
if (fs.existsSync(configPath)) {
    try {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
        console.error("Error loading config:", e);
    }
}

function login(loginData, options, callback) {
    // Xử lý nếu options là callback (overload)
    if (typeof options === 'function' || (options && typeof options.then === 'function')) {
        callback = options;
        options = {};
    }

    // Xử lý Promise nếu không có callback
    let returnPromise;
    if (!callback) {
        returnPromise = new Promise((resolve, reject) => {
            callback = (err, api) => {
                if (err) reject(err);
                else resolve(api);
            };
        });
    }

    // Merge options với defaults
    const defaultOptions = {
        logLevel: "silent",
        forceLogin: true,
        autoMarkDelivery: false,
        autoMarkRead: false,
        listenEvents: true,
        selfListen: false,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        autoReconnect: true,
        online: true
    };

    let appState = null;
    let loginDataOptions = {};
    
    if (loginData) {
        if (loginData.appState) {
            appState = loginData.appState;
            const { appState: _, ...rest } = loginData;
            loginDataOptions = rest;
        } else if (Array.isArray(loginData)) {
            appState = loginData;
        } else if (typeof loginData === 'string') {
            appState = loginData;
        }
    }

    if (!appState) {
        const error = { error: "No appState given. ws3-fca requires appState to login." };
        if (returnPromise) {
            return Promise.reject(error);
        }
        return callback(error);
    }

    const mergedOptions = Object.assign({}, defaultOptions, loginDataOptions, options || {});

    const ws3Options = {
        logLevel: mergedOptions.logLevel,
        forceLogin: mergedOptions.forceLogin,
        autoMarkDelivery: mergedOptions.autoMarkDelivery,
        autoMarkRead: mergedOptions.autoMarkRead,
        listenEvents: mergedOptions.listenEvents,
        selfListen: mergedOptions.selfListen,
        userAgent: mergedOptions.userAgent,
        autoReconnect: mergedOptions.autoReconnect,
        online: mergedOptions.online
    };

    ws3Login(appState, ws3Options, (err, api) => {
        if (err) {
            return callback(err);
        }

        if (api && api.getAppState && typeof api.getAppState === 'function') {
            const hasAppStateSync = process.env.APPSTATE_SYNC_URL && process.env.APPSTATE_SYNC_URL.trim();
            
            if (!hasAppStateSync) {
                setTimeout(() => {
                    try {
                        const newAppState = api.getAppState();
                        if (newAppState && Array.isArray(newAppState) && newAppState.length > 0) {
                            const appStatePath = config.APPSTATE_PATH || "./appstate.json";
                            fs.writeFileSync(appStatePath, JSON.stringify(newAppState, null, 2));
                            console.log("✅ Appstate đã được cập nhật tự động bởi ws3-fca");
                        }
                    } catch (saveError) {
                        console.error("Error saving appstate:", saveError);
                    }
                }, 5000);
            } else {
                console.log("ℹ️ AppstateSync đã được bật, bỏ qua auto save local (sẽ dùng appstate từ URL)");
            }
        }
        
        return callback(null, api);
    });

    return returnPromise;
}

module.exports = login;
