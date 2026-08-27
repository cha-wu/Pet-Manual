/**
 * API 统一类型定义
 * 对应接口文档 1.2 统一响应结构、1.3 统一分页结构、1.4 通用对象
 */

/** 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T | null
  request_id?: string
}

/** 统一分页结构 */
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

/** 用户对象（简化） */
export interface ApiUser {
  id: string
  nickname: string
  avatar_asset_id?: number
  avatar_url?: string
  identity: 'guest' | 'member' | 'owner'
  family?: {
    id: string
    name: string
    role: 'member' | 'owner'
  } | null
  profile_completed?: boolean
}

/** 家庭摘要 */
export interface ApiFamilySummary {
  id: string
  name: string
  code: string
}

/** 宠物对象（列表/详情） */
export interface ApiPet {
  id: string
  name: string
  species: string
  breed?: string
  gender: 'male' | 'female' | 'unknown'
  neutered: boolean
  birthday: string
  arrived_at: string
  avatar_asset_id?: number
  avatar_url?: string
  health_status?: 'healthy' | 'attention' | 'treatment'
  tags?: string[]
  quote?: string
  created_at?: string
  updated_at?: string
}

/** 创建/更新宠物请求体 */
export interface ApiPetSaveBody {
  name: string
  species: string
  breed?: string
  gender: 'male' | 'female' | 'unknown'
  neutered: boolean
  birthday: string
  arrived_at: string
  avatar_asset_id?: number
  health_status?: 'healthy' | 'attention' | 'treatment'
  tags?: string[]
  quote?: string
}

/** 个性问答 */
export interface ApiPersonalityQA {
  id?: string
  title: string
  summary: string
  detail: string
}

/** 健康摘要 */
export interface ApiHealthSummary {
  overall: string
  allergies: { label: string; value: string; note: string }
  diseases: { label: string; value: string; note: string }
  medications: { label: string; value: string; note: string }
  vaccines: { label: string; value: string; note: string }
}

/** 生日记录 */
export interface ApiBirthday {
  id?: string
  date: string
  age: string
  title: string
  wish: string
  media_label: string
}

/** 体重记录 */
export interface ApiWeight {
  id?: string
  date: string
  value: string
}

/** 成长事件 */
export interface ApiGrowthEvent {
  id?: string
  type: string
  date: string
  title: string
  content: string
  author: string
}

/** 成长足迹聚合 */
export interface ApiGrowth {
  weights: ApiWeight[]
  events: ApiGrowthEvent[]
}

/** 证件 */
export interface ApiDocument {
  id: string
  type: string
  title: string
  asset_id?: number
  asset_url?: string
}
