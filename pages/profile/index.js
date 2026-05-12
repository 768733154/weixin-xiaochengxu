const user = require('../../core/user')
const leaderboard = require('../../core/leaderboard')
const registry = require('../../core/game-registry')
const storage = require('../../core/storage')

Page({
  data: {
    userInfo: null,
    gameScores: [],
    totalGames: 0,
    bestGame: null,
    editingNickName: false,
    nickNameInput: ''
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
      icon: g.icon,
      color: g.color,
      category: g.category,
      score: leaderboard.getBestScore(g.id)
    }))
  },

  // 选择头像
  onChooseAvatar(e) {
    const tempFilePath = e.detail.avatarUrl
    user.saveAvatar(tempFilePath).then(() => {
      const info = user.getCurrentUser()
      this.setData({ userInfo: info })
    })
  },

  // 昵称输入
  onNickNameInput(e) {
    this.setData({ nickNameInput: e.detail.value })
  },

  onNickNameConfirm(e) {
    const nickName = e.detail.value.trim()
    if (!nickName) return
    user.saveNickName(nickName)
    const info = user.getCurrentUser()
    this.setData({ userInfo: info, editingNickName: false })
  },

  startEditNickName() {
    this.setData({ editingNickName: true, nickNameInput: this.data.userInfo?.nickName || '' })
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
