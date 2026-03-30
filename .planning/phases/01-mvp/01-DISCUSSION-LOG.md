# Phase 1: MVP - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 01-mvp
**Areas discussed:** 天气数据源, 缓存策略, 城市配置, 错误处理, 天气翻译

---

## 天气数据源

| Option | Description | Selected |
|--------|-------------|----------|
| Current Weather API | 免费额度1000次/天，简单够用 | ✓ |
| One Call API 3.0 | 需信用卡验证，数据更丰富 | |
| Geocoding + Current | 支持任意城市名输入 | |

**User's choice:** Current Weather API
**Notes:** 免费额度足够个人使用，接口简单直接

---

## 缓存策略

| Option | Description | Selected |
|--------|-------------|----------|
| Edge Cache API | 使用 Cloudflare Cache API，无需额外存储 | |
| KV 存储 | 带 TTL 的 KV，更灵活 | |
| 内存缓存 | 全局变量/Map，实现简单 | ✓ |

**User's choice:** 内存缓存
**Notes:** 简单实现，但多实例可能不一致。与错误处理决策有冲突需解决。

---

## 城市配置

| Option | Description | Selected |
|--------|-------------|----------|
| 环境变量 | EdgeOne 控制台配置，安全固定 | ✓ |
| URL 参数 | 灵活切换，但 URL 较长 | |
| 硬编码 | 最简单，但改城市需改代码 | |

**User's choice:** 环境变量
**Notes:** 变量名 `CITY`，默认 Beijing

---

## 错误处理

| Option | Description | Selected |
|--------|-------------|----------|
| 友好降级文本 | "天气获取中"等 | |
| 上次成功数据 | 需要持久化存储 | ✓ |
| 静态默认信息 | "北京 --°C 请稍后再试" | |

**User's choice:** 显示上次成功数据
**Notes:** 与内存缓存策略冲突，需要协调或改用 KV

---

## 天气翻译

| Option | Description | Selected |
|--------|-------------|----------|
| 英文原样 | Clear, Clouds 等 | |
| 简单中文 | 晴/多云/雨 | |
| 完整中文 | 晴朗/阴天/小雨 | ✓ |

**User's choice:** 完整中文翻译
**Notes:** 需维护天气状况映射表

---

## Claude's Discretion

None — all areas had explicit user choices

## Deferred Ideas

- 多城市支持（URL 参数）
- 天气图标展示
- 7天预报
- 自动 IP 定位

## Conflicts & Notes

⚠️ **缓存策略 vs 错误处理冲突**
- 选择了"内存缓存"但要求"显示上次成功数据"
- 内存缓存无法在边缘函数实例间共享
- Planner should recommend: use KV storage instead, or change error handling to friendly text
