import { escapeHtml } from './html.js';

function renderMeta({ title, description, canonicalUrl, ogImageUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonicalUrl = escapeHtml(canonicalUrl);
  const safeOgImageUrl = escapeHtml(ogImageUrl);

  return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Weather Signature">
  <meta property="og:url" content="${safeCanonicalUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeOgImageUrl}">
  <meta property="og:image:type" content="image/svg+xml">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeOgImageUrl}">
  <link rel="canonical" href="${safeCanonicalUrl}">
  <title>${safeTitle}</title>`;
}

export function renderContentPage(data, { canonicalUrl, ogImageUrl }) {
  const title = data.title;
  const safeCity = escapeHtml(data.city);
  const safeTemp = escapeHtml(data.temp);
  const safeCondition = escapeHtml(data.condition);
  const safeTimeStr = escapeHtml(data.timeStr);
  const safeTitle = escapeHtml(data.title);

  return `<!DOCTYPE html>
<html lang="zh-CN" prefix="og: https://ogp.me/ns#">
<head>
${renderMeta({
    title,
    description: title,
    canonicalUrl,
    ogImageUrl
  })}
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
    .entry-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="weather-card">
    <div class="city">${safeCity}</div>
    <div class="temp">${safeTemp}°C</div>
    <div class="condition">${safeCondition}</div>
    <div class="time">更新时间: ${safeTimeStr}</div>
    ${data.isStale ? '<div class="stale-warning">⚠️ 天气数据暂时无法更新，显示为缓存数据</div>' : ''}
  </div>
  <div class="info">
    <p>此页面用于飞书个人签名显示天气</p>
    <p>Title: ${safeTitle}</p>
    <p>推荐签名入口: <a class="entry-link" href="/s">/s</a></p>
  </div>
</body>
</html>`;
}

export function renderErrorPage(error) {
  const safeMessage = escapeHtml(error.message);

  return `<!DOCTYPE html>
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
  <div class="message">${safeMessage}</div>
</body>
</html>`;
}
