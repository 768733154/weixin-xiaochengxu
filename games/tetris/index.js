const engine = require('./engine')
const manifest = require('./manifest')
const leaderboard = require('../../core/leaderboard')

Page({
  data: { cells: [], score: 0, lines: 0, boardStyle: '' },

  onLoad() {
    this.reset()
  },

  onReady() {
    this.updateBoardSize()
  },

  onShow() {
    this.updateBoardSize()
    if (this._wasPlaying) this.resume()
  },

  onHide() {
    if (this.isStarted && !this.isPaused) {
      this._wasPlaying = true
      this.pause()
    }
  },

  onUnload() {
    this.pause()
    this.stopFastDrop()
    this.stopFastLeft()
    this.stopFastRight()
  },

  updateBoardSize() {
    const query = wx.createSelectorQuery().in(this)
    query.select('.screen-shell').boundingClientRect()
    query.select('.meta').boundingClientRect()
    query.select('.screen').boundingClientRect()
    query.exec(res => {
      const shellRect = res && res[0]
      const metaRect = res && res[1]
      const screenRect = res && res[2]
      if (!shellRect || !metaRect || !screenRect) return
      const maxBoardWidth = Math.max(180, screenRect.width - 16)
      const maxBoardHeight = Math.max(260, shellRect.height - metaRect.height - 20)
      const boardWidth = Math.floor(Math.min(maxBoardWidth, maxBoardHeight / 2))
      const boardHeight = boardWidth * 2
      this.setData({ boardStyle: `width:${boardWidth}px;height:${boardHeight}px;` })
    })
  },

  reset() {
    this.pause()
    this.grid = engine.createGrid()
    this.score = 0
    this.lines = 0
    this.isStarted = false
    this.isPaused = false
    this._wasPlaying = false
    this.cur = engine.spawn()
    this.render()
  },

  start() {
    if (this.timer) return
    this.isStarted = true
    this.isPaused = false
    this._wasPlaying = true
    this.timer = setInterval(() => this.tick(), 450)
  },

  pause() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.isStarted) this.isPaused = true
    this.stopFastDrop()
    this.stopFastLeft()
    this.stopFastRight()
  },

  resume() {
    this._wasPlaying = false
    if (this.isStarted && this.isPaused) {
      this.isPaused = false
      this.timer = setInterval(() => this.tick(), 450)
    }
  },

  canOperate() {
    return this.isStarted && !this.isPaused
  },

  gameOver() {
    this.pause()
    this._wasPlaying = false
    leaderboard.submitScore(manifest.id, this.score)
    wx.showModal({
      title: '游戏结束',
      content: `得分：${this.score}\n消行：${this.lines}`,
      confirmText: '再来一局',
      cancelText: '返回',
      success: res => {
        if (res.confirm) this.reset()
        else wx.navigateBack()
      }
    })
  },

  tick() {
    if (!engine.collide(this.grid, this.cur.x, this.cur.y + 1, this.cur.shape)) {
      this.cur.y += 1
    } else {
      engine.merge(this.grid, this.cur)
      const { grid, cleared } = engine.clearLines(this.grid)
      this.grid = grid
      if (cleared) {
        this.score += cleared * 100
        this.lines += cleared
      }
      this.cur = engine.spawn()
      if (engine.collide(this.grid, this.cur.x, this.cur.y, this.cur.shape)) {
        this.render()
        this.gameOver()
        return
      }
    }
    this.render()
  },

  left() {
    if (!this.canOperate()) return
    if (!engine.collide(this.grid, this.cur.x - 1, this.cur.y, this.cur.shape)) { this.cur.x -= 1; this.render() }
  },

  right() {
    if (!this.canOperate()) return
    if (!engine.collide(this.grid, this.cur.x + 1, this.cur.y, this.cur.shape)) { this.cur.x += 1; this.render() }
  },

  rotate() {
    if (!this.canOperate()) return
    const r = engine.rotate(this.cur.shape)
    if (!engine.collide(this.grid, this.cur.x, this.cur.y, r)) { this.cur.shape = r; this.render() }
  },

  down() {
    if (!this.canOperate()) return
    this.tick()
  },

  startFastLeft() {
    if (!this.canOperate()) return
    if (this.fastLeftTimer) return
    this.fastLeftTimer = setInterval(() => this.left(), 70)
  },
  stopFastLeft() {
    if (this.fastLeftTimer) { clearInterval(this.fastLeftTimer); this.fastLeftTimer = null }
  },

  startFastRight() {
    if (!this.canOperate()) return
    if (this.fastRightTimer) return
    this.fastRightTimer = setInterval(() => this.right(), 70)
  },
  stopFastRight() {
    if (this.fastRightTimer) { clearInterval(this.fastRightTimer); this.fastRightTimer = null }
  },

  startFastDrop() {
    if (!this.canOperate()) return
    if (this.fastDropTimer) return
    this.fastDropTimer = setInterval(() => this.tick(), 70)
  },
  stopFastDrop() {
    if (this.fastDropTimer) { clearInterval(this.fastDropTimer); this.fastDropTimer = null }
  },

  render() {
    const cells = engine.render(this.grid, this.cur)
    this.setData({ cells, score: this.score, lines: this.lines })
  },

  onShareAppMessage() {
    return {
      title: `我在俄罗斯方块拿到了${this.score}分，来挑战！`,
      path: `/games/tetris/index?from=share&gameId=${manifest.id}`
    }
  }
})
