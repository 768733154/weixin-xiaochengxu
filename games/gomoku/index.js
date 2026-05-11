const engine = require('./engine')
const room = require('./room')
const manifest = require('./manifest')
const leaderboard = require('../../core/leaderboard')
const storage = require('../../core/storage')

Page({
  data: {
    mode: 'single',
    difficulty: 'normal',
    cells: [],
    turn: 1,
    status: 'playing',
    statusText: '人机对战：你执黑先手',
    roomId: '',
    roomInput: '',
    role: 0,
    roleText: '观战',
    turnText: '黑子'
  },

  onLoad(options) {
    this.initBoard()

    if (options && options.roomId) {
      this.switchToOnline()
      this.setData({ roomInput: options.roomId })
      this.joinRoom()
    }

    if (options && options.mode === 'online') {
      this.switchToOnline()
    }
  },

  onUnload() {
    if (this.unwatch) this.unwatch.close()
  },

  onShareAppMessage() {
    const { mode, roomId } = this.data
    if (mode === 'online' && roomId) {
      return {
        title: '来一局五子棋对战！',
        path: `/games/gomoku/index?roomId=${roomId}&gameId=${manifest.id}`
      }
    }
    return {
      title: '游戏百宝箱五子棋，来试试！',
      path: `/games/gomoku/index?gameId=${manifest.id}`
    }
  },

  updateTexts() {
    const roleText = this.data.role === 1 ? '黑子(房主)' : this.data.role === 2 ? '白子(挑战者)' : '观战'
    const turnText = this.data.turn === 1 ? '黑子' : '白子'
    this.setData({ roleText, turnText })
  },

  initBoard() {
    this.setData({
      cells: engine.createBoard(),
      turn: 1,
      status: 'playing',
      statusText: this.data.mode === 'single' ? '人机对战：你执黑先手' : '联机模式：等待对手'
    }, () => this.updateTexts())
  },

  switchToSingle() {
    if (this.unwatch) this.unwatch.close()
    this.unwatch = null
    this.setData({ mode: 'single', roomId: '', roomInput: '', role: 0 }, () => {
      this.initBoard()
    })
  },

  setDifficulty(e) {
    const level = e.currentTarget.dataset.level
    if (!level || level === this.data.difficulty) return
    this.setData({ difficulty: level })
    const textMap = {
      easy: '人机对战（简单）：你执黑先手',
      normal: '人机对战（普通）：你执黑先手',
      hard: '人机对战（困难）：你执黑先手'
    }
    if (this.data.mode === 'single') {
      this.setData({ statusText: textMap[level] || textMap.normal })
    }
  },

  switchToOnline() {
    this.setData({ mode: 'online', role: 0, statusText: '联机模式：请创建或加入房间' }, () => {
      this.initBoard()
    })
  },

  onRoomInput(e) {
    this.setData({ roomInput: e.detail.value.trim() })
  },

  async createRoom() {
    if (!wx.cloud) return wx.showToast({ title: '请开通云开发', icon: 'none' })
    if (this.data.mode !== 'online') this.switchToOnline()

    const roomId = await room.createRoom()
    if (!roomId) return wx.showToast({ title: '创建失败', icon: 'none' })

    this.setData({ roomId, role: 1, statusText: '房间已创建，点击分享邀请好友' }, () => this.updateTexts())
    this.watchRoom(roomId)
    wx.showToast({ title: '已创建，可点右上角分享', icon: 'none' })
  },

  async joinRoom() {
    if (!wx.cloud) return wx.showToast({ title: '请开通云开发', icon: 'none' })
    if (this.data.mode !== 'online') this.switchToOnline()

    const roomId = this.data.roomInput
    if (!roomId) return wx.showToast({ title: '请输入房间号', icon: 'none' })

    const result = await room.joinRoom(roomId)
    if (result.error) return wx.showToast({ title: result.error, icon: 'none' })

    const role = result.role === 'host' ? 1 : 2
    const statusText = role === 1 ? '你是房主，等待好友加入' : '已加入对战，白子后手'
    this.setData({ roomId, role, statusText }, () => this.updateTexts())
    this.watchRoom(roomId)
  },

  leaveRoom() {
    if (this.unwatch) this.unwatch.close()
    this.unwatch = null
    if (this.data.roomId) room.leaveRoom(this.data.roomId)
    this.switchToSingle()
  },

  watchRoom(roomId) {
    if (this.unwatch) this.unwatch.close()
    this.unwatch = room.watchRoom(roomId,
      d => {
        const cells = d.gameState ? d.gameState.cells : (d.board || this.data.cells)
        const turn = d.gameState ? d.gameState.turn : (d.turn || this.data.turn)
        const status = d.status || this.data.status
        this.setData({ cells, turn, status }, () => this.updateTexts())
        if (status === 'win_black') this.setData({ statusText: '对局结束：黑子胜' })
        if (status === 'win_white') this.setData({ statusText: '对局结束：白子胜' })
      },
      () => wx.showToast({ title: '同步中断', icon: 'none' })
    )
  },

  async tapCell(e) {
    if (this.data.mode === 'single') {
      this.tapSingle(e)
      return
    }
    await this.tapOnline(e)
  },

  tapSingle(e) {
    const { status, turn } = this.data
    if (status !== 'playing' || turn !== 1) return

    const idx = Number(e.currentTarget.dataset.index)
    const cells = [...this.data.cells]
    if (cells[idx] !== 0) return

    cells[idx] = 1
    if (engine.checkWin(cells, idx, 1)) {
      this.setData({ cells, status: 'win_black', statusText: '你赢了！' })
      leaderboard.submitScore(manifest.id, 100)
      return
    }

    const aiIdx = engine.pickAiMove(cells, this.data.difficulty)
    if (aiIdx === -1) {
      this.setData({ cells, status: 'draw', statusText: '平局' })
      return
    }

    cells[aiIdx] = 2
    if (engine.checkWin(cells, aiIdx, 2)) {
      this.setData({ cells, status: 'win_white', statusText: '电脑获胜，再来一局吧' })
      return
    }

    this.setData({ cells, turn: 1, statusText: '人机对战：轮到你落子' })
  },

  async tapOnline(e) {
    const { roomId, role, turn, status } = this.data
    if (!roomId || status !== 'playing') return
    if (role !== turn) return

    const idx = Number(e.currentTarget.dataset.index)
    const cells = [...this.data.cells]
    if (cells[idx] !== 0) return

    cells[idx] = role
    const winner = engine.checkWin(cells, idx, role)
    const newStatus = winner ? (role === 1 ? 'win_black' : 'win_white') : 'playing'
    const newTurn = role === 1 ? 2 : 1

    await room.updateBoard(roomId, cells, newTurn, newStatus)

    if (winner) {
      leaderboard.submitScore(manifest.id, role === 1 ? 100 : 80)
    }
  },

  async resetBoard() {
    if (this.data.mode === 'single') {
      this.initBoard()
      return
    }

    if (!this.data.roomId || this.data.role !== 1) return
    await room.resetBoard(this.data.roomId)
    this.setData({ statusText: '已重置，黑子先手' })
  }
})
