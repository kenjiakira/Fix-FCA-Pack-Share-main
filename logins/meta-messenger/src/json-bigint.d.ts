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

declare module "yumi-json-bigint" {
    export type JSONBigIntAction = "error" | "ignore" | "preserve";

    export interface JSONBigIntOptions {
        strict?: boolean;
        storeAsString?: boolean;
        alwaysParseAsBig?: boolean;
        parseAsBigInt32?: boolean;
        useNativeBigInt?: boolean;
        protoAction?: JSONBigIntAction;
        constructorAction?: JSONBigIntAction;
    }

    export interface JSONBigInt {
        parse(text: string, reviver?: (key: string, value: unknown) => unknown): unknown;
        stringify(
            value: unknown,
            replacer?: ((key: string, value: unknown) => unknown) | Array<string | number>,
            space?: string | number,
        ): string;
    }

    export interface JSONBigIntStatic {
        (options?: JSONBigIntOptions): JSONBigInt;
        parse(text: string, reviver?: (key: string, value: unknown) => unknown): unknown;
        stringify(
            value: unknown,
            replacer?: ((key: string, value: unknown) => unknown) | Array<string | number>,
            space?: string | number,
        ): string;
    }

    const JSONBigInt: JSONBigIntStatic;
    export default JSONBigInt;
}
