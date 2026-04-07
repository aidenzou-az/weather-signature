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

export function renderShellPage(data, { canonicalUrl, contentUrl, ogImageUrl }) {
  const shellTitle = `${data.title} | Feishu Signature`;
  const shellDescription = `Feishu signature preview for ${data.title}`;
  const safeContentUrl = escapeHtml(contentUrl);
  const safeCondition = escapeHtml(data.condition);
  const safeTemp = escapeHtml(data.temp);
  const safeCity = escapeHtml(data.city);

  return `<!DOCTYPE html>
<html lang="zh-CN" prefix="og: https://ogp.me/ns#">
<head>
${renderMeta({
    title: shellTitle,
    description: shellDescription,
    canonicalUrl,
    ogImageUrl
  })}
  <style>
    :root {
      color-scheme: light;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background:
        radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 24%),
        linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .shell {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
    }
    .frame {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      background: white;
    }
    .badge {
      position: absolute;
      top: 24px;
      left: 24px;
      z-index: 1;
      padding: 10px 16px;
      border-radius: 999px;
      background: rgba(9, 15, 47, 0.4);
      backdrop-filter: blur(14px);
      font-size: 14px;
      letter-spacing: 0.02em;
    }
    .footer {
      position: absolute;
      left: 24px;
      right: 24px;
      bottom: 24px;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      border-radius: 20px;
      background: rgba(9, 15, 47, 0.45);
      backdrop-filter: blur(16px);
    }
    .summary {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .summary strong {
      font-size: 18px;
      font-weight: 700;
    }
    .summary span {
      font-size: 14px;
      opacity: 0.86;
    }
    .open-link {
      color: white;
      text-decoration: none;
      padding: 10px 16px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.16);
      font-weight: 600;
      white-space: nowrap;
    }
    .noscript {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .noscript-card {
      max-width: 560px;
      padding: 32px;
      border-radius: 24px;
      background: rgba(9, 15, 47, 0.45);
      backdrop-filter: blur(16px);
      text-align: center;
    }
    .noscript-card a {
      color: white;
      font-weight: 700;
    }
    @media (max-width: 720px) {
      .footer {
        flex-direction: column;
        align-items: flex-start;
      }
      .open-link {
        width: 100%;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="badge">Feishu Signature Preview</div>
    <iframe class="frame" src="${safeContentUrl}" title="Weather signature content"></iframe>
    <div class="footer">
      <div class="summary">
        <strong>${safeCity} ${safeTemp}°C ${safeCondition}</strong>
        <span>稳定预览入口，适合填入飞书个人签名</span>
      </div>
      <a class="open-link" href="${safeContentUrl}">打开天气内容页</a>
    </div>
    <noscript>
      <div class="noscript">
        <div class="noscript-card">
          <p>此链接用于飞书个人签名预览。</p>
          <p><a href="${safeContentUrl}">点击打开天气内容页</a></p>
        </div>
      </div>
    </noscript>
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
