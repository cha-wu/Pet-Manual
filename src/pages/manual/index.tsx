import { useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface ManualPage {
  num: string
  title: string
  subtitle?: string
  items: { label: string; value: string; emoji?: string }[]
}

const PAGES: ManualPage[] = [
  {
    num: '01',
    title: '身份与证件',
    subtitle: '宠物的基本身份信息',
    items: [
      { label: '名字', value: '小猫', emoji: '🐱' },
      { label: '物种', value: '英短蓝猫', emoji: '🐾' },
      { label: '性别', value: '母', emoji: '♀' },
      { label: '出生', value: '2024年3月', emoji: '🎂' },
      { label: '芯片号', value: 'CN2024XXXXX', emoji: '📟' },
    ],
  },
  {
    num: '02',
    title: '个性说明书',
    subtitle: '了解 TA 的小脾气',
    items: [
      { label: '性格', value: '温顺粘人，偶尔高冷', emoji: '😊' },
      { label: '爱好', value: '晒太阳、追毛球', emoji: '☀️' },
      { label: '怕什么', value: '吸尘器、吹风机', emoji: '😨' },
      { label: '小习惯', value: '喜欢趴在窗台看鸟', emoji: '🐦' },
      { label: '小秘密', value: '偷喝过水龙头的水', emoji: '🤫' },
    ],
  },
  {
    num: '03',
    title: '健康档案',
    subtitle: '守护 TA 的每一天',
    items: [
      { label: '体重', value: '4.2kg', emoji: '⚖️' },
      { label: '疫苗', value: '猫三联已完成', emoji: '💉' },
      { label: '驱虫', value: '体外8/14，体内6/20', emoji: '🛡️' },
      { label: '绝育', value: '已绝育', emoji: '✂️' },
      { label: '体检', value: '2026/7/10 一切正常', emoji: '📋' },
    ],
  },
  {
    num: '04',
    title: '生日纪念',
    subtitle: '重要的日子',
    items: [
      { label: '出生日期', value: '2024年3月15日', emoji: '🎂' },
      { label: '到家日期', value: '2024年5月1日', emoji: '🏠' },
      { label: '满月', value: '2024年4月15日', emoji: '🌙' },
      { label: '一岁', value: '2025年3月15日', emoji: '🎉' },
    ],
  },
  {
    num: '05',
    title: '成长记录',
    subtitle: '点滴成长，都是回忆',
    items: [
      { label: '学会用猫砂', value: '2024年4月', emoji: '🚽' },
      { label: '第一次洗澡', value: '2024年6月', emoji: '🛁' },
      { label: '第一次驱虫', value: '2024年5月', emoji: '💊' },
      { label: '打完疫苗', value: '2024年8月', emoji: '💉' },
      { label: '绝育手术', value: '2025年1月', emoji: '🏥' },
    ],
  },
]

export default function ManualPage() {
  const [currentPage, setCurrentPage] = useState(0)
  const [showTOC, setShowTOC] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const goToPage = useCallback((page: number) => {
    const max = PAGES.length
    setCurrentPage(prev => Math.max(0, Math.min(max, page)))
  }, [])

  const handleTouchStart = useCallback((e: any) => {
    setTouchStartX(e.touches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback((e: any) => {
    if (touchStartX === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX
    setTouchStartX(null)
    if (Math.abs(deltaX) > 48) {
      goToPage(currentPage + (deltaX < 0 ? 1 : -1))
    }
  }, [touchStartX, currentPage, goToPage])

  const page = PAGES[currentPage]
  const isCover = currentPage === 0
  const isFirst = currentPage === 0
  const isLast = currentPage === PAGES.length

  return (
    <View className='manual-page'>
      {/* 顶部导航 */}
      <View className='manual-header'>
        <View className='manual-header-btn' onClick={() => goToPage(currentPage - 1)}>
          ‹
        </View>
        <Text className='manual-title'>宠物档案</Text>
        <View className='manual-capsule'>
          <Text className='capsule-more'>•••</Text>
          <View className='capsule-divider' />
          <View className='capsule-mark' />
        </View>
      </View>

      {/* 书本容器 */}
      <View
        className='book-container'
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isCover ? (
          /* 封面 */
          <View className='book-cover'>
            <View className='cover-spine' />
            <View className='cover-content'>
              <Text className='cover-emoji'>🐱</Text>
              <Text className='cover-title'>小猫的成长小册</Text>
              <Text className='cover-subtitle'>小小一团，却把整个家都装进了心里。</Text>
              <View className='cover-meta'>
                <Text className='cover-meta-item'>英短蓝猫 · 母</Text>
                <Text className='cover-meta-item'>2024年3月出生</Text>
              </View>
              <View className='cover-TOC-btn' onClick={() => setShowTOC(true)}>
                📋 目录
              </View>
              <View className='cover-page-hint'>左滑翻页 →</View>
            </View>
            <View className='cover-spine-r' />
          </View>
        ) : isLast ? (
          /* 封底 */
          <View className='book-back-cover'>
            <Text className='back-emoji'>📖</Text>
            <Text className='back-title'>成长还在继续...</Text>
            <Text className='back-sub'>更多内容敬请期待</Text>
            <View className='back-restart' onClick={() => goToPage(0)}>
              回到封面
            </View>
          </View>
        ) : (
          /* 内容页 */
          <View className='book-page'>
            <View className='page-num'>{page.num}</View>
            <View className='page-content'>
              <Text className='page-title'>{page.title}</Text>
              {page.subtitle && <Text className='page-subtitle'>{page.subtitle}</Text>}
              <View className='page-divider' />
              <View className='page-items'>
                {page.items.map((item, i) => (
                  <View key={i} className='page-item'>
                    <View className='item-emoji'>{item.emoji}</View>
                    <View className='item-text'>
                      <Text className='item-label'>{item.label}</Text>
                      <Text className='item-value'>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <View className='page-footer'>
              <View className='page-nav prev' onClick={() => goToPage(currentPage - 1)}>‹ 上一页</View>
              <Text className='page-indicator'>{currentPage} / {PAGES.length}</Text>
              <View className='page-nav next' onClick={() => goToPage(currentPage + 1)}>下一页 ›</View>
            </View>
          </View>
        )}
      </View>

      {/* 目录弹层 */}
      {showTOC && (
        <View className='toc-overlay' onClick={() => setShowTOC(false)}>
          <View className='toc-sheet' onClick={(e) => e.stopPropagation()}>
            <View className='toc-handle' />
            <View className='toc-head'>
              <Text className='toc-title'>目录</Text>
              <Text className='toc-sub'>小猫的成长小册 · 共 {PAGES.length + 1} 页</Text>
              <View className='toc-close' onClick={() => setShowTOC(false)}>×</View>
            </View>
            <ScrollView className='toc-list' scrollY>
              <View
                className={`toc-item ${currentPage === 0 ? 'active' : ''}`}
                onClick={() => { goToPage(0); setShowTOC(false) }}
              >
                <Text className='toc-num'>00</Text>
                <Text className='toc-name'>封面</Text>
              </View>
              {PAGES.map((p, i) => (
                <View
                  key={i}
                  className={`toc-item ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => { goToPage(i + 1); setShowTOC(false) }}
                >
                  <Text className='toc-num'>{p.num}</Text>
                  <Text className='toc-name'>{p.title}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}
