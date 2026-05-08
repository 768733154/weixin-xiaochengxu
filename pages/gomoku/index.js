const SIZE = 15

Page({
  data: {
    mode: 'single',
    difficulty: 'normal',
    cells: [],
    turn: 1,
    status: 'playing',
    statusText: '人机对战：你执黑先手',
    roomId: '',
    roomInput: '',
    role: 0,
    roleText: '观战',
    turnText: '黑子'
  },

  onLoad(options) {
    this.uid = wx.getStorageSync('local_uid')
    if (!this.uid) {
      this.uid = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`
      wx.setStorageSync('local_uid', this.uid)
    }

    if (wx.cloud) {
      wx.cloud.init({ traceUser: true })
      this.db = wx.cloud.database()
    }

    this.initBoard()

    if (options && options.roomId) {
      this.switchToOnline()
      this.setData({ roomInput: options.roomId })
      this.joinRoom()
    }
  },

  onUnload() {
    if (this.unwatch) this.unwatch.close()
  },

  onShareAppMessage() {
    const { mode, roomId } = this.data
    if (mode === 'online' && roomId) {
      return {
        title: '来一局五子棋对战！',
        path: `/pages/gomoku/index?roomId=${roomId}`
      }
    }
    return {
      title: '怀古五子棋，来试试！',
      path: '/pages/gomoku/index'
    }
  },

  updateTexts() {
    const roleText = this.data.role === 1 ? '黑子(房主)' : this.data.role === 2 ? '白子(挑战者)' : '观战'
    const turnText = this.data.turn === 1 ? '黑子' : '白子'
    this.setData({ roleText, turnText })
  },

  initBoard() {
    this.setData({
      cells: new Array(SIZE * SIZE).fill(0),
      turn: 1,
      status: 'playing',
      statusText: this.data.mode === 'single' ? '人机对战：你执黑先手' : '联机模式：等待对手'
    }, () => this.updateTexts())
  },

  switchToSingle() {
    if (this.unwatch) this.unwatch.close()
    this.unwatch = null
    this.setData({ mode: 'single', roomId: '', roomInput: '', role: 0 }, () => {
      this.initBoard()
    })
  },

  setDifficulty(e) {
    const level = e.currentTarget.dataset.level
    if (!level || level === this.data.difficulty) return
    this.setData({ difficulty: level })
    const textMap = {
      easy: '人机对战（简单）：你执黑先手',
      normal: '人机对战（普通）：你执黑先手',
      hard: '人机对战（困难）：你执黑先手'
    }
    if (this.data.mode === 'single') {
      this.setData({ statusText: textMap[level] || textMap.normal })
    }
  },

  switchToOnline() {
    this.setData({ mode: 'online', role: 0, statusText: '联机模式：请创建或加入房间' }, () => {
      this.initBoard()
    })
  },

  onRoomInput(e) {
    this.setData({ roomInput: e.detail.value.trim() })
  },

  async createRoom() {
    if (!this.db) return wx.showToast({ title: '请开通云开发', icon: 'none' })
    if (this.data.mode !== 'online') this.switchToOnline()

    const cells = new Array(SIZE * SIZE).fill(0)
    const res = await this.db.collection('gomoku_rooms').add({
      data: {
        board: cells,
        turn: 1,
        status: 'playing',
        hostId: this.uid,
        guestId: '',
        updatedAt: Date.now()
      }
    })
    this.setData({ roomId: res._id, role: 1, statusText: '房间已创建，点击分享邀请好友' }, () => this.updateTexts())
    this.watchRoom(res._id)
    wx.showToast({ title: '已创建，可点右上角分享', icon: 'none' })
  },

  async joinRoom() {
    if (!this.db) return wx.showToast({ title: '请开通云开发', icon: 'none' })
    if (this.data.mode !== 'online') this.switchToOnline()

    const roomId = this.data.roomInput
    if (!roomId) return wx.showToast({ title: '请输入房间号', icon: 'none' })

    const room = await this.db.collection('gomoku_rooms').doc(roomId).get().catch(() => null)
    if (!room || !room.data) return wx.showToast({ title: '房间不存在', icon: 'none' })

    if (room.data.hostId === this.uid) {
      this.setData({ roomId, role: 1, statusText: '你是房主，等待好友加入' }, () => this.updateTexts())
      this.watchRoom(roomId)
      return
    }

    if (room.data.guestId && room.data.guestId !== this.uid) {
      return wx.showToast({ title: '房间已满', icon: 'none' })
    }

    await this.db.collection('gomoku_rooms').doc(roomId).update({
      data: { guestId: this.uid, updatedAt: Date.now() }
    })
    this.setData({ roomId, role: 2, statusText: '已加入对战，白子后手' }, () => this.updateTexts())
    this.watchRoom(roomId)
  },

  leaveRoom() {
    if (this.unwatch) this.unwatch.close()
    this.unwatch = null
    this.switchToSingle()
  },

  watchRoom(roomId) {
    if (this.unwatch) this.unwatch.close()
    this.unwatch = this.db.collection('gomoku_rooms').doc(roomId).watch({
      onChange: snap => {
        if (!snap.docs || !snap.docs[0]) return
        const d = snap.docs[0]
        this.setData({ cells: d.board, turn: d.turn, status: d.status }, () => this.updateTexts())
        if (d.status === 'win_black') this.setData({ statusText: '对局结束：黑子胜' })
        if (d.status === 'win_white') this.setData({ statusText: '对局结束：白子胜' })
      },
      onError: () => wx.showToast({ title: '同步中断', icon: 'none' })
    })
  },

  async tapCell(e) {
    if (this.data.mode === 'single') {
      this.tapSingle(e)
      return
    }
    await this.tapOnline(e)
  },

  tapSingle(e) {
    const { status, turn } = this.data
    if (status !== 'playing' || turn !== 1) return

    const idx = Number(e.currentTarget.dataset.index)
    const cells = [...this.data.cells]
    if (cells[idx] !== 0) return

    cells[idx] = 1
    if (this.checkWin(cells, idx, 1)) {
      this.setData({ cells, status: 'win_black', statusText: '你赢了！' })
      return
    }

    const aiIdx = this.pickAiMove(cells)
    if (aiIdx === -1) {
      this.setData({ cells, status: 'draw', statusText: '平局' })
      return
    }

    cells[aiIdx] = 2
    if (this.checkWin(cells, aiIdx, 2)) {
      this.setData({ cells, status: 'win_white', statusText: '电脑获胜，再来一局吧' })
      return
    }

    this.setData({ cells, turn: 1, statusText: '人机对战：轮到你落子' })
  },

  pickAiMove(cells) {
    const empties = []
    for (let i = 0; i < cells.length; i++) if (cells[i] === 0) empties.push(i)
    if (!empties.length) return -1

    const center = Math.floor(SIZE / 2)
    const { defendWeight, nearWeight, centerWeight, randomTopN, randomChance } = this.getDifficultyConfig()
    let bestIdx = empties[0]
    let bestScore = -1
    const scored = []

    for (const idx of empties) {
      const x = idx % SIZE
      const y = Math.floor(idx / SIZE)

      // 优先考虑已有棋子附近，避免无意义的远点落子
      const nearBonus = this.hasNeighbor(cells, x, y, 2) ? nearWeight : 0
      const centerBonus = (20 - (Math.abs(x - center) + Math.abs(y - center))) * centerWeight

      // 进攻分：白棋尝试形成连子
      const attackScore = this.evaluatePoint(cells, x, y, 2)
      // 防守分：黑棋威胁更高，防守权重更大
      const defendScore = this.evaluatePoint(cells, x, y, 1) * defendWeight

      // 若该点能直接成五，给最高优先级
      const winNow = this.willWinAt(cells, idx, 2) ? 100000 : 0
      // 若黑棋下一手可成五，必须强力拦截
      const blockNow = this.willWinAt(cells, idx, 1) ? 90000 : 0

      const score = winNow + blockNow + attackScore + defendScore + nearBonus + centerBonus
      scored.push({ idx, score })
      if (score > bestScore) {
        bestScore = score
        bestIdx = idx
      }
    }

    if (randomTopN > 1 && Math.random() < randomChance) {
      scored.sort((a, b) => b.score - a.score)
      const top = scored.slice(0, Math.min(randomTopN, scored.length))
      return top[Math.floor(Math.random() * top.length)].idx
    }
    return bestIdx
  },

  getDifficultyConfig() {
    const level = this.data.difficulty
    if (level === 'easy') {
      return {
        defendWeight: 0.95,
        nearWeight: 55,
        centerWeight: 0.6,
        randomTopN: 4,
        randomChance: 0.45
      }
    }
    if (level === 'hard') {
      return {
        defendWeight: 1.45,
        nearWeight: 95,
        centerWeight: 1.1,
        randomTopN: 1,
        randomChance: 0
      }
    }
    return {
      defendWeight: 1.2,
      nearWeight: 80,
      centerWeight: 0.9,
      randomTopN: 2,
      randomChance: 0.15
    }
  },

  hasNeighbor(cells, x, y, dist) {
    for (let dy = -dist; dy <= dist; dy++) {
      for (let dx = -dist; dx <= dist; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue
        if (cells[ny * SIZE + nx] !== 0) return true
      }
    }
    return false
  },

  willWinAt(cells, idx, role) {
    const copy = [...cells]
    copy[idx] = role
    return this.checkWin(copy, idx, role)
  },

  evaluatePoint(cells, x, y, role) {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]]
    let total = 0
    for (const [dx, dy] of dirs) {
      const line = this.lineInfo(cells, x, y, dx, dy, role)
      total += this.patternScore(line.count, line.openEnds)
    }
    return total
  },

  lineInfo(cells, x, y, dx, dy, role) {
    let count = 1
    let openEnds = 0

    let nx = x + dx
    let ny = y + dy
    while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && cells[ny * SIZE + nx] === role) {
      count++
      nx += dx
      ny += dy
    }
    if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && cells[ny * SIZE + nx] === 0) openEnds++

    nx = x - dx
    ny = y - dy
    while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && cells[ny * SIZE + nx] === role) {
      count++
      nx -= dx
      ny -= dy
    }
    if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && cells[ny * SIZE + nx] === 0) openEnds++

    return { count, openEnds }
  },

  patternScore(count, openEnds) {
    if (count >= 5) return 50000
    if (count === 4 && openEnds === 2) return 12000
    if (count === 4 && openEnds === 1) return 4000
    if (count === 3 && openEnds === 2) return 1800
    if (count === 3 && openEnds === 1) return 500
    if (count === 2 && openEnds === 2) return 220
    if (count === 2 && openEnds === 1) return 80
    if (count === 1 && openEnds === 2) return 30
    return 5
  },

  async tapOnline(e) {
    const { roomId, role, turn, status } = this.data
    if (!roomId || status !== 'playing') return
    if (role !== turn) return

    const idx = Number(e.currentTarget.dataset.index)
    const cells = [...this.data.cells]
    if (cells[idx] !== 0) return

    cells[idx] = role
    const winner = this.checkWin(cells, idx, role)

    await this.db.collection('gomoku_rooms').doc(roomId).update({
      data: {
        board: cells,
        turn: role === 1 ? 2 : 1,
        status: winner ? (role === 1 ? 'win_black' : 'win_white') : 'playing',
        updatedAt: Date.now()
      }
    })
  },

  checkWin(cells, idx, role) {
    const x = idx % SIZE
    const y = Math.floor(idx / SIZE)
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]]

    for (const [dx, dy] of dirs) {
      let count = 1
      count += this.countDir(cells, x, y, dx, dy, role)
      count += this.countDir(cells, x, y, -dx, -dy, role)
      if (count >= 5) return true
    }
    return false
  },

  countDir(cells, x, y, dx, dy, role) {
    let c = 0
    let nx = x + dx
    let ny = y + dy
    while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && cells[ny * SIZE + nx] === role) {
      c += 1
      nx += dx
      ny += dy
    }
    return c
  },

  async resetBoard() {
    if (this.data.mode === 'single') {
      this.initBoard()
      return
    }

    if (!this.data.roomId || this.data.role !== 1) return
    const cells = new Array(SIZE * SIZE).fill(0)
    await this.db.collection('gomoku_rooms').doc(this.data.roomId).update({
      data: { board: cells, turn: 1, status: 'playing', updatedAt: Date.now() }
    })
    this.setData({ statusText: '已重置，黑子先手' })
  }
})
