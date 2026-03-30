# Phase 1: MVP - Research

**Researched:** 2026-03-30
**Domain:** Edge Functions (EdgeOne Pages), OpenWeatherMap API, KV Storage
**Confidence:** HIGH

## Summary

This research covers the implementation of a weather signature service using EdgeOne Pages Functions and OpenWeatherMap API. The core challenge is resolving the conflict between the user's choice of "memory cache" and the requirement to "show last successful data on API error" — memory caches don't persist across Edge Function instances.

**Resolution:** EdgeOne Pages provides KV storage (launched December 2024) which offers global persistence with eventual consistency. This is the recommended approach over memory caching for the "last successful data" requirement.

**Primary recommendation:** Use EdgeOne Pages KV storage for weather data caching with 30-minute TTL implemented via timestamp checking, not native TTL (which doesn't exist in EdgeOne KV).

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use OpenWeatherMap Current Weather API (free tier: 1000 calls/day sufficient)
- **D-02:** Memory caching with 30-minute TTL (CONFLICT — see resolution below)
- **D-03:** Environment variable for city config (`CITY=Beijing`, optional `UNITS=metric`)
- **D-04:** API failure must show last successful data (REQUIRES persistent storage)
- **D-05:** Full Chinese weather translation (need mapping table)
- **D-06:** Title format: `{城市} {温度}°C {天气} - {HH:MM}` (example: `北京 22°C 晴朗 - 14:30`)

### Claude's Discretion
- Weather mapping table implementation (Map vs Object)
- Cache key naming conventions
- HTML page structure (title required, body can be simple)
- API timeout setting (recommend 5 seconds)

### Deferred Ideas (OUT OF SCOPE)
- Multi-city support via URL parameters — Phase 2
- Weather icons — Feishu doesn't support images in signatures
- 7-day forecast — beyond current requirements
- Auto-location via IP geolocation — requires additional service

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WTH-01 | Title format: {城市} {温度}°C {天气} - {HH:MM} | Response format from OpenWeatherMap API documented |
| WTH-02 | Configurable city via environment variable | EdgeOne Pages supports env vars via `context.env` |
| WTH-03 | 30-minute auto-refresh | Implement via KV timestamp checking (no native TTL) |
| WTH-04 | Response time < 500ms | KV reads are fast (< 50ms), cache hit avoids API call |
| API-01 | OpenWeatherMap API integration | Endpoint: `api.openweathermap.org/data/2.5/weather` |
| API-02 | Lat/lon query support | API supports `lat` + `lon` params |
| API-03 | Friendly error messages | KV fallback provides last successful data |
| API-04 | Cache weather data | KV storage is the correct solution |
| DEP-01 | EdgeOne Pages deployment | Functions in `/functions/` or `/edge-functions/` directory |
| DEP-02 | Document API key setup | Free tier: 60 calls/min, 1M calls/month |
| DEP-03 | Document Feishu signature URL | Feishu fetches page and extracts `<title>` content |

## Standard Stack

### Core
| Library/Service | Version | Purpose | Why Standard |
|-----------------|---------|---------|--------------|
| EdgeOne Pages Functions | 2025 | Edge compute platform | Native Tencent Cloud integration, free tier generous |
| OpenWeatherMap Current Weather API | v2.5 | Weather data source | Free tier: 1M calls/month, no credit card required |
| EdgeOne Pages KV | 2025 | Persistent cache storage | Global persistence, eventual consistency, free 1GB |

### API Parameters (OpenWeatherMap)
| Parameter | Required | Value | Notes |
|-----------|----------|-------|-------|
| `appid` | Yes | API key | Get from openweathermap.org/api |
| `lat`/`lon` | Yes* | Coordinates | Use Geocoding API to convert city name |
| `q` | Yes* | City name | Built-in geocoding deprecated but still works |
| `units` | No | `metric` | Use for Celsius (default is Kelvin) |
| `lang` | No | `zh_cn` | Returns Chinese descriptions (but we map ourselves) |

*Either lat/lon OR q required

### Response Structure
```json
{
  "coord": {"lon": 116.4, "lat": 39.9},
  "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01d"}],
  "main": {"temp": 22.5, "feels_like": 21.8, "temp_min": 20.1, "temp_max": 24.2, "pressure": 1015, "humidity": 45},
  "visibility": 10000,
  "wind": {"speed": 3.5, "deg": 180},
  "clouds": {"all": 0},
  "dt": 1711800000,
  "sys": {"country": "CN", "sunrise": 1711750000, "sunset": 1711795000},
  "timezone": 28800,
  "id": 1816670,
  "name": "Beijing",
  "cod": 200
}
```

Key fields for title: `name` (city), `main.temp` (temperature), `weather[0].id` (condition code)

## Architecture Patterns

### Recommended Project Structure
```
weather-signature/
├── functions/
│   └── index.js          # Main edge function entry point
├── lib/
│   ├── weather.js        # OpenWeatherMap API client
│   ├── cache.js          # KV storage wrapper with TTL logic
│   └── i18n.js           # Weather condition Chinese translations
├── edgeone.json          # EdgeOne configuration (if needed)
└── package.json          # Dependencies (if any)
```

### Pattern 1: KV Storage with Client-Side TTL
**What:** Store weather data with timestamp, check expiry on read
**When to use:** When you need TTL but the storage doesn't support it natively
**Example:**
```javascript
// Source: EdgeOne Pages KV docs + OpenWeatherMap patterns
async function getCachedWeather(kv, city) {
  const key = `weather:${city}`;
  const cached = await kv.get(key, 'json');

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < 30 * 60 * 1000) { // 30 minutes
      return cached.data; // Cache hit
    }
  }

  // Cache miss or expired - fetch from API
  const data = await fetchWeather(city);
  await kv.put(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  return data;
}
```

### Pattern 2: Graceful Degradation on API Error
**What:** If API fails, return cached data regardless of age
**When to use:** When availability matters more than freshness
**Example:**
```javascript
async function getWeatherWithFallback(kv, city) {
  try {
    return await getCachedWeather(kv, city); // Normal flow
  } catch (apiError) {
    // API failed - try to get ANY cached data
    const cached = await kv.get(`weather:${city}`, 'json');
    if (cached) {
      return { ...cached.data, stale: true }; // Mark as stale
    }
    throw new Error('No weather data available');
  }
}
```

### Pattern 3: Edge Function Entry Point
**What:** Standard EdgeOne Pages function structure
**Example:**
```javascript
// functions/index.js
export default async function onRequest(context) {
  const { request, env } = context;
  const city = env.CITY || 'Beijing';
  const kv = env.WEATHER_KV; // Bound KV namespace

  try {
    const weather = await getWeatherWithFallback(kv, city);
    const title = formatTitle(weather);

    return new Response(generateHTML(title, weather), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return new Response(generateErrorHTML(error), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
```

### Anti-Patterns to Avoid
- **Global variables for cache:** `const cache = new Map()` — doesn't persist across instances
- **Ignoring KV write failures:** Always await `kv.put()` and handle errors
- **Hardcoded API keys:** Use environment variables exclusively
- **No timeout on fetch:** OpenWeatherMap can be slow; set 5-second timeout

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| City name → coordinates | Custom geocoding | OpenWeatherMap Geocoding API | Free, accurate, handles edge cases |
| Weather condition icons | Custom icon set | OpenWeatherMap icon CDN | `https://openweathermap.org/img/wn/{icon}@2x.png` |
| Temperature conversion | Manual math | API `units=metric` parameter | Kelvin→Celsius handled server-side |
| Timezone conversion | Custom logic | API returns `timezone` offset | Use `dt + timezone` for local time |
| HTML templating | String concatenation | Template literals with escaping | Simple enough, no library needed |

## Resolving the Cache Conflict

**The Problem:**
- User chose "memory cache" (D-02) for 30-minute TTL
- User requires "show last successful data on error" (D-04)
- Memory caches are per-instance and don't persist

**The Solution:**
Use **EdgeOne Pages KV storage** instead of memory cache:

| Aspect | Memory Cache | KV Storage |
|--------|--------------|------------|
| Persistence | Per-instance only | Global across all edge nodes |
| Survives API errors | No (lost on instance recycle) | Yes |
| 30-minute TTL | Easy (in-memory) | Implement via timestamp check |
| Free tier limit | N/A | 1 GB storage |
| Consistency | Immediate | Eventual (within 60s) |

**Implementation approach:**
1. Store weather data in KV with timestamp: `{ data, timestamp }`
2. On read: check if `now - timestamp < 30 minutes`
3. If expired: fetch from API, update KV
4. If API fails: return cached data regardless of age (with `stale` flag)

## Weather Condition Code Mapping

OpenWeatherMap uses numeric condition codes. Map `weather[0].id` to Chinese:

| ID Range | Category | Example IDs | Chinese |
|----------|----------|-------------|---------|
| 200-232 | Thunderstorm | 200, 201, 211 | 雷阵雨 |
| 300-321 | Drizzle | 300, 301, 310 | 小雨 |
| 500-504 | Rain (light) | 500, 501, 502 | 雨 |
| 511 | Freezing rain | 511 | 冻雨 |
| 520-531 | Rain (showers) | 520, 521, 522 | 阵雨 |
| 600-602 | Snow | 600, 601, 602 | 雪 |
| 611-613 | Sleet | 611, 612, 613 | 雨夹雪 |
| 615-616 | Rain and snow | 615, 616 | 雨雪 |
| 620-622 | Snow showers | 620, 621, 622 | 阵雪 |
| 701 | Mist | 701 | 薄雾 |
| 711 | Smoke | 711 | 烟霾 |
| 721 | Haze | 721 | 霾 |
| 731 | Dust | 731 | 沙尘 |
| 741 | Fog | 741 | 雾 |
| 751 | Sand | 751 | 沙尘 |
| 761 | Dust | 761 | 浮尘 |
| 762 | Ash | 762 | 火山灰 |
| 771 | Squall | 771 | 阵风 |
| 781 | Tornado | 781 | 龙卷风 |
| 800 | Clear | 800 | 晴朗 |
| 801 | Few clouds | 801 | 少云 |
| 802 | Scattered clouds | 802 | 多云 |
| 803 | Broken clouds | 803 | 阴天 |
| 804 | Overcast | 804 | 阴 |

**Simplified mapping for title (most common):**
```javascript
const weatherMap = {
  200: '雷阵雨', 201: '雷阵雨', 202: '雷阵雨', 210: '雷', 211: '雷',
  500: '小雨', 501: '雨', 502: '大雨', 503: '暴雨', 504: '大暴雨',
  600: '小雪', 601: '雪', 602: '大雪',
  701: '雾', 711: '霾', 721: '霾', 741: '雾',
  800: '晴朗',
  801: '少云', 802: '多云', 803: '阴', 804: '阴'
};
// Default: weather[0].main (Clear, Clouds, Rain, etc.)
```

## EdgeOne Pages KV API Reference

### Binding Setup
1. Create KV namespace in EdgeOne console
2. Bind to project with variable name (e.g., `WEATHER_KV`)
3. Access via `context.env.WEATHER_KV` in functions

### JavaScript API
```javascript
const kv = context.env.WEATHER_KV;

// Write (max 25MB value, 512B key)
await kv.put('key', 'value');
await kv.put('key', JSON.stringify(obj));

// Read
const text = await kv.get('key');           // Returns string or null
const obj = await kv.get('key', 'json');    // Returns parsed object
const buf = await kv.get('key', 'arrayBuffer');

// Delete
await kv.delete('key');

// List keys (pagination)
const result = await kv.list({ prefix: 'weather:', limit: 10 });
// result: { complete: boolean, cursor: string|null, keys: [{key: string}] }
```

### Limitations
- **No native TTL:** Must implement expiration via timestamp checking
- **No atomic operations:** No INCR, EXPIRE, etc. like Redis
- **Eventual consistency:** Writes propagate globally within 60 seconds
- **Key format:** Alphanumeric + underscore only, max 512 bytes

## Common Pitfalls

### Pitfall 1: Assuming Memory Cache Persists
**What goes wrong:** Using `const cache = new Map()` and expecting data to survive across requests
**Why it happens:** Edge Functions are stateless; each request may hit a different instance
**How to avoid:** Use KV storage for any data that must survive across requests
**Warning signs:** "Sometimes the cache works, sometimes it doesn't"

### Pitfall 2: KV Write Without Await
**What goes wrong:** `kv.put(key, value)` without await — data may not be written before function ends
**Why it happens:** Edge Functions have 200ms CPU limit; unawaited promises may not complete
**How to avoid:** Always `await kv.put()` or use `context.waitUntil(kv.put(...))` for fire-and-forget
**Warning signs:** Data appears to save but disappears on next request

### Pitfall 3: OpenWeatherMap Rate Limiting
**What goes wrong:** 429 errors after deployment due to too many requests
**Why it happens:** Free tier is 60 calls/minute; cache miss storms can hit this
**How to avoid:** Always check cache before API call; implement exponential backoff
**Warning signs:** API works locally but fails in production

### Pitfall 4: Ignoring API Timeout
**What goes wrong:** Function times out waiting for OpenWeatherMap
**Why it happens:** Edge Functions have execution limits; external APIs can be slow
**How to avoid:** Set 5-second timeout on fetch; fall to cache on timeout
**Warning signs:** Intermittent 500 errors, slow responses

### Pitfall 5: Chinese Character Encoding
**What goes wrong:** Garbled Chinese in title or response
**Why it happens:** Missing charset declaration or incorrect encoding
**How to avoid:** Always use `charset=utf-8` in Content-Type headers
**Warning signs:** `\u5317\u4eac` instead of `北京` in output

## Code Examples

### OpenWeatherMap API Call
```javascript
// Source: openweathermap.org/current
async function fetchWeather(apiKey, city) {
  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('q', city);
  url.searchParams.set('appid', apiKey);
  url.searchParams.set('units', 'metric');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
```

### HTML Response Generation
```javascript
function generateHTML(title, weather) {
  const staleBadge = weather.stale ? ' [缓存]' : '';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}${staleBadge}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>天气签名服务</h1>
  <p>当前显示: ${title}</p>
  <p>更新时间: ${new Date().toLocaleString('zh-CN')}</p>
  ${weather.stale ? '<p style="color: orange;">⚠️ 数据可能不是最新的</p>' : ''}
</body>
</html>`;
}
```

### Title Formatting
```javascript
function formatTitle(weatherData) {
  const city = weatherData.name;
  const temp = Math.round(weatherData.main.temp);
  const conditionId = weatherData.weather[0].id;
  const condition = WEATHER_MAP[conditionId] || weatherData.weather[0].main;
  const time = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return `${city} ${temp}°C ${condition} - ${time}`;
}
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| EdgeOne Pages | Deployment | ✓ | 2025 | — |
| KV Storage | Cache persistence | ✓ | 2025 | None (required) |
| OpenWeatherMap API | Weather data | ✓ | v2.5 | None (required) |
| Git | Deployment | ✓ | — | Manual upload |

**Missing dependencies with no fallback:**
- OpenWeatherMap API key (user must provide)
- EdgeOne Pages account (user must have)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cloudflare Workers | EdgeOne Pages | Dec 2024 | Tencent's alternative, similar APIs |
| Memory caching | KV storage | Dec 2024 | EdgeOne Pages launched KV |
| Built-in geocoding | Geocoding API | 2024 | OpenWeatherMap deprecated built-in geocoding |

**Deprecated/outdated:**
- OpenWeatherMap built-in geocoding (still works but deprecated)
- One Call API 2.5 (being phased out for 3.0)

## Open Questions

1. **Does EdgeOne Pages KV have a free tier limit that affects us?**
   - What we know: 1 GB storage, 10 namespaces per account
   - What's unclear: Read/write operation limits
   - Recommendation: Monitor usage; weather data is small (~200 bytes per city)

2. **Should we implement stale-while-revalidate pattern?**
   - What we know: Current plan blocks on API call if cache expired
   - What's unclear: Whether returning stale data immediately + background refresh is better
   - Recommendation: Start with blocking approach; optimize if latency issues arise

3. **How to handle city names with special characters?**
   - What we know: KV keys are alphanumeric + underscore only
   - What's unclear: Best encoding for city names like "New York" or "São Paulo"
   - Recommendation: Use URL-safe base64 or simple slugify (beijing, new_york)

## Sources

### Primary (HIGH confidence)
- [OpenWeatherMap Current Weather API](https://openweathermap.org/current) - Endpoint, parameters, response format
- [OpenWeatherMap Weather Conditions](https://openweathermap.org/weather-conditions) - Condition codes and descriptions
- [OpenWeatherMap Pricing](https://openweathermap.org/full-price) - Free tier limits (60/min, 1M/month)
- [EdgeOne Pages Edge Functions](https://pages.edgeone.ai/document/edge-functions) - Function structure, runtime APIs
- [EdgeOne Pages KV Storage](https://pages.edgeone.ai/document/kv-storage) - KV API, limits, binding

### Secondary (MEDIUM confidence)
- [Cloudflare Workers KV docs](https://developers.cloudflare.com/kv/concepts/how-kv-works/) - Eventual consistency model (EdgeOne KV similar)
- [Cloudflare Cache API vs KV 2025](https://developers.cloudflare.com/kv/examples/cache-data-with-workers-kv/) - Caching patterns

### Tertiary (LOW confidence)
- Community examples on GitHub for EdgeOne Pages patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs verified
- Architecture: HIGH - EdgeOne Pages docs + working examples
- Pitfalls: MEDIUM - Based on Cloudflare Workers experience (similar platform)

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (EdgeOne Pages is new and evolving rapidly)
