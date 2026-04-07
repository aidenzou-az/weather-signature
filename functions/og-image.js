import { getWeatherPageData } from './page-data.js';
import { escapeXml } from './html.js';

export async function onRequestGet({ env }) {
  try {
    const { city, temp, condition, timeStr, isStale } = await getWeatherPageData(env);

    const staleText = isStale ? '缓存数据' : '实时更新';
    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#667EEA"/>
      <stop offset="1" stop-color="#764BA2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)"/>
  <circle cx="1030" cy="110" r="120" fill="white" fill-opacity="0.08"/>
  <circle cx="930" cy="40" r="48" fill="white" fill-opacity="0.08"/>
  <text x="80" y="120" fill="white" fill-opacity="0.9" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="42">${escapeXml(city)}</text>
  <text x="80" y="320" fill="white" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="170" font-weight="700">${escapeXml(temp)}°C</text>
  <text x="80" y="410" fill="white" fill-opacity="0.95" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="68">${escapeXml(condition)}</text>
  <text x="80" y="500" fill="white" fill-opacity="0.82" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="34">更新时间 ${escapeXml(timeStr)}</text>
  <text x="80" y="560" fill="white" fill-opacity="0.7" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="28">Feishu Weather Signature · ${escapeXml(staleText)}</text>
</svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new Response('Failed to render OG image', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
}
