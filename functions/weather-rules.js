import { getCityVisualConfig } from '../lib/city-config.js';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getOffsetShiftedDate(offsetSeconds, timestampMs = Date.now()) {
  return new Date(timestampMs + (offsetSeconds * 1000));
}

function normalizeDegrees(value, fallback = 0) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return ((Number(value) % 360) + 360) % 360;
}

function getMotionVector(headingDegrees, distance, verticalScale = 0.42) {
  const radians = normalizeDegrees(headingDegrees) * (Math.PI / 180);
  const x = Math.sin(radians) * distance;
  const y = -Math.cos(radians) * distance * verticalScale;

  return {
    x: Math.round(x),
    y: Math.round(y)
  };
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

function getTemperatureTheme(temp) {
  if (temp <= 5) {
    return {
      skyTop: '#0f1c3f',
      skyBottom: '#3c6df0',
      glow: '#9fd3ff',
      surface: 'rgba(7, 18, 44, 0.72)',
      border: 'rgba(173, 222, 255, 0.28)',
      accent: '#bce7ff',
      thermalLabel: '冷空气增强'
    };
  }

  if (temp <= 20) {
    return {
      skyTop: '#123b56',
      skyBottom: '#3f8db5',
      glow: '#ffe39a',
      surface: 'rgba(10, 31, 47, 0.68)',
      border: 'rgba(181, 229, 255, 0.24)',
      accent: '#daf4ff',
      thermalLabel: '舒适流动'
    };
  }

  if (temp <= 28) {
    return {
      skyTop: '#21435f',
      skyBottom: '#ef8e52',
      glow: '#ffd26e',
      surface: 'rgba(34, 24, 39, 0.62)',
      border: 'rgba(255, 223, 159, 0.24)',
      accent: '#fff1bf',
      thermalLabel: '暖光扩散'
    };
  }

  return {
    skyTop: '#341a37',
    skyBottom: '#ff7b54',
    glow: '#ffb35c',
    surface: 'rgba(47, 17, 28, 0.64)',
    border: 'rgba(255, 193, 128, 0.28)',
    accent: '#ffe0b5',
    thermalLabel: '热浪脉冲'
  };
}

function getDayPhaseState(dayPhase, weatherFamily) {
  const cloudDimming = weatherFamily === 'clouds' || weatherFamily === 'rain' || weatherFamily === 'thunder';

  switch (dayPhase) {
    case 'morning':
      return {
        phaseLabel: '清晨',
        overlayTop: 'rgba(255, 205, 136, 0.24)',
        overlayBottom: 'rgba(255, 243, 214, 0.06)',
        rimLight: 'rgba(255, 229, 176, 0.34)',
        starOpacity: cloudDimming ? 0.02 : 0.06,
        landmarkOpacity: 0.96,
        haloScale: 1.08,
        orbitOpacity: 1.04
      };
    case 'dusk':
      return {
        phaseLabel: '黄昏',
        overlayTop: 'rgba(255, 144, 106, 0.28)',
        overlayBottom: 'rgba(69, 46, 93, 0.14)',
        rimLight: 'rgba(255, 198, 137, 0.24)',
        starOpacity: cloudDimming ? 0.08 : 0.18,
        landmarkOpacity: 0.88,
        haloScale: 0.92,
        orbitOpacity: 0.92
      };
    case 'night':
      return {
        phaseLabel: '夜晚',
        overlayTop: 'rgba(8, 17, 44, 0.48)',
        overlayBottom: 'rgba(2, 8, 24, 0.28)',
        rimLight: 'rgba(132, 185, 255, 0.18)',
        starOpacity: cloudDimming ? 0.1 : 0.38,
        landmarkOpacity: 0.82,
        haloScale: 0.8,
        orbitOpacity: 0.82
      };
    case 'day':
    default:
      return {
        phaseLabel: '白天',
        overlayTop: 'rgba(255, 255, 255, 0.08)',
        overlayBottom: 'rgba(255, 255, 255, 0)',
        rimLight: 'rgba(255, 255, 255, 0.16)',
        starOpacity: 0,
        landmarkOpacity: 1,
        haloScale: 1,
        orbitOpacity: 1
      };
  }
}

export function normalizePrecipitationProbability(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getWeatherFamily(conditionCode) {
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

function getWeatherVariant(conditionCode, weatherFamily, humidity, windSpeed) {
  if (weatherFamily === 'rain') {
    if (conditionCode >= 300 && conditionCode < 400) {
      return 'drizzle';
    }
    if (conditionCode >= 520 && conditionCode < 600) {
      return 'showers';
    }
    return 'steady-rain';
  }

  if (weatherFamily === 'clouds') {
    if (conditionCode >= 803) {
      return 'overcast';
    }
    return 'broken-clouds';
  }

  if (weatherFamily === 'atmosphere') {
    if (conditionCode === 701 || conditionCode === 741) {
      return 'fog';
    }
    if ([721, 731, 751, 761, 762].includes(conditionCode)) {
      return 'haze';
    }
    if (humidity >= 85) {
      return 'fog';
    }
    return 'mist';
  }

  if (weatherFamily === 'thunder') {
    return windSpeed >= 9 || conditionCode >= 210 ? 'active-thunder' : 'distant-thunder';
  }

  if (weatherFamily === 'snow') {
    return windSpeed >= 7 ? 'wind-snow' : 'soft-snow';
  }

  return 'default';
}

function getThermalLabel(theme, { temp, feelsLike, humidity, windSpeed }) {
  if (feelsLike <= 0) {
    return windSpeed >= 6 ? '风寒贴面' : '冷感贴地';
  }
  if (feelsLike <= 8) {
    return windSpeed >= 6 ? '风寒明显' : '冷空气增强';
  }
  if (feelsLike >= 33 || (feelsLike >= 29 && humidity >= 70)) {
    return '闷热滞留';
  }
  if (feelsLike >= 28) {
    return humidity >= 70 ? '热感裹身' : '热感抬升';
  }
  if (humidity >= 80 && temp >= 22) {
    return '湿气堆积';
  }
  if (windSpeed >= 8) {
    return '风感明显';
  }
  return theme.thermalLabel;
}

function getWeatherStatusLabel({
  weatherFamily,
  weatherVariant,
  precipitationProbability,
  humidity,
  windSpeed,
  temp,
  feelsLike
}) {
  switch (weatherFamily) {
    case 'thunder':
      return weatherVariant === 'active-thunder'
        ? '雷雨压境'
        : '雷声逼近';
    case 'rain':
      if (weatherVariant === 'drizzle') {
        return humidity >= 80 ? '潮雾细雨' : '细雨铺开';
      }
      if (weatherVariant === 'showers') {
        return precipitationProbability >= 60 ? '阵雨来回' : '云间阵雨';
      }
      return precipitationProbability >= 70 ? '降雨进行中' : '雨势渐密';
    case 'clouds':
      if (weatherVariant === 'overcast') {
        return precipitationProbability >= 60 ? '阴云蓄雨' : '厚云压城';
      }
      return humidity >= 70 ? '云隙带潮' : '流云铺展';
    case 'snow':
      return weatherVariant === 'wind-snow' ? '风雪掠过' : '雪意渐浓';
    case 'atmosphere':
      if (weatherVariant === 'fog') {
        return '雾幕低垂';
      }
      if (weatherVariant === 'haze') {
        return '灰霾弥散';
      }
      return '湿雾流动';
    case 'clear':
      if (feelsLike >= 30 || (temp >= 28 && humidity >= 70)) {
        return '晴热上扬';
      }
      if (humidity >= 75 && precipitationProbability >= 30) {
        return '晴空带潮';
      }
      if (windSpeed >= 8) {
        return '晴空带风';
      }
      return '晴空舒展';
    default:
      return '天气流动';
  }
}

export function getDayPhase(nowUnixSeconds, sunriseUnixSeconds, sunsetUnixSeconds, offsetSeconds) {
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

  return getDayPhaseByHour(getOffsetShiftedDate(offsetSeconds, nowUnixSeconds * 1000).getUTCHours());
}

export function getDayPhaseLabel(dayPhase) {
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

export function normalizeShortTermForecast(summary) {
  if (!summary || typeof summary !== 'object') {
    return null;
  }

  const nextPrecipitationProbability = normalizePrecipitationProbability(summary.nextPrecipitationProbability);
  const peakPrecipitationProbability = normalizePrecipitationProbability(summary.peakPrecipitationProbability);
  const peakOffsetHours = Number.isFinite(summary.peakOffsetHours) ? Math.max(1, Math.round(summary.peakOffsetHours)) : null;
  const rainStartOffsetHours = Number.isFinite(summary.rainStartOffsetHours) ? Math.max(1, Math.round(summary.rainStartOffsetHours)) : null;
  const transitionOffsetHours = Number.isFinite(summary.transitionOffsetHours) ? Math.max(1, Math.round(summary.transitionOffsetHours)) : null;
  const windRiseOffsetHours = Number.isFinite(summary.windRiseOffsetHours) ? Math.max(1, Math.round(summary.windRiseOffsetHours)) : null;
  const humidityRiseOffsetHours = Number.isFinite(summary.humidityRiseOffsetHours) ? Math.max(1, Math.round(summary.humidityRiseOffsetHours)) : null;
  const transitionConditionCode = Number.isFinite(summary.transitionConditionCode) ? summary.transitionConditionCode : null;
  const nextConditionCode = Number.isFinite(summary.nextConditionCode) ? summary.nextConditionCode : null;
  const peakWindSpeed = Number.isFinite(summary.peakWindSpeed) ? Number(summary.peakWindSpeed) : null;
  const peakHumidity = Number.isFinite(summary.peakHumidity) ? Math.max(0, Math.min(100, Math.round(summary.peakHumidity))) : null;
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
    trendDirection,
    nextConditionCode,
    transitionConditionCode,
    transitionOffsetHours,
    peakWindSpeed,
    windRiseOffsetHours,
    peakHumidity,
    humidityRiseOffsetHours
  };
}

export function getShortTermTrendText(forecastSummary, conditionCode, precipitationProbability) {
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
  const transitionFamily = getWeatherFamily(forecast.transitionConditionCode);
  const peakPop = forecast.peakPrecipitationProbability;
  const peakHours = forecast.peakOffsetHours || 3;
  const rainStartHours = forecast.rainStartOffsetHours;
  const windRiseHours = forecast.windRiseOffsetHours;
  const humidityRiseHours = forecast.humidityRiseOffsetHours;
  const peakWindSpeed = forecast.peakWindSpeed;
  const peakHumidity = forecast.peakHumidity;

  if ((weatherFamily === 'rain' || weatherFamily === 'thunder') && forecast.trendDirection === 'down') {
    return '短时降水逐步减弱';
  }
  if ((weatherFamily === 'rain' || weatherFamily === 'thunder') && forecast.trendDirection !== 'down') {
    if (peakPop >= 70 && peakHours <= 3) {
      return '这阵雨势还会再撑一会';
    }
    return '未来几小时仍有降雨';
  }
  if ((transitionFamily === 'rain' || transitionFamily === 'thunder') && rainStartHours !== null) {
    return rainStartHours <= 2
      ? `${rainStartHours}小时内可能转雨`
      : `约${rainStartHours}小时后雨带靠近`;
  }
  if (windRiseHours !== null && peakWindSpeed !== null && peakWindSpeed >= 8) {
    return windRiseHours <= 2
      ? '短时风感会明显抬升'
      : `约${windRiseHours}小时后风感增强`;
  }
  if (humidityRiseHours !== null && peakHumidity !== null && peakHumidity >= 85) {
    return humidityRiseHours <= 2
      ? '湿气正在往上堆'
      : `约${humidityRiseHours}小时后湿气更重`;
  }
  if (peakPop >= 70 && rainStartHours !== null) {
    return rainStartHours <= 3
      ? '未来3小时降水走强'
      : `约${rainStartHours}小时后降水抬升`;
  }
  if (forecast.trendDirection === 'up' && peakPop >= 40) {
    return peakHours <= 3
      ? '湿润感正在靠近'
      : `未来${peakHours}小时湿润感增强`;
  }
  if (forecast.trendDirection === 'down' && peakPop <= 40) {
    return '这波云雨正在退开';
  }
  if (peakPop <= 20) {
    return '未来数小时降水偏低';
  }
  return '未来数小时变化平稳';
}

export function getOutingAdvice(forecastSummary, conditionCode, precipitationProbability, temp, feelsLike = temp) {
  const weatherFamily = getWeatherFamily(conditionCode);
  const forecast = normalizeShortTermForecast(forecastSummary);
  const peakPop = forecast?.peakPrecipitationProbability ?? precipitationProbability;
  const transitionFamily = getWeatherFamily(forecast?.transitionConditionCode);
  const rainStartHours = forecast?.rainStartOffsetHours;
  const windRiseHours = forecast?.windRiseOffsetHours;
  const peakHumidity = forecast?.peakHumidity;

  if (weatherFamily === 'rain' || weatherFamily === 'thunder') {
    return '建议带伞出门';
  }
  if ((transitionFamily === 'rain' || transitionFamily === 'thunder') && Number.isFinite(rainStartHours)) {
    return rainStartHours <= 2 ? '出门前最好带伞' : '晚些外出留意降雨';
  }
  if (Number.isFinite(windRiseHours)) {
    return windRiseHours <= 2 ? '外出留意风感增强' : '晚些风会更明显';
  }
  if (Number.isFinite(peakHumidity) && peakHumidity >= 85 && feelsLike >= 25) {
    return '体感会比气温更闷';
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
  if (feelsLike >= 30) {
    return '外出注意闷热体感';
  }
  if (temp >= 28) {
    return '适合轻装出门';
  }
  return '适合按当前天气出行';
}

export function getVisualState(data) {
  const temp = Number(data.temp);
  const feelsLike = Number.isFinite(data.feelsLike) ? Number(data.feelsLike) : temp;
  const humidity = Number.isFinite(data.humidity) ? clamp(Number(data.humidity), 0, 100) : 56;
  const windSpeed = Number.isFinite(data.windSpeed) ? Math.max(0, Number(data.windSpeed)) : 0;
  const windDirection = normalizeDegrees(data.windDirection, 180);
  const conditionCode = Number(data.conditionCode);
  const dayPhase = typeof data.dayPhase === 'string' ? data.dayPhase : 'day';
  const cityVisual = getCityVisualConfig(data.city);
  const precipitationProbability = typeof data.precipitationProbability === 'number'
    ? clamp(data.precipitationProbability, 0, 100)
    : 0;
  const rainLevel = precipitationProbability / 100;
  const humidityFactor = clamp((humidity - 42) / 58, 0, 1);
  const windFactor = clamp(windSpeed / 12, 0, 1);
  const feelDelta = feelsLike - temp;
  const heatFactor = clamp((feelsLike - 24) / 12, 0, 1);
  const chillFactor = clamp((10 - feelsLike) / 12, 0, 1);
  const weatherFamily = getWeatherFamily(conditionCode);
  const weatherVariant = getWeatherVariant(conditionCode, weatherFamily, humidity, windSpeed);
  const theme = getTemperatureTheme(feelsLike);
  const phase = getDayPhaseState(dayPhase, weatherFamily);
  const isWetFamily = weatherFamily === 'rain' || weatherFamily === 'thunder';
  const isFogLike = weatherVariant === 'fog' || weatherVariant === 'mist' || weatherVariant === 'haze';
  const motionHeading = normalizeDegrees(windDirection + 180, 180);
  const driftVector = getMotionVector(
    motionHeading,
    18 + (windFactor * 22) + (weatherFamily === 'thunder' ? 6 : 0) + (weatherVariant === 'showers' ? 4 : 0),
    0.44
  );
  const fogVector = getMotionVector(
    motionHeading + 24,
    12 + (humidityFactor * 12) + (isFogLike ? 10 : 0),
    0.28
  );
  const rainTilt = clamp(
    Math.round((Math.sin(motionHeading * (Math.PI / 180)) * (8 + (windFactor * 16))) + (weatherFamily === 'thunder' ? 4 : 0)),
    -24,
    24
  );
  const rainShiftX = Math.round(
    (Math.sin(motionHeading * (Math.PI / 180)) * (26 + (windFactor * 42)))
    + (weatherVariant === 'showers' ? 10 : 0)
    + (weatherFamily === 'thunder' ? 12 : 0)
  );
  const glowOpacity = clamp(
    0.78
      - (weatherFamily === 'clouds' ? 0.18 : 0)
      - (weatherFamily === 'rain' ? 0.24 : 0)
      - (weatherFamily === 'thunder' ? 0.32 : 0)
      - (isFogLike ? 0.12 : 0)
      + (heatFactor * 0.12)
      - (humidityFactor * 0.08)
      + (feelDelta > 2 ? 0.04 : 0),
    0.18,
    0.88
  );
  const rainPresence = isWetFamily
    ? clamp(
      (weatherVariant === 'drizzle' ? 0.24 : weatherVariant === 'showers' ? 0.34 : 0.42)
      + (rainLevel * (weatherVariant === 'drizzle' ? 0.22 : 0.48)),
      0.2,
      0.92
    )
    : weatherFamily === 'clouds'
      ? clamp((weatherVariant === 'overcast' ? 0.06 : 0.02) + (rainLevel * 0.22), 0, 0.28)
      : weatherFamily === 'atmosphere'
        ? clamp((weatherVariant === 'haze' ? 0.01 : 0) + (rainLevel * 0.08), 0, 0.08)
        : 0;
  const rainOpacity = rainPresence;
  const rainLineCount = isWetFamily
    ? weatherFamily === 'thunder'
      ? 15
      : weatherVariant === 'drizzle'
        ? 7
        : weatherVariant === 'showers'
          ? 11
          : 13
    : weatherFamily === 'clouds' && rainLevel >= 0.5
      ? 6
      : 0;
  const rainLength = isWetFamily
    ? clamp(
      (weatherVariant === 'drizzle' ? 22 : weatherVariant === 'showers' ? 30 : 34)
      + Math.round(rainLevel * 26)
      + Math.round(windFactor * 10),
      20,
      64
    )
    : weatherFamily === 'clouds'
      ? clamp(18 + Math.round(rainLevel * 10), 18, 32)
      : 18;
  const rainBaseDuration = clamp(
    weatherFamily === 'thunder'
      ? 1.1
      : weatherVariant === 'showers'
        ? 1.45
        : weatherVariant === 'steady-rain'
          ? 1.7
          : weatherVariant === 'drizzle'
            ? 2.4
            : 2.1,
    1.1,
    2.8
  );
  const driftDuration = clamp(
    16
      - (feelsLike * 0.16)
      - (weatherFamily === 'thunder' ? 2.4 : 0)
      - (weatherFamily === 'rain' ? 1.2 : 0)
      - (windFactor * 4.8),
    7,
    18
  );
  const pulseDuration = clamp(
    8
      - (feelsLike * 0.08)
      - (weatherFamily === 'thunder' ? 1 : 0)
      - (weatherFamily === 'rain' ? 0.4 : 0)
      - (heatFactor * 0.8),
    4.2,
    8
  );
  const cloudOpacity = clamp(
    (weatherFamily === 'clear' ? 0.1 : 0)
      + (weatherFamily === 'clouds' ? (weatherVariant === 'overcast' ? 0.44 : 0.24) : 0)
      + (weatherFamily === 'rain' ? (weatherVariant === 'drizzle' ? 0.18 : weatherVariant === 'showers' ? 0.24 : 0.28) : 0)
      + (weatherFamily === 'thunder' ? 0.32 : 0)
      + (weatherFamily === 'snow' ? 0.22 : 0)
      + (weatherFamily === 'atmosphere' ? (weatherVariant === 'fog' ? 0.18 : 0.12) : 0)
      + (weatherFamily === 'clouds' ? rainLevel * 0.18 : 0)
      + (humidityFactor * 0.12),
    0.1,
    0.84
  );
  const hazeOpacity = clamp(
    (feelsLike > 28 ? 0.18 : 0.06)
      + (weatherFamily === 'clouds' ? 0.04 : 0)
      + (weatherFamily === 'rain' ? 0.08 : 0)
      + (weatherFamily === 'thunder' ? 0.12 : 0)
      + (weatherFamily === 'atmosphere' ? (weatherVariant === 'fog' ? 0.24 : weatherVariant === 'haze' ? 0.2 : 0.16) : 0)
      + (weatherFamily === 'snow' ? 0.08 : 0)
      + (humidityFactor * 0.16)
      - (windFactor * 0.04),
    0.08,
    0.44
  );
  const fogOpacity = clamp(
    (isFogLike ? 0.18 : 0)
      + (weatherVariant === 'drizzle' ? 0.08 : 0)
      + (weatherVariant === 'overcast' ? 0.04 : 0)
      + (humidityFactor * 0.18)
      - (windFactor * 0.05),
    0,
    0.4
  );
  const fogLayerVisible = fogOpacity >= 0.12;
  const fogDuration = clamp(driftDuration * (isFogLike ? 1.6 : 1.4), 9, 24);
  const thunderFlashOpacity = weatherFamily === 'thunder'
    ? clamp(weatherVariant === 'active-thunder' ? 0.34 : 0.2, 0.16, 0.38)
    : 0;
  const thunderFlashVisible = thunderFlashOpacity >= 0.16;
  const thunderFlashDuration = clamp(
    weatherVariant === 'active-thunder' ? 5.2 - (windFactor * 0.8) : 7.4 - (windFactor * 0.5),
    4.2,
    7.4
  );
  const rainLabel = getWeatherStatusLabel({
    weatherFamily,
    weatherVariant,
    precipitationProbability,
    humidity,
    windSpeed,
    windDirection,
    temp,
    feelsLike
  });
  const rainLayerVisible = rainOpacity >= 0.08;
  const thermalLabel = getThermalLabel(theme, {
    temp,
    feelsLike,
    humidity,
    windSpeed
  });
  const orbitOpacity = clamp(phase.orbitOpacity + (windFactor * 0.18), 0.72, 1.24);
  const landmarkOpacity = clamp(
    phase.landmarkOpacity - (isFogLike ? 0.14 : 0) - (humidityFactor * 0.05),
    0.64,
    1
  );

  return {
    ...theme,
    thermalLabel,
    dayPhase,
    dayPhaseLabel: phase.phaseLabel,
    weatherFamily,
    weatherVariant,
    precipitationProbability,
    feelsLike,
    humidity,
    windSpeed,
    windDirection,
    cityKey: cityVisual.key,
    landmark: cityVisual.landmark,
    rainLabel,
    rainLayerVisible,
    rainLineCount,
    rainBaseDuration,
    fogLayerVisible,
    thunderFlashVisible,
    style: [
      `--sky-top:${theme.skyTop}`,
      `--sky-bottom:${theme.skyBottom}`,
      `--glow:${theme.glow}`,
      `--surface:${theme.surface}`,
      `--surface-border:${theme.border}`,
      `--accent:${theme.accent}`,
      `--glow-soft:${hexToRgba(theme.glow, 0.58)}`,
      `--glow-strong:${hexToRgba(theme.glow, 0.82)}`,
      `--glow-panel:${hexToRgba(theme.glow, 0.28)}`,
      `--glow-halo:${hexToRgba(theme.glow, 0.36)}`,
      `--accent-shadow:${hexToRgba(theme.accent, 0.65)}`,
      `--glow-opacity:${glowOpacity}`,
      `--rain-opacity:${rainOpacity}`,
      `--rain-length:${rainLength}px`,
      `--rain-base-duration:${rainBaseDuration}s`,
      `--rain-shift-x:${rainShiftX}px`,
      `--rain-tilt:${rainTilt}deg`,
      `--cloud-opacity:${cloudOpacity}`,
      `--haze-opacity:${hazeOpacity}`,
      `--fog-opacity:${fogOpacity}`,
      `--fog-duration:${fogDuration}s`,
      `--fog-drift-x:${fogVector.x}px`,
      `--fog-drift-y:${fogVector.y}px`,
      `--thunder-opacity:${thunderFlashOpacity}`,
      `--thunder-flash-duration:${thunderFlashDuration}s`,
      `--phase-overlay-top:${phase.overlayTop}`,
      `--phase-overlay-bottom:${phase.overlayBottom}`,
      `--phase-rim:${phase.rimLight}`,
      `--star-opacity:${phase.starOpacity}`,
      `--landmark-opacity:${landmarkOpacity}`,
      `--halo-scale:${phase.haloScale}`,
      `--orbit-opacity:${orbitOpacity}`,
      `--drift-x:${driftVector.x}px`,
      `--drift-y:${driftVector.y}px`,
      `--drift-duration:${driftDuration}s`,
      `--pulse-duration:${pulseDuration}s`
    ].join(';')
  };
}
