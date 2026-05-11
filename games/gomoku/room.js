const matchService = require('../../core/match')
const storage = require('../../core/storage')

module.exports = {
  /**
   * 创建五子棋房间
   */
  async createRoom() {
    const roomId = await matchService.createRoom('gomoku', 'friend')
    return roomId
  },

  /**
   * 加入房间
   */
  async joinRoom(roomId) {
    return await matchService.joinRoom(roomId)
  },

  /**
   * 离开房间
   */
  async leaveRoom(roomId) {
    return await matchService.leaveRoom(roomId)
  },

  /**
   * 随机匹配
   */
  async randomMatch() {
    return await matchService.randomMatch('gomoku')
  },

  /**
   * 监听房间
   */
  watchRoom(roomId, onChange, onError) {
    return matchService.watchRoom(roomId, onChange, onError)
  },

  /**
   * 更新房间棋盘状态
   */
  async updateBoard(roomId, cells, turn, status) {
    const gameState = { cells, turn }
    const extra = {}
    if (status) extra.status = status
    if (status === 'win_black' || status === 'win_white' || status === 'draw') {
      extra.result = status
    }
    await matchService.updateGameState(roomId, gameState, extra)
  },

  /**
   * 重置房间棋盘
   */
  async resetBoard(roomId) {
    const engine = require('./engine')
    const cells = engine.createBoard()
    await matchService.updateGameState(roomId, { cells, turn: 1 }, { status: 'playing' })
  }
}
