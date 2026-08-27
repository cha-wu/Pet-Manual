/**
 * API 数据 ↔ 前端 PetRecord 转换器
 *
 * 后端返回 ApiPet 等结构，前端组件消费 PetRecord（原型数据结构）。
 * 此文件做字段映射，保持组件层不变。
 */

import type { ApiPet, ApiPersonalityQA, ApiHealthSummary, ApiBirthday, ApiGrowth, ApiGrowthEvent, ApiWeight } from './types'
import type { PetRecord } from '../pages/index/data'

const GENDER_MAP: Record<string, string> = { male: '公', female: '母', unknown: '未知' }

/** 生成今天日期字符串 YYYY-MM-DD */
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * ApiPet → PetRecord
 * 缺失字段用默认值填充（新宠物无历史数据）
 */
export function apiPetToRecord(pet: ApiPet): PetRecord {
  const genderLabel = GENDER_MAP[pet.gender] || '未知'
  const neuteredLabel = pet.neutered ? '已绝育' : '未绝育'
  const genderLine = pet.gender === 'unknown' ? '性别未知' : `${genderLabel} · ${neuteredLabel}`

  return {
    id: pet.id,
    name: pet.name,
    title: `${pet.name}的成长小册`,
    quote: pet.quote || `${pet.name}，是我们家的小宝贝。`,
    years: `${pet.birthday?.slice(0, 4) || '未知'} — 至今`,
    type: `${pet.species}${pet.breed ? '<br>' + pet.breed : ''}<br>${genderLine}`,
    birthDate: pet.birthday,
    arrivalDate: pet.arrived_at,
    tags: pet.tags || ['新成员'],
    personalityQuestions: [],
    health: {
      overall: pet.health_status === 'healthy' ? '健康' : pet.health_status === 'attention' ? '需关注' : '治疗中',
      allergies: { label: '过敏信息', value: '未记录', note: '入住后补充' },
      diseases: { label: '既往疾病', value: '未记录', note: '入住后补充' },
      medications: { label: '长期用药', value: '未记录', note: '入住后补充' },
      vaccines: { label: '最近疫苗', value: '未记录', note: '入住后补充' },
    },
    updated: `更新于 ${pet.updated_at || todayStr()}`,
    backFamily: `更新于 ${todayStr()}`,
    weights: [],
    events: [],
    birthdays: [],
  }
}

/** 个性问答转换 */
export function apiPersonalityToRecord(qa: ApiPersonalityQA[]): PetRecord['personalityQuestions'] {
  return qa.map(q => ({ title: q.title, summary: q.summary, detail: q.detail }))
}

/** 健康摘要转换 */
export function apiHealthToRecord(health: ApiHealthSummary): PetRecord['health'] {
  return {
    overall: health.overall,
    allergies: health.allergies,
    diseases: health.diseases,
    medications: health.medications,
    vaccines: health.vaccines,
  }
}

/** 生日记录转换 */
export function apiBirthdaysToRecord(bdays: ApiBirthday[]): PetRecord['birthdays'] {
  return bdays.map(b => ({
    date: b.date,
    age: b.age,
    title: b.title,
    wish: b.wish,
    mediaLabel: b.media_label,
  }))
}

/** 成长足迹转换（体重 + 事件） */
export function apiGrowthToRecord(growth: ApiGrowth): {
  weights: PetRecord['weights']
  events: PetRecord['events']
} {
  return {
    weights: (growth.weights || []).map((w: ApiWeight) => ({ date: w.date, value: w.value })),
    events: (growth.events || []).map((e: ApiGrowthEvent) => ({
      type: e.type,
      date: e.date,
      title: e.title,
      content: e.content,
      author: e.author,
    })),
  }
}

/**
 * 前端表单 → API 创建请求体
 * 供 index.tsx 的 submitAddPet 使用
 */
export function formToApiPetBody(form: {
  name: string
  speciesId: string
  speciesOther: string
  breed: string
  genderId: string
  neuteredId: string
  birthDate: string
  arrivalDate: string
  healthId: string
  tagsText: string
  quote: string
}): import('./types').ApiPetSaveBody {
  const SPECIES_MAP: Record<string, string> = {
    cat: '猫', dog: '狗', rabbit: '兔', hamster: '仓鼠', bird: '鸟', other: '',
  }
  const species = form.speciesId === 'other'
    ? (form.speciesOther.trim() || '其他')
    : (SPECIES_MAP[form.speciesId] || '其他')

  return {
    name: form.name.trim(),
    species,
    breed: form.breed.trim() || undefined,
    gender: form.genderId as 'male' | 'female' | 'unknown',
    neutered: form.neuteredId === 'yes',
    birthday: form.birthDate,
    arrived_at: form.arrivalDate,
    health_status: form.healthId as 'healthy' | 'attention' | 'treatment',
    tags: form.tagsText.split(/[，,\s]+/).map(t => t.trim()).filter(Boolean).slice(0, 8),
    quote: form.quote.trim() || undefined,
  }
}
