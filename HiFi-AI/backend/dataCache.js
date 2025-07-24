const fs = require('fs').promises;
const path = require('path');

class PersistentCache {
    constructor(cacheDir = './cache') {
        this.cacheDir = cacheDir;
        this.memoryCache = new Map();
        this.initCache();
    }

    async initCache() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            await this.loadFromDisk();
        } catch (error) {
            console.error('Cache initialization error:', error);
        }
    }

    async loadFromDisk() {
        try {
            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.cacheDir, file);
                    const data = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(data);
                    
                    // Only load if not expired (7 days)
                    if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
                        const key = file.replace('.json', '');
                        this.memoryCache.set(key, parsed.data);
                    }
                }
            }
            console.log(`Loaded ${this.memoryCache.size} items from cache`);
        } catch (error) {
            console.error('Cache loading error:', error);
        }
    }

    async get(key) {
        // Try memory first
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }

        // Try disk
        try {
            const filePath = path.join(this.cacheDir, `${key}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            
            // Check expiry (7 days)
            if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
                this.memoryCache.set(key, parsed.data);
                return parsed.data;
            }
        } catch (error) {
            // File doesn't exist or is corrupted
        }

        return null;
    }

    async set(key, data) {
        this.memoryCache.set(key, data);
        
        // Save to disk asynchronously
        const cacheData = {
            data,
            timestamp: Date.now()
        };
        
        try {
            const filePath = path.join(this.cacheDir, `${key}.json`);
            await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.error('Cache save error:', error);
        }
    }

    has(key) {
        return this.memoryCache.has(key);
    }

    clear() {
        this.memoryCache.clear();
    }

    size() {
        return this.memoryCache.size;
    }
}

module.exports = PersistentCache;