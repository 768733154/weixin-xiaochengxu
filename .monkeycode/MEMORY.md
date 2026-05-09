# 用户指令记忆

本文件记录了用户的指令、偏好和教导，用于在未来的交互中提供参考。

## 格式

### 用户指令条目
用户指令条目应遵循以下格式：

[用户指令摘要]
- Date: [YYYY-MM-DD]
- Context: [提及的场景或时间]
- Instructions:
  - [用户教导或指示的内容，逐行描述]

### 项目知识条目
Agent 在任务执行过程中发现的条目应遵循以下格式：

[项目知识摘要]
- Date: [YYYY-MM-DD]
- Context: Agent 在执行 [具体任务描述] 时发现
- Category: [代码结构|代码模式|代码生成|构建方法|测试方法|依赖关系|环境配置]
- Instructions:
  - [具体的知识点，逐行描述]

## 去重策略
- 添加新条目前，检查是否存在相似或相同的指令
- 若发现重复，跳过新条目或与已有条目合并
- 合并时，更新上下文或日期信息
- 这有助于避免冗余条目，保持记忆文件整洁

## 条目

[微信小程序项目基础结构]
- Date: 2026-05-09
- Context: Agent 在执行项目概况分析时发现
- Category: 代码结构
- Instructions:
  - 项目是原生微信小程序，不是 Web 或 Node.js 项目。
  - 入口配置在 `app.json`，全局初始化在 `app.js`。
  - 主要页面位于 `pages/home`、`pages/tetris`、`pages/snake`、`pages/gomoku`、`pages/game2048`。

[微信开发者工具运行方式]
- Date: 2026-05-09
- Context: Agent 在执行项目概况分析时发现
- Category: 构建方法
- Instructions:
  - 该项目通过微信开发者工具导入和预览。
  - `project.config.json` 的 `compileType` 为 `miniprogram`。

[云开发依赖]
- Date: 2026-05-09
- Context: Agent 在执行项目概况分析时发现
- Category: 依赖关系
- Instructions:
  - `app.js` 在启动时调用 `wx.cloud.init`，项目依赖微信云开发能力。
  - README 指出五子棋联机功能依赖云开发数据库集合 `gomoku_rooms`。

[小程序样式兼容偏好]
- Date: 2026-05-09
- Context: Agent 在执行贪吃蛇页面现代化改造时发现
- Category: 代码模式
- Instructions:
  - 原生小程序样式应优先使用兼容性更稳的写法，避免依赖 `aspect-ratio` 这类兼容性不稳定的能力。
  - 棋盘类等比方块可优先使用 `padding-top: 100%` 的方式实现。

[小游戏首页路由约定]
- Date: 2026-05-09
- Context: Agent 在执行猜灯谜闯关接入时发现
- Category: 代码结构
- Instructions:
  - 首页入口位于 `pages/home/index.wxml`。
  - 新增小游戏页面后，需要同时在 `app.json` 注册页面，并在首页增加 `navigator` 入口。

[猜灯谜玩法规则]
- Date: 2026-05-09
- Context: 用户在调整猜灯谜闯关玩法时提出
- Instructions:
  - 猜灯谜模式中，答错直接失败，不再允许继续下一关。
  - 需要增加通关奖励页。
  - 需要增加排行榜或最高通关记录。

[闯关小游戏实现模式]
- Date: 2026-05-09
- Context: Agent 在新增古诗词闯关页面时发现
- Category: 代码模式
- Instructions:
  - 闯关类小游戏使用独立题库文件，页面内负责随机抽取 50 题并处理闯关逻辑。
  - 结算页 `pages/lantern-result/index` 可复用于不同闯关游戏，通过 `mode` 参数切换本地存储键和奖励文案。

[小游戏隔离实现要求]
- Date: 2026-05-09
- Context: 用户在约束闯关游戏实现方式时提出
- Instructions:
  - 不要把不同游戏抽成通用模板。
  - 每个游戏都保持单独逻辑，互不影响。

[动作类闯关实现约定]
- Date: 2026-05-09
- Context: Agent 在新增见缝插针小游戏时发现
- Category: 代码模式
- Instructions:
  - 动作类小游戏也保持独立页面逻辑，不与答题类游戏共享模板。
  - 见缝插针使用独立关卡参数递增难度，包括旋转速度、初始障碍针数量和待发射针数量。
