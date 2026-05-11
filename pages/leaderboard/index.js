const registry = require('../../core/game-registry')
const leaderboard = require('../../core/leaderboard')
const user = require('../../core/user')

Page({
  data: {
    loading: true,
    games: [],
    selectedGameId: '',
    selectedGameName: '',
    tabType: 'global',       // 'global' | 'friends'
    rankingList: [],
    myRank: null,
    myInfo: null
  },

  onLoad() {
    const games = registry.getAll()
    const selectedGameId = games.length ? games[0].id : ''
    const selectedGameName = games.length ? games[0].name : ''
    this.setData({ games, selectedGameId, selectedGameName })
    this.loadRanking()
  },

  async onShow() {
    const info = user.getCurrentUser()
    if (info) this.setData({ myInfo: info })
  },

  // 切换游戏
  onGameChange(e) {
    const idx = Number(e.detail.value)
    const game = this.data.games[idx]
    this.setData({
      selectedGameId: game.id,
      selectedGameName: game.name
    })
    this.loadRanking()
  },

  // 切换 Tab
  switchTab(e) {
    const tabType = e.currentTarget.dataset.type
    if (tabType === this.data.tabType) return
    this.setData({ tabType })
    this.loadRanking()
  },

  async loadRanking() {
    this.setData({ loading: true, rankingList: [] })
    const { selectedGameId, tabType } = this.data

    let list = []
    if (tabType === 'global') {
      list = await leaderboard.getGlobalRanking(selectedGameId, 50)
    } else {
      list = await leaderboard.getFriendRanking(selectedGameId)
    }

    // 找自己的排名
    const info = user.getCurrentUser()
    let myRank = null
    if (info) {
      const idx = list.findIndex(item => {
        return item.openid === info.openid || item.userId === info.openid
      })
      if (idx >= 0) myRank = idx + 1
    }

    this.setData({ loading: false, rankingList: list, myRank })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadRanking().then(() => wx.stopPullDownRefresh())
  },

  onShareAppMessage() {
    return {
      title: `我在${this.data.selectedGameName}等你来挑战！`,
      path: '/pages/home/index'
    }
  }
})
