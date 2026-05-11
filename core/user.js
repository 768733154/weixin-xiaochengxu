const storage = require('./storage')

const CACHE_KEY = 'userInfo'
const CACHE_EXPIRE = 24 * 60 * 60 * 1000 // 24h

module.exports = {
  /**
   * 静默登录 — 获取 openid，无需用户授权
   */
  silentLogin() {
    const cached = storage.getFresh(CACHE_KEY, null)
    if (cached && cached.openid) return Promise.resolve(cached)

    if (!wx.cloud) return Promise.resolve(this._ensureLocalUid())

    return wx.cloud.callFunction({ name: 'login' }).then(res => {
      const { openid } = res.result || {}
      const info = { openid, ...storage.getFresh(CACHE_KEY, {}) }
      storage.set(CACHE_KEY, info, CACHE_EXPIRE)
      return info
    }).catch(() => this._ensureLocalUid())
  },

  /**
   * 获取用户资料 — 需要用户点击授权
   */
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于排行榜和好友对战',
        success: res => {
          const profile = res.userInfo
          const existing = storage.getFresh(CACHE_KEY, {})
          const info = { ...existing, ...profile, authorized: true }
          storage.set(CACHE_KEY, info, CACHE_EXPIRE)

          // 同步到云数据库
          if (wx.cloud && info.openid) {
            const db = wx.cloud.database()
            db.collection('users').where({ _openid: info.openid }).count().then(count => {
              if (count.total === 0) {
                db.collection('users').add({ data: { nickName: info.nickName, avatarUrl: info.avatarUrl, updatedAt: Date.now() } })
              } else {
                db.collection('users').where({ _openid: info.openid }).update({ data: { nickName: info.nickName, avatarUrl: info.avatarUrl, updatedAt: Date.now() } })
              }
            }).catch(() => {})
          }

          resolve(info)
        },
        fail: reject
      })
    })
  },

  /**
   * 确保已登录 — 排行榜/对战时调用
   */
  async ensureLogin() {
    const info = storage.getFresh(CACHE_KEY, null)
    if (info && info.authorized) return info

    try {
      return await this.getUserProfile()
    } catch (e) {
      return this._ensureLocalUid()
    }
  },

  /**
   * 获取当前用户信息（同步，可能为空）
   */
  getCurrentUser() {
    return storage.getFresh(CACHE_KEY, null)
  },

  _ensureLocalUid() {
    let uid = storage.get('local_uid', '')
    if (!uid) {
      uid = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`
      storage.set('local_uid', uid)
    }
    const info = { openid: uid, nickName: '游客', avatarUrl: '', authorized: false }
    storage.set(CACHE_KEY, info, CACHE_EXPIRE)
    return info
  }
}
