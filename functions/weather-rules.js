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

export function getOutingAdvice(forecastSummary, conditionCode, precipitationProbability, temp) {
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

export function getVisualState(data) {
  const temp = Number(data.temp);
  const conditionCode = Number(data.conditionCode);
  const dayPhase = typeof data.dayPhase === 'string' ? data.dayPhase : 'day';
  const cityVisual = getCityVisualConfig(data.city);
  const precipitationProbability = typeof data.precipitationProbability === 'number'
    ? clamp(data.precipitationProbability, 0, 100)
    : 0;
  const rainLevel = precipitationProbability / 100;
  const weatherFamily = getWeatherFamily(conditionCode);
  const theme = getTemperatureTheme(temp);
  const phase = getDayPhaseState(dayPhase, weatherFamily);
  const isWetFamily = weatherFamily === 'rain' || weatherFamily === 'thunder';
  const glowOpacity = clamp(
    0.78
      - (weatherFamily === 'clouds' ? 0.18 : 0)
      - (weatherFamily === 'rain' ? 0.24 : 0)
      - (weatherFamily === 'thunder' ? 0.32 : 0)
      + (temp > 26 ? 0.08 : 0),
    0.18,
    0.88
  );
  const rainPresence = isWetFamily
    ? clamp(0.42 + (rainLevel * 0.48), 0.42, 0.92)
    : weatherFamily === 'clouds'
      ? clamp(rainLevel * 0.22, 0, 0.22)
      : weatherFamily === 'atmosphere'
        ? clamp(rainLevel * 0.12, 0, 0.12)
        : 0;
  const rainOpacity = rainPresence;
  const rainLength = isWetFamily
    ? clamp(34 + Math.round(rainLevel * 26), 34, 60)
    : weatherFamily === 'clouds'
      ? clamp(18 + Math.round(rainLevel * 10), 18, 28)
      : 18;
  const driftDuration = clamp(
    16
      - ((temp + 8) * 0.18)
      - (weatherFamily === 'thunder' ? 2.4 : 0)
      - (weatherFamily === 'rain' ? 1.2 : 0),
    7,
    18
  );
  const pulseDuration = clamp(
    8
      - (temp * 0.08)
      - (weatherFamily === 'thunder' ? 1 : 0)
      - (weatherFamily === 'rain' ? 0.4 : 0),
    4.2,
    8
  );
  const cloudOpacity = clamp(
    (weatherFamily === 'clear' ? 0.1 : 0)
      + (weatherFamily === 'clouds' ? 0.34 : 0)
      + (weatherFamily === 'rain' ? 0.28 : 0)
      + (weatherFamily === 'thunder' ? 0.32 : 0)
      + (weatherFamily === 'snow' ? 0.22 : 0)
      + (weatherFamily === 'atmosphere' ? 0.26 : 0)
      + (weatherFamily === 'clouds' ? rainLevel * 0.18 : 0),
    0.1,
    0.78
  );
  const hazeOpacity = clamp(
    (temp > 28 ? 0.22 : 0.08)
      + (weatherFamily === 'clouds' ? 0.04 : 0)
      + (weatherFamily === 'rain' ? 0.08 : 0)
      + (weatherFamily === 'thunder' ? 0.12 : 0)
      + (weatherFamily === 'atmosphere' ? 0.18 : 0)
      + (weatherFamily === 'snow' ? 0.08 : 0),
    0.08,
    0.36
  );
  const rainLabel = weatherFamily === 'thunder'
    ? '雷暴逼近'
    : weatherFamily === 'rain'
      ? (precipitationProbability >= 60 ? '降雨进行中' : '湿润降雨')
      : weatherFamily === 'clouds'
        ? (precipitationProbability >= 60 ? '云层蓄雨' : '云层堆积')
        : weatherFamily === 'snow'
          ? '雪意渐浓'
          : weatherFamily === 'clear'
            ? (precipitationProbability >= 40 ? '晴空转潮' : '晴空舒展')
            : weatherFamily === 'atmosphere'
              ? '雾气弥散'
              : '天气流动';
  const rainLayerVisible = rainOpacity > 0.02;

  return {
    ...theme,
    dayPhase,
    dayPhaseLabel: phase.phaseLabel,
    weatherFamily,
    precipitationProbability,
    cityKey: cityVisual.key,
    landmark: cityVisual.landmark,
    rainLabel,
    rainLayerVisible,
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
      `--cloud-opacity:${cloudOpacity}`,
      `--haze-opacity:${hazeOpacity}`,
      `--phase-overlay-top:${phase.overlayTop}`,
      `--phase-overlay-bottom:${phase.overlayBottom}`,
      `--phase-rim:${phase.rimLight}`,
      `--star-opacity:${phase.starOpacity}`,
      `--landmark-opacity:${phase.landmarkOpacity}`,
      `--halo-scale:${phase.haloScale}`,
      `--orbit-opacity:${phase.orbitOpacity}`,
      `--drift-duration:${driftDuration}s`,
      `--pulse-duration:${pulseDuration}s`
    ].join(';')
  };
}
