import { useState, useCallback, useRef } from 'react'
import { View, Text, Textarea, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface Pet { id: string; name: string; info: string }
interface Preset { q: string; a: string }
interface HistoryItem { q: string; petName: string; time: string }

const PETS: Pet[] = [
  { id: 'all', name: '全部动物', info: '不限宠物，通用提问' },
  { id: 'dou', name: '豆豆', info: '金毛 · 公 · 3岁' },
  { id: 'mi', name: '咪咪', info: '英短 · 母 · 2岁' },
  { id: 'tuan', name: '团子', info: '荷兰侏儒兔 · 1岁' },
]

const PRESETS: Preset[] = [
  { q: '豆豆下次疫苗什么时候打？', a: '根据日历记录，豆豆的狂犬疫苗下一次提醒日是2026年8月20日，距今还有6天，到期会自动提醒你。上次接种是2025年8月25日，此次为年度加强针，接种后建议留院观察30分钟。' },
  { q: '咪咪最近驱虫做了吗？', a: '咪咪最近一次体外驱虫是8月14日，记录显示使用的是滴剂，状态良好。体内驱虫上次是6月20日，按每3个月一次的建议，下次体内驱虫应在9月20日左右，届时日历会生成提醒。' },
  { q: '豆豆体重正常吗？', a: '豆豆目前体重28kg，处于金毛犬标准体重范围内（25-34kg），体态健康。日常建议每天喂食优质成犬粮约300-350g，分早晚两餐，并保持适量运动，避免肥胖增加关节负担。' },
  { q: '新手养猫要注意什么？', a: '新手养猫注意以下几点：1. 接种疫苗（猫三联+狂犬）；2. 定期驱虫（体外每月、体内每3个月）；3. 提供干净的猫砂盆并每日清理；4. 不要喂牛奶、巧克力、洋葱等；5. 封窗防止坠楼；6. 每年至少体检一次。有具体问题可以继续问我~' },
  { q: '团子能吃胡萝卜吗？', a: '可以吃。胡萝卜是兔子可以食用的蔬菜之一，富含维生素A，但糖分偏高，建议作为零食少量喂食（每次一小片），主食仍应以无限量提摩西草+适量兔粮为主。喂前洗净擦干，避免腹泻。' },
]

const MOCKS = [
  '根据豆豆的健康档案记录，豆豆是一只3岁的金毛寻回犬。最后一次体检是在2026年7月10日，各项指标正常。目前疫苗接种齐全，下次狂犬疫苗提醒日是8月20日。建议保持每月一次的体外驱虫频率。',
  '豆豆目前体重28kg，处于金毛犬标准体重范围内（25-34kg），体态健康。日常饮食建议每天喂食优质成犬粮约300-350g，分早晚两餐。可以适量补充鸡胸肉、蛋黄等蛋白质，但注意不要喂巧克力、葡萄、洋葱等对狗有毒的食物。',
  '关于这个问题，我需要更多信息来给出准确回答。你可以告诉我具体出现了什么症状吗？比如食欲、精神状态、排便情况等。如果情况紧急，建议直接联系你的宠物医生。',
]

const IMG_EMOJIS = ['📷', '🖼️', '🐾', '🦴', '🌿', '💉']

export default function AskPage() {
  const [curPet, setCurPet] = useState('all')
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [answerText, setAnswerText] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [petDropdownOpen, setPetDropdownOpen] = useState(false)
  const [historyMode, setHistoryMode] = useState(false)
  const [imgList, setImgList] = useState<string[]>([])
  const [askedPreset, setAskedPreset] = useState<number | null>(null)
  const [pendingQ, setPendingQ] = useState<string | null>(null)
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const curPetInfo = PETS.find(p => p.id === curPet) || PETS[0]
  const canSend = (inputValue.trim().length > 0 || !!pendingQ) && !isThinking

  const sendQuestion = useCallback((q?: string, answer?: string) => {
    const text = q || inputValue.trim() || pendingQ || ''
    if (!text || isThinking) return

    const pet = PETS.find(p => p.id === curPet) || PETS[0]
    setHistory(prev => [{
      q: text, petName: pet.name,
      time: new Date().toTimeString().slice(0, 5),
    }, ...prev])

    setShowAnswer(true)
    setIsThinking(true)
    setAnswerText('')
    setInputValue('')

    setTimeout(() => {
      setIsThinking(false)
      const ans = answer || MOCKS[Math.floor(Math.random() * MOCKS.length)]
      // 打字机效果
      let i = 0
      const type = () => {
        if (i < ans.length) {
          setAnswerText(ans.slice(0, i + 1))
          i++
          typingRef.current = setTimeout(type, 25)
        }
      }
      type()
    }, 1500)
  }, [inputValue, pendingQ, isThinking, curPet])

  const handlePreset = useCallback((index: number) => {
    if (isThinking) return
    const p = PRESETS[index]
    setAskedPreset(index)
    setPendingQ(p.q)
    setInputValue('')
    sendQuestion(p.q, p.a)
  }, [isThinking, sendQuestion])

  const addImg = useCallback(() => {
    const emoji = IMG_EMOJIS[Math.floor(Math.random() * IMG_EMOJIS.length)]
    setImgList(prev => [...prev, emoji])
  }, [])

  const removeImg = useCallback((index: number) => {
    setImgList(prev => prev.filter((_, i) => i !== index))
  }, [])

  const selectPet = useCallback((id: string) => {
    setCurPet(id)
    setPendingQ(null)
    setPetDropdownOpen(false)
  }, [])

  const toggleHistory = useCallback(() => {
    setHistoryMode(prev => !prev)
  }, [])

  return (
    <View className='ask-page'>
      {/* 顶部导航 */}
      <View className='ask-header'>
        <View className='ask-header-spacer' />
        <Text className='ask-title'>AI 助手</Text>
        <View className='ask-capsule'>
          <Text className='capsule-more'>•••</Text>
          <View className='capsule-divider' />
          <View className='capsule-mark' />
        </View>
      </View>

      {/* 内容区 */}
      <View className='ask-content'>
        {/* 猫头（fixed 居中） */}
        <View className={`cat-container ${isThinking ? 'thinking' : ''} ${showAnswer ? 'no-float' : ''}`}>
          <View className='cat-svg'>
            {/* 简化猫头 SVG */}
            <View className='cat-ear-l' />
            <View className='cat-ear-r' />
            <View className='cat-face'>
              <View className='cat-eye-l' />
              <View className='cat-eye-r' />
              <View className='cat-nose' />
              <View className='cat-mouth' />
              <View className='cat-cheek-l' />
              <View className='cat-cheek-r' />
            </View>
          </View>
        </View>

        {/* 回答框（fixed 于猫头上方） */}
        {showAnswer && (
          <View className='answer-wrap show'>
            <View className='answer-box'>
              {isThinking ? (
                <View className='ab-loading'>
                  <Text>·</Text>
                  <Text>·</Text>
                  <Text>·</Text>
                </View>
              ) : (
                <Text className='ab-text'>{answerText}</Text>
              )}
            </View>
          </View>
        )}

        {/* 预设问题 */}
        <ScrollView className='preset-row' scrollX>
          {PRESETS.map((p, i) => (
            <View
              key={i}
              className={`preset-chip ${askedPreset === i ? 'asked' : ''}`}
              onClick={() => handlePreset(i)}
            >
              {p.q}
            </View>
          ))}
        </ScrollView>

        {/* 输入栏 */}
        <View className={`ask-input-bar ${historyMode ? 'ask-history-mode' : ''}`}>
          {/* 顶部行：宠物切换 + 历史 */}
          <View className='ask-top-row'>
            <View
              className={`ask-pet-switch ${petDropdownOpen ? 'open' : ''}`}
              onClick={() => setPetDropdownOpen(o => !o)}
            >
              {curPetInfo.name} ▾
            </View>
            <View className='ask-history-btn' onClick={toggleHistory}>
              ◷
            </View>
          </View>

          {/* 宠物下拉 */}
          {petDropdownOpen && (
            <View className='ask-pet-dropdown show'>
              {PETS.map(p => (
                <View
                  key={p.id}
                  className={`ask-pd-item ${curPet === p.id ? 'selected' : ''}`}
                  onClick={() => selectPet(p.id)}
                >
                  <Text className='pd-name'>{p.name}</Text>
                  <Text className='pd-info'>{p.info}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 图片预览 */}
          {imgList.length > 0 && (
            <View className='ask-img-preview show'>
              {imgList.map((img, i) => (
                <View key={i} className='ask-img-item'>
                  {img}
                  <View className='remove-x' onClick={() => removeImg(i)}>✕</View>
                </View>
              ))}
            </View>
          )}

          {/* 历史列表 */}
          {historyMode && (
            <View className='ask-history-list'>
              {history.length === 0 ? (
                <Text className='ask-history-empty'>还没有提问记录{'\n'}试着问点什么吧~</Text>
              ) : (
                history.map((h, i) => (
                  <View key={i} className='ask-hc-item' onClick={() => {
                    setPendingQ(h.q)
                    setHistoryMode(false)
                  }}>
                    <Text className='hc-q'>{h.q}</Text>
                    <Text className='hc-meta'>{h.petName} · {h.time}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* 底部行：添加图片 + 输入 + 发送 */}
          <View className='ask-bottom-row'>
            <View
              className={`ask-add-img ${imgList.length > 0 ? 'has-img' : ''}`}
              onClick={addImg}
            >
              ＋
            </View>
            <Textarea
              className='ask-textarea'
              placeholder={pendingQ || (curPet === 'all' ? '问点什么吧~' : `问我关于${curPetInfo.name}的问题吧~`)}
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              maxlength={-1}
              autoHeight
            />
            <View
              className={`ask-send-btn ${canSend ? 'active' : ''}`}
              onClick={() => canSend && sendQuestion()}
            >
              ➤
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
