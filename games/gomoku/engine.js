const SIZE = 15

module.exports = {
  SIZE,

  createBoard() {
    return new Array(SIZE * SIZE).fill(0)
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

  willWinAt(cells, idx, role) {
    const copy = [...cells]
    copy[idx] = role
    return this.checkWin(copy, idx, role)
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

  pickAiMove(cells, difficulty) {
    const empties = []
    for (let i = 0; i < cells.length; i++) if (cells[i] === 0) empties.push(i)
    if (!empties.length) return -1

    const center = Math.floor(SIZE / 2)
    const config = this.getDifficultyConfig(difficulty)
    let bestIdx = empties[0]
    let bestScore = -1
    const scored = []

    for (const idx of empties) {
      const x = idx % SIZE
      const y = Math.floor(idx / SIZE)

      const nearBonus = this.hasNeighbor(cells, x, y, 2) ? config.nearWeight : 0
      const centerBonus = (20 - (Math.abs(x - center) + Math.abs(y - center))) * config.centerWeight

      const attackScore = this.evaluatePoint(cells, x, y, 2)
      const defendScore = this.evaluatePoint(cells, x, y, 1) * config.defendWeight

      const winNow = this.willWinAt(cells, idx, 2) ? 100000 : 0
      const blockNow = this.willWinAt(cells, idx, 1) ? 90000 : 0

      const score = winNow + blockNow + attackScore + defendScore + nearBonus + centerBonus
      scored.push({ idx, score })
      if (score > bestScore) {
        bestScore = score
        bestIdx = idx
      }
    }

    if (config.randomTopN > 1 && Math.random() < config.randomChance) {
      scored.sort((a, b) => b.score - a.score)
      const top = scored.slice(0, Math.min(config.randomTopN, scored.length))
      return top[Math.floor(Math.random() * top.length)].idx
    }
    return bestIdx
  },

  getDifficultyConfig(level) {
    if (level === 'easy') {
      return { defendWeight: 0.95, nearWeight: 55, centerWeight: 0.6, randomTopN: 4, randomChance: 0.45 }
    }
    if (level === 'hard') {
      return { defendWeight: 1.45, nearWeight: 95, centerWeight: 1.1, randomTopN: 1, randomChance: 0 }
    }
    return { defendWeight: 1.2, nearWeight: 80, centerWeight: 0.9, randomTopN: 2, randomChance: 0.15 }
  }
}
