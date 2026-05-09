const { poetryQuestionBank } = require('../../utils/poetryQuestions')

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const TOTAL_LEVELS = 50
const TOTAL_TIME = 300
const SCORE_PER_LEVEL = 2

function saveResult(result) {
  const history = wx.getStorageSync('poetry_quiz_history') || []
  const nextHistory = [result].concat(history).slice(0, 10)
  wx.setStorageSync('poetry_quiz_history', nextHistory)

  const best = wx.getStorageSync('poetry_quiz_best') || { maxLevel: 0, bestScore: 0 }
  if (
    result.passedLevel > Number(best.maxLevel || 0) ||
    (result.passedLevel === Number(best.maxLevel || 0) && result.score > Number(best.bestScore || 0))
  ) {
    wx.setStorageSync('poetry_quiz_best', {
      maxLevel: result.passedLevel,
      bestScore: result.score,
      updatedAt: result.createdAt
    })
  }
}

Page({
  data: {
    total: TOTAL_LEVELS,
    current: 1,
    score: 0,
    timeLeft: TOTAL_TIME,
    selected: -1,
    answered: false,
    gameOver: false,
    question: null,
    message: '',
    levelTitle: '第 1 关'
  },

  onLoad() {
    this.startGame()
  },

  onUnload() {
    this.clearTimer()
  },

  startGame() {
    const selectedQuestions = shuffle(poetryQuestionBank).slice(0, TOTAL_LEVELS)
    this.questions = selectedQuestions
    this.qIndex = 0

    this.setData({
      total: TOTAL_LEVELS,
      current: 1,
      score: 0,
      timeLeft: TOTAL_TIME,
      selected: -1,
      answered: false,
      gameOver: false,
      message: '',
      levelTitle: '第 1 关',
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
        this.finishGame('时间到！', false)
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
      score: isRight ? this.data.score + SCORE_PER_LEVEL : this.data.score,
      message: isRight
        ? '回答正确，进入下一关。'
        : `回答错误。${this.data.question.explain}`
    })

    if (!isRight) {
      setTimeout(() => {
        this.finishGame('答错闯关失败', false)
      }, 600)
    }
  },

  nextQuestion() {
    if (!this.data.answered || this.data.gameOver) return

    const nextIndex = this.qIndex + 1
    if (nextIndex >= this.questions.length) {
      this.finishGame('闯关完成！', true)
      return
    }

    this.qIndex = nextIndex
    this.setData({
      current: nextIndex + 1,
      levelTitle: `第 ${nextIndex + 1} 关`,
      question: this.questions[nextIndex],
      selected: -1,
      answered: false,
      message: ''
    })
  },

  finishGame(tip, isPass) {
    this.clearTimer()
    const passedLevel = isPass ? TOTAL_LEVELS : this.data.current - (this.data.answered && this.data.selected === this.data.question.answer ? 0 : 1)
    const result = {
      isPass: Boolean(isPass),
      score: this.data.score,
      passedLevel: Math.max(0, passedLevel),
      total: TOTAL_LEVELS,
      timeLeft: this.data.timeLeft,
      createdAt: Date.now(),
      tip
    }

    saveResult(result)
    this.setData({
      gameOver: true,
      message: `${tip} 最终得分：${this.data.score}`
    })

    wx.redirectTo({
      url: `/pages/lantern-result/index?mode=poetry&pass=${result.isPass ? 1 : 0}&score=${result.score}&level=${result.passedLevel}&total=${result.total}&timeLeft=${result.timeLeft}`
    })
  },

  restart() {
    this.startGame()
  }
})
