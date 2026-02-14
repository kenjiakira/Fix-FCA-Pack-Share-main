/*
 * meta-messenger.js
 * Unofficial Meta Messenger Chat API for Node.js
 *
 * Copyright (c) 2026 Yumi Team and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import koffi from "koffi";
import JSONBig from "yumi-json-bigint";

// Configure json-bigint to use native BigInt
const JSONBigNative = JSONBig({
    useNativeBigInt: true,
    parseAsBigInt32: true,
});

function resolveDirname(): string {
    return path.dirname(fileURLToPath(import.meta.url));
}

function libPath(): string {
    const base = path.join(resolveDirname(), "..", "build");
    if (process.platform === "win32") return path.join(base, "messagix.dll");
    if (process.platform === "darwin") return path.join(base, "messagix.dylib");
    return path.join(base, "messagix.so");
}

const LIB_FILE = libPath();
if (!fs.existsSync(LIB_FILE)) {
    throw new Error(`Native library not found at ${LIB_FILE}. Run: npm run build:go`);
}

const lib = koffi.load(LIB_FILE);

const mk = (ret: string, name: string, args: string[]) => lib.func(name, ret, args);

const fns = {
    MxFreeCString: mk("void", "MxFreeCString", ["char*"]),
    MxNewClient: mk("str", "MxNewClient", ["str"]),
    MxConnect: mk("str", "MxConnect", ["str"]),
    MxConnectE2EE: mk("str", "MxConnectE2EE", ["str"]),
    MxDisconnect: mk("str", "MxDisconnect", ["str"]),
    MxIsConnected: mk("str", "MxIsConnected", ["str"]),
    MxSendMessage: mk("str", "MxSendMessage", ["str"]),
    MxSendReaction: mk("str", "MxSendReaction", ["str"]),
    MxEditMessage: mk("str", "MxEditMessage", ["str"]),
    MxUnsendMessage: mk("str", "MxUnsendMessage", ["str"]),
    MxSendTyping: mk("str", "MxSendTyping", ["str"]),
    MxMarkRead: mk("str", "MxMarkRead", ["str"]),
    MxUploadMedia: mk("str", "MxUploadMedia", ["str"]),
    MxSendImage: mk("str", "MxSendImage", ["str"]),
    MxSendVideo: mk("str", "MxSendVideo", ["str"]),
    MxSendVoice: mk("str", "MxSendVoice", ["str"]),
    MxSendFile: mk("str", "MxSendFile", ["str"]),
    MxSendSticker: mk("str", "MxSendSticker", ["str"]),
    MxCreateThread: mk("str", "MxCreateThread", ["str"]),
    MxGetUserInfo: mk("str", "MxGetUserInfo", ["str"]),
    MxSetGroupPhoto: mk("str", "MxSetGroupPhoto", ["str"]),
    MxRenameThread: mk("str", "MxRenameThread", ["str"]),
    MxMuteThread: mk("str", "MxMuteThread", ["str"]),
    MxDeleteThread: mk("str", "MxDeleteThread", ["str"]),
    MxSearchUsers: mk("str", "MxSearchUsers", ["str"]),
    MxPollEvents: mk("str", "MxPollEvents", ["str"]),
    MxSendE2EEMessage: mk("str", "MxSendE2EEMessage", ["str"]),
    MxSendE2EEReaction: mk("str", "MxSendE2EEReaction", ["str"]),
    MxSendE2EETyping: mk("str", "MxSendE2EETyping", ["str"]),
    MxEditE2EEMessage: mk("str", "MxEditE2EEMessage", ["str"]),
    MxUnsendE2EEMessage: mk("str", "MxUnsendE2EEMessage", ["str"]),
    MxGetDeviceData: mk("str", "MxGetDeviceData", ["str"]),
    // E2EE Media functions
    MxSendE2EEImage: mk("str", "MxSendE2EEImage", ["str"]),
    MxSendE2EEVideo: mk("str", "MxSendE2EEVideo", ["str"]),
    MxSendE2EEAudio: mk("str", "MxSendE2EEAudio", ["str"]),
    MxSendE2EEDocument: mk("str", "MxSendE2EEDocument", ["str"]),
    MxSendE2EESticker: mk("str", "MxSendE2EESticker", ["str"]),
    MxDownloadE2EEMedia: mk("str", "MxDownloadE2EEMedia", ["str"]),
    // Cookie and push notification functions
    MxGetCookies: mk("str", "MxGetCookies", ["str"]),
    MxRegisterPushNotifications: mk("str", "MxRegisterPushNotifications", ["str"]),
} as const;

interface JsonResp<T = unknown> {
    ok: boolean;
    data?: T;
    error?: string;
}

function call<T>(fn: keyof typeof fns, payload: unknown): T {
    // Use JSONBigNative.stringify to serialize BigInt as numbers (not strings)
    const input = JSONBigNative.stringify(payload);
    const bound = fns[fn] as (arg: string) => string;
    const out = bound(input);
    const data = JSONBigNative.parse(out) as JsonResp<T>;
    if (!data.ok) throw new Error(data.error || "Unknown error");
    return data.data as T;
}

// Async version that yields to event loop
function callAsync<T>(fn: keyof typeof fns, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
        // Use setTimeout(0) to yield to event loop
        setTimeout(() => {
            try {
                const result = call<T>(fn, payload);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        }, 0);
    });
}

export const native = {
    newClient: (cfg: {
        cookies: Record<string, string>;
        platform?: string;
        devicePath?: string;
        deviceData?: string;
        e2eeMemoryOnly?: boolean;
        logLevel?: string;
    }) => call<{ handle: number }>("MxNewClient", cfg),

    connect: (handle: number) =>
        call<{
            user: { id: bigint; name: string; username: string };
            initialData: { threads: unknown[]; messages: unknown[] };
        }>("MxConnect", { handle }),

    connectE2EE: (handle: number) => callAsync<unknown>("MxConnectE2EE", { handle }),

    disconnect: (handle: number) => call<unknown>("MxDisconnect", { handle }),

    isConnected: (handle: number) => call<{ connected: boolean; e2eeConnected: boolean }>("MxIsConnected", { handle }),

    sendMessage: (
        handle: number,
        options: {
            threadId: bigint;
            text: string;
            replyToId?: string;
            mentionIds?: bigint[];
            mentionOffsets?: number[];
            mentionLengths?: number[];
            attachmentFbIds?: bigint[];
            stickerId?: bigint;
            url?: string;
            isE2EE?: boolean;
            e2eeChatJid?: string;
        },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendMessage", { handle, options }),

    sendReaction: (handle: number, threadId: bigint, messageId: string, emoji: string) =>
        callAsync<unknown>("MxSendReaction", { handle, threadId, messageId, emoji }),

    editMessage: (handle: number, messageId: string, newText: string) =>
        callAsync<unknown>("MxEditMessage", { handle, messageId, newText }),

    unsendMessage: (handle: number, messageId: string) => callAsync<unknown>("MxUnsendMessage", { handle, messageId }),

    sendTyping: (handle: number, threadId: bigint, isTyping: boolean, isGroup: boolean, threadType: number) =>
        callAsync<unknown>("MxSendTyping", { handle, threadId, isTyping, isGroup, threadType }),

    markRead: (handle: number, threadId: bigint, watermarkTs?: number) =>
        callAsync<unknown>("MxMarkRead", { handle, threadId, watermarkTs: watermarkTs || 0n }),

    uploadMedia: (
        handle: number,
        options: {
            threadId: bigint;
            filename: string;
            mimeType: string;
            data: number[];
            isVoice?: boolean;
        },
    ) => callAsync<{ fbId: bigint; filename: string }>("MxUploadMedia", { handle, options }),

    sendImage: (
        handle: number,
        options: { threadId: bigint; data: number[]; filename: string; caption?: string; replyToId?: string },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendImage", { handle, options }),

    sendVideo: (
        handle: number,
        options: { threadId: bigint; data: number[]; filename: string; caption?: string; replyToId?: string },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendVideo", { handle, options }),

    sendVoice: (handle: number, options: { threadId: bigint; data: number[]; filename: string; replyToId?: string }) =>
        callAsync<{ messageId: string; timestampMs: bigint }>("MxSendVoice", { handle, options }),

    sendFile: (
        handle: number,
        options: {
            threadId: bigint;
            data: number[];
            filename: string;
            mimeType: string;
            caption?: string;
            replyToId?: string;
        },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendFile", { handle, options }),

    sendSticker: (handle: number, options: { threadId: bigint; stickerId: bigint; replyToId?: string }) =>
        callAsync<{ messageId: string; timestampMs: bigint }>("MxSendSticker", { handle, options }),

    createThread: (handle: number, options: { userId: bigint }) =>
        callAsync<{ threadId: bigint }>("MxCreateThread", { handle, options }),

    getUserInfo: (handle: number, options: { userId: bigint }) =>
        callAsync<{
            id: bigint;
            name: string;
            firstName?: string;
            username?: string;
            profilePictureUrl?: string;
            isMessengerUser?: boolean;
            isVerified?: boolean;
            gender?: number;
            canViewerMessage?: boolean;
        }>("MxGetUserInfo", { handle, options }),

    setGroupPhoto: (handle: number, threadId: bigint, data: string, mimeType: string) =>
        callAsync<unknown>("MxSetGroupPhoto", { handle, threadId, data, mimeType }),

    renameThread: (handle: number, options: { threadId: bigint; newName: string }) =>
        callAsync<unknown>("MxRenameThread", { handle, options }),

    muteThread: (handle: number, options: { threadId: bigint; muteSeconds: number }) =>
        callAsync<unknown>("MxMuteThread", { handle, options }),

    deleteThread: (handle: number, options: { threadId: bigint }) =>
        callAsync<unknown>("MxDeleteThread", { handle, options }),

    searchUsers: (handle: number, options: { query: string }) =>
        callAsync<{ users: { id: bigint; name: string; username: string }[] }>("MxSearchUsers", {
            handle,
            options,
        }),

    pollEvents: (handle: number, timeoutMs: number) => callAsync<unknown>("MxPollEvents", { handle, timeoutMs }),

    // E2EE functions
    sendE2EEMessage: (handle: number, chatJid: string, text: string, replyToId?: string, replyToSenderJid?: string) =>
        callAsync<{ messageId: string; timestampMs: bigint }>("MxSendE2EEMessage", {
            handle,
            chatJid,
            text,
            replyToId,
            replyToSenderJid,
        }),

    sendE2EEReaction: (handle: number, chatJid: string, messageId: string, senderJid: string, emoji: string) =>
        callAsync<unknown>("MxSendE2EEReaction", { handle, chatJid, messageId, senderJid, emoji }),

    sendE2EETyping: (handle: number, chatJid: string, isTyping: boolean) =>
        callAsync<unknown>("MxSendE2EETyping", { handle, chatJid, isTyping }),

    editE2EEMessage: (handle: number, chatJid: string, messageId: string, newText: string) =>
        callAsync<unknown>("MxEditE2EEMessage", { handle, chatJid, messageId, newText }),

    unsendE2EEMessage: (handle: number, chatJid: string, messageId: string) =>
        callAsync<unknown>("MxUnsendE2EEMessage", { handle, chatJid, messageId }),

    getDeviceData: (handle: number) => call<{ deviceData: string }>("MxGetDeviceData", { handle }),

    // E2EE Media functions
    sendE2EEImage: (
        handle: number,
        options: {
            chatJid: string;
            data: number[];
            mimeType: string;
            caption?: string;
            width?: number;
            height?: number;
            replyToId?: string;
            replyToSenderJid?: string;
        },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendE2EEImage", { handle, options }),

    sendE2EEVideo: (
        handle: number,
        options: {
            chatJid: string;
            data: number[];
            mimeType: string;
            caption?: string;
            width?: number;
            height?: number;
            duration?: number;
            replyToId?: string;
            replyToSenderJid?: string;
        },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendE2EEVideo", { handle, options }),

    sendE2EEAudio: (
        handle: number,
        options: {
            chatJid: string;
            data: number[];
            mimeType: string;
            duration?: number;
            ptt?: boolean; // Push-to-talk (voice message)
            replyToId?: string;
            replyToSenderJid?: string;
        },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendE2EEAudio", { handle, options }),

    sendE2EEDocument: (
        handle: number,
        options: {
            chatJid: string;
            data: number[];
            filename: string;
            mimeType: string;
            replyToId?: string;
            replyToSenderJid?: string;
        },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendE2EEDocument", { handle, options }),

    sendE2EESticker: (
        handle: number,
        options: {
            chatJid: string;
            data: number[];
            mimeType: string;
            replyToId?: string;
            replyToSenderJid?: string;
        },
    ) => callAsync<{ messageId: string; timestampMs: bigint }>("MxSendE2EESticker", { handle, options }),

    downloadE2EEMedia: (
        handle: number,
        options: {
            directPath: string;
            mediaKey: string;
            mediaSha256: string;
            mediaType: string;
            mimeType: string;
            fileSize: bigint;
        },
    ) => callAsync<{ data: string; mimeType: string; fileSize: bigint }>("MxDownloadE2EEMedia", { handle, options }),

    // Cookie and push notification functions
    getCookies: (handle: number) => call<{ cookies: Record<string, string> }>("MxGetCookies", { handle }),

    registerPushNotifications: (
        handle: number,
        options: {
            endpoint: string;
            p256dh: string; // base64 encoded
            auth: string; // base64 encoded
        },
    ) => callAsync<unknown>("MxRegisterPushNotifications", { handle, options }),

    unload: () => lib.unload(),
};
