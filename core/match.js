const storage = require('./storage')

module.exports = {
  /**
   * 创建对战房间
   */
  async createRoom(gameId, type = 'friend') {
    if (!wx.cloud) return null

    const db = wx.cloud.database()
    const uid = storage.get('local_uid', '')

    const res = await db.collection('rooms').add({
      data: {
        gameId,
        type,
        status: 'waiting',
        hostId: uid,
        guestId: '',
        gameState: {},
        turn: 1,
        result: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })

    return res._id
  },

  /**
   * 加入房间
   */
  async joinRoom(roomId) {
    if (!wx.cloud) return null

    const db = wx.cloud.database()
    const uid = storage.get('local_uid', '')

    const room = await db.collection('rooms').doc(roomId).get().catch(() => null)
    if (!room || !room.data) return { error: '房间不存在' }

    if (room.data.hostId === uid) {
      return { role: 'host', room: room.data }
    }

    if (room.data.status !== 'waiting') {
      return { error: '房间已满或已开始' }
    }

    await db.collection('rooms').doc(roomId).update({
      data: { guestId: uid, status: 'playing', updatedAt: Date.now() }
    })

    return { role: 'guest', room: room.data }
  },

  /**
   * 离开房间
   */
  async leaveRoom(roomId) {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    await db.collection('rooms').doc(roomId).update({
      data: { status: 'abandoned', updatedAt: Date.now() }
    }).catch(() => {})
  },

  /**
   * 随机匹配
   */
  async randomMatch(gameId) {
    if (!wx.cloud) return null

    try {
      const res = await wx.cloud.callFunction({
        name: 'random-match',
        data: { gameId }
      })
      return res.result
    } catch (e) {
      return { status: 'error', message: e.message }
    }
  },

  /**
   * 实时监听房间
   */
  watchRoom(roomId, onChange, onError) {
    if (!wx.cloud) return null

    const db = wx.cloud.database()
    return db.collection('rooms').doc(roomId).watch({
      onChange: snap => {
        if (!snap.docs || !snap.docs[0]) return
        onChange(snap.docs[0])
      },
      onError: err => {
        if (onError) onError(err)
      }
    })
  },

  /**
   * 断线重连
   */
  async reconnect(roomId) {
    if (!wx.cloud) return null

    const room = await this.getRoom(roomId)
    if (!room) return { error: '房间不存在' }

    if (room.status === 'finished' || room.status === 'abandoned') {
      return { status: 'ended', room }
    }

    if (room.status === 'playing') {
      return { status: 'reconnected', room }
    }

    return { status: room.status, room }
  },

  /**
   * 获取房间信息
   */
  async getRoom(roomId) {
    if (!wx.cloud) return null

    const db = wx.cloud.database()
    const res = await db.collection('rooms').doc(roomId).get().catch(() => null)
    return res && res.data ? res.data : null
  },

  /**
   * 更新房间游戏状态
   */
  async updateGameState(roomId, gameState, extra = {}) {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    await db.collection('rooms').doc(roomId).update({
      data: { gameState, updatedAt: Date.now(), ...extra }
    })
  }
}
