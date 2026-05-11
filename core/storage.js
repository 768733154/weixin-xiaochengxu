/**
 * 本地缓存封装
 * 支持带过期时间的缓存存取
 */
module.exports = {
  get(key, fallback) {
    try {
      const raw = wx.getStorageSync(key)
      if (raw === '' || raw === undefined || raw === null) return fallback
      return raw
    } catch (e) {
      return fallback
    }
  },

  set(key, value, expireMs) {
    try {
      if (expireMs) {
        wx.setStorageSync(key, { value, ts: Date.now(), expire: expireMs })
      } else {
        wx.setStorageSync(key, value)
      }
    } catch (e) {
      // ignore
    }
  },

  getFresh(key, fallback) {
    const raw = this.get(key, null)
    if (!raw || typeof raw !== 'object' || !raw.ts) return raw || fallback
    if (raw.expire && Date.now() - raw.ts > raw.expire) return fallback
    return raw.value
  },

  remove(key) {
    try { wx.removeStorageSync(key) } catch (e) { /* ignore */ }
  },

  clear() {
    try { wx.clearStorageSync() } catch (e) { /* ignore */ }
  }
}
