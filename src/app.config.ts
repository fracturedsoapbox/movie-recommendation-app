export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/tags/index',
    'pages/detail/index',
    'pages/mine/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6366f1',
    navigationBarTitleText: '影视推荐',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f8fafc',
    enablePullDownRefresh: true
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#6366f1',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '推荐'
      },
      {
        pagePath: 'pages/tags/index',
        text: '标签'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  },
  style: 'v2',
  sitemapLocation: 'sitemap.json'
})