const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const userRes = await db.collection('users').where({ _openid: OPENID }).get()

  if (userRes.data.length === 0) {
    await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickName: '',
        avatarUrl: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })
  }

  return {
    openid: OPENID,
    userInfo: userRes.data[0] || null
  }
}
