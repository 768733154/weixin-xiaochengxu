const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { roomId } = event

  if (!roomId) return { error: 'missing roomId' }

  const roomRes = await db.collection('rooms').doc(roomId).get().catch(() => null)
  if (!roomRes || !roomRes.data) return { error: '房间不存在' }

  const room = roomRes.data

  // 房主重连
  if (room.hostId === OPENID) {
    return { role: 'host', room }
  }

  // 房间已满
  if (room.status !== 'waiting') {
    return { error: '房间已满或已开始' }
  }

  // 加入房间
  await db.collection('rooms').doc(roomId).update({
    data: {
      guestId: OPENID,
      status: 'playing',
      updatedAt: Date.now()
    }
  })

  return { role: 'guest', roomId }
}
