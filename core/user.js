const storage = require('./storage')

const CACHE_KEY = 'userInfo'
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000 // 7d

module.exports = {
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
   * 保存头像 — 从 chooseAvatar 回调的临时路径上传到云存储
   */
  async saveAvatar(tempFilePath) {
    let avatarUrl = tempFilePath

    // 上传到云存储获取永久链接
    if (wx.cloud) {
      try {
        const info = this.getCurrentUser()
        const ext = tempFilePath.split('.').pop() || 'png'
        const cloudPath = `avatars/${info.openid || Date.now()}.${ext}`
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath
        })
        avatarUrl = uploadRes.fileID
      } catch (e) { /* 上传失败则用临时路径 */ }
    }

    this._updateInfo({ avatarUrl, authorized: true })
    return avatarUrl
  },

  /**
   * 保存昵称
   */
  saveNickName(nickName) {
    this._updateInfo({ nickName, authorized: true })
  },

  /**
   * 确保已登录 — 排行榜/对战时调用
   */
  async ensureLogin() {
    const info = storage.getFresh(CACHE_KEY, null)
    if (info && info.authorized) return info
    // 未授权则返回当前信息，由页面引导授权
    return info || this._ensureLocalUid()
  },

  getCurrentUser() {
    return storage.getFresh(CACHE_KEY, null)
  },

  /**
   * 内部：更新用户信息到缓存和云数据库
   */
  _updateInfo(patch) {
    const existing = storage.getFresh(CACHE_KEY, {}) || {}
    const info = { ...existing, ...patch }
    storage.set(CACHE_KEY, info, CACHE_EXPIRE)

    // 同步到云数据库
    if (wx.cloud && info.openid) {
      const db = wx.cloud.database()
      db.collection('users').where({ _openid: info.openid }).count().then(count => {
        if (count.total === 0) {
          db.collection('users').add({ data: { nickName: info.nickName || '', avatarUrl: info.avatarUrl || '', updatedAt: Date.now() } })
        } else {
          db.collection('users').where({ _openid: info.openid }).update({ data: { nickName: info.nickName || '', avatarUrl: info.avatarUrl || '', updatedAt: Date.now() } })
        }
      }).catch(() => {})
    }

    return info
  },

  _ensureLocalUid() {
    let uid = storage.get('local_uid', '')
    if (!uid) {
      uid = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`
      storage.set('local_uid', uid)
    }
    const info = { openid: uid, nickName: '', avatarUrl: '', authorized: false }
    storage.set(CACHE_KEY, info, CACHE_EXPIRE)
    return info
  }
}
