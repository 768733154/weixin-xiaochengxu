function formatTime(ts) {
  const date = new Date(Number(ts))
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

Page({
  data: {
    mode: 'lantern',
    isPass: false,
    score: 0,
    level: 0,
    total: 50,
    timeLeft: 0,
    title: '闯关结束',
    subtitle: '再试一次，看看你能冲到第几关',
    rewardTitle: '本轮奖励',
    rewardText: '获得灯会再挑战机会 1 次',
    best: null,
    ranking: []
  },

  onLoad(options) {
    const mode = options.mode || 'lantern'
    const isPass = Number(options.pass) === 1
    const score = Number(options.score || 0)
    const level = Number(options.level || 0)
    const total = Number(options.total || 50)
    const timeLeft = Number(options.timeLeft || 0)
    const storageKeyPrefix = mode === 'poetry' ? 'poetry_quiz' : 'lantern_quiz'
    const best = wx.getStorageSync(`${storageKeyPrefix}_best`) || null
    const history = wx.getStorageSync(`${storageKeyPrefix}_history`) || []
    const ranking = [...history]
      .sort((a, b) => {
        if (b.passedLevel !== a.passedLevel) return b.passedLevel - a.passedLevel
        if (b.score !== a.score) return b.score - a.score
        return b.createdAt - a.createdAt
      })
      .slice(0, 3)
      .map((item, index) => ({
      rank: index + 1,
      label: item.isPass ? '完美通关' : `闯到第 ${item.passedLevel} 关`,
      score: item.score,
      time: formatTime(item.createdAt)
      }))

    this.setData({
      mode,
      isPass,
      score,
      level,
      total,
      timeLeft,
      title: isPass ? '恭喜通关' : '挑战失败',
      subtitle: isPass
        ? `你已成功完成 ${total} 关挑战，剩余 ${timeLeft}s。`
        : `本次止步第 ${level + 1} 关前，继续加油。`,
      rewardTitle: isPass ? '通关奖励' : '挑战奖励',
      rewardText: isPass
        ? (mode === 'poetry' ? '获得“诗词达人”称号与满分通关记录。' : '获得“灯会谜王”称号与满分通关记录。')
        : '已记录本次最佳进度，可继续冲榜。',
      best,
      ranking
    })
  },

  playAgain() {
    const url = this.data.mode === 'poetry' ? '/pages/poetry/index' : '/pages/index/index'
    wx.redirectTo({ url })
  },

  backHome() {
    wx.reLaunch({ url: '/pages/home/index' })
  }
})
