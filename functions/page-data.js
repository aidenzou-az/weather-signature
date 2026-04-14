import { getCachedWeather } from '../lib/cache.js';
import { getWeatherDescription } from '../lib/i18n.js';

function normalizePrecipitationProbability(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function getWeatherPageData(env) {
  const city = env?.CITY || 'Beijing';
  const apiKey = env?.OPENWEATHER_API_KEY;
  // EdgeOne KV is a global binding
  const kv = WEATHER_KV;

  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY environment variable is required');
  }
  if (!kv) {
    throw new Error('WEATHER_KV binding is required');
  }

  const result = await getCachedWeather(kv, apiKey, city);
  const weather = result.data;
  const isStale = result.stale || false;

  const temp = Math.round(weather.main.temp);
  const conditionCode = weather.weather[0].id;
  const condition = getWeatherDescription(conditionCode);
  const precipitationProbability = normalizePrecipitationProbability(weather.precipitationProbability);
  const precipitationText = precipitationProbability === null
    ? '暂无数据'
    : `${precipitationProbability}%`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const precipitationTitlePart = precipitationProbability === null
    ? ''
    : ` 降水${precipitationProbability}%`;
  const title = `${city} ${temp}°C ${condition}${precipitationTitlePart} - ${timeStr}`;

  return {
    city,
    temp,
    condition,
    conditionCode,
    precipitationProbability,
    precipitationText,
    timeStr,
    title,
    isStale
  };
}
