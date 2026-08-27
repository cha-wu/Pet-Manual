import { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, Textarea, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

// ===== 数据类型 =====
interface Pet { id: string; name: string; emoji: string }
interface CalRecord {
  date: string; pet: string; cat: 'daily' | 'medical'; medType: string | null
  title: string; text: string; imgs: string[]; by: string; time: string
}
interface Todo {
  id: string; pet: string; title: string; remindDate: string
  cycle: 'once' | 'quarterly' | 'yearly'; cycleName: string
  status: 'pending' | 'completed'; by: string
}

// ===== 常量 =====
const PETS: Pet[] = [
  { id: 'dou', name: '豆豆', emoji: '🐶' },
  { id: 'mi', name: '咪咪', emoji: '🐱' },
  { id: 'tuan', name: '团子', emoji: '🐹' },
]
const MEMBERS: Record<string, { name: string }> = { ma: { name: '妈妈' }, ba: { name: '爸爸' } }
const WEEKS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_CN = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const getPet = (id: string) => PETS.find(p => p.id === id) || PETS[0]
const getBy = (by: string) => MEMBERS[by] || { name: by }

const TODAY = new Date(2026, 7, 14)

const INITIAL_RECORDS: CalRecord[] = [
  { date: '2026-08-14', pet: 'mi', cat: 'medical', medType: '驱虫', title: '体外驱虫', text: '今天给咪咪做了体外驱虫，医生说状态很好。', imgs: ['🧴', '🥼'], by: 'ma', time: '10:20' },
  { date: '2026-08-14', pet: 'dou', cat: 'daily', medType: null, title: '学会握手啦', text: '豆豆今天终于学会握手了！奖励了最爱的小零食。', imgs: ['🐾', '🍖'], by: 'ba', time: '18:05' },
  { date: '2026-08-03', pet: 'dou', cat: 'medical', medType: '疫苗', title: '狂犬疫苗第一针', text: '接种完成，留观30分钟无异常。', imgs: ['💉'], by: 'ma', time: '14:30' },
  { date: '2026-08-05', pet: 'tuan', cat: 'daily', medType: null, title: '换了新草窝', text: '团子对新草窝爱不释口，滚来滚去。', imgs: ['🌿', '🐹'], by: 'ba', time: '09:15' },
  { date: '2026-08-10', pet: 'mi', cat: 'daily', medType: null, title: '晒太阳的小团子', text: '咪咪趴在窗台上晒了一下午太阳。', imgs: ['☀️', '😺'], by: 'ma', time: '16:40' },
]

const INITIAL_TODOS: Todo[] = [
  { id: 't1', pet: 'dou', title: '狂犬疫苗第二针', remindDate: '2026-08-20', cycle: 'yearly', cycleName: '每年', status: 'pending', by: 'ma' },
]

export default function CalendarPage() {
  // ===== 状态 =====
  const [records, setRecords] = useState<CalRecord[]>(INITIAL_RECORDS)
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS)
  const [curDate, setCurDate] = useState(fmtDate(TODAY))
  const [viewYM, setViewYM] = useState({ y: 2026, m: 7 })
  const [calOpen, setCalOpen] = useState(false)
  const [filterPet, setFilterPet] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addCat, setAddCat] = useState<'daily' | 'medical'>('daily')
  const [addPet, setAddPet] = useState<string | null>(null)
  const [addTime, setAddTime] = useState('09:00')
  const [addText, setAddText] = useState('')
  const [addRemind, setAddRemind] = useState(false)
  const [addCycle, setAddCycle] = useState<'once' | 'quarterly' | 'yearly'>('yearly')
  const [showDoneOverlay, setShowDoneOverlay] = useState(false)
  const [doneTodoId, setDoneTodoId] = useState<string | null>(null)

  // ===== 计算 =====
  const dayRecords = useMemo(() => records.filter(r => r.date === curDate), [records, curDate])
  const dayTodos = useMemo(() => todos.filter(t => t.status === 'pending' && t.remindDate === curDate), [todos, curDate])

  const calendarDays = useMemo(() => {
    const { y, m } = viewYM
    const first = new Date(y, m, 1)
    const start = new Date(y, m, 1 - first.getDay())
    const days: { date: Date; dateStr: string; isCurMonth: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      days.push({ date: day, dateStr: fmtDate(day), isCurMonth: day.getMonth() === m })
    }
    return days
  }, [viewYM])

  const hasMedOn = useCallback((dateStr: string) =>
    records.some(r => r.date === dateStr && r.cat === 'medical' && (!filterPet || r.pet === filterPet)),
    [records, filterPet])

  const hasDailyOn = useCallback((dateStr: string) =>
    records.some(r => r.date === dateStr && r.cat === 'daily' && (!filterPet || r.pet === filterPet)),
    [records, filterPet])

  const hasTodoOn = useCallback((dateStr: string) =>
    todos.some(t => t.status === 'pending' && t.remindDate === dateStr && (!filterPet || t.pet === filterPet)),
    [todos, filterPet])

  const remindNextDate = useMemo(() => {
    const d = parseDate(curDate)
    if (addCycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
    else if (addCycle === 'quarterly') d.setMonth(d.getMonth() + 3)
    return fmtDate(d)
  }, [curDate, addCycle])

  const canSave = addPet && addText.trim()

  // ===== 事件 =====
  const toggleCal = useCallback(() => setCalOpen(o => !o), [])

  const selectDay = useCallback((dateStr: string) => {
    setCurDate(dateStr)
    setCalOpen(false)
  }, [])

  const prevMonth = useCallback(() => {
    setViewYM(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 })
  }, [])

  const nextMonth = useCallback(() => {
    setViewYM(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 })
  }, [])

  const cycleFilter = useCallback(() => {
    const ids: (string | null)[] = [null, ...PETS.map(p => p.id)]
    setFilterPet(prev => {
      const idx = ids.indexOf(prev)
      return ids[(idx + 1) % ids.length]
    })
  }, [])

  const openAddForm = useCallback(() => {
    setAddCat('daily')
    setAddPet(null)
    setAddRemind(false)
    setAddCycle('yearly')
    setAddText('')
    setAddTime('09:00')
    setShowAddForm(true)
  }, [])

  const handleSave = useCallback(() => {
    if (!canSave) return
    const isMed = addCat === 'medical'
    const newRecord: CalRecord = {
      date: curDate, pet: addPet!, cat: addCat, medType: null,
      title: addText.length > 14 ? addText.slice(0, 14) + '…' : addText,
      text: addText.trim(),
      imgs: isMed ? ['🥼'] : ['📷'],
      by: 'ma', time: addTime || '09:00',
    }
    setRecords(prev => [...prev, newRecord])

    if (isMed && addRemind) {
      const d = parseDate(curDate)
      if (addCycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
      else if (addCycle === 'quarterly') d.setMonth(d.getMonth() + 3)
      const cycleName = addCycle === 'yearly' ? '每年' : addCycle === 'quarterly' ? '每3个月' : '一次性'
      const newTodo: Todo = {
        id: 't' + Date.now(), pet: addPet!, title: '下次医疗提醒',
        remindDate: fmtDate(d), cycle: addCycle, cycleName, status: 'pending', by: 'ma',
      }
      setTodos(prev => [...prev, newTodo])
    }

    setShowAddForm(false)
    Taro.showToast({ title: '记录已保存', icon: 'success' })
  }, [canSave, addCat, addPet, addText, addTime, addRemind, addCycle, curDate])

  const openDone = useCallback((todoId: string) => {
    setDoneTodoId(todoId)
    setShowDoneOverlay(true)
  }, [])

  const confirmDone = useCallback(() => {
    if (!doneTodoId) return
    const t = todos.find(x => x.id === doneTodoId)
    if (!t) return

    setTodos(prev => prev.map(x => x.id === doneTodoId ? { ...x, status: 'completed' } : x))

    const doneRecord: CalRecord = {
      date: fmtDate(TODAY), pet: t.pet, cat: 'medical', medType: t.title,
      title: t.title, text: '通过待办提醒完成，已自动记录。', imgs: ['✅'],
      by: 'ma', time: new Date().toTimeString().slice(0, 5),
    }
    setRecords(prev => [...prev, doneRecord])

    if (t.cycle !== 'once') {
      const d = new Date(TODAY)
      if (t.cycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
      else if (t.cycle === 'quarterly') d.setMonth(d.getMonth() + 3)
      const newTodo: Todo = {
        id: 't' + Date.now(), pet: t.pet, title: t.title,
        remindDate: fmtDate(d), cycle: t.cycle, cycleName: t.cycleName,
        status: 'pending', by: t.by,
      }
      setTodos(prev => [...prev, newTodo])
    }

    setCurDate(fmtDate(TODAY))
    setShowDoneOverlay(false)
    Taro.showToast({ title: '待办已完成', icon: 'success' })
  }, [doneTodoId, todos])

  const doneTodo = todos.find(t => t.id === doneTodoId)
  const filterLabel = filterPet ? getPet(filterPet).name : '全部宠物'

  return (
    <View className='cal-page'>
      {/* 顶部导航 */}
      <View className='cal-header'>
        <View className='cal-family-btn'>⌂</View>
        <Text className='cal-title'>宠物日历</Text>
        <View className='cal-capsule'>
          <Text className='capsule-more'>•••</Text>
          <View className='capsule-divider' />
          <View className='capsule-mark' />
        </View>
      </View>

      {/* 内容区 */}
      <View className='cal-content'>
        {/* 猫爪书签 */}
        <View
          className={`cal-bookmark ${calOpen ? 'open' : ''}`}
          onClick={toggleCal}
        >
          <Text className='paw-icon'>🐾</Text>
        </View>

        {/* 日历下拉 */}
        <View className={`cal-dropdown ${calOpen ? 'open' : ''}`}>
          <View className='cal-dd-content'>
            <View className='cal-dd-title'>
              <Text className='dd-month-en'>{MONTH_EN[viewYM.m]}</Text>
              <Text className='dd-month-cn'>{MONTH_CN[viewYM.m].split('').join(' ')}</Text>
              <Text className='dd-sub'>— 记录毛孩子的每一天 —</Text>
            </View>
            <View className='cal-dd-head'>
              <View className='cal-dd-filter' onClick={cycleFilter}>
                🐾 {filterLabel} ▾
              </View>
              <View className='cal-dd-nav'>
                <View className='dd-nav-btn' onClick={prevMonth}>‹</View>
                <Text className='dd-ym'>{viewYM.y} · {viewYM.m + 1}</Text>
                <View className='dd-nav-btn' onClick={nextMonth}>›</View>
              </View>
            </View>
            <View className='cal-dd-weekrow'>
              {WEEKS.map(w => <View key={w} className='cal-dd-week'>{w}</View>)}
            </View>
            <View className='cal-dd-grid'>
              {calendarDays.map((day, i) => (
                <View
                  key={i}
                  className={`cal-dd-cell ${!day.isCurMonth ? 'other-month' : ''} ${day.dateStr === curDate ? 'selected' : ''} ${hasTodoOn(day.dateStr) && day.isCurMonth ? 'alarm' : ''}`}
                  onClick={() => selectDay(day.dateStr)}
                >
                  <Text className='cdd-day'>{day.date.getDate()}</Text>
                  {day.isCurMonth && hasMedOn(day.dateStr) && <View className='cdd-dot med' />}
                  {day.isCurMonth && hasDailyOn(day.dateStr) && <View className='cdd-dot daily' />}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 每日详情 */}
        <ScrollView className='cal-day-scroll' scrollY>
          <View className='cal-day-card'>
            <View className='cal-day-header'>
              <Text className='d-date'>
                {parseDate(curDate).getMonth() + 1}月{parseDate(curDate).getDate()}日 星期{WEEKS[parseDate(curDate).getDay()]}
                {curDate === fmtDate(TODAY) && <Text className='d-today-tag'>今天</Text>}
              </Text>
              <Text className='d-summary'>
                {dayRecords.length}条记录{dayTodos.length ? ` · ${dayTodos.length}条待办提醒` : ''}
              </Text>
            </View>
            <View className='cal-day-body'>
              {dayRecords.length === 0 && dayTodos.length === 0 ? (
                <View className='cal-day-empty'>
                  <Text className='e-emoji'>🍃</Text>
                  <Text className='e-title'>这一天还没有记录</Text>
                  <Text className='e-sub'>点击右下角「＋」记录点什么吧</Text>
                </View>
              ) : (
                <>
                  {dayTodos.map(t => {
                    const pet = getPet(t.pet)
                    const by = getBy(t.by)
                    return (
                      <View key={t.id} className='cal-rec-row todo'>
                        <View className='cal-rec-main'>
                          <View className='cal-rec-head'>
                            <Text className='cal-rec-cat todo'>待办</Text>
                            <Text className='cal-rec-pet'>{pet.name}</Text>
                            <Text className='cal-rec-time'>⏰ {t.remindDate.replace('2026-', '').replace('2027-', '')}</Text>
                          </View>
                          <Text className='cal-rec-text'>{t.title}</Text>
                          <Text className='td-sub'>提醒日 {t.remindDate.replace('2026-', '').replace('2027-', '')} · {t.cycleName}一次</Text>
                          <Text className='cal-rec-by'>{by.name} 记录</Text>
                        </View>
                        <View className='cal-btn-done' onClick={() => openDone(t.id)}>✓ 完成</View>
                      </View>
                    )
                  })}
                  {[...dayRecords].sort((a, b) => b.time.localeCompare(a.time)).map((r, idx) => {
                    const pet = getPet(r.pet)
                    const by = getBy(r.by)
                    const catName = r.cat === 'medical' ? '医疗' : '日常'
                    return (
                      <View key={idx} className={`cal-rec-row ${r.cat}`}>
                        <View className='cal-rec-main'>
                          <View className='cal-rec-head'>
                            <Text className={`cal-rec-cat ${r.cat}`}>{catName}</Text>
                            <Text className='cal-rec-pet'>{pet.name}</Text>
                            <Text className='cal-rec-time'>{r.time}</Text>
                          </View>
                          {r.text && <Text className='cal-rec-text'>{r.text}</Text>}
                          {r.imgs && r.imgs.length > 0 && (
                            <View className='cal-rec-imgs'>
                              {r.imgs.map((img, i) => <View key={i} className='img-thumb'>{img}</View>)}
                            </View>
                          )}
                          <Text className='cal-rec-by'>{by.name} 记录</Text>
                        </View>
                      </View>
                    )
                  })}
                </>
              )}
            </View>
          </View>
        </ScrollView>

        {/* FAB 添加按钮 */}
        <View className='cal-fab'>
          <View className='cal-fab-btn' onClick={openAddForm}>＋</View>
        </View>

        {/* 添加记录弹层 */}
        {showAddForm && (
          <View className='cal-overlay show' onClick={() => setShowAddForm(false)}>
            <View className='cal-sheet' onClick={(e) => e.stopPropagation()}>
              <View className='cal-sheet-handle' />
              <Text className='cal-sheet-title'>添加记录</Text>

              <Text className='cal-field-label'>分类</Text>
              <View className='cal-seg'>
                <View
                  className={`cal-seg-item ${addCat === 'daily' ? 'active' : ''}`}
                  onClick={() => setAddCat('daily')}
                >
                  <View className='seg-dot' />
                  <Text>日常</Text>
                </View>
                <View
                  className={`cal-seg-item ${addCat === 'medical' ? 'active' : ''}`}
                  onClick={() => setAddCat('medical')}
                >
                  <View className='seg-dot' />
                  <Text>医疗</Text>
                </View>
              </View>

              <Text className='cal-field-label'>宠物</Text>
              <View className='cal-pet-chips'>
                {PETS.map(p => (
                  <View
                    key={p.id}
                    className={`cal-pet-chip ${addPet === p.id ? 'selected' : ''}`}
                    onClick={() => setAddPet(p.id)}
                  >
                    {p.emoji} {p.name}
                  </View>
                ))}
              </View>

              <Text className='cal-field-label'>时间</Text>
              <Picker mode='time' value={addTime} onChange={(e) => setAddTime(e.detail.value)}>
                <View className='cal-time-display'>{addTime}</View>
              </Picker>

              <Text className='cal-field-label'>记录内容</Text>
              <Textarea
                className='cal-textarea'
                placeholder={addCat === 'medical' ? '记录做了什么医疗行为，如：今天接种狂犬疫苗第二针…' : '记录日常点滴，如：今天终于学会握手啦！'}
                value={addText}
                onInput={(e) => setAddText(e.detail.value)}
                style={{ minHeight: '88px' }}
              />

              {/* 医疗待办 */}
              {addCat === 'medical' && (
                <View className='cal-remind-box'>
                  <View className='cal-switch-row'>
                    <Text className='sr-label'>⏰ 添加待办提醒（仅医疗可设）</Text>
                    <View
                      className={`cal-switch ${addRemind ? 'on' : ''}`}
                      onClick={() => setAddRemind(r => !r)}
                    />
                  </View>
                  {addRemind && (
                    <View className='cal-remind-panel'>
                      <View className='cal-remind-row'>
                        <Text>提醒日期</Text>
                        <Text className='rr-val'>{remindNextDate}</Text>
                      </View>
                      <View className='cal-remind-row'><Text>重复周期</Text></View>
                      <View className='cal-cycle-chips'>
                        {[
                          { c: 'once', label: '一次性' },
                          { c: 'quarterly', label: '每3个月' },
                          { c: 'yearly', label: '每年' },
                        ].map(({ c, label }) => (
                          <View
                            key={c}
                            className={`cal-cycle-chip ${addCycle === c ? 'selected' : ''}`}
                            onClick={() => setAddCycle(c as 'once' | 'quarterly' | 'yearly')}
                          >
                            {label}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View
                className={`cal-submit-btn ${!canSave ? 'disabled' : ''}`}
                onClick={handleSave}
              >
                保存记录
              </View>
            </View>
          </View>
        )}

        {/* 完成待办确认弹层 */}
        {showDoneOverlay && doneTodo && (
          <View className='cal-overlay show' onClick={() => setShowDoneOverlay(false)}>
            <View className='cal-sheet' onClick={(e) => e.stopPropagation()}>
              <View className='cal-sheet-handle' />
              <Text className='cal-sheet-title'>✅ 标记完成</Text>
              <View className='cal-done-info'>
                <Text>「{doneTodo.title}」 已完成？{'\n'}系统自动生成医疗记录，并以实际完成日期（今天）为基准，按周期 {doneTodo.cycleName} 自动顺延下一次提醒。</Text>
              </View>
              <View className='cal-sheet-actions'>
                <View className='cal-btn cancel' onClick={() => setShowDoneOverlay(false)}>取消</View>
                <View className='cal-btn save' onClick={confirmDone}>确认完成</View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
