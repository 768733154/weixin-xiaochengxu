const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { gameId, score } = event

  if (!gameId || score === undefined) {
    return { error: 'missing params' }
  }

  // 查询历史最高分
  const existing = await db.collection('scores')
    .where({ _openid: OPENID, gameId })
    .get()

  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  const userInfo = userRes.data[0] || {}

  if (existing.data.length === 0) {
    // 新记录
    await db.collection('scores').add({
      data: {
        _openid: OPENID,
        gameId,
        score,
        nickName: userInfo.nickName || '',
        avatarUrl: userInfo.avatarUrl || '',
        updatedAt: Date.now()
      }
    })
    return { updated: true, score }
  }

  // 更新最高分
  const record = existing.data[0]
  if (score > record.score) {
    await db.collection('scores').doc(record._id).update({
      data: {
        score,
        nickName: userInfo.nickName || record.nickName,
        avatarUrl: userInfo.avatarUrl || record.avatarUrl,
        updatedAt: Date.now()
      }
    })
    return { updated: true, score }
  }

  // 分数未提高，仅更新昵称头像
  await db.collection('scores').doc(record._id).update({
    data: {
      nickName: userInfo.nickName || record.nickName,
      avatarUrl: userInfo.avatarUrl || record.avatarUrl,
      updatedAt: Date.now()
    }
  })

  return { updated: false, bestScore: record.score }
}
