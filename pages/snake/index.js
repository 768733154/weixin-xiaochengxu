const SIZE = 16

Page({
  data: { cells: [], score: 0, speed: 300 },
  onLoad() { this.reset() },
  onUnload() { this.stop() },
  reset() {
    this.stop()
    this.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }]
    this.dir = { x: 1, y: 0 }
    this.nextDir = { x: 1, y: 0 }
    this.score = 0
    this.food = this.randomFood()
    this.setData({ score: 0, speed: 300 })
    this.render()
  },
  start() {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), this.data.speed)
  },
  pause() { this.stop() },
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null } },
  setDir(x, y) {
    if (x + this.dir.x === 0 && y + this.dir.y === 0) return
    this.nextDir = { x, y }
  },
  up() { this.setDir(0, -1) }, down() { this.setDir(0, 1) }, left() { this.setDir(-1, 0) }, right() { this.setDir(1, 0) },
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
    if (next.x < 0 || next.x >= SIZE || next.y < 0 || next.y >= SIZE || this.snake.some(s => s.x === next.x && s.y === next.y)) {
      this.stop()
      wx.showToast({ title: '游戏结束', icon: 'none' })
      return
    }
    this.snake.unshift(next)
    if (next.x === this.food.x && next.y === this.food.y) {
      this.score += 1
      this.setData({ score: this.score })
      this.food = this.randomFood()
    } else {
      this.snake.pop()
    }
    this.render()
  },
  render() {
    const cells = new Array(SIZE * SIZE).fill('')
    this.snake.forEach((s, i) => { cells[s.y * SIZE + s.x] = i === 0 ? 'head' : 'snake' })
    cells[this.food.y * SIZE + this.food.x] = 'food'
    this.setData({ cells })
  }
})
