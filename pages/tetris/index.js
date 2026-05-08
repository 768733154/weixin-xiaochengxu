const W = 10
const H = 20
const SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]]
]

function clone2d(a) { return a.map(r => [...r]) }
function rot(m) { return m[0].map((_, i) => m.map(r => r[i]).reverse()) }

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
  },
  onUnload() {
    this.pause()
    this.stopFastDrop()
    this.stopFastLeft()
    this.stopFastRight()
  },
  onHide() {
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
    this.grid = Array.from({ length: H }, () => Array(W).fill(0))
    this.score = 0
    this.lines = 0
    this.isStarted = false
    this.isPaused = false
    this.spawn()
    this.render()
  },
  start() {
    if (this.timer) return
    this.isStarted = true
    this.isPaused = false
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
  canOperate() {
    return this.isStarted && !this.isPaused
  },
  spawn() {
    this.cur = { shape: clone2d(SHAPES[Math.floor(Math.random() * SHAPES.length)]), x: 3, y: 0 }
    if (this.collide(this.cur.x, this.cur.y, this.cur.shape)) {
      wx.showToast({ title: '游戏结束', icon: 'none' })
      this.reset()
    }
  },
  collide(x, y, shape) {
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (!shape[i][j]) continue
        const nx = x + j, ny = y + i
        if (nx < 0 || nx >= W || ny >= H) return true
        if (ny >= 0 && this.grid[ny][nx]) return true
      }
    }
    return false
  },
  merge() {
    const { x, y, shape } = this.cur
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) this.grid[y + i][x + j] = 1
      }
    }
    this.clearLines()
    this.spawn()
  },
  clearLines() {
    let cleared = 0
    this.grid = this.grid.filter(row => {
      if (row.every(v => v)) { cleared += 1; return false }
      return true
    })
    while (this.grid.length < H) this.grid.unshift(Array(W).fill(0))
    if (cleared) {
      this.score += cleared * 100
      this.lines += cleared
      this.setData({ score: this.score, lines: this.lines })
    }
  },
  tick() {
    if (!this.collide(this.cur.x, this.cur.y + 1, this.cur.shape)) {
      this.cur.y += 1
    } else {
      this.merge()
    }
    this.render()
  },
  left() {
    if (!this.canOperate()) return
    if (!this.collide(this.cur.x - 1, this.cur.y, this.cur.shape)) { this.cur.x -= 1; this.render() }
  },
  right() {
    if (!this.canOperate()) return
    if (!this.collide(this.cur.x + 1, this.cur.y, this.cur.shape)) { this.cur.x += 1; this.render() }
  },
  rotate() {
    if (!this.canOperate()) return
    const r = rot(this.cur.shape)
    if (!this.collide(this.cur.x, this.cur.y, r)) { this.cur.shape = r; this.render() }
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
    if (this.fastLeftTimer) {
      clearInterval(this.fastLeftTimer)
      this.fastLeftTimer = null
    }
  },
  startFastRight() {
    if (!this.canOperate()) return
    if (this.fastRightTimer) return
    this.fastRightTimer = setInterval(() => this.right(), 70)
  },
  stopFastRight() {
    if (this.fastRightTimer) {
      clearInterval(this.fastRightTimer)
      this.fastRightTimer = null
    }
  },
  startFastDrop() {
    if (!this.canOperate()) return
    if (this.fastDropTimer) return
    this.fastDropTimer = setInterval(() => this.tick(), 70)
  },
  stopFastDrop() {
    if (this.fastDropTimer) {
      clearInterval(this.fastDropTimer)
      this.fastDropTimer = null
    }
  },
  render() {
    const board = this.grid.map(r => [...r])
    const { x, y, shape } = this.cur
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] && y + i >= 0 && y + i < H && x + j >= 0 && x + j < W) board[y + i][x + j] = 1
      }
    }
    this.setData({ cells: board.flat(), score: this.score, lines: this.lines })
  }
})
