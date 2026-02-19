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

/*
 * This source code (Unlicense) is derived from the original repository:
 * https://github.com/imhiendev/LoginFacebookAppKatanaAPI
 *
 * It has been rewritten in TypeScript.
 * All credit goes to the original author.
 */

import { randomUUID } from "crypto";
import { fetch } from "undici";

interface Account {
    uid: string;
    password: string;
}

interface AuthenticatedResult {
    cookie: string;
    token: string;
}

export class UIDLogin extends null {
    private static readonly API_ENDPOINT = "https://b-graph.facebook.com/graphql";
    private static readonly USER_AGENT =
        "[FBAN/FB4A;FBAV/498.1.0.64.74;FBBV/692621185;FBDM/{density=1.5,width=540,height=960};FBLC/vi_VN;FBRV/0;FBCR/MobiFone;FBMF/Xiaomi;FBBD/Xiaomi;FBPN/com.facebook.katana;FBDV/2211133C;FBSV/9;FBOP/1;FBCA/x86_64:arm64-v8a;]";
    private static readonly AUTH_TOKEN = "OAuth 350685531728|62f8ce9f74b12f84c123cc23437a4a32";
    private static readonly CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    private static randomString(len: number): string {
        let result = "";
        for (let i = 0; i < len; i++) {
            result += this.CHARS[Math.floor(Math.random() * this.CHARS.length)];
        }
        return result;
    }

    private static generateNonce(size: number): string {
        const bytes = new Uint8Array(size);
        for (let i = 0; i < size; i++) bytes[i] = Math.floor(Math.random() * 256);
        return Buffer.from(bytes).toString("base64");
    }

    private static toBase64(text: string): string {
        return Buffer.from(text).toString("base64");
    }

    private static formatPassword(pwd: string): string {
        return `#PWD_FB4A:0:${Math.floor(Date.now() / 1000)}:${pwd}`;
    }

    private static hashData(uid: string): string {
        return this.toBase64(JSON.stringify({ challenge_nonce: this.generateNonce(32), username: uid }));
    }

    private static generateVariable(account: Account): string {
        const deviceId = randomUUID();
        // random sth
        const variable = {
            params: {
                params: JSON.stringify({
                    client_input_params: {
                        sim_phones: [],
                        secure_family_device_id: randomUUID(),
                        /*
                        attestation_result: {
                            data: this.hashData(account.uid),
                            signature:
                                "MEYCIQDtz5TqO0pwysy82Ko92FErORasLag9o/pQYlZl8+zaMgIhAKon529upFiPfGgoS6OkPKg0/VahBuSDxwiTgtzpYQA3",
                            keyHash: "92398b3e4d9ee926bae93a61fd75e18d750100c1e73fd44d4faa7b9ba9353eee",
                        },
                        */
                        has_granted_read_contacts_permissions: 0,
                        auth_secure_device_id: "",
                        has_whatsapp_installed: 0,
                        password: this.formatPassword(account.password),
                        sso_token_map_json_string: "",
                        event_flow: "login_manual",
                        password_contains_non_ascii: "false",
                        sim_serials: [],
                        client_known_key_hash: "",
                        encrypted_msisdn: "",
                        has_granted_read_phone_permissions: 0,
                        app_manager_id: "null",
                        should_show_nested_nta_from_aymh: 0,
                        device_id: deviceId,
                        login_attempt_count: 1,
                        machine_id: this.randomString(22),
                        flash_call_permission_status: {
                            READ_PHONE_STATE: "DENIED",
                            READ_CALL_LOG: "DENIED",
                            ANSWER_PHONE_CALLS: "DENIED",
                        },
                        accounts_list: [],
                        family_device_id: deviceId,
                        fb_ig_device_id: [],
                        device_emails: [],
                        try_num: 2,
                        lois_settings: { lois_token: "" },
                        event_step: "home_page",
                        headers_infra_flow_id: "",
                        openid_tokens: {},
                        contact_point: account.uid,
                    },
                    server_params: {
                        should_trigger_override_login_2fa_action: 0,
                        is_from_logged_out: 0,
                        should_trigger_override_login_success_action: 0,
                        login_credential_type: "none",
                        server_login_source: "login",
                        waterfall_id: randomUUID(),
                        login_source: "Login",
                        is_platform_login: 0,
                        pw_encryption_try_count: 1,
                        INTERNAL__latency_qpl_marker_id: 36707139,
                        offline_experiment_group: "caa_iteration_v6_perf_fb_2",
                        is_from_landing_page: 0,
                        password_text_input_id: "jirv90:99",
                        is_from_empty_password: 0,
                        is_from_msplit_fallback: 0,
                        ar_event_source: "login_home_page",
                        username_text_input_id: "jirv90:98",
                        layered_homepage_experiment_group: null,
                        device_id: deviceId,
                        INTERNAL__latency_qpl_instance_id: 1.18039064400779e14,
                        reg_flow_source: "login_home_native_integration_point",
                        is_caa_perf_enabled: 1,
                        credential_type: "password",
                        is_from_password_entry_page: 0,
                        caller: "gslr",
                        family_device_id: deviceId,
                        is_from_assistive_id: 0,
                        access_flow_version: "F2_FLOW",
                        is_from_logged_in_switcher: 0,
                    },
                }),
                // const
                bloks_versioning_id: "cb6ac324faea83da28649a4d5046c3a4f0486cb987f8ab769765e316b075a76c",
                app_id: "com.bloks.www.bloks.caa.login.async.send_login_request",
            },
            scale: "1.5",
            nt_context: {
                using_white_navbar: true,
                // const
                styles_id: "55d2af294359fa6bbdb8e045ff01fc5e",
                pixel_ratio: 1.5,
                is_push_on: true,
                debug_tooling_metadata_token: null,
                is_flipper_enabled: false,
                theme_params: [],
                // can be dynamic
                bloks_version: "cb6ac324faea83da28649a4d5046c3a4f0486cb987f8ab769765e316b075a76c",
            },
        };
        return JSON.stringify(variable);
    }

    private static extractCookieToken(data: string): AuthenticatedResult {
        const tokenMatch = data.match(/"access_token":"([^"]+)"/);
        const cookiesMatch = data.match(/"session_cookies":\s*\[([^\]]+)\]/);

        const cookies: string[] = [];
        if (cookiesMatch) {
            const pattern = /"name":"([^"]+)","value":"([^"]+)"/g;
            let m;
            while ((m = pattern.exec(cookiesMatch[1]))) cookies.push(`${m[1]}=${m[2]}`);
        }

        return {
            token: tokenMatch?.[1] ?? "Access token not found",
            cookie: cookies.join("; "),
        };
    }

    /**
     * Performs Facebook login via Katana API
     * @param account - Account with UID and password
     * @returns Cookie and token upon successful authentication
     * @warn Accounts with 2FA are not supported, and the function will return an error
     * @deprecated This login method is unstable and may be blocked by Facebook at any time.
     */
    static async login(account: Account): Promise<AuthenticatedResult> {
        const headers: Record<string, string> = {
            "User-Agent": this.USER_AGENT,
            Authorization: this.AUTH_TOKEN,
            "Content-Type": "application/x-www-form-urlencoded",
            "x-fb-sim-hni": "45201",
            "x-fb-net-hni": "45201",
            "x-fb-device-group": "2789",
            "x-fb-connection-type": "WIFI",
            "x-fb-http-engine": "Tigon/Liger",
            "x-fb-client-ip": "True",
            "x-fb-server-cluster": "True",
            "x-graphql-client-library": "graphservice",
            "x-graphql-request-purpose": "fetch",
            "x-fb-friendly-name": "FbBloksActionRootQuery-com.bloks.www.bloks.caa.login.async.send_login_request",
            "x-tigon-is-retry": "False",
            "x-zero-eh": "error",
            "Accept-Encoding": "identity",
        };

        const body = new URLSearchParams({
            method: "post",
            pretty: "false",
            format: "json",
            server_timestamps: "true",
            locale: "vi_VN",
            purpose: "fetch",
            fb_api_req_friendly_name: "FbBloksActionRootQuery-com.bloks.www.bloks.caa.login.async.send_login_request",
            fb_api_caller_class: "graphservice",
            client_doc_id: "11994080423986492941384902285",
            variables: this.generateVariable(account),
            fb_api_analytics_tags: '["GraphServices"]',
            client_trace_id: randomUUID(),
        });

        const res = await fetch(this.API_ENDPOINT, { method: "POST", headers, body: body.toString() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const result = this.extractCookieToken((await res.text()).replace(/\\/g, ""));
        return result;
    }
}
