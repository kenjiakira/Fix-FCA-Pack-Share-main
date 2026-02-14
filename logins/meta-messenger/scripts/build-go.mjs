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

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { detectPlatform } from "./detect-platform.mjs";
import { packageJson } from "./package.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { ext } = detectPlatform();
const { name } = packageJson;

function runGo(args) {
    const res = spawnSync(process.env.GO_BIN || "go", args, {
        cwd: join(__dirname, "..", "bridge-go"),
        stdio: "inherit",
        env: process.env,
    });
    if (res.status !== 0) process.exit(res.status || 1);
}

const buildDir = join(__dirname, "..", "build");
if (!existsSync(buildDir)) mkdirSync(buildDir, { recursive: true });

console.log(`[${name}] Tidying Go modules...`);
runGo(["mod", "tidy"]);

console.log(`[${name}] Building native library (release mode)...`);
runGo(["build", "-buildmode=c-shared", "-ldflags=-s -w", "-o", join("..", "build", `messagix.${ext}`), "."]);

console.log(`[${name}] Built native: build/messagix.${ext}`);
