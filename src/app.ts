import { PropsWithChildren } from 'react'
import { useLaunch, loadFontFace } from '@tarojs/taro'
import './app.scss'

// 小程序端没有 index.html，无法用 <link> 引入 Google 字体，
// 用 loadFontFace 补回 H5 端的手写字体（Ma Shan Zheng / ZCOOL KuaiLe）。
// 注意：真机上需把 fonts.gstatic.com 加入 downloadFile 合法域名。
const WEAPP_FONTS: Array<[string, string]> = [
  ['Ma Shan Zheng', 'https://fonts.gstatic.com/s/mashanzheng/v18/NaPecZTRCLxvwo41b4gvzkXaRMQ.ttf'],
  ['ZCOOL KuaiLe', 'https://fonts.gstatic.com/s/zcoolkuaile/v22/tssqApdaRQokwFjFJjvM6h2Wpg.ttf'],
]

function App({ children }: PropsWithChildren<Record<string, unknown>>) {
  useLaunch(() => {
    console.log('宠物小册启动')
    if (process.env.TARO_ENV === 'weapp') {
      WEAPP_FONTS.forEach(([family, url]) => {
        loadFontFace({
          family,
          source: `url("${url}")`,
          global: true,
          fail: (e) => console.warn('字体加载失败:', family, e),
        })
      })
    }
  })

  return children
}

export default App
