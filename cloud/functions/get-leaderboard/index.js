const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { gameId, type = 'global', friendIds = [], limit = 50 } = event

  if (!gameId) return { error: 'missing gameId' }

  if (type === 'global') {
    const res = await db.collection('scores')
      .where({ gameId })
      .orderBy('score', 'desc')
      .limit(limit)
      .get()

    return res.data.map((item, index) => ({
      rank: index + 1,
      userId: item._openid,
      nickName: item.nickName,
      avatarUrl: item.avatarUrl,
      score: item.score
    }))
  }

  if (type === 'friends' && friendIds.length) {
    const res = await db.collection('scores')
      .where({
        gameId,
        _openid: _.in(friendIds)
      })
      .orderBy('score', 'desc')
      .limit(limit)
      .get()

    return res.data.map((item, index) => ({
      rank: index + 1,
      userId: item._openid,
      nickName: item.nickName,
      avatarUrl: item.avatarUrl,
      score: item.score
    }))
  }

  return []
}
