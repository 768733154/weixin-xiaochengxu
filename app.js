const storage = require('./core/storage')
const user = require('./core/user')

App({
  onLaunch(options) {
    // 云初始化（异步不阻塞）
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true })
    }

    // 并行加载本地缓存，首页立即可用
    this.globalData = {
      userInfo: storage.getFresh('userInfo', null),
      gameList: null,
      scene: options.scene || null,
      query: options.query || {}
    }

    // 静默登录获取 openid
    user.silentLogin().then(info => {
      this.globalData.userInfo = info
    })

    // 场景值路由：从分享卡片/对战邀请直达
    if (options.query && options.query.gameId) {
      this.globalData.pendingNav = `/games/${options.query.gameId}/index?from=share`
    }
    if (options.query && options.query.roomId) {
      this.globalData.pendingNav = `/pages/match/index?roomId=${options.query.roomId}`
    }
  }
})
