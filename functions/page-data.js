import { getCachedWeather } from '../lib/cache.js';
import { getWeatherDescription } from '../lib/i18n.js';

function normalizePrecipitationProbability(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getOffsetShiftedDate(offsetSeconds, timestampMs = Date.now()) {
  return new Date(timestampMs + (offsetSeconds * 1000));
}

function formatOffsetTime(offsetSeconds, timestampMs = Date.now()) {
  const shiftedDate = getOffsetShiftedDate(offsetSeconds, timestampMs);
  const hours = String(shiftedDate.getUTCHours()).padStart(2, '0');
  const minutes = String(shiftedDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getDayPhaseByHour(localHour) {
  if (localHour >= 5 && localHour < 11) {
    return 'morning';
  }
  if (localHour >= 11 && localHour < 17) {
    return 'day';
  }
  if (localHour >= 17 && localHour < 20) {
    return 'dusk';
  }
  return 'night';
}

function getDayPhase(nowUnixSeconds, sunriseUnixSeconds, sunsetUnixSeconds, offsetSeconds) {
  if (Number.isFinite(sunriseUnixSeconds) && Number.isFinite(sunsetUnixSeconds)) {
    const morningEnd = sunriseUnixSeconds + (2.5 * 60 * 60);
    const duskStart = sunsetUnixSeconds - (1.75 * 60 * 60);
    const nightStart = sunsetUnixSeconds + (0.75 * 60 * 60);

    if (nowUnixSeconds < sunriseUnixSeconds || nowUnixSeconds >= nightStart) {
      return 'night';
    }
    if (nowUnixSeconds < morningEnd) {
      return 'morning';
    }
    if (nowUnixSeconds >= duskStart) {
      return 'dusk';
    }
    return 'day';
  }

  return getDayPhaseByHour(getOffsetShiftedDate(offsetSeconds).getUTCHours());
}

function getDayPhaseLabel(dayPhase) {
  switch (dayPhase) {
    case 'morning':
      return '清晨';
    case 'day':
      return '白天';
    case 'dusk':
      return '黄昏';
    case 'night':
    default:
      return '夜晚';
  }
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
  const timezoneOffsetSeconds = Number.isFinite(weather.timezone) ? weather.timezone : 0;
  const nowUnixSeconds = Math.floor(Date.now() / 1000);
  const sunriseUnixSeconds = Number.isFinite(weather?.sys?.sunrise) ? weather.sys.sunrise : null;
  const sunsetUnixSeconds = Number.isFinite(weather?.sys?.sunset) ? weather.sys.sunset : null;
  const timeStr = formatOffsetTime(timezoneOffsetSeconds);
  const dayPhase = getDayPhase(nowUnixSeconds, sunriseUnixSeconds, sunsetUnixSeconds, timezoneOffsetSeconds);
  const dayPhaseLabel = getDayPhaseLabel(dayPhase);

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
    dayPhase,
    dayPhaseLabel,
    timezoneOffsetSeconds,
    title,
    isStale
  };
}
