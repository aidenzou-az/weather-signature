// Shared EdgeOne Pages Function handler for both "/" and "/weather"

import { getCachedWeather } from '../lib/cache.js';
import { getWeatherDescription } from '../lib/i18n.js';

export async function onRequestGet({ env }) {
  try {
    // Read configuration from environment
    const city = env?.CITY || 'Beijing';
    const apiKey = env?.OPENWEATHER_API_KEY;
    // EdgeOne KV is a global binding
    const kv = WEATHER_KV;

    // Validate required environment variables
    if (!apiKey) {
      throw new Error('OPENWEATHER_API_KEY environment variable is required');
    }
    if (!kv) {
      throw new Error('WEATHER_KV binding is required');
    }

    // Fetch weather data (cached or fresh)
    const result = await getCachedWeather(kv, apiKey, city);
    const weather = result.data;
    const isStale = result.stale || false;

    // Extract weather info
    const temp = Math.round(weather.main.temp);
    const conditionCode = weather.weather[0].id;
    const condition = getWeatherDescription(conditionCode);

    // Format current time (HH:MM)
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Format title: {城市} {温度}°C {天气} - {HH:MM}
    const title = `${city} ${temp}°C ${condition} - ${timeStr}`;

    // Generate HTML response
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${title}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${title}">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
      color: #333;
    }
    .weather-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 40px;
      color: white;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .city { font-size: 24px; opacity: 0.9; margin-bottom: 10px; }
    .temp { font-size: 72px; font-weight: 300; line-height: 1; }
    .condition { font-size: 28px; margin: 20px 0; }
    .time { font-size: 18px; opacity: 0.8; margin-top: 20px; }
    .stale-warning {
      background: #ff6b6b;
      color: white;
      padding: 10px;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 14px;
    }
    .info { margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="weather-card">
    <div class="city">${city}</div>
    <div class="temp">${temp}°C</div>
    <div class="condition">${condition}</div>
    <div class="time">更新时间: ${timeStr}</div>
    ${isStale ? '<div class="stale-warning">⚠️ 天气数据暂时无法更新，显示为缓存数据</div>' : ''}
  </div>
  <div class="info">
    <p>此页面用于飞书个人签名显示天气</p>
    <p>Title: ${title}</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    const errorHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>天气服务暂时不可用</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    .error { color: #e74c3c; font-size: 48px; margin-bottom: 20px; }
    .message { color: #666; font-size: 18px; }
  </style>
</head>
<body>
  <div class="error">⚠️</div>
  <div class="message">${error.message}</div>
</body>
</html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
}
