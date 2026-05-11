const { questionBank } = require('./questions')
const manifest = require('./manifest')
const leaderboard = require('../../core/leaderboard')

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

Page({
  data: {
    total: 5,
    current: 1,
    score: 0,
    timeLeft: 60,
    selected: -1,
    answered: false,
    gameOver: false,
    question: null,
    message: ''
  },

  onLoad() {
    this.startGame()
  },

  onHide() {
    this.clearTimer()
  },

  onUnload() {
    this.clearTimer()
  },

  onShow() {
    if (this._wasPlaying && !this.data.gameOver && !this.timer) {
      this.startTimer()
    }
  },

  startGame() {
    const selectedQuestions = shuffle(questionBank).slice(0, 5)
    this.questions = selectedQuestions
    this.qIndex = 0
    this._wasPlaying = true

    this.setData({
      total: selectedQuestions.length,
      current: 1,
      score: 0,
      timeLeft: 60,
      selected: -1,
      answered: false,
      gameOver: false,
      message: '',
      question: selectedQuestions[0]
    })

    this.startTimer()
  },

  startTimer() {
    this.clearTimer()
    this.timer = setInterval(() => {
      const next = this.data.timeLeft - 1
      if (next <= 0) {
        this.setData({ timeLeft: 0 })
        this.finishGame('时间到！')
        return
      }
      this.setData({ timeLeft: next })
    }, 1000)
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  chooseOption(e) {
    if (this.data.answered || this.data.gameOver) return

    const selected = Number(e.currentTarget.dataset.index)
    const correct = this.data.question.answer
    const isRight = selected === correct

    this.setData({
      selected,
      answered: true,
      score: isRight ? this.data.score + 20 : this.data.score,
      message: isRight
        ? '回答正确，气势如虹！'
        : `回答错误。${this.data.question.explain}`
    })
  },

  nextQuestion() {
    if (!this.data.answered || this.data.gameOver) return

    const nextIndex = this.qIndex + 1
    if (nextIndex >= this.questions.length) {
      this.finishGame('闯关完成！')
      return
    }

    this.qIndex = nextIndex
    this.setData({
      current: nextIndex + 1,
      question: this.questions[nextIndex],
      selected: -1,
      answered: false,
      message: ''
    })
  },

  finishGame(tip) {
    this.clearTimer()
    this._wasPlaying = false
    leaderboard.submitScore(manifest.id, this.data.score)
    this.setData({
      gameOver: true,
      message: `${tip} 最终得分：${this.data.score}`
    })
  },

  restart() {
    this.startGame()
  },

  onShareAppMessage() {
    return {
      title: `我在诗词闯关拿到了${this.data.score}分，来挑战！`,
      path: `/games/quiz/index?from=share&gameId=${manifest.id}`
    }
  }
})
