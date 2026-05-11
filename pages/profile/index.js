const user = require('../../core/user')
const leaderboard = require('../../core/leaderboard')
const registry = require('../../core/game-registry')
const storage = require('../../core/storage')

Page({
  data: {
    userInfo: null,
    gameScores: [],
    totalGames: 0,
    bestGame: null
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.refreshScores()
    const info = user.getCurrentUser()
    if (info) this.setData({ userInfo: info })
  },

  initPage() {
    const info = user.getCurrentUser()
    const gameScores = this._buildScoreList()
    const bestGame = gameScores.length ? gameScores.reduce((a, b) => a.score > b.score ? a : b) : null

    this.setData({
      userInfo: info,
      gameScores,
      totalGames: gameScores.filter(g => g.score > 0).length,
      bestGame
    })
  },

  refreshScores() {
    const gameScores = this._buildScoreList()
    const bestGame = gameScores.length ? gameScores.reduce((a, b) => a.score > b.score ? a : b) : null
    this.setData({
      gameScores,
      totalGames: gameScores.filter(g => g.score > 0).length,
      bestGame
    })
  },

  _buildScoreList() {
    return registry.getAll().map(g => ({
      id: g.id,
      name: g.name,
      category: g.category,
      score: leaderboard.getBestScore(g.id)
    }))
  },

  // 授权登录
  async onTapLogin() {
    try {
      const info = await user.getUserProfile()
      this.setData({ userInfo: info })
    } catch (e) { /* 用户拒绝 */ }
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定清除所有本地缓存？排行榜分数不会被删除。',
      success: res => {
        if (res.confirm) {
          storage.clear()
          wx.showToast({ title: '已清除', icon: 'success' })
          this.initPage()
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '游戏百宝箱 — 来挑战我的最高分！',
      path: '/pages/home/index'
    }
  }
})
