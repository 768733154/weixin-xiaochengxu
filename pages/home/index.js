const registry = require('../../core/game-registry')
const user = require('../../core/user')
const leaderboard = require('../../core/leaderboard')
const storage = require('../../core/storage')

Page({
  data: {
    loading: true,
    userInfo: null,
    pvpGames: [],
    singleGames: [],
    bestScores: {},
    currentTab: 'home'
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    // 每次显示时刷新最高分
    this.refreshBestScores()

    // 处理场景值路由（从分享卡片进入）
    const app = getApp()
    if (app.globalData && app.globalData.pendingNav) {
      const url = app.globalData.pendingNav
      app.globalData.pendingNav = null
      wx.navigateTo({ url })
    }
  },

  async initPage() {
    // 本地优先：立即渲染缓存数据
    const cachedUser = user.getCurrentUser()
    const pvpGames = registry.getPvPGames()
    const singleGames = registry.getSingleGames()
    const bestScores = this._loadAllBestScores()

    this.setData({
      loading: false,
      userInfo: cachedUser,
      pvpGames,
      singleGames,
      bestScores
    })

    // 云端更新：获取最新用户信息
    try {
      const info = await user.silentLogin()
      if (info && info.authorized) {
        this.setData({ userInfo: info })
      }
    } catch (e) { /* ignore */ }
  },

  refreshBestScores() {
    const bestScores = this._loadAllBestScores()
    this.setData({ bestScores })
  },

  _loadAllBestScores() {
    const scores = {}
    registry.getAll().forEach(g => {
      scores[g.id] = leaderboard.getBestScore(g.id)
    })
    return scores
  },

  // 用户栏：跳转个人中心设置头像昵称
  onTapUser() {
    wx.navigateTo({ url: '/pages/profile/index' })
  },

  // 跳转游戏
  navigateToGame(e) {
    const { id, path } = e.currentTarget.dataset
    wx.navigateTo({
      url: path,
      fail: () => {
        // 分包未就绪，尝试加载
        wx.showLoading({ title: '加载中...', mask: true })
        wx.loadSubpackage({ name: id }).then(() => {
          wx.hideLoading()
          wx.navigateTo({ url: path })
        }).catch(() => {
          wx.hideLoading()
          wx.showToast({ title: '加载失败，请检查网络', icon: 'none' })
        })
      }
    })
  },

  // 底部导航
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === 'home') {
      this.setData({ currentTab: 'home' })
      return
    }
    if (tab === 'leaderboard') {
      wx.navigateTo({ url: '/pages/leaderboard/index' })
    } else if (tab === 'profile') {
      wx.navigateTo({ url: '/pages/profile/index' })
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '游戏百宝箱 — 各种经典小游戏，来挑战吧！',
      path: '/pages/home/index'
    }
  }
})
