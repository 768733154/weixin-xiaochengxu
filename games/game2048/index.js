const engine = require('./engine')
const manifest = require('./manifest')
const leaderboard = require('../../core/leaderboard')
const gesture = require('../../core/gesture')

Page({
  data: { cells: [], score: 0 },

  onLoad() {
    this.reset()
    const handlers = gesture.createHandlers(dir => {
      this.move(dir)
    })
    this.swipeTouchStart = handlers.swipeTouchStart
    this.swipeTouchEnd = handlers.swipeTouchEnd
  },

  reset() {
    this.board = engine.createBoard()
    this.totalScore = 0
    this.board = engine.addRandom(this.board)
    this.board = engine.addRandom(this.board)
    this.sync()
  },

  move(direction) {
    const result = engine.move(this.board, direction)
    if (!result.moved) return

    this.board = result.board
    this.totalScore += result.score
    this.board = engine.addRandom(this.board)
    this.sync()

    if (engine.isGameOver(this.board)) {
      leaderboard.submitScore(manifest.id, this.totalScore)
      wx.showModal({
        title: '游戏结束',
        content: `最终得分：${this.totalScore}`,
        confirmText: '再来一局',
        cancelText: '返回',
        success: res => {
          if (res.confirm) this.reset()
          else wx.navigateBack()
        }
      })
    }
  },

  up() { this.move('up') },
  down() { this.move('down') },
  left() { this.move('left') },
  right() { this.move('right') },

  sync() {
    this.setData({ cells: this.board.flat(), score: this.totalScore })
  },

  onShareAppMessage() {
    return {
      title: `我在2048拿到了${this.totalScore}分，来挑战！`,
      path: `/games/game2048/index?from=share&gameId=${manifest.id}`
    }
  }
})
