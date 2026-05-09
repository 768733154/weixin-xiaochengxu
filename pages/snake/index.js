const SIZE = 16
const BASE_SPEED = 300
const MIN_SPEED = 120

Page({
  data: {
    cells: [],
    score: 0,
    bestScore: 0,
    speed: BASE_SPEED,
    length: 2,
    statusText: '准备开始',
    isRunning: false,
    isGameOver: false
  },

  onLoad() {
    const bestScore = Number(wx.getStorageSync('snake_best_score') || 0)
    this.touchStartPoint = null
    this.setData({ bestScore })
    this.reset()
  },

  onUnload() {
    this.stop()
  },

  reset() {
    this.stop()
    this.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }]
    this.dir = { x: 1, y: 0 }
    this.nextDir = { x: 1, y: 0 }
    this.score = 0
    this.speed = BASE_SPEED
    this.food = this.randomFood()
    this.setData({
      score: 0,
      speed: BASE_SPEED,
      length: this.snake.length,
      statusText: '准备开始',
      isRunning: false,
      isGameOver: false
    })
    this.render()
  },

  start() {
    if (this.timer) return
    this.setData({
      isRunning: true,
      isGameOver: false,
      statusText: this.score > 0 ? '继续冲刺' : '滑动或点击方向键操控'
    })
    this.timer = setInterval(() => this.tick(), this.speed)
  },

  pause() {
    this.stop()
    if (!this.data.isGameOver) {
      this.setData({ statusText: '已暂停', isRunning: false })
    }
  },

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  setDir(x, y) {
    if (x + this.dir.x === 0 && y + this.dir.y === 0) return
    this.nextDir = { x, y }
  },

  up() { this.setDir(0, -1) },
  down() { this.setDir(0, 1) },
  left() { this.setDir(-1, 0) },
  right() { this.setDir(1, 0) },

  onTouchStart(e) {
    const touch = e.touches && e.touches[0]
    if (!touch) return
    this.touchStartPoint = { x: touch.clientX, y: touch.clientY }
  },

  onTouchEnd(e) {
    if (!this.touchStartPoint) return
    const touch = e.changedTouches && e.changedTouches[0]
    if (!touch) return

    const dx = touch.clientX - this.touchStartPoint.x
    const dy = touch.clientY - this.touchStartPoint.y
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (Math.max(absX, absY) < 24) return

    if (absX > absY) {
      this.setDir(dx > 0 ? 1 : -1, 0)
    } else {
      this.setDir(0, dy > 0 ? 1 : -1)
    }
  },

  randomFood() {
    while (true) {
      const p = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) }
      if (!this.snake.some(s => s.x === p.x && s.y === p.y)) return p
    }
  },

  tick() {
    this.dir = this.nextDir
    const head = this.snake[0]
    const next = { x: head.x + this.dir.x, y: head.y + this.dir.y }
    const willEat = next.x === this.food.x && next.y === this.food.y
    const bodyToCheck = willEat ? this.snake : this.snake.slice(0, -1)

    if (
      next.x < 0 ||
      next.x >= SIZE ||
      next.y < 0 ||
      next.y >= SIZE ||
      bodyToCheck.some(s => s.x === next.x && s.y === next.y)
    ) {
      this.gameOver()
      return
    }

    this.snake.unshift(next)
    if (willEat) {
      this.score += 1
      this.food = this.randomFood()
      this.updateSpeed()
      this.updateBestScore()
    } else {
      this.snake.pop()
    }

    this.render()
  },

  updateSpeed() {
    const nextSpeed = Math.max(MIN_SPEED, BASE_SPEED - this.score * 12)
    if (nextSpeed === this.speed) return

    this.speed = nextSpeed
    this.setData({ speed: nextSpeed })
    if (this.timer) {
      this.stop()
      this.timer = setInterval(() => this.tick(), this.speed)
    }
  },

  updateBestScore() {
    if (this.score <= this.data.bestScore) {
      this.setData({ score: this.score, length: this.snake.length })
      return
    }

    wx.setStorageSync('snake_best_score', this.score)
    this.setData({
      score: this.score,
      bestScore: this.score,
      length: this.snake.length
    })
  },

  gameOver() {
    this.stop()
    this.setData({
      isRunning: false,
      isGameOver: true,
      statusText: `游戏结束，得分 ${this.score}`
    })
    wx.showToast({ title: '游戏结束', icon: 'none' })
  },

  render() {
    const cells = new Array(SIZE * SIZE).fill('')
    this.snake.forEach((s, i) => {
      cells[s.y * SIZE + s.x] = i === 0 ? 'head' : 'snake'
    })
    cells[this.food.y * SIZE + this.food.x] = 'food'

    this.setData({
      cells,
      score: this.score,
      speed: this.speed,
      length: this.snake.length
    })
  }
})
