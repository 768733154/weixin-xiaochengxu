/**
 * 手势识别模块
 * 识别上下左右滑动，供贪吃蛇/2048等方向控制类游戏复用
 */
module.exports = {
  bindSwipe(page, selector, onSwipe) {
    let sx = 0, sy = 0

    const touchStart = e => {
      const t = e.touches[0]
      sx = t.clientX
      sy = t.clientY
    }

    const touchEnd = e => {
      const t = e.changedTouches[0]
      const dx = t.clientX - sx
      const dy = t.clientY - sy
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (Math.max(absDx, absDy) < 20) return
      if (absDx > absDy) {
        onSwipe(dx > 0 ? 'right' : 'left')
      } else {
        onSwipe(dy > 0 ? 'down' : 'up')
      }
    }

    // 绑定到页面实例
    page._swipeHandlers = { touchStart, touchEnd }
    return { touchStart, touchEnd }
  },

  /**
   * 在 WXML 中使用 bindtouchstart/bindtouchend 绑定
   * <view bindtouchstart="{{swipeTouchStart}}" bindtouchend="{{swipeTouchEnd}}">
   */
  createHandlers(onSwipe) {
    let sx = 0, sy = 0
    return {
      swipeTouchStart(e) {
        const t = e.touches[0]
        sx = t.clientX; sy = t.clientY
      },
      swipeTouchEnd(e) {
        const t = e.changedTouches[0]
        const dx = t.clientX - sx
        const dy = t.clientY - sy
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
        if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left')
        else onSwipe(dy > 0 ? 'down' : 'up')
      }
    }
  }
}
