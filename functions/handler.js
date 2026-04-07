// Shared EdgeOne Pages Function handler for both "/" and "/weather"

import { getWeatherPageData } from './page-data.js';

export async function onRequestGet({ request, env }) {
  try {
    const { city, temp, condition, timeStr, title, isStale } = await getWeatherPageData(env);
    const url = new URL(request.url);
    const canonicalUrl = url.toString();
    const ogImageUrl = `${url.origin}/og-image${url.search}`;

    // Generate HTML response
    const html = `<!DOCTYPE html>
<html lang="zh-CN" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${title}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Weather Signature">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${title}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:type" content="image/svg+xml">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${title}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <link rel="canonical" href="${canonicalUrl}">
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
        'Cache-Control': 'no-cache, no-store, must-revalidate'
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
