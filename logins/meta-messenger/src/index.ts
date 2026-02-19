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

/**
 * meta-messenger.js - TypeScript wrapper for Facebook Messenger with E2EE support
 *
 * @example
 * ```typescript
 * import { Client, login } from 'meta-messenger.js'
 *
 * // Method 1: Using Client class directly
 * const client = new Client({
 *     c_user: 'your_user_id',
 *     xs: 'your_xs_cookie',
 *     datr: 'your_datr_cookie',
 *     fr: 'your_fr_cookie'
 * })
 *
 * client.on('message', (message) => {
 *     console.log('New message:', message)
 *     if (message.text === 'ping') {
 *         client.sendMessage(message.threadId, 'pong')
 *     }
 * })
 *
 * await client.connect()
 *
 * // Method 2: Using login function (facebook-chat-api style)
 * const api = await login({
 *     c_user: 'your_user_id',
 *     xs: 'your_xs_cookie',
 *     datr: 'your_datr_cookie',
 *     fr: 'your_fr_cookie'
 * })
 *
 * api.on('message', (message) => {
 *     console.log('Got message:', message.text)
 * })
 * ```
 *
 * @packageDocumentation
 */

// Exports all
export * from "./client.js";
export * from "./login.js";
export * from "./types.js";
export * from "./utils.js";

import { Client } from "./client.js";
import type { ClientOptions, Cookies } from "./types.js";

/**
 * Login to Facebook Messenger (E2EE disabled for simplicity)
 *
 * @param cookies - Authentication cookies
 * @param options - Client options
 * @returns Connected client instance
 *
 * @example
 * ```typescript
 * const api = await login({
 *     c_user: 'your_user_id',
 *     xs: 'your_xs_cookie',
 *     datr: 'your_datr_cookie',
 *     fr: 'your_fr_cookie'
 * })
 *
 * console.log('Logged in as:', api.user?.name)
 *
 * api.on('message', async (message) => {
 *     if (message.senderId !== api.currentUserId) {
 *         await api.sendMessage(message.threadId, 'Hello!')
 *     }
 * })
 * ```
 */
export async function login(cookies: Cookies, options?: ClientOptions): Promise<Client> {
    const client = new Client(cookies, options);
    await client.connect();
    return client;
}

/**
 * Create a client without connecting
 *
 * @param cookies - Authentication cookies
 * @param options - Client options
 * @returns Client instance (not connected)
 */
export function createClient(cookies: Cookies, options?: ClientOptions): Client {
    return new Client(cookies, options);
}

// Default export for convenience
export default { Client, login, createClient };
