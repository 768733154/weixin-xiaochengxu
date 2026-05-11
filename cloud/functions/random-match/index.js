const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { gameId } = event

  if (!gameId) return { error: 'missing gameId' }

  const now = Date.now()

  // 清理过期匹配记录
  await db.collection('matching_pool')
    .where({ expireAt: _.lt(now) })
    .remove()

  // 查找等待中的同游戏玩家
  const waiting = await db.collection('matching_pool')
    .where({
      gameId,
      userId: _.neq(OPENID),
      expireAt: _.gt(now)
    })
    .limit(1)
    .get()

  if (waiting.data.length > 0) {
    // 匹配成功
    const opponent = waiting.data[0]

    // 创建房间
    const roomRes = await db.collection('rooms').add({
      data: {
        gameId,
        type: 'random',
        status: 'playing',
        hostId: opponent.userId,
        guestId: OPENID,
        gameState: {},
        turn: 1,
        result: null,
        createdAt: now,
        updatedAt: now
      }
    })

    // 删除双方的匹配记录
    await db.collection('matching_pool').doc(opponent._id).remove()
    await db.collection('matching_pool').where({ userId: OPENID }).remove()

    return { status: 'matched', roomId: roomRes._id }
  }

  // 无等待者，加入匹配池
  const existing = await db.collection('matching_pool')
    .where({ userId: OPENID, gameId })
    .get()

  if (existing.data.length === 0) {
    await db.collection('matching_pool').add({
      data: {
        userId: OPENID,
        gameId,
        createdAt: now,
        expireAt: now + 30000
      }
    })
  } else {
    // 更新过期时间
    await db.collection('matching_pool').doc(existing.data[0]._id).update({
      data: { expireAt: now + 30000 }
    })
  }

  return { status: 'matching' }
}
