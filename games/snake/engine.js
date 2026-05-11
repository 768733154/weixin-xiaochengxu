const SIZE = 16

module.exports = {
  SIZE,

  createInitialState() {
    return {
      snake: [{ x: 8, y: 8 }, { x: 7, y: 8 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: null,
      score: 0,
      speed: 300
    }
  },

  randomFood(snake) {
    let tries = 0
    while (tries < 1000) {
      const p = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) }
      if (!snake.some(s => s.x === p.x && s.y === p.y)) return p
      tries++
    }
    return { x: 0, y: 0 }
  },

  tick(state) {
    const s = { ...state, dir: { ...state.nextDir }, snake: state.snake.map(p => ({ ...p })) }
    const head = s.snake[0]
    const next = { x: head.x + s.dir.x, y: head.y + s.dir.y }

    // 碰撞检测
    if (next.x < 0 || next.x >= SIZE || next.y < 0 || next.y >= SIZE ||
        s.snake.some(seg => seg.x === next.x && seg.y === next.y)) {
      return { state: s, gameOver: true }
    }

    s.snake.unshift(next)

    if (next.x === s.food.x && next.y === s.food.y) {
      s.score += 1
      s.food = this.randomFood(s.snake)
    } else {
      s.snake.pop()
    }

    return { state: s, gameOver: false }
  },

  setDirection(state, x, y) {
    if (x + state.dir.x === 0 && y + state.dir.y === 0) return state
    return { ...state, nextDir: { x, y } }
  },

  render(state) {
    const cells = new Array(SIZE * SIZE).fill('')
    state.snake.forEach((s, i) => { cells[s.y * SIZE + s.x] = i === 0 ? 'head' : 'snake' })
    cells[state.food.y * SIZE + state.food.x] = 'food'
    return cells
  }
}
