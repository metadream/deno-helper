// deno-lint-ignore-file no-explicit-any

/**
 * Format date with pattern string
 * @param {Date} date
 * @param {String} pattern
 * @param {Boolean} utc
 * @returns {String}
 */
export function formatDate(date: any, pattern: string, utc: boolean): string {
    const get = utc ? "getUTC" : "get";
    return pattern
        .replace(/yyyy/g, date[get + "FullYear"]())
        .replace(/yy/g, ("" + date[get + "FullYear"]()).slice(-2))
        .replace(/MM/g, ("0" + (date[get + "Month"]() + 1)).slice(-2))
        .replace(/M/g, date[get + "Month"]() + 1)
        .replace(/dd/g, ("0" + date[get + "Date"]()).slice(-2))
        .replace(/d/g, date[get + "Date"]())
        .replace(/hh/g, ("0" + date[get + "Hours"]()).slice(-2))
        .replace(/h/g, date[get + "Hours"]())
        .replace(/mm/g, ("0" + date[get + "Minutes"]()).slice(-2))
        .replace(/m/g, date[get + "Minutes"]())
        .replace(/ss/g, ("0" + date[get + "Seconds"]()).slice(-2))
        .replace(/s/g, date[get + "Seconds"]())
        .replace(/SSS/g, ("00" + date[get + "Milliseconds"]()).slice(-3))
        .replace(/S/g, date[get + "Milliseconds"]());
}

/**
 * Format the number of bytes to be easily recognizable by humans
 * @param {Number} bytes
 * @returns {String}
 */
export function formatBytes(bytes: number): string {
    const unit = ["B", "K", "M", "G", "T", "P", "E", "Z"];
    const base = Math.min(unit.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const scale = Math.max(0, base - 2);
    return parseFloat((bytes / Math.pow(1024, base)).toFixed(scale)) + " " + unit[base];
}

/**
 * Format template string with placeholder
 * @param {String} pattern
 * @param {Array} args
 * @returns {String}
 */
export function formatString(pattern: string, args: Array<string> | Record<string, string>): string {
    if (Array.isArray(args)) {
        for (let i = 0; i < args.length; i++) {
            pattern = pattern.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
        }
    } else {
        for (const i in args) {
            pattern = pattern.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
        }
    }
    return pattern;
}

/**
 * Generate a random number between [a,b]
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 */
export function randomBetween(a: number, b: number): number {
    b = b > a ? b : a;
    return Math.floor(Math.random() * (b - a + 1) + a);
}

/**
 * Generate a random string with specified length
 * @param {Number} length
 * @returns {String}
 */
export function randomString(length: number) {
    const base = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        const index = randomBetween(0, base.length - 1);
        result += base.charAt(index);
    }
    return result;
}

/**
 * Initials upper case
 * @param {String} text
 * @returns {String}
 */
export function firstUpperCase(text: string): string {
    return text.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

/**
 * Strip html tags
 * 1. Identify complete tag matches, e.g. "b" tag will not match "br", "body".
 * 2. Identify empty tags, e.g. "<>" will not be striped.
 * 3. Identify the start and end tag cannot be spaces, e.g. "a < b and c > d" will not be striped.
 * @param {String} html
 * @param {Array} ignoredTags
 * @returns {String}
 */
export function stripHtml(html: string, ignoredTags: Array<string> = []): string {
    ignoredTags.push(" ");
    const tags = ignoredTags.join("|");
    return html
        .replace(new RegExp("<(?!\/?(" + tags + ")\\b)[^<>]+>", "gm"), "")
        .replace(/([\r\n]+ +)+/gm, ""); // Remove leading spaces and repeated CR/LF
}

/**
 * Truncate a Chinese-English mixed string of specified length
 * A Chinese character is calculated by two characters
 * @param {String} text
 * @param {Number} length
 * @returns {String}
 */
export function truncate(text: string, length: number): string {
    // Chinese regular expression
    const cnRegex = /[^\\x00-\\xff]/g;

    // Replace one Chinese character with two English letters
    // and then compare the length
    if (text.replace(cnRegex, "**").length > length) {
        const m = Math.floor(length / 2);
        for (let i = m, l = text.length; i < l; i++) {
            const _text = text.substring(0, i);
            if (_text.replace(cnRegex, "**").length >= length) {
                return _text + "...";
            }
        }
    }
    return text;
}

/**
 * Determine whether it is a plain object (the object created by {} or new Object)
 * @link https://github.com/lodash/lodash
 */
export function isPlainObject(value: unknown) {
    if (!value || typeof value !== "object" || Object.prototype.toString.call(value) != "[object Object]") {
        return false;
    }
    if (Object.getPrototypeOf(value) === null) {
        return true;
    }
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
}

/**
 * Deep merge multiple objects
 * @param {Array} ...object
 * @return {Object}
 */
export function mergeObjects(...objs: Array<any>): unknown {
    const result: any = {};
    objs.forEach((obj) => {
        for (const key in obj) {
            const value = obj[key];
            if (isPlainObject(result[key]) && isPlainObject(value)) {
                result[key] = mergeObjects(result[key], value);
            } else {
                result[key] = value;
            }
        }
    });
    return result;
}

/**
 * Merge two arrays by the specify function.
 * @example mergeArrays(arr1, arr2, (v1, v2) => v1.id == v2.id)
 * @param arr1
 * @param arr2
 * @param callback
 * @returns
 */
// deno-lint-ignore ban-types
export function mergeArrays(arr1: Array<any>, arr2: Array<any>, callback: Function) {
    const merged: Array<any> = [];
    const clone = [...arr2];
    arr1.forEach((a1) => {
        const index = clone.findIndex((a2) => callback(a1, a2));
        if (index > -1) {
            const found = clone.splice(index, 1)[0];
            merged.push(Object.assign(a1, found));
        }
    });
    return merged;
}
