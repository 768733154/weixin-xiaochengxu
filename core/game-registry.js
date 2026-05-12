const games = [
  { id: 'tetris',   name: '俄罗斯方块', icon: '🧱', color: '#3d6cf0', path: '/games/tetris/index',   category: 'single', scoreType: 'highest', tags: ['经典', '益智'] },
  { id: 'snake',    name: '贪吃蛇',     icon: '🐍', color: '#3d8b4f', path: '/games/snake/index',    category: 'single', scoreType: 'highest', tags: ['经典', '休闲'] },
  { id: 'gomoku',   name: '五子棋',     icon: '⚫', color: '#7a5834', path: '/games/gomoku/index',   category: 'pvp',    scoreType: 'wins',    tags: ['对战', '棋类'] },
  { id: 'game2048', name: '2048',        icon: '🔢', color: '#b56d35', path: '/games/game2048/index', category: 'single', scoreType: 'highest', tags: ['益智', '数字'] },
  { id: 'quiz',     name: '诗词闯关',   icon: '📜', color: '#6b4c8a', path: '/games/quiz/index',     category: 'single', scoreType: 'highest', tags: ['国学', '闯关'] }
]

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
