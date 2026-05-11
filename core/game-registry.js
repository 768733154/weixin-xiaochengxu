const tetris = require('../games/tetris/manifest')
const snake = require('../games/snake/manifest')
const gomoku = require('../games/gomoku/manifest')
const game2048 = require('../games/game2048/manifest')
const quiz = require('../games/quiz/manifest')

const games = [tetris, snake, gomoku, game2048, quiz]

module.exports = {
  getAll() {
    return games
  },

  getById(id) {
    return games.find(g => g.id === id) || null
  },

  getByCategory(category) {
    return games.filter(g => g.category === category)
  },

  getPvPGames() {
    return games.filter(g => g.category === 'pvp')
  },

  getSingleGames() {
    return games.filter(g => g.category === 'single')
  }
}
