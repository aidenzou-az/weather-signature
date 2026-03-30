# Weather Signature for Feishu

A simple EdgeOne Pages Function that displays current weather in your Feishu (Lark) personal signature.

![Weather Signature Demo](https://via.placeholder.com/600x300/667eea/ffffff?text=Weather+Signature+Demo)

## Overview

This service fetches weather data from OpenWeatherMap, caches it for 30 minutes, and displays it in an HTML page title. When you set this page as your Feishu signature URL, your signature will automatically show:

```
北京 22°C 晴朗 - 14:30
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

1. Copy your deployed EdgeOne Pages URL (e.g., `https://your-project.edgeone.app`)
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

The HTML `<title>` tag (which Feishu reads) follows this format:

```
{CITY} {TEMPERATURE}°C {CONDITION} - {HH:MM}
```

Example outputs:
- `北京 22°C 晴朗 - 14:30`
- `上海 26°C 多云 - 09:15`
- `广州 30°C 小雨 - 18:45`

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
│   └── index.js          # Edge function entry point
├── lib/
│   ├── weather.js        # OpenWeatherMap API client
│   ├── cache.js          # KV storage with TTL
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
