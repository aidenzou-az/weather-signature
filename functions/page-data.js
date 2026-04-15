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

function getWeatherFamily(conditionCode) {
  if (!Number.isFinite(conditionCode)) {
    return 'unknown';
  }
  if (conditionCode >= 200 && conditionCode < 300) {
    return 'thunder';
  }
  if ((conditionCode >= 300 && conditionCode < 400) || (conditionCode >= 500 && conditionCode < 600)) {
    return 'rain';
  }
  if (conditionCode >= 600 && conditionCode < 700) {
    return 'snow';
  }
  if (conditionCode >= 700 && conditionCode < 800) {
    return 'atmosphere';
  }
  if (conditionCode === 800) {
    return 'clear';
  }
  if (conditionCode > 800 && conditionCode < 900) {
    return 'clouds';
  }
  return 'unknown';
}

function normalizeShortTermForecast(summary) {
  if (!summary || typeof summary !== 'object') {
    return null;
  }

  const nextPrecipitationProbability = normalizePrecipitationProbability(summary.nextPrecipitationProbability);
  const peakPrecipitationProbability = normalizePrecipitationProbability(summary.peakPrecipitationProbability);
  const peakOffsetHours = Number.isFinite(summary.peakOffsetHours) ? Math.max(1, Math.round(summary.peakOffsetHours)) : null;
  const rainStartOffsetHours = Number.isFinite(summary.rainStartOffsetHours) ? Math.max(1, Math.round(summary.rainStartOffsetHours)) : null;
  const trendDirection = ['up', 'down', 'steady'].includes(summary.trendDirection)
    ? summary.trendDirection
    : 'steady';

  if (nextPrecipitationProbability === null && peakPrecipitationProbability === null) {
    return null;
  }

  return {
    nextPrecipitationProbability,
    peakPrecipitationProbability: peakPrecipitationProbability ?? nextPrecipitationProbability,
    peakOffsetHours,
    rainStartOffsetHours,
    trendDirection
  };
}

function getShortTermTrendText(forecastSummary, conditionCode, precipitationProbability) {
  const forecast = normalizeShortTermForecast(forecastSummary);

  if (!forecast) {
    if (precipitationProbability === null) {
      return '短时趋势暂缺';
    }
    if (precipitationProbability >= 60) {
      return '未来3小时湿润感较强';
    }
    if (precipitationProbability <= 20) {
      return '未来数小时降水偏低';
    }
    return '未来3小时天气平稳';
  }

  const weatherFamily = getWeatherFamily(conditionCode);
  const peakPop = forecast.peakPrecipitationProbability;
  const peakHours = forecast.peakOffsetHours || 3;
  const rainStartHours = forecast.rainStartOffsetHours;

  if ((weatherFamily === 'rain' || weatherFamily === 'thunder') && forecast.trendDirection === 'down') {
    return '短时降水逐步减弱';
  }
  if ((weatherFamily === 'rain' || weatherFamily === 'thunder') && forecast.trendDirection !== 'down') {
    return '未来3小时仍有降雨';
  }
  if (peakPop >= 70 && rainStartHours !== null) {
    return rainStartHours <= 3
      ? '未来3小时降水走强'
      : `约${rainStartHours}小时后降水抬升`;
  }
  if (forecast.trendDirection === 'up' && peakPop >= 40) {
    return `未来${peakHours}小时湿润感增强`;
  }
  if (forecast.trendDirection === 'down' && peakPop <= 40) {
    return '未来数小时云雨走弱';
  }
  if (peakPop <= 20) {
    return '未来数小时降水偏低';
  }
  return '未来数小时变化平稳';
}

function getOutingAdvice(forecastSummary, conditionCode, precipitationProbability, temp) {
  const weatherFamily = getWeatherFamily(conditionCode);
  const forecast = normalizeShortTermForecast(forecastSummary);
  const peakPop = forecast?.peakPrecipitationProbability ?? precipitationProbability;

  if (weatherFamily === 'rain' || weatherFamily === 'thunder') {
    return '建议带伞出门';
  }
  if (peakPop !== null && peakPop >= 70) {
    return '备伞更稳妥';
  }
  if (peakPop !== null && peakPop >= 40) {
    return '外出留意降水变化';
  }
  if (temp <= 5) {
    return '出门注意保暖';
  }
  if (temp >= 28) {
    return '适合轻装出门';
  }
  return '适合按当前天气出行';
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
  const shortTermForecast = normalizeShortTermForecast(weather.shortTermForecast);
  const timezoneOffsetSeconds = Number.isFinite(weather.timezone) ? weather.timezone : 0;
  const nowUnixSeconds = Math.floor(Date.now() / 1000);
  const sunriseUnixSeconds = Number.isFinite(weather?.sys?.sunrise) ? weather.sys.sunrise : null;
  const sunsetUnixSeconds = Number.isFinite(weather?.sys?.sunset) ? weather.sys.sunset : null;
  const timeStr = formatOffsetTime(timezoneOffsetSeconds);
  const dayPhase = getDayPhase(nowUnixSeconds, sunriseUnixSeconds, sunsetUnixSeconds, timezoneOffsetSeconds);
  const dayPhaseLabel = getDayPhaseLabel(dayPhase);
  const shortTermTrendText = getShortTermTrendText(shortTermForecast, conditionCode, precipitationProbability);
  const outingAdvice = getOutingAdvice(shortTermForecast, conditionCode, precipitationProbability, temp);

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
    shortTermForecast,
    shortTermTrendText,
    outingAdvice,
    timezoneOffsetSeconds,
    title,
    isStale
  };
}
