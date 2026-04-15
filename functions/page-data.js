import { getCachedWeather } from '../lib/cache.js';
import { getCityDisplayName } from '../lib/city-config.js';
import { getWeatherDescription } from '../lib/i18n.js';
import {
  getDayPhase,
  getDayPhaseLabel,
  getOutingAdvice,
  getShortTermTrendText,
  normalizePrecipitationProbability,
  normalizeShortTermForecast
} from './weather-rules.js';

function getOffsetShiftedDate(offsetSeconds, timestampMs = Date.now()) {
  return new Date(timestampMs + (offsetSeconds * 1000));
}

function formatOffsetTime(offsetSeconds, timestampMs = Date.now()) {
  const shiftedDate = getOffsetShiftedDate(offsetSeconds, timestampMs);
  const hours = String(shiftedDate.getUTCHours()).padStart(2, '0');
  const minutes = String(shiftedDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export async function getWeatherPageData(env) {
  const city = env?.CITY || 'Beijing';
  const cityDisplayName = getCityDisplayName(city);
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
  const feelsLike = Number.isFinite(weather?.main?.feels_like)
    ? Math.round(weather.main.feels_like)
    : temp;
  const humidity = Number.isFinite(weather?.main?.humidity)
    ? Math.max(0, Math.min(100, Math.round(weather.main.humidity)))
    : null;
  const windSpeed = Number.isFinite(weather?.wind?.speed)
    ? Math.max(0, Number(weather.wind.speed))
    : null;
  const windDirection = Number.isFinite(weather?.wind?.deg)
    ? ((Number(weather.wind.deg) % 360) + 360) % 360
    : null;
  const conditionCode = weather.weather[0].id;
  const condition = getWeatherDescription(conditionCode);
  const precipitationProbability = normalizePrecipitationProbability(weather.precipitationProbability);
  const precipitationText = precipitationProbability === null
    ? '暂无数据'
    : `${precipitationProbability}%`;
  const shortTermForecast = normalizeShortTermForecast(weather.shortTermForecast);
  const timezoneOffsetSeconds = Number.isFinite(weather.timezone) ? weather.timezone : 0;
  const nowUnixSeconds = Math.floor(Date.now() / 1000);
  const sunriseUnixSeconds = Number.isFinite(weather?.sys?.sunrise) ? weather.sys.sunrise : null;
  const sunsetUnixSeconds = Number.isFinite(weather?.sys?.sunset) ? weather.sys.sunset : null;
  const timeStr = formatOffsetTime(timezoneOffsetSeconds);
  const dayPhase = getDayPhase(nowUnixSeconds, sunriseUnixSeconds, sunsetUnixSeconds, timezoneOffsetSeconds);
  const dayPhaseLabel = getDayPhaseLabel(dayPhase);
  const shortTermTrendText = getShortTermTrendText(shortTermForecast, conditionCode, precipitationProbability);
  const outingAdvice = getOutingAdvice(shortTermForecast, conditionCode, precipitationProbability, temp, feelsLike);

  const precipitationTitlePart = precipitationProbability === null
    ? ''
    : ` 降水${precipitationProbability}%`;
  const title = `${city} ${temp}°C ${condition}${precipitationTitlePart} - ${timeStr}`;

  return {
    city,
    cityDisplayName,
    temp,
    feelsLike,
    humidity,
    windSpeed,
    windDirection,
    condition,
    conditionCode,
    precipitationProbability,
    precipitationText,
    timeStr,
    dayPhase,
    dayPhaseLabel,
    shortTermForecast,
    shortTermTrendText,
    outingAdvice,
    timezoneOffsetSeconds,
    title,
    isStale
  };
}
