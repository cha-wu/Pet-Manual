# 宠物小册 Pet-Manual

宠物家庭小程序的高保真前端原型：给宠物做一本「成长说明书」，包含宠物档案册、家庭日历、AI 问问三大板块。

基于 Taro 4 + React 18 + TypeScript + Sass 构建，同时支持微信小程序（weapp）与 H5 双端，**当前以离线模式运行**（`API_ENABLED = false`，全部数据来自本地原型数据）。

## 功能板块

| 板块 | 文件 | 说明 |
|------|------|------|
| 档案册 | `src/pages/index/ManualPanel.tsx` | 7 章翻页书：封面 / 身份名片 / 个性说明书 / 健康资料 / 生日纪念册 / 成长足迹 / 封底 |
| 日历 | `src/pages/index/CalPanel.tsx` | 42 格月历、按宠物筛选、日常/医疗记录、周期待办（once/quarterly/yearly）；完成待办自动生成医疗记录并顺延 |
| AI 问问 | `src/pages/index/AskPanel.tsx` | AI 猫咪形象 + 表情状态机、预设问题、打字机回答（当前为纯前端 mock） |

主页面 `src/pages/index/index.tsx` 同时承担：5 步 onboarding 引导、家庭中心（家庭码 / 成员管理 / 审批）、添加宠物表单。

## 架构说明

- **单页应用**：`app.config.ts` 仅注册 `pages/index/index` 一个页面，三大板块以 Panel 组件切换。
- **双端兼容**：`src/components/compat.tsx` 封装 View/Text/Input/ScrollView 等基础组件，weapp 端使用 Taro 组件、H5 端还原原生标签并统一事件格式（`e.detail.value`）。业务代码统一从 compat 导入基础组件。
- **数据层**：`src/services/` 按后端接口文档实现（请求封装 / 类型 / 映射），当前离线回退到 `src/pages/index/data/` 中的原型数据。
- **样式**：`src/styles/proto.scss` 为原型样式 1:1 搬移（请勿随意改动）；主题色 `#F5EFE6`；weapp 端通过 `loadFontFace` 加载手写字体。

## 目录结构

```
src/
├── app.config.ts          # 页面注册（仅 index）与窗口配置
├── app.ts                 # 全局逻辑（手写字体加载）
├── assets/                # 图片资源
├── components/compat.tsx  # 双端基础组件 shim
├── pages/index/           # 唯一页面
│   ├── index.tsx          # 主组件（引导 / 家庭 / 表单 / 板块切换）
│   ├── ManualPanel.tsx    # 档案册
│   ├── CalPanel.tsx       # 日历
│   ├── AskPanel.tsx       # AI 问问
│   └── data/              # 展示层类型与原型数据
│       ├── types.ts       # PetRecord / CalRecord / FamilyData 等
│       ├── mocks.ts       # 原型数据 1:1 搬移（离线展示用）
│       └── index.ts       # 出口（对外 import 路径 './data' 不变）
├── services/              # 网络层（按后端接口文档实现，当前离线）
│   ├── config.ts          # API_ENABLED / API_BASE_URL / TOKEN_KEY
│   ├── request.ts         # 请求封装（Bearer / 幂等 / 静默重登）
│   ├── pet.ts             # 宠物 CRUD 与子资源端点
│   ├── types.ts           # API 类型定义
│   └── mappers.ts         # API 数据 ↔ 展示数据转换
├── styles/                # proto.scss（原型样式）等
└── index.html             # H5 入口
```

接口契约详见 [docs/api-contract.md](docs/api-contract.md)。

## 快速开始

```bash
npm install

# 微信小程序（构建产物在 dist/，用微信开发者工具导入项目根目录）
npm run dev:weapp

# H5
npm run dev:h5
```

类型检查：`npm run typecheck`

## 与后端（wechat-pet）的关系

本项目是同一产品的 UI 原型前端，接口层与后端工程 `wechat-pet`（Go + Gin）遵循同一份接口契约：`/api/v1` 前缀、统一响应结构 `{ code, msg, data, request_id }`、统一错误码（40101/40102 认证、40301-40304 家庭权限）。

对接后端时需要：

1. `src/services/config.ts` 中将 `API_ENABLED` 改为 `true`，并将 `API_BASE_URL`（weapp 端）改为已备案的真实域名；
2. 补全 `src/services/request.ts` 中 `silentRelogin` 的微信登录逻辑（当前为 TODO）；
3. 微信公众平台配置 request 合法域名。

## 已知问题

- `src/components/compat.tsx` 中 `DateInput` 向 Taro `Picker` 传递了 `max`/`min` 属性，Taro 的 `PickerDateProps` 类型定义为 `start`/`end`，类型检查会报 TS2322（运行时 H5 端正常，weapp 端日期范围限制可能不生效）。
