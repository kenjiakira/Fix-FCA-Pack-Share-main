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

import { execSync } from "node:child_process";

export function detectPlatform() {
    const { platform } = process;
    const { arch } = process;
    const isMusl = detectMusl();

    const libc = platform === "linux" ? (isMusl ? "musl" : "gnu") : "";
    const triplet = platform === "linux" ? `${platform}-${arch}-${libc}` : `${platform}-${arch}`;

    const ext = platform === "win32" ? "dll" : platform === "darwin" ? "dylib" : "so";

    return { platform, arch, libc, triplet, ext };
}

function detectMusl() {
    try {
        if (process.platform !== "linux") return false;
        if (process.report && typeof process.report.getReport === "function") {
            const rep = process.report.getReport();
            const glibc = rep.header && rep.header.glibcVersionRuntime;
            return !glibc;
        }
    } catch {
        //
    }
    try {
        const out = execSync("ldd --version 2>&1 || true", { encoding: "utf8" });
        return /musl/i.test(out);
    } catch {
        //
    }
    return false;
}

export default detectPlatform;
