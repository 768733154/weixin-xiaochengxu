const W = 10
const H = 20
const SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]]
]

function clone2d(a) { return a.map(r => [...r]) }
function rot(m) { return m[0].map((_, i) => m.map(r => r[i]).reverse()) }

module.exports = {
  W, H, SHAPES,

  createGrid() {
    return Array.from({ length: H }, () => Array(W).fill(0))
  },

  spawn() {
    return { shape: clone2d(SHAPES[Math.floor(Math.random() * SHAPES.length)]), x: 3, y: 0 }
  },

  collide(grid, x, y, shape) {
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (!shape[i][j]) continue
        const nx = x + j, ny = y + i
        if (nx < 0 || nx >= W || ny >= H) return true
        if (ny >= 0 && grid[ny][nx]) return true
      }
    }
    return false
  },

  merge(grid, cur) {
    const { x, y, shape } = cur
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) grid[y + i][x + j] = 1
      }
    }
  },

  clearLines(grid) {
    let cleared = 0
    const newGrid = grid.filter(row => {
      if (row.every(v => v)) { cleared += 1; return false }
      return true
    })
    while (newGrid.length < H) newGrid.unshift(Array(W).fill(0))
    return { grid: newGrid, cleared }
  },

  rotate(shape) {
    return rot(shape)
  },

  render(grid, cur) {
    const board = grid.map(r => [...r])
    if (cur) {
      const { x, y, shape } = cur
      for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
          if (shape[i][j] && y + i >= 0 && y + i < H && x + j >= 0 && x + j < W) board[y + i][x + j] = 1
        }
      }
    }
    return board.flat()
  }
}
