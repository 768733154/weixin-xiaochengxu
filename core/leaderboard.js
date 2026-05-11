const storage = require('./storage')

const SCORE_PREFIX = 'best_'

module.exports = {
  /**
   * 提交分数 — 双写：云数据库 + 用户云存储
   */
  async submitScore(gameId, score) {
    // 本地最高分
    const key = SCORE_PREFIX + gameId
    const best = storage.get(key, 0)
    if (score > best) {
      storage.set(key, score)
    }

    // 云端
    if (!wx.cloud) return

    try {
      // 用户云存储（好友排行榜用）
      wx.setUserCloudStorage({
        KVDataList: [{ key: `score_${gameId}`, value: String(Math.max(score, best)) }]
      })
    } catch (e) { /* ignore */ }

    try {
      // 云数据库（全局排行榜用）
      await wx.cloud.callFunction({
        name: 'submit-score',
        data: { gameId, score: Math.max(score, best) }
      })
    } catch (e) { /* ignore */ }
  },

  /**
   * 获取本地最高分
   */
  getBestScore(gameId) {
    return storage.get(SCORE_PREFIX + gameId, 0)
  },

  /**
   * 获取全局排行榜
   */
  async getGlobalRanking(gameId, limit = 50) {
    if (!wx.cloud) return []
    try {
      const res = await wx.cloud.callFunction({
        name: 'get-leaderboard',
        data: { gameId, type: 'global', limit }
      })
      return res.result || []
    } catch (e) {
      return []
    }
  },

  /**
   * 获取好友排行榜
   */
  async getFriendRanking(gameId) {
    try {
      const res = await wx.getFriendCloudStorage({
        keyList: [`score_${gameId}`]
      })
      if (!res || !res.data) return []
      return res.data
        .map(d => ({
          openid: d.openid,
          avatarUrl: d.avatarUrl,
          nickName: d.nickname,
          score: d.KVDataList && d.KVDataList[0] ? Number(d.KVDataList[0].value) : 0
        }))
        .filter(d => d.score > 0)
        .sort((a, b) => b.score - a.score)
    } catch (e) {
      return []
    }
  }
}
