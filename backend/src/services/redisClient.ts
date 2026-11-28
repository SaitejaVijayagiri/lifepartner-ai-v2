import Redis, { RedisOptions } from 'ioredis';
import type { ClientRateLimitInfo, Options as RateLimitOptions, Store } from 'express-rate-limit';

const RAW_REDIS_URL = (process.env.REDIS_URL || '').trim();
const IS_JEST = Boolean(process.env.JEST_WORKER_ID);

let cmdClient: Redis | null = null;
let socketPubClient: Redis | null = null;
let socketSubClient: Redis | null = null;
let initAttempted = false;
let lastErrorLogAt = 0;

type CacheTarget = 'auth' | 'match';
type CacheOp = 'delete' | 'prefix' | 'clear';
export interface CacheInvalidationMessage {
    target: CacheTarget;
    op: CacheOp;
    key?: string;
}

const cacheListeners = new Set<(msg: CacheInvalidationMessage) => void>();
let clusterCacheBroadcaster: ((msg: CacheInvalidationMessage) => void) | null = null;

function logRedisError(label: string, err: unknown) {
    const now = Date.now();
    if (now - lastErrorLogAt < 30_000) return;
    lastErrorLogAt = now;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Redis:${label}] ${msg}`);
}

function buildRedisOptions(forPubSub = false): RedisOptions {
    const options: RedisOptions = {
        connectTimeout: 5000,
        keepAlive: 15000,
        retryStrategy(times) {
            return Math.min(times * 250, 3000);
        },
        maxRetriesPerRequest: forPubSub ? null : 2,
        enableOfflineQueue: forPubSub,
    };

    if (RAW_REDIS_URL.startsWith('rediss://')) {
        options.tls = { rejectUnauthorized: false };
    }

    return options;
}

export function isRedisConfigured(): boolean {
    return Boolean(RAW_REDIS_URL && !IS_JEST);
}

export function getRedisClient(): Redis | null {
    if (!isRedisConfigured()) return null;

    if (!cmdClient && !initAttempted) {
        initAttempted = true;
        try {
            cmdClient = new Redis(RAW_REDIS_URL, buildRedisOptions(false));
            cmdClient.on('ready', () => {
                console.log('✅ Redis Command Client Ready');
            });
            cmdClient.on('error', (err) => logRedisError('cmd', err));
        } catch (err) {
            logRedisError('init', err);
            cmdClient = null;
        }
    }

    return cmdClient;
}

export function isRedisReady(): boolean {
    const client = getRedisClient();
    return Boolean(client && client.status === 'ready');
}

export function createSocketRedisClients(): { pubClient: Redis; subClient: Redis } | null {
    if (!isRedisConfigured()) return null;

    if (!socketPubClient || !socketSubClient) {
        try {
            const pubOptions = buildRedisOptions(true);
            socketPubClient = new Redis(RAW_REDIS_URL, pubOptions);
            socketSubClient = socketPubClient.duplicate();

            socketPubClient.on('error', (err) => logRedisError('socket-pub', err));
            socketSubClient.on('error', (err) => logRedisError('socket-sub', err));
            socketPubClient.on('ready', () => console.log('✅ Redis Socket.IO Pub Client Ready'));
        } catch (err) {
            logRedisError('socket-init', err);
            socketPubClient = null;
            socketSubClient = null;
            return null;
        }
    }

    return { pubClient: socketPubClient, subClient: socketSubClient };
}

export async function closeRedis(): Promise<void> {
    const clients = [cmdClient, socketSubClient, socketPubClient].filter((c): c is Redis => Boolean(c));
    cmdClient = null;
    socketSubClient = null;
    socketPubClient = null;
    initAttempted = false;

    await Promise.allSettled(
        clients.map(async (client) => {
            try {
                await Promise.race([
                    client.quit(),
                    new Promise((resolve) => setTimeout(resolve, 1500))
                ]);
            } catch {
                // ignore
            } finally {
                try {
                    client.disconnect();
                } catch {
                    // ignore
                }
            }
        })
    );
}

// ── Cross-instance Cache Invalidation Hooks (wired through Socket.IO serverSideEmit when active) ──
export function onCacheInvalidation(listener: (msg: CacheInvalidationMessage) => void): () => void {
    cacheListeners.add(listener);
    return () => cacheListeners.delete(listener);
}

export function setClusterCacheBroadcaster(broadcaster: ((msg: CacheInvalidationMessage) => void) | null) {
    clusterCacheBroadcaster = broadcaster;
}

export function publishCacheInvalidation(msg: CacheInvalidationMessage) {
    try {
        clusterCacheBroadcaster?.(msg);
    } catch {
        // Non-fatal
    }
}

export function applyRemoteCacheInvalidation(msg: CacheInvalidationMessage) {
    for (const listener of cacheListeners) {
        try {
            listener(msg);
        } catch {
            // Non-fatal
        }
    }
}

// ── Distributed express-rate-limit Store (falls back cleanly to bounded local memory) ──
const RATE_LIMIT_LUA = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
    redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local pttl = redis.call("PTTL", KEYS[1])
return { current, pttl }
`;

class RedisFallbackRateLimitStore implements Store {
    public readonly localKeys = false;
    public readonly prefix: string;
    private windowMs = 60_000;
    private localHits = new Map<string, { hits: number; resetAt: number }>();

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    init(options: RateLimitOptions): void {
        if (options.windowMs > 0) {
            this.windowMs = options.windowMs;
        }
    }

    private localIncrement(key: string): ClientRateLimitInfo {
        const now = Date.now();
        if (this.localHits.size > 15_000) {
            for (const [k, v] of this.localHits.entries()) {
                if (v.resetAt <= now) this.localHits.delete(k);
            }
            if (this.localHits.size > 15_000) this.localHits.clear();
        }
        const existing = this.localHits.get(key);
        if (!existing || existing.resetAt <= now) {
            const resetAt = now + this.windowMs;
            this.localHits.set(key, { hits: 1, resetAt });
            return { totalHits: 1, resetTime: new Date(resetAt) };
        }
        existing.hits += 1;
        return { totalHits: existing.hits, resetTime: new Date(existing.resetAt) };
    }

    async increment(key: string): Promise<ClientRateLimitInfo> {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
            try {
                const redisKey = `${this.prefix}${key}`;
                const res = (await client.eval(RATE_LIMIT_LUA, 1, redisKey, String(this.windowMs))) as [number | string, number | string];
                const totalHits = Number(res?.[0] || 1);
                const pttl = Number(res?.[1] || this.windowMs);
                return {
                    totalHits,
                    resetTime: new Date(Date.now() + (pttl > 0 ? pttl : this.windowMs))
                };
            } catch (err) {
                logRedisError('ratelimit', err);
            }
        }
        return this.localIncrement(key);
    }

    async decrement(key: string): Promise<void> {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
            try {
                const redisKey = `${this.prefix}${key}`;
                const next = await client.decr(redisKey);
                if (next <= 0) await client.del(redisKey);
                return;
            } catch {
                // fallback below
            }
        }
        const existing = this.localHits.get(key);
        if (existing) {
            existing.hits = Math.max(0, existing.hits - 1);
        }
    }

    async resetKey(key: string): Promise<void> {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
            try {
                await client.del(`${this.prefix}${key}`);
            } catch {
                // ignore
            }
        }
        this.localHits.delete(key);
    }

    async get(key: string): Promise<ClientRateLimitInfo | undefined> {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
            try {
                const redisKey = `${this.prefix}${key}`;
                const [val, pttl] = await Promise.all([client.get(redisKey), client.pttl(redisKey)]);
                if (val === null) return undefined;
                return {
                    totalHits: Number(val) || 0,
                    resetTime: pttl > 0 ? new Date(Date.now() + pttl) : undefined
                };
            } catch {
                return undefined;
            }
        }
        const existing = this.localHits.get(key);
        if (!existing || existing.resetAt <= Date.now()) return undefined;
        return { totalHits: existing.hits, resetTime: new Date(existing.resetAt) };
    }
}

export function createRedisRateLimitStore(prefix: string): Store {
    return new RedisFallbackRateLimitStore(prefix);
}
