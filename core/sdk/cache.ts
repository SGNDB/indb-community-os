const _cache = new Map<string, {value: unknown; expiry: number}>();

export function getCached<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (entry.expiry > 0 && Date.now() > entry.expiry) {
    _cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs = 60_000): void {
  _cache.set(key, {value, expiry: Date.now() + ttlMs});
}

export function clearCache(key?: string): void {
  if (key) {
    _cache.delete(key);
  } else {
    _cache.clear();
  }
}

export function getCacheSize(): number {
  return _cache.size;
}
