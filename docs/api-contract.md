# 接口契约（前端视角）

本文件从 `src/services/` 实现中提炼，是本项目与后端工程（wechat-pet）共同遵循的接口契约快照。以「接口文档」章节编号为参照，后端实现以 wechat-pet 仓库为准。

## 0. 全局约定

- 接口根路径：`/api/v1`
- 请求格式：`Content-Type: application/json`
- 鉴权：`Authorization: Bearer <token>`（token 由微信登录换取）
- 幂等：写操作可携带 `Idempotency-Key` 请求头（前端创建宠物时自动生成 UUID 作为幂等键）
- 超时：前端默认 15000ms（`src/services/config.ts`）

## 1. 统一结构

### 1.2 统一响应

```json
{ "code": 0, "msg": "ok", "data": {}, "request_id": "xxx" }
```

- `code === 0` 表示成功，业务数据在 `data`
- `code !== 0` 时前端抛出 `ApiError`，按 code 分类处理

### 1.3 统一分页

```json
{ "items": [], "total": 0, "page": 1, "page_size": 20, "has_more": false }
```

### 1.5 错误码

| code | 分类 | 含义 | 前端行为 |
|------|------|------|----------|
| 40101 / 40102 | 认证 | 未登录 / token 失效 | 静默重新登录并重放一次，仍失败则清 token |
| 40301-40304 | 家庭权限 | guest 无家庭 / 无权限等 | 触发家庭引导流程（onboarding） |
| 其他 | 业务错误 | — | 抛 ApiError 由调用方处理 |

## 5. 宠物档案

规则：

- `family_id` 由服务端从鉴权中间件取，不在请求体传递
- 所有 detail 端点校验宠物归属当前家庭
- 删除为逻辑删除
- 附件先上传取得 `asset_id`，再在 body 中提交 `asset_ids`

### 5.1 宠物基础

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/pets` | 家庭宠物列表（分页） | RequireAuth + RequireFamily |
| GET | `/pets/{pet_id}` | 宠物详情 | 同上 |
| POST | `/pets` | 创建宠物（需 Idempotency-Key） | 同上 |
| PATCH | `/pets/{pet_id}` | 更新宠物 | 同上 |
| DELETE | `/pets/{pet_id}` | 删除宠物（逻辑删除） | 同上 |

宠物对象（`ApiPet`）：

```ts
{
  id: string
  name: string
  species: string
  breed?: string
  gender: 'male' | 'female' | 'unknown'
  neutered: boolean
  birthday: string        // YYYY-MM-DD
  arrived_at: string      // 到家日
  avatar_asset_id?: number
  avatar_url?: string
  health_status?: 'healthy' | 'attention' | 'treatment'
  tags?: string[]
  quote?: string          // 寄语
  created_at?: string
  updated_at?: string
}
```

创建/更新请求体（`ApiPetSaveBody`）：`name`、`species`、`gender`、`neutered`、`birthday`、`arrived_at` 必填，其余可选。

### 5.2 宠物子资源（均为 GET）

| 路径 | 返回类型 | 说明 |
|------|----------|------|
| `/pets/{pet_id}/documents` | 分页 `ApiDocument[]` | 证件（type/title/asset_id/asset_url） |
| `/pets/{pet_id}/personality` | `ApiPersonalityQA[]` | 个性问答（title/summary/detail） |
| `/pets/{pet_id}/health/summary` | `ApiHealthSummary` | 健康摘要（overall/allergies/diseases/medications/vaccines） |
| `/pets/{pet_id}/birthdays` | `ApiBirthday[]` | 生日记录（date/age/title/wish/media_label） |
| `/pets/{pet_id}/growth` | `ApiGrowth` | 成长足迹聚合（weights[] + events[]） |

## 对接状态与差距（截至本文档撰写）

- 前端 `API_ENABLED = false`，所有请求走本地回退，不发出网络请求
- `silentRelogin`（微信 code → `/auth/login`）为 TODO，后端就绪后需启用
- 后端宠物模型当前仅有 `name` 字段，5.1 的完整字段与 5.2 全部子资源端点尚待实现
- `Idempotency-Key` 幂等机制后端尚未实现（前端已就绪）
- 日历记录 / 待办 / AI 问答尚无对应后端模型与端点
