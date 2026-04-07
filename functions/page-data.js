import { getCachedWeather } from '../lib/cache.js';
import { getWeatherDescription } from '../lib/i18n.js';

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

  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const title = `${city} ${temp}°C ${condition} - ${timeStr}`;

  return {
    city,
    temp,
    condition,
    timeStr,
    title,
    isStale
  };
}
