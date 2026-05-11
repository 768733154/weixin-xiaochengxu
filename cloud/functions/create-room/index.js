const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { gameId, type = 'friend' } = event

  if (!gameId) return { error: 'missing gameId' }

  const res = await db.collection('rooms').add({
    data: {
      gameId,
      type,
      status: 'waiting',
      hostId: OPENID,
      guestId: '',
      gameState: {},
      turn: 1,
      result: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  })

  return { roomId: res._id }
}
