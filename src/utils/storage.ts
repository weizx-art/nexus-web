export default {
  get<T = unknown>(key: string, defaultValue: T): T {
    const value = localStorage.getItem(key)
    if (value !== null) {
      try {
        return JSON.parse(value) as T
      } catch {
        return value as unknown as T
      }
    }
    return defaultValue
  },
  set<T>(key: string, value: T): void {
    if (typeof value === 'string') {
      localStorage.setItem(key, value)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  },
  remove(key: string): void {
    localStorage.removeItem(key)
  },
  clear(): void {
    localStorage.clear()
  },
}
