# 基于标签匹配的高分影视推荐+AI趣味影评小程序

## 📋 项目概述

一款基于Taro框架开发的跨端小程序，通过智能标签匹配为用户推荐高分影视作品，并结合AI技术生成趣味性影评，为用户提供个性化的影视推荐体验。

## ✨ 核心功能

### 1. 智能标签匹配
- 用户可选择感兴趣的影视标签（动作、喜剧、科幻、爱情等）
- 系统基于标签推荐匹配的高分影视作品
- 支持多标签组合筛选

### 2. 高分影视推荐
- 整合评分数据，优先推荐8.0分以上的优质影视
- 支持按评分、热度排序
- 个性化推荐算法

### 3. AI趣味影评
- 为每部推荐影视生成个性化、趣味性的AI影评
- 增加阅读娱乐性
- 结合表情符号和生动语言

### 4. 用户体验
- 下拉刷新、上拉加载更多
- 流畅的页面转场动画
- 收藏、浏览历史等个性化功能
- 本地数据持久化

## 🏗️ 技术架构

### 技术栈
- **框架**: Taro 4.1.9（React技术栈）
- **语言**: TypeScript 5.1.0
- **样式**: CSS Modules + SCSS
- **状态管理**: React Context
- **多端支持**: 微信、支付宝、抖音、H5

### 项目结构
```
src/
├── pages/              # 页面文件
│   ├── home/          # 首页推荐
│   ├── tags/          # 标签选择
│   ├── detail/        # 影视详情
│   └── mine/          # 我的
├── components/        # 通用组件
│   ├── MovieCard/     # 影视卡片
│   ├── TagItem/       # 标签项
│   ├── RatingStar/    # 评分星星
│   └── ReviewCard/    # 影评卡片
├── services/          # API服务
│   └── movie.ts       # 影视服务
├── data/              # Mock数据
│   ├── movies.ts      # 影视数据
│   └── tags.ts        # 标签数据
├── types/             # 类型定义
│   ├── movie.ts       # 影视类型
│   ├── tag.ts         # 标签类型
│   └── user.ts        # 用户类型
├── store/             # 状态管理
│   └── useAppStore.ts # 全局状态
├── utils/             # 工具函数
│   ├── storage.ts     # 存储工具
│   └── format.ts      # 格式化工具
└── styles/            # 全局样式
    ├── theme.scss     # 主题变量
    └── variables.scss # 全局变量
```

## 🎨 设计规范

### 配色方案
- **主题色**: #6366f1（现代紫色）
- **辅助色**: #8b5cf6（浅紫色）
- **背景色**: #f8fafc（浅灰蓝）
- **文本色**: #1e293b（深灰蓝）
- **评分色**: #f59e0b（金色）

### 设计原则
- 8px网格系统
- 卡片式设计
- 圆角规范（卡片16rpx，按钮48rpx）
- 阴影层次
- 渐变色运用

## 📱 功能页面

### 1. 首页（推荐）
- 个性化影视推荐列表
- 热门标签快速筛选
- 搜索功能
- 下拉刷新、上拉加载

### 2. 标签页
- 所有标签展示
- 标签选择/取消
- 已选标签管理
- 标签热度排行

### 3. 我的页面
- 用户信息展示
- 收藏列表管理
- 浏览历史记录
- 偏好标签管理
- 设置选项

### 4. 详情页
- 影视基本信息
- 剧情简介
- AI趣味影评
- 收藏/分享功能
- 相关推荐

## 🚀 开发指南

### 环境要求
- Node.js >= 18
- npm >= 8
- Taro CLI >= 4.1.9

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 微信小程序
npm run dev:weapp

# 支付宝小程序
npm run dev:alipay

# 抖音小程序
npm run dev:tt

# H5
npm run dev:h5
```

### 生产构建
```bash
# 微信小程序
npm run build:weapp

# 支付宝小程序
npm run build:alipay

# 抖音小程序
npm run build:tt

# H5
npm run build:h5
```

## 📊 数据说明

### Mock数据
- **影视数据**: 12部高分影视作品（评分8.0+）
- **标签数据**: 15个影视分类标签
- **AI影评**: 每部影视配有趣味性AI生成影评

### 数据持久化
- 用户偏好标签
- 收藏列表
- 浏览历史
- 使用Taro.setStorageSync/getStorageSync

## 🔧 核心特性

### 1. 标签匹配算法
```typescript
// 根据标签筛选影视
const filterMoviesByTags = (movies: Movie[], tags: string[]): Movie[] => {
  if (!tags || tags.length === 0) return movies;
  return movies.filter(movie => 
    movie.tags.some(tag => tags.includes(tag))
  );
};
```

### 2. 智能推荐
```typescript
// 获取高分影视（评分>=8.0）
const getHighRatedMovies = (movies: Movie[], minRating: number = 8.0): Movie[] => {
  return movies.filter(movie => movie.rating >= minRating)
    .sort((a, b) => b.rating - a.rating);
};
```

### 3. 状态管理
```typescript
// 全局状态管理
const { selectedTags, setSelectedTags } = useAppStore();
```

## 🎯 用户体验优化

### 性能优化
- 图片懒加载
- 列表虚拟化
- 防抖节流
- 本地缓存

### 交互优化
- 点击反馈效果
- 加载状态提示
- 空状态处理
- 错误处理
- 平滑动画

### 视觉优化
- 渐变色背景
- 卡片阴影
- 圆角设计
- 间距规范

## 📝 注意事项

1. **图片资源**: 使用picsum.photos作为占位图，实际项目中需替换为真实图片
2. **AI影评**: 当前使用Mock数据，实际项目需接入AI API
3. **数据持久化**: 使用本地存储，实际项目建议接入后端服务
4. **分享功能**: 需配置相应平台的小程序分享权限

## 🔄 后续优化方向

1. **功能扩展**
   - 用户登录注册
   - 影评评论互动
   - 影视评分功能
   - 个人推荐算法优化

2. **技术优化**
   - 接入真实后端API
   - AI影评实时生成
   - 图片CDN加速
   - 性能监控

3. **体验优化**
   - 主题切换
   - 字体大小调节
   - 无障碍支持
   - 多语言支持

## 📄 许可证

MIT License

## 👥 联系方式

如有问题或建议，欢迎反馈。

---

**版本**: 1.0.0  
**更新日期**: 2026-06-22