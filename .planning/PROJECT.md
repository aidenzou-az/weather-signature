# Weather Signature

## What This Is

一个为飞书个人签名档提供动态天气展示的服务。通过生成一个固定 URL，飞书会自动抓取页面标题并显示在签名中，从而实现签名档实时显示最新天气。

## Core Value

让飞书个人签名自动展示所在地最新天气，无需手动更新。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 支持城市配置（默认北京）
- [ ] 调用天气 API 获取实时天气
- [ ] 生成包含天气信息的 HTML 页面
- [ ] 页面标题格式：城市 温度 天气状况 - 更新时间
- [ ] 定时刷新天气数据（每30分钟）
- [ ] 支持 EdgeOne Pages 部署

### Out of Scope

- **多用户系统** — 个人使用，配置写死或环境变量即可
- **天气预警推送** — 超出签名档展示范围
- **历史天气记录** — 无需存储，只展示当前
- **多城市切换** — 固定一个城市足够

## Context

### 技术环境
- **平台**: 腾讯云 EdgeOne Pages（免费边缘托管）
- **运行时**: Cloudflare Workers / Edge Functions
- **天气 API**: OpenWeatherMap（免费额度足够）
- **语言**: JavaScript / TypeScript

### 飞书签名机制
飞书会自动抓取 URL 的 `<title>` 标签内容显示在签名档中。例如：
```html
<title>北京 22°C 晴 - 14:30</title>
```
飞书显示: **北京 22°C 晴 - 14:30**

### 约束
- 页面必须快速加载（边缘缓存）
- 标题字符数不宜过长（飞书截断）
- API 调用频率受限（1000次/天免费额度）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 单HTML页面 | 飞书只抓取标题，无需复杂UI | — Pending |
| OpenWeatherMap | 免费额度足够，国际服务稳定 | — Pending |
| 30分钟缓存 | 天气不会频繁变化，节省API额度 | — Pending |

---

*Last updated: 2026-03-30 after project creation*
