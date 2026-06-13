/**
 * 通用服务端内存缓存工具
 *
 * 为各 API 模块提供统一的 TTL 缓存能力，消除重复代码。
 * 缓存基于模块级变量实现，同一 Node.js 进程内所有请求共享。
 *
 * 特性：
 * - TTL 过期自动失效
 * - 身份密钥校验（防止不同配置的缓存冲突）
 * - 内置日志输出
 * - 泛型支持任意数据类型
 */

/** 默认缓存有效期 12 小时（毫秒） */
export const DEFAULT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * 通用内存缓存类
 *
 * @template T - 缓存数据类型
 *
 * 使用示例:
 * ```ts
 * const cache = new MemoryCache<{ products: Foo[]; total: number }>("HaokaCache");
 *
 * // 尝试读取
 * const cached = cache.get(appId);
 * if (cached) return cached;
 *
 * // 未命中则拉取数据并写入
 * const data = await fetchFromAPI();
 * cache.set(data, appId);
 * ```
 */
export class MemoryCache<T> {
    /** 缓存条目 */
    private entry: {
        data: T;
        timestamp: number;
        identityKey: string;
    } | null = null;

    /** 上次日志输出的总条数（用于去重） */
    private lastLogCount = 0;

    /**
     * @param name - 缓存名称（用于日志前缀，如 "HaokaCache"）
     * @param ttlMs - 缓存有效期（毫秒），默认 12 小时
     */
    constructor(
        private name: string,
        private ttlMs: number = DEFAULT_CACHE_TTL_MS,
    ) { }

    /**
     * 尝试从缓存获取数据
     *
     * @param identityKey - 身份标识（如 appId / userId），用于区分不同配置
     * @returns 缓存数据，未命中或已过期返回 null
     */
    get(identityKey: string): T | null {
        if (!this.entry) return null;
        if (this.entry.identityKey !== identityKey) return null;
        if (Date.now() - this.entry.timestamp >= this.ttlMs) return null;

        if (this.lastLogCount !== 0) {
            console.log(`[${this.name}] 缓存命中，直接返回`);
        }
        return this.entry.data;
    }

    /**
     * 写入缓存
     *
     * @param data - 要缓存的数据
     * @param identityKey - 身份标识
     * @param count - 可选的数据条目数（用于日志输出）
     */
    set(data: T, identityKey: string, count?: number): void {
        this.entry = { data, timestamp: Date.now(), identityKey };
        this.lastLogCount = count ?? 0;

        const ttlHours = this.ttlMs / 3600000;
        const countStr = count !== undefined ? `，共 ${count} 条` : "";
        console.log(
            `[${this.name}] 数据刷新完成${countStr}，缓存有效期 ${ttlHours} 小时`,
        );
    }

    /**
     * 手动清除缓存（用于调试或强制刷新）
     */
    invalidate(): void {
        this.entry = null;
        this.lastLogCount = 0;
        console.log(`[${this.name}] 缓存已手动清除`);
    }
}
