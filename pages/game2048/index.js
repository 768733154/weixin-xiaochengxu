function emptyBoard() { return Array.from({ length: 4 }, () => Array(4).fill(0)) }

Page({
  data: { cells: [], score: 0 },
  onLoad() { this.reset() },
  reset() {
    this.board = emptyBoard()
    this.score = 0
    this.add(); this.add();
    this.sync()
  },
  add() {
    const empties = []
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!this.board[y][x]) empties.push([x, y])
    if (!empties.length) return
    const [x, y] = empties[Math.floor(Math.random() * empties.length)]
    this.board[y][x] = Math.random() < 0.9 ? 2 : 4
  },
  line(arr) {
    const a = arr.filter(Boolean)
    for (let i = 0; i < a.length - 1; i++) {
      if (a[i] === a[i + 1]) { a[i] *= 2; this.score += a[i]; a[i + 1] = 0 }
    }
    return a.filter(Boolean).concat(Array(4 - a.filter(Boolean).length).fill(0))
  },
  moveLeft() {
    const old = JSON.stringify(this.board)
    this.board = this.board.map(r => this.line(r))
    if (JSON.stringify(this.board) !== old) this.add()
    this.sync()
  },
  moveRight() {
    const old = JSON.stringify(this.board)
    this.board = this.board.map(r => this.line([...r].reverse()).reverse())
    if (JSON.stringify(this.board) !== old) this.add()
    this.sync()
  },
  moveUp() {
    const old = JSON.stringify(this.board)
    for (let x = 0; x < 4; x++) {
      const col = [this.board[0][x], this.board[1][x], this.board[2][x], this.board[3][x]]
      const n = this.line(col)
      for (let y = 0; y < 4; y++) this.board[y][x] = n[y]
    }
    if (JSON.stringify(this.board) !== old) this.add()
    this.sync()
  },
  moveDown() {
    const old = JSON.stringify(this.board)
    for (let x = 0; x < 4; x++) {
      const col = [this.board[0][x], this.board[1][x], this.board[2][x], this.board[3][x]].reverse()
      const n = this.line(col).reverse()
      for (let y = 0; y < 4; y++) this.board[y][x] = n[y]
    }
    if (JSON.stringify(this.board) !== old) this.add()
    this.sync()
  },
  up() { this.moveUp() }, down() { this.moveDown() }, left() { this.moveLeft() }, right() { this.moveRight() },
  sync() {
    this.setData({ cells: this.board.flat(), score: this.score })
  }
})
