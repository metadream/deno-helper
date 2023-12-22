import { encode, decode } from "https://deno.land/std@0.187.0/encoding/base64.ts";

const textEncode = (s: string) => new TextEncoder().encode(s);
const textDecode = (u: Uint8Array) => new TextDecoder().decode(u);

const importAesKey = async (key: string) => {
    const digest = await crypto.subtle.digest("SHA-1", textEncode(key));
    const rawKey = new Uint8Array(digest).slice(0, 16);
    return await crypto.subtle.importKey(
        "raw", rawKey, "AES-CBC", true, ["encrypt", "decrypt"]
    );
}

/**
 * SHA-1 hash encryption
 * algorithm: SHA-1
 */
export async function sha1(message: string) {
    const buffer = await crypto.subtle.digest("SHA-1", textEncode(message));
    const array = Array.from(new Uint8Array(buffer));
    const hex = array.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hex;
}

/**
 * AES encryption and decryption
 * algorithm: AES-CBC
 * encoding: base64
 */
export const AES = {
    async encrypt(plaintext: string, key: string) {
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-CBC", iv }, await importAesKey(key), textEncode(plaintext)
        );
        return encode(iv) + '.' + encode(encrypted);
    },

    async decrypt(ciphertext: string, key: string) {
        const index = ciphertext.indexOf(".");
        const iv = decode(ciphertext.substring(0, index));
        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-CBC", iv }, await importAesKey(key),
                decode(ciphertext.substring(index + 1))
            );
            return textDecode(new Uint8Array(decrypted));
        } catch (e) {
            console.error(e);
        }
    }
}

/**
 * RSA encryption and decryption
 * algorithm: RSA-OAEP
 * encoding: base64
 */
export const RSA = {
    async generateKeyPair() {
        return await crypto.subtle.generateKey({
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
            true,
            ["encrypt", "decrypt"]
        );
    },

    async exportPublicKey(key: CryptoKey) {
        const buffer = await crypto.subtle.exportKey("spki", key);
        const base64 = encode((new Uint8Array(buffer)));
        return `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC KEY-----`;
    },

    async exportPrivateKey(key: CryptoKey) {
        const buffer = await crypto.subtle.exportKey("pkcs8", key);
        const base64 = encode((new Uint8Array(buffer)));
        return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`;
    },

    async importPublicKey(pem: string) {
        const pemHeader = "-----BEGIN PUBLIC KEY-----\n";
        const pemFooter = "\n-----END PUBLIC KEY-----";
        const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
        return await crypto.subtle.importKey(
            "spki",
            decode(pemContents),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );
    },

    async importPrivateKey(pem: string) {
        const pemHeader = "-----BEGIN PRIVATE KEY-----\n";
        const pemFooter = "\n-----END PRIVATE KEY-----";
        const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
        return await crypto.subtle.importKey(
            "pkcs8",
            decode(pemContents),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
    },

    async encrypt(plaintext: string, publicKey: CryptoKey) {
        return encode(await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            textEncode(plaintext)
        ));
    },

    async decrypt(ciphertext: string, privateKey: CryptoKey) {
        return textDecode((new Uint8Array(await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            decode(ciphertext)
        ))));
    }
}

/**
 * JWT encryption and decryption
 * algorithm: RSA-OAEP
 */
export const JWT = {
    async create(payload: Record<string, unknown>, publicKey: CryptoKey) {
        return await RSA.encrypt(JSON.stringify(payload), publicKey);
    },

    async verify(jwt: string, privateKey: CryptoKey) {
        const payload: Record<string, unknown> = JSON.parse(await RSA.decrypt(jwt, privateKey));
        if (payload.exp && Date.now() > (payload.exp as number)) return;
        return payload;
    }
}