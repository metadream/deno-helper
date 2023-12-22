/**
 * Lightweight Cache
 *
 * @example new Cache()
 * @Author metadream
 * @Since 2023-09-07
 */
export class Cache {

    private cache = new Map();

    set(key: string, value: unknown, ttl?: number) {
        const data = this.cache.get(key) || {};
        data.value = value;
        clearTimeout(data.timeout);

        if (ttl) {
            data.timeout = setTimeout(() => this.delete(key), ttl);
            data.expire = Date.now() + ttl * 1000;
        }
        this.cache.set(key, data);
    }

    ttl(key: string, ttl: number) {
        const data = this.cache.get(key)
        if (data) {
            clearTimeout(data.timeout);
            data.timeout = setTimeout(() => this.delete(key), ttl);
            data.expire = Date.now() + ttl * 1000;
            return true;
        }
        return false;
    }

    get(key: string) {
        const data = this.cache.get(key);
        if (data) {
            if (!data.expire || data.expire > Date.now()) {
                return data.value;
            }
            this.delete(key);
        }
        return null;
    }

    delete(key: string) {
        const data = this.cache.get(key);
        if (data) {
            if (data.expire) clearTimeout(data.timeout);
            return this.cache.delete(key);
        }
        return false;
    }

}