const TOTAL_LEVELS = 30
const TICK_MS = 16
const SHOT_ANGLE = 180
const STORAGE_KEY = 'pinball_records'
const MAX_RECORDS = 20

function normalizeAngle(angle) {
  const normalized = angle % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function angleDiff(a, b) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b))
  return Math.min(diff, 360 - diff)
}

function range(count) {
  return Array.from({ length: count }, (_, index) => index)
}

function getLevelConfig(level) {
  const speed = Math.min(5.8, 1.4 + level * 0.12)
  const initialPins = Math.min(8, 1 + Math.floor((level - 1) / 3))
  const remainingPins = Math.min(10, 4 + Math.floor((level - 1) / 2))
  const collisionThreshold = Math.max(12, 20 - Math.floor(level / 4))
  return {
    speed,
    direction: level % 2 === 0 ? -1 : 1,
    initialPins,
    remainingPins,
    collisionThreshold
  }
}

function formatTime(ts) {
  const date = new Date(Number(ts))
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function loadRecords() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || []
  } catch (error) {
    return []
  }
}

function persistRecords(records) {
  try {
    wx.setStorageSync(STORAGE_KEY, records.slice(0, MAX_RECORDS))
  } catch (error) {}
}

Page({
  data: {
    level: 1,
    totalLevels: TOTAL_LEVELS,
    remainingPins: 0,
    score: 0,
    statusText: '点击发射开始挑战',
    discStyle: '',
    attachedPins: [],
    queuePins: [],
    currentPinStyle: '',
    gameOver: false,
    completed: false,
    failText: '',
    actionText: '发射',
    bestRecord: null,
    leaderboard: []
  },

  onLoad() {
    this.startLevel(1)
    this.refreshLeaderboard()
  },

  onUnload() {
    this.clearTimer()
    this.clearPendingTimers()
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  clearPendingTimers() {
    if (this.shootTimer) {
      clearTimeout(this.shootTimer)
      this.shootTimer = null
    }
    if (this.nextLevelTimer) {
      clearTimeout(this.nextLevelTimer)
      this.nextLevelTimer = null
    }
  },

  startLevel(level) {
    this.clearTimer()
    this.clearPendingTimers()

    const config = getLevelConfig(level)
    const step = 360 / (config.initialPins || 1)
    this.level = level
    this.rotation = 0
    this.rotationSpeed = config.speed
    this.rotationDirection = config.direction
    this.collisionThreshold = config.collisionThreshold
    this.attachedAngles = range(config.initialPins).map(index => normalizeAngle(index * step))
    this.remainingPins = config.remainingPins
    this.isShooting = false
    this.isTransitioning = false
    this.gameOver = false

    this.setData({
      level,
      totalLevels: TOTAL_LEVELS,
      remainingPins: this.remainingPins,
      score: (level - 1) * 10,
      statusText: `第 ${level} 关：注意旋转节奏`,
      gameOver: false,
      completed: false,
      failText: '',
      actionText: '发射',
      currentPinStyle: this.getCurrentPinStyle(false),
      queuePins: range(Math.max(0, this.remainingPins - 1))
    })

    this.renderDisc()
    this.timer = setInterval(() => this.tick(), TICK_MS)
  },

  refreshLeaderboard() {
    const records = loadRecords()
    if (!records.length) {
      this.setData({ bestRecord: null, leaderboard: [] })
      return
    }

    const ranked = [...records].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.level !== a.level) return b.level - a.level
      return b.createdAt - a.createdAt
    })

    const best = ranked[0]
    const leaderboard = ranked.slice(0, 5).map((item, index) => ({
      rank: index + 1,
      label: item.completed ? '通关成功' : `闯到第 ${item.level} 关`,
      score: item.score,
      time: formatTime(item.createdAt)
    }))

    this.setData({
      bestRecord: {
        title: best.completed ? '通关成功' : `闯到第 ${best.level} 关`,
        score: best.score,
        level: best.level,
        time: formatTime(best.createdAt)
      },
      leaderboard
    })
  },

  persistRecord(completed) {
    const records = loadRecords()
    const record = {
      level: completed ? TOTAL_LEVELS : this.level,
      score: this.data.score,
      completed,
      createdAt: Date.now()
    }
    const next = [record].concat(records)
    persistRecords(next)
    this.refreshLeaderboard()
  },

  tick() {
    this.rotation = normalizeAngle(this.rotation + this.rotationSpeed * this.rotationDirection)
    this.renderDisc()
  },

  renderDisc() {
    const attachedPins = this.attachedAngles.map((angle, index) => ({
      key: `${index}-${angle}`,
      style: `transform: rotate(${normalizeAngle(angle + this.rotation)}deg);`
    }))

    this.setData({
      discStyle: `transform: rotate(${this.rotation}deg);`,
      attachedPins
    })
  },

  getCurrentPinStyle(isFlying) {
    return isFlying
      ? 'transform: translateX(-50%) translateY(-300rpx); opacity: 1;'
      : 'transform: translateX(-50%) translateY(0); opacity: 1;'
  },

  handleArenaTap() {
    this.shootPin()
  },

  shootPin() {
    if (this.isShooting || this.isTransitioning || this.gameOver || this.data.completed) return
    if (this.remainingPins <= 0) return

    this.isShooting = true
    this.setData({
      currentPinStyle: this.getCurrentPinStyle(true),
      actionText: '发射中'
    })

    this.shootTimer = setTimeout(() => {
      this.resolveShot()
    }, 180)
  },

  resolveShot() {
    this.shootTimer = null
    const hitLocalAngle = normalizeAngle(SHOT_ANGLE - this.rotation)
    const hasCollision = this.attachedAngles.some(angle => {
      const worldAngle = normalizeAngle(angle + this.rotation)
      return angleDiff(worldAngle, SHOT_ANGLE) < this.collisionThreshold
    })

    if (hasCollision) {
      this.handleFail()
      return
    }

    this.attachedAngles.push(hitLocalAngle)
    this.remainingPins -= 1
    this.isShooting = false
    this.setData({
      remainingPins: this.remainingPins,
      score: (this.level - 1) * 10 + (getLevelConfig(this.level).remainingPins - this.remainingPins) * 2,
      statusText: this.remainingPins === 0 ? '本关完成，准备进入下一关' : '命中成功，继续发射',
      currentPinStyle: this.getCurrentPinStyle(false),
      actionText: this.remainingPins === 0 ? '通关中' : '继续发射',
      queuePins: range(Math.max(0, this.remainingPins - 1))
    })
    this.renderDisc()

    if (this.remainingPins === 0) {
      this.handleLevelClear()
    }
  },

  handleFail() {
    this.clearTimer()
    this.isShooting = false
    this.gameOver = true
    this.setData({
      gameOver: true,
      failText: '碰撞失败，针已相撞',
      statusText: `闯关失败，止步第 ${this.level} 关`,
      currentPinStyle: this.getCurrentPinStyle(false),
      actionText: '重试本关'
    }, () => this.persistRecord(false))
  },

  handleLevelClear() {
    this.isTransitioning = true
    this.clearTimer()
    if (this.level >= TOTAL_LEVELS) {
      this.setData({
        completed: true,
        statusText: '全部关卡通关，恭喜完成挑战',
        actionText: '全部通关'
      }, () => this.persistRecord(true))
      return
    }

    this.nextLevelTimer = setTimeout(() => {
      this.isTransitioning = false
      this.startLevel(this.level + 1)
    }, 900)
  },

  restartLevel() {
    this.startLevel(this.level)
  },

  restartGame() {
    this.startLevel(1)
  }
})
