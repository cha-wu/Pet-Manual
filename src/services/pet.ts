/**
 * 宠物档案模块 API
 *
 * 对应接口文档第 5 节：
 * 5.1 宠物基础：POST /pets, GET /pets, GET /pets/{id}, PATCH /pets/{id}, DELETE /pets/{id}
 * 5.2 宠物子资源：
 *   - 证件      GET /pets/{id}/documents
 *   - 个性      GET /pets/{id}/personality
 *   - 健康摘要  GET /pets/{id}/health/summary
 *   - 生日      GET /pets/{id}/birthdays
 *   - 成长      GET /pets/{id}/growth
 *
 * 规则：
 * - family_id 来自 RequireFamily 中间件，不放 body
 * - 所有 detail endpoint 检查 pet 属于当前 family
 * - delete 使用逻辑删除
 * - 附件先上传取得 asset_id，再在 body 提交 asset_ids
 */

import { request } from './request'
import type {
  ApiPet,
  ApiPetSaveBody,
  ApiPersonalityQA,
  ApiHealthSummary,
  ApiBirthday,
  ApiGrowth,
  ApiDocument,
  PaginatedData,
} from './types'

/** 生成 UUID（用于 Idempotency-Key） */
function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ─── 5.1 宠物基础 ───

/**
 * 获取家庭宠物列表
 * GET /pets
 * 鉴权：RequireAuth + RequireFamily
 */
export async function getPets(): Promise<ApiPet[]> {
  const data = await request<PaginatedData<ApiPet>>('GET', '/pets')
  return data.items
}

/**
 * 获取宠物详情
 * GET /pets/{pet_id}
 */
export async function getPetDetail(petId: string): Promise<ApiPet> {
  return request<ApiPet>('GET', `/pets/${petId}`)
}

/**
 * 创建宠物
 * POST /pets（必须幂等，带 Idempotency-Key）
 */
export async function createPet(body: ApiPetSaveBody): Promise<ApiPet> {
  return request<ApiPet>('POST', '/pets', body as unknown as Record<string, unknown>, {
    idempotencyKey: uuid(),
  })
}

/**
 * 更新宠物
 * PATCH /pets/{pet_id}
 */
export async function updatePet(petId: string, body: Partial<ApiPetSaveBody>): Promise<ApiPet> {
  return request<ApiPet>('PATCH', `/pets/${petId}`, body as unknown as Record<string, unknown>)
}

/**
 * 删除宠物（逻辑删除）
 * DELETE /pets/{pet_id}
 */
export async function deletePet(petId: string): Promise<void> {
  await request<null>('DELETE', `/pets/${petId}`)
}

// ─── 5.2 宠物子资源 ───

/**
 * 获取宠物证件
 * GET /pets/{pet_id}/documents
 */
export async function getPetDocuments(petId: string): Promise<ApiDocument[]> {
  const data = await request<PaginatedData<ApiDocument>>('GET', `/pets/${petId}/documents`)
  return data.items
}

/**
 * 获取宠物个性问答
 * GET /pets/{pet_id}/personality
 */
export async function getPetPersonality(petId: string): Promise<ApiPersonalityQA[]> {
  return request<ApiPersonalityQA[]>('GET', `/pets/${petId}/personality`)
}

/**
 * 获取宠物健康摘要
 * GET /pets/{pet_id}/health/summary
 */
export async function getPetHealthSummary(petId: string): Promise<ApiHealthSummary> {
  return request<ApiHealthSummary>('GET', `/pets/${petId}/health/summary`)
}

/**
 * 获取宠物生日记录
 * GET /pets/{pet_id}/birthdays
 */
export async function getPetBirthdays(petId: string): Promise<ApiBirthday[]> {
  return request<ApiBirthday[]>('GET', `/pets/${petId}/birthdays`)
}

/**
 * 获取宠物成长足迹（体重 + 事件）
 * GET /pets/{pet_id}/growth
 */
export async function getPetGrowth(petId: string): Promise<ApiGrowth> {
  return request<ApiGrowth>('GET', `/pets/${petId}/growth`)
}
