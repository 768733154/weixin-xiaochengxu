const match = require('../../core/match')
const user = require('../../core/user')
const registry = require('../../core/game-registry')
const storage = require('../../core/storage')

Page({
  data: {
    gameId: '',
    gameName: '',
    mode: 'friend',           // 'friend' | 'random'
    status: 'idle',           // 'idle' | 'creating' | 'waiting' | 'matching' | 'matched' | 'error'
    roomId: '',
    matchTimer: 0,
    errorMsg: ''
  },

  onLoad(options) {
    const gameId = options.gameId || 'gomoku'
    const game = registry.getById(gameId)
    const mode = options.mode || 'friend'

    this.setData({
      gameId,
      gameName: game ? game.name : '对战',
      mode
    })

    // 如果从分享卡片带入 roomId，直接加入
    if (options.roomId) {
      this.setData({ status: 'creating' })
      this.joinExistingRoom(options.roomId)
      return
    }

    if (mode === 'friend') {
      this.createFriendRoom()
    } else {
      this.startRandomMatch()
    }
  },

  onUnload() {
    this._clearTimers()
  },

  // 好友邀请：创建房间
  async createFriendRoom() {
    this.setData({ status: 'creating' })

    const roomId = await match.createRoom(this.data.gameId, 'friend')
    if (roomId) {
      this.setData({ status: 'waiting', roomId })
    } else {
      this.setData({ status: 'error', errorMsg: '创建房间失败，请检查云开发配置' })
    }
  },

  // 加入已有房间
  async joinExistingRoom(roomId) {
    this.setData({ status: 'creating' })

    const result = await match.joinRoom(roomId)
    if (result.error) {
      this.setData({ status: 'error', errorMsg: result.error })
      return
    }

    // 监听房间状态
    this._watcher = match.watchRoom(roomId, room => {
      if (room.status === 'playing') {
        this.navigateToGame(roomId)
      }
    })

    this.setData({ status: 'waiting', roomId })
  },

  // 随机匹配
  async startRandomMatch() {
    this.setData({ status: 'matching', matchTimer: 0 })

    const result = await match.randomMatch(this.data.gameId)
    if (!result) {
      this.setData({ status: 'error', errorMsg: '匹配服务不可用' })
      return
    }

    if (result.roomId) {
      // 匹配成功
      this.setData({ status: 'matched', roomId: result.roomId })
      setTimeout(() => this.navigateToGame(result.roomId), 1000)
    } else if (result.status === 'matching') {
      // 等待中
      this._startMatchTimer()
      this._pollMatchResult()
    } else {
      this.setData({ status: 'error', errorMsg: result.message || '匹配失败' })
    }
  },

  _startMatchTimer() {
    this._matchTimerInterval = setInterval(() => {
      const t = this.data.matchTimer + 1
      this.setData({ matchTimer: t })
      // 30s 超时
      if (t >= 30) {
        this._clearTimers()
        this.setData({ status: 'error', errorMsg: '暂无对手，请稍后再试' })
      }
    }, 1000)
  },

  _pollMatchResult() {
    // 每 3s 查询一次匹配池
    this._pollInterval = setInterval(async () => {
      const result = await match.randomMatch(this.data.gameId)
      if (result && result.roomId) {
        this._clearTimers()
        this.setData({ status: 'matched', roomId: result.roomId })
        setTimeout(() => this.navigateToGame(result.roomId), 1000)
      }
    }, 3000)
  },

  _clearTimers() {
    if (this._matchTimerInterval) clearInterval(this._matchTimerInterval)
    if (this._pollInterval) clearInterval(this._pollInterval)
  },

  // 跳转到游戏
  navigateToGame(roomId) {
    const game = registry.getById(this.data.gameId)
    if (!game) return

    wx.redirectTo({
      url: `${game.path}?roomId=${roomId}&mode=online`
    })
  },

  // 取消匹配
  cancelMatch() {
    this._clearTimers()
    if (this._watcher) {
      this._watcher.close()
      this._watcher = null
    }
    wx.navigateBack()
  },

  // 复制房间号
  copyRoomId() {
    wx.setClipboardData({
      data: this.data.roomId,
      success: () => wx.showToast({ title: '已复制房间号', icon: 'success' })
    })
  },

  // 分享邀请
  onShareAppMessage() {
    return {
      title: `来一局${this.data.gameName}对战！`,
      path: `/pages/match/index?gameId=${this.data.gameId}&roomId=${this.data.roomId}`
    }
  }
})
