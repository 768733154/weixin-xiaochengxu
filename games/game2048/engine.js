function emptyBoard() { return Array.from({ length: 4 }, () => Array(4).fill(0)) }

module.exports = {
  createBoard: emptyBoard,

  addRandom(board) {
    const empties = []
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!board[y][x]) empties.push([x, y])
    if (!empties.length) return board
    const [x, y] = empties[Math.floor(Math.random() * empties.length)]
    const newBoard = board.map(r => [...r])
    newBoard[y][x] = Math.random() < 0.9 ? 2 : 4
    return newBoard
  },

  line(arr) {
    const a = arr.filter(Boolean)
    let score = 0
    for (let i = 0; i < a.length - 1; i++) {
      if (a[i] === a[i + 1]) { a[i] *= 2; score += a[i]; a[i + 1] = 0 }
    }
    return { result: a.filter(Boolean).concat(Array(4 - a.filter(Boolean).length).fill(0)), score }
  },

  move(board, direction) {
    let newBoard = board.map(r => [...r])
    let totalScore = 0
    let moved = false

    if (direction === 'left') {
      newBoard = newBoard.map(r => {
        const { result, score } = this.line(r)
        totalScore += score
        return result
      })
    } else if (direction === 'right') {
      newBoard = newBoard.map(r => {
        const { result, score } = this.line([...r].reverse())
        totalScore += score
        return result.reverse()
      })
    } else if (direction === 'up') {
      for (let x = 0; x < 4; x++) {
        const col = [newBoard[0][x], newBoard[1][x], newBoard[2][x], newBoard[3][x]]
        const { result, score } = this.line(col)
        totalScore += score
        for (let y = 0; y < 4; y++) newBoard[y][x] = result[y]
      }
    } else if (direction === 'down') {
      for (let x = 0; x < 4; x++) {
        const col = [newBoard[0][x], newBoard[1][x], newBoard[2][x], newBoard[3][x]].reverse()
        const { result, score } = this.line(col)
        totalScore += score
        const rev = result.reverse()
        for (let y = 0; y < 4; y++) newBoard[y][x] = rev[y]
      }
    }

    moved = JSON.stringify(newBoard) !== JSON.stringify(board)
    return { board: newBoard, score: totalScore, moved }
  },

  isGameOver(board) {
    // 有空格
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!board[y][x]) return false
    // 有可合并的
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (x < 3 && board[y][x] === board[y][x + 1]) return false
        if (y < 3 && board[y][x] === board[y + 1][x]) return false
      }
    }
    return true
  }
}
