const engine = require('./engine')
const manifest = require('./manifest')
const leaderboard = require('../../core/leaderboard')
const gesture = require('../../core/gesture')

Page({
  data: { cells: [], score: 0, speed: 300, showOverModal: false, overScore: 0, overBest: 0 },

  onLoad() {
    this.reset()
    const handlers = gesture.createHandlers(dir => {
      if (dir === 'up') this.up()
      else if (dir === 'down') this.down()
      else if (dir === 'left') this.left()
      else if (dir === 'right') this.right()
    })
    this.swipeTouchStart = handlers.swipeTouchStart
    this.swipeTouchEnd = handlers.swipeTouchEnd
  },

  onShow() {
    if (this._wasPlaying) this.start()
  },

  onHide() {
    if (this.timer) {
      this._wasPlaying = true
      this.stop()
    }
  },

  onUnload() {
    this.stop()
  },

  reset() {
    this.stop()
    this.state = engine.createInitialState()
    this.state.food = engine.randomFood(this.state.snake)
    this._wasPlaying = false
    this.setData({ score: 0, speed: 300 })
    this.render()
  },

  start() {
    if (this.timer) return
    this._wasPlaying = true
    this.timer = setInterval(() => this.tick(), this.data.speed)
  },

  pause() {
    this.stop()
  },

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  },

  tick() {
    this.state = engine.setDirection(this.state, this.state.nextDir.x, this.state.nextDir.y)
    const result = engine.tick(this.state)
    this.state = result.state

    if (result.gameOver) {
      this.stop()
      this._wasPlaying = false
      leaderboard.submitScore(manifest.id, this.state.score)
      const best = leaderboard.getBestScore(manifest.id)
      this.setData({ showOverModal: true, overScore: this.state.score, overBest: Math.max(best, this.state.score) })
      return
    }

    this.setData({ score: this.state.score })
    this.render()
  },

  up() { this.state = engine.setDirection(this.state, 0, -1) },
  down() { this.state = engine.setDirection(this.state, 0, 1) },
  left() { this.state = engine.setDirection(this.state, -1, 0) },
  right() { this.state = engine.setDirection(this.state, 1, 0) },

  render() {
    const cells = engine.render(this.state)
    this.setData({ cells })
  },

  overRestart() {
    this.setData({ showOverModal: false })
    this.reset()
  },

  overBack() {
    this.setData({ showOverModal: false })
    wx.navigateBack()
  },

  onShareAppMessage() {
    return {
      title: `我在贪吃蛇拿到了${this.state.score}分，来挑战！`,
      path: `/games/snake/index?from=share&gameId=${manifest.id}`
    }
  }
})
