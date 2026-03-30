# Phase 1: MVP - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

创建一个 Edge Function 服务，返回包含实时天气的 HTML 页面。飞书会自动抓取 `<title>` 标签内容显示在签名档中，实现签名档动态展示天气。

</domain>

<decisions>
## Implementation Decisions

### 天气数据源
- **D-01:** 使用 OpenWeatherMap Current Weather API
  - 理由：免费额度 1000次/天足够个人使用，接口简单
  - Endpoint: `https://api.openweathermap.org/data/2.5/weather`

### 缓存策略
- **D-02:** 使用内存缓存（JavaScript Map/全局变量）
  - 缓存 TTL: 30分钟
  - 注意：边缘函数多实例可能导致短时间数据不一致，但可接受

### 城市配置
- **D-03:** 通过环境变量配置
  - 变量名: `CITY`（默认: Beijing）
  - 可选: `UNITS`（metric/imperial，默认 metric 摄氏度）
  - 在 EdgeOne Pages 控制台配置

### 错误处理
- **D-04:** API 失败时显示上次成功数据
  - ⚠️ 此决策需要协调缓存策略（内存缓存无法持久化）
  - 建议：使用 KV 存储替代内存缓存，或降级为显示友好文本

### 天气翻译
- **D-05:** 完整中文翻译
  - 需维护天气状况映射表（OpenWeatherMap 英文 → 中文）
  - 示例：Clear→晴朗, Clouds→多云, Rain→雨, Snow→雪

### 标题格式
- **D-06:** 格式: `{城市} {温度}°C {天气} - {HH:MM}`
  - 示例: `北京 22°C 晴朗 - 14:30`
  - 字符数控制在 20 字以内，防止飞书截断

### Claude's Discretion
- 天气映射表的具体实现（Map/Object）
- 缓存键命名规则
- HTML 页面结构（除了 title，body 可简单说明用途）
- API 超时时间设置（建议 5 秒）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### OpenWeatherMap API
- https://openweathermap.org/current — Current Weather API 文档
- https://openweathermap.org/weather-conditions — 天气状况代码列表

### EdgeOne Pages
- `.planning/PROJECT.md` — 项目上下文和约束
- `.planning/REQUIREMENTS.md` — 需求规格

**Note:** No external specs beyond API docs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is a greenfield project

### Established Patterns
- None — new project, freedom to choose patterns

### Integration Points
- EdgeOne Pages Functions — entry point at `functions/weather.js`
- OpenWeatherMap API — external HTTP call
- Feishun Lark — consumer of the page title

</code_context>

<specifics>
## Specific Ideas

- 飞书签名档只显示 title 内容，body 可以放个简单的说明页面
- 天气 API Key 需要用户自己申请（免费）
- 考虑在 body 中显示更详细的天气信息（虽然飞书签名看不到）

</specifics>

<deferred>
## Deferred Ideas

- 多城市支持（通过 URL 参数切换）— Phase 2 if needed
- 天气图标展示 — 飞书签名不支持图片，但网页可以显示
- 7天预报 — 超出当前需求
- 自动定位（IP 地理）— 需要额外服务

**Conflict to resolve:**
- 用户选择了"内存缓存"（D-02）但要求"显示上次成功数据"（D-04）
- 内存缓存无法在实例间共享，建议改用 KV 存储
- Planner should address this in the plan

</deferred>

---

*Phase: 01-mvp*
*Context gathered: 2026-03-30*
