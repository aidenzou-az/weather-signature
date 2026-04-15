# Weather Signature for Feishu

A simple EdgeOne Pages Function that serves a dedicated preview shell for your Feishu (Lark) personal signature and displays current weather.

![Weather Signature Demo](https://via.placeholder.com/600x300/667eea/ffffff?text=Weather+Signature+Demo)

## Overview

This service fetches weather data from OpenWeatherMap, enriches it with forecast precipitation probability, derives the target city's local time and day-phase visual state, caches it for 30 minutes, and serves:

- `/s` as a stable signature-preview page backed by a static rewrite
- `/content` as a new weather content page URL backed by a static rewrite
- `/` and `/weather` as backward-compatible direct weather pages

When you set the signature entry URL in Feishu, your signature preview will show:

```
北京 22°C 晴朗 降水30% - 14:30
```

## Prerequisites

Before you begin, you'll need accounts with:

1. **[OpenWeatherMap](https://openweathermap.org)** — Free tier includes 60 calls/minute
2. **[EdgeOne Pages](https://edgeone.ai/pages)** — For deploying and hosting
3. **[Feishu/Lark](https://www.larksuite.com)** — Where the signature will display

## Quick Start

### 1. Get OpenWeatherMap API Key

1. Sign up for a free account at [openweathermap.org](https://openweathermap.org)
2. Go to your Dashboard → API Keys
3. Generate a new API key (activation may take 10-15 minutes)

### 2. Deploy to EdgeOne Pages

1. Fork or clone this repository
2. Go to [EdgeOne Pages Console](https://edgeone.ai/pages)
3. Create a new project → Import from Git
4. Select your repository

### 3. Configure KV Storage

1. In your EdgeOne Pages project, go to **Settings → KV Storage**
2. Click **Create KV Namespace**
3. Name it `weather-cache` (or any name you prefer)
4. Go to **Bindings** and add a binding:
   - **Variable name**: `WEATHER_KV`
   - **KV namespace**: Select the one you just created

### 4. Set Environment Variables

1. Go to **Settings → Environment Variables**
2. Add the following variables:

| Variable | Value | Required |
|----------|-------|----------|
| `OPENWEATHER_API_KEY` | Your API key from step 1 | ✅ Yes |
| `CITY` | Your city name (e.g., `Shanghai`) | ❌ No (defaults to `Beijing`) |

3. Redeploy your project

### 5. Configure Feishu Signature

1. Copy your deployed EdgeOne Pages signature URL (e.g., `https://your-project.edgeone.app/s`)
2. Open Feishu → **Settings → Personal Info → Signature**
3. Paste the URL as your signature
4. Your signature will now display current weather!

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENWEATHER_API_KEY` | Yes | — | Your OpenWeatherMap API key |
| `CITY` | No | `Beijing` | City name for weather lookup |
| `WEATHER_KV` | Yes* | — | KV namespace binding (set in console) |

*WEATHER_KV is configured in the EdgeOne Pages console, not as a local env variable.

### Supported Cities

Any city name supported by OpenWeatherMap works. Examples:
- `Beijing`, `Shanghai`, `Guangzhou`, `Shenzhen`
- `Tokyo`, `New York`, `London`, `Paris`
- Chinese names also work: `北京`, `上海`

## How It Works

### Caching

- Weather data is cached for **30 minutes** to reduce API calls and improve response time
- On cache hit: response time < 500ms
- On API failure: shows last cached data with a "stale data" warning

### Title Format

The HTML `<title>` tag follows this format:

```
{CITY} {TEMPERATURE}°C {CONDITION} 降水{PRECIPITATION}% - {HH:MM}
```

Example outputs:
- `北京 22°C 晴朗 降水30% - 14:30`
- `上海 26°C 多云 降水10% - 09:15`
- `广州 30°C 小雨 降水65% - 18:45`
- If forecast precipitation is unavailable, the title falls back to `{CITY} {TEMPERATURE}°C {CONDITION} - {HH:MM}`

`HH:MM` uses the target city's local time derived from the weather API timezone field, not the server timezone.

### Precipitation Probability Source

- Current temperature and condition still come from OpenWeatherMap current weather data.
- Precipitation probability is derived from the nearest available item in OpenWeatherMap's 5 day / 3 hour forecast response (`list.pop`).
- If the forecast request fails or the field is unavailable, the page still renders and shows `暂无数据`.

### Day-Phase Rendering

- The HTML weather page also derives a day-phase state from the target city's local time plus sunrise / sunset data in the current weather response.
- The page shifts between `清晨` / `白天` / `黄昏` / `夜晚` without changing the core weather condition logic.
- Day-phase is a visual modulation layer only; current weather type still decides the main motion and atmosphere.

### Short-Term Trend And Advice

- The HTML weather page also uses the first few forecast items to derive a lightweight short-term trend signal.
- The page renders a compact `Next Hours` insight plus a simple outing suggestion such as whether carrying an umbrella is more prudent.
- The trend layer can now describe approaching change windows such as rain moving in, wind feeling stronger later, or humidity building up in the next few hours.
- This remains a summary layer only; the page does not expand into a full hourly forecast table.

### Weather Feel Modulation

- The HTML weather page now also uses current `feels_like`, `humidity`, `wind.speed`, and `wind.deg` from OpenWeatherMap current weather data.
- These fields primarily modulate motion and atmosphere instead of adding more visible metrics.
- Examples: stronger wind speeds accelerate cloud drift, higher humidity thickens haze and dampens landmark clarity, and high feels-like heat shifts the thermal tone toward muggy heat rather than only reading the raw temperature.
- Motion layering is now more directional: wind direction biases cloud drift and rain slant, fog uses a slower independent sweep, and thunder adds a restrained flash layer instead of only increasing rain intensity.

### City Visual Configuration

- City-specific landmark and city-level visual config now live in `lib/city-config.js`.
- The current deployment keeps `Beijing / 北京` mapped to the Temple of Heaven, while unknown cities fall back to a generic skyline.
- Adding another supported city now means extending the config module rather than adding new hard-coded city branches inside render or rule logic.

### Weather Conditions (Chinese)

| Code Range | Condition |
|------------|-----------|
| 800 | 晴朗 |
| 801-802 | 少云/多云 |
| 803-804 | 阴 |
| 500-531 | 雨/小雨/阵雨 |
| 600-622 | 雪 |
| 200-232 | 雷阵雨 |
| 701-781 | 雾/霾 |

## Troubleshooting

### Signature not updating in Feishu

- **Cause**: Feishu caches signature content
- **Solution**: Wait 5-10 minutes, or try clearing Feishu cache

### "City not found" error

- Check the `CITY` environment variable spelling
- Try the English city name (e.g., `Beijing` instead of `北京`)
- Verify the city exists on [OpenWeatherMap](https://openweathermap.org)

### "Invalid API key" error

- New API keys may take 10-15 minutes to activate
- Verify you've copied the full key without spaces
- Check your OpenWeatherMap dashboard for key status

### API rate limit exceeded

- Free tier allows 60 calls/minute
- The 30-minute cache keeps usage well under this limit
- If you have multiple deployments, each may count separately

### Page shows "Weather service temporarily unavailable"

- Check that `WEATHER_KV` binding is configured in EdgeOne console
- Verify environment variables are set correctly
- Check EdgeOne Pages function logs for details

## Project Structure

```
├── functions/
│   ├── index.js          # Root weather page
│   ├── weather.js        # /weather weather page
│   ├── handler.js        # Shared content-page handler
│   ├── html.js           # HTML/XML escaping helpers
│   ├── render.js         # HTML rendering helpers
│   ├── page-data.js      # Shared weather view model
│   └── og-image.js       # Dynamic preview image
├── s.html                # /s static signature-preview page
├── content.html          # /content static weather content page
├── lib/
│   ├── weather.js        # OpenWeatherMap API client
│   ├── cache.js          # KV storage with TTL
│   ├── city-config.js    # City visual configuration
│   └── i18n.js           # Chinese weather translations
├── edgeone.json          # EdgeOne Pages configuration
├── .env.example          # Environment variable template
└── README.md             # This file
```

## Local Development

Currently, EdgeOne Pages Functions require the EdgeOne environment to run. For local testing:

1. Deploy to a staging/preview branch on EdgeOne Pages
2. Use the preview URL for testing
3. Check EdgeOne console logs for debugging

## License

MIT License — feel free to use and modify!

## Credits

- Weather data: [OpenWeatherMap](https://openweathermap.org)
- Hosting: [EdgeOne Pages](https://edgeone.ai/pages)
- Built for: [Feishu/Lark](https://www.larksuite.com)
