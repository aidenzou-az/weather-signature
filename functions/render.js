import { escapeHtml } from './html.js';

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

function getCityLandmark(city) {
  const normalized = city.trim().toLowerCase();

  if (normalized === 'beijing' || normalized === '北京') {
    return {
      label: '天坛',
      caption: '北京地标轮廓',
      svg: `
        <svg viewBox="0 0 640 200" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M110 168H530" opacity="0.4" />
            <path d="M208 164H432" />
            <path d="M232 146H408" opacity="0.9" />
            <path d="M260 128H380" opacity="0.85" />
            <path d="M284 110H356" opacity="0.82" />
            <path d="M320 56V98" opacity="0.92" />
            <path d="M260 110C274 90 296 78 320 78C344 78 366 90 380 110" />
            <path d="M236 128C252 104 283 90 320 90C357 90 388 104 404 128" />
            <path d="M208 146C228 118 268 102 320 102C372 102 412 118 432 146" />
            <path d="M300 50H340" opacity="0.75" />
            <path d="M188 178H452" opacity="0.3" />
            <path d="M120 178C148 164 178 158 208 164" opacity="0.28" />
            <path d="M520 178C492 164 462 158 432 164" opacity="0.28" />
          </g>
        </svg>
      `
    };
  }

  return {
    label: '城市轮廓',
    caption: '当前城市视觉标识',
    svg: `
      <svg viewBox="0 0 640 200" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M96 168H544" opacity="0.4" />
          <path d="M156 168V118L214 92V168" />
          <path d="M232 168V72H284V168" />
          <path d="M304 168V40H338V168" />
          <path d="M356 168V96H416V168" />
          <path d="M438 168V124L494 102V168" />
        </g>
      </svg>
    `
  };
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

function getVisualState(data) {
  const temp = Number(data.temp);
  const conditionCode = Number(data.conditionCode);
  const dayPhase = typeof data.dayPhase === 'string' ? data.dayPhase : 'day';
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
    landmark: getCityLandmark(data.city),
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

function renderRainLines() {
  return Array.from({ length: 9 }, (_, index) => {
    const left = 8 + (index * 10.5);
    const delay = (index * 0.55).toFixed(2);
    const duration = (1.8 + ((index % 3) * 0.35)).toFixed(2);

    return `<span class="rain-line" style="--line-left:${left}%;--line-delay:${delay}s;--line-duration:${duration}s;"></span>`;
  }).join('');
}

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
  const visual = getVisualState(data);
  const safeCity = escapeHtml(data.city);
  const safeCondition = escapeHtml(data.condition);
  const safePrecipitationText = escapeHtml(data.precipitationText);
  const safeTimeStr = escapeHtml(data.timeStr);
  const safeDayPhaseLabel = escapeHtml(data.dayPhaseLabel || visual.dayPhaseLabel);
  const safeShortTermTrendText = escapeHtml(data.shortTermTrendText || '短时趋势暂缺');
  const safeOutingAdvice = escapeHtml(data.outingAdvice || '适合按当前天气出行');
  const safeTempText = escapeHtml(`${data.temp}°C`);
  const safeLandmarkLabel = escapeHtml(visual.landmark.label);
  const safeLandmarkCaption = escapeHtml(visual.landmark.caption);
  const safeThermalLabel = escapeHtml(visual.thermalLabel);
  const safeRainLabel = escapeHtml(visual.rainLabel);

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
    :root {
      color-scheme: dark;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: "SF Pro Display", "Segoe UI", sans-serif;
      color: #f7fbff;
      background:
        linear-gradient(180deg, var(--phase-overlay-top) 0%, var(--phase-overlay-bottom) 70%),
        radial-gradient(circle at 18% 18%, var(--glow-soft) 0%, transparent 34%),
        radial-gradient(circle at 82% 16%, rgba(255, 255, 255, 0.14), transparent 20%),
        linear-gradient(160deg, var(--sky-top) 0%, var(--sky-bottom) 100%);
      overflow-x: hidden;
    }
    .weather-stage {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
      isolation: isolate;
    }
    .weather-stage::before,
    .weather-stage::after {
      content: "";
      position: absolute;
      inset: auto auto 14% -8%;
      width: 30rem;
      height: 30rem;
      border-radius: 50%;
      background: var(--glow-strong);
      opacity: var(--glow-opacity);
      filter: blur(18px);
      animation: haloPulse var(--pulse-duration) ease-in-out infinite alternate;
      z-index: 0;
    }
    .weather-stage::after {
      inset: 10% -8% auto auto;
      width: 18rem;
      height: 18rem;
      opacity: calc(var(--glow-opacity) * 0.55);
      animation-duration: calc(var(--pulse-duration) * 1.35);
      transform: scale(var(--halo-scale));
    }
    .phase-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      background:
        linear-gradient(180deg, var(--phase-rim) 0%, rgba(255, 255, 255, 0) 32%),
        radial-gradient(circle at 50% 115%, rgba(255, 255, 255, 0.08), transparent 46%);
      mix-blend-mode: screen;
    }
    .phase-stars {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      opacity: var(--star-opacity);
    }
    .phase-stars span {
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 14px rgba(189, 223, 255, 0.55);
      animation: starPulse 4.8s ease-in-out infinite alternate;
    }
    .phase-stars span:nth-child(1) {
      top: 12%;
      left: 18%;
      animation-delay: 0.2s;
    }
    .phase-stars span:nth-child(2) {
      top: 18%;
      left: 36%;
      width: 3px;
      height: 3px;
      animation-delay: 1.1s;
    }
    .phase-stars span:nth-child(3) {
      top: 14%;
      right: 24%;
      animation-delay: 1.8s;
    }
    .phase-stars span:nth-child(4) {
      top: 26%;
      right: 14%;
      width: 3px;
      height: 3px;
      animation-delay: 0.8s;
    }
    .phase-stars span:nth-child(5) {
      top: 32%;
      left: 12%;
      width: 2px;
      height: 2px;
      animation-delay: 2.3s;
    }
    .phase-stars span:nth-child(6) {
      top: 24%;
      left: 54%;
      width: 2px;
      height: 2px;
      animation-delay: 1.5s;
    }
    .weather-shell {
      position: relative;
      z-index: 2;
      width: min(1080px, calc(100vw - 32px));
      margin: 0 auto;
      min-height: 100vh;
      display: grid;
      align-items: center;
      padding: 32px 0;
    }
    .weather-card {
      position: relative;
      overflow: hidden;
      border-radius: 32px;
      background: linear-gradient(180deg, var(--surface) 0%, rgba(5, 11, 25, 0.74) 100%);
      border: 1px solid var(--surface-border);
      box-shadow:
        0 26px 80px rgba(2, 6, 18, 0.42),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
      padding: 32px;
      backdrop-filter: blur(18px);
    }
    .weather-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(140deg, rgba(255, 255, 255, 0.08), transparent 38%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 32%);
      pointer-events: none;
    }
    .weather-card::after {
      content: "";
      position: absolute;
      inset: auto -10% -22% auto;
      width: 22rem;
      height: 22rem;
      border-radius: 50%;
      background: var(--glow-panel);
      opacity: 0.55;
      filter: blur(44px);
      animation: drift var(--drift-duration) ease-in-out infinite alternate;
      pointer-events: none;
    }
    .status-orbit {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .status-orbit span {
      position: absolute;
      display: block;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      opacity: calc(var(--cloud-opacity) * var(--orbit-opacity));
      filter: blur(2px);
      animation: drift calc(var(--drift-duration) * 1.1) ease-in-out infinite alternate;
    }
    .status-orbit span:nth-child(1) {
      top: 14%;
      left: 8%;
      width: 180px;
      height: 42px;
    }
    .status-orbit span:nth-child(2) {
      top: 20%;
      right: 12%;
      width: 132px;
      height: 34px;
      animation-duration: calc(var(--drift-duration) * 0.92);
    }
    .status-orbit span:nth-child(3) {
      bottom: 34%;
      right: 18%;
      width: 96px;
      height: 24px;
      opacity: calc(var(--cloud-opacity) * 0.78);
      animation-duration: calc(var(--drift-duration) * 1.25);
    }
    .rain-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      mask-image: linear-gradient(180deg, transparent 0%, black 18%, black 88%, transparent 100%);
    }
    .rain-line {
      position: absolute;
      top: -18%;
      left: var(--line-left);
      width: 2px;
      height: var(--rain-length);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(197, 231, 255, 0.95));
      opacity: var(--rain-opacity);
      transform: rotate(12deg);
      animation: rainFall var(--line-duration) linear infinite;
      animation-delay: var(--line-delay);
    }
    .weather-top {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .eyebrow,
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      letter-spacing: 0.03em;
      font-size: 13px;
      color: rgba(246, 251, 255, 0.88);
    }
    .eyebrow::before,
    .status-chip::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent-shadow);
    }
    .hero-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
      gap: 28px;
      margin-top: 28px;
      align-items: end;
    }
    .hero-copy {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .city {
      font-size: clamp(1.2rem, 1rem + 0.8vw, 1.75rem);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(247, 251, 255, 0.86);
    }
    .temp {
      display: flex;
      align-items: baseline;
      gap: 18px;
      flex-wrap: wrap;
    }
    .temp strong {
      font-size: clamp(4.3rem, 12vw, 7.5rem);
      line-height: 0.95;
      font-weight: 650;
      letter-spacing: -0.06em;
    }
    .temp span {
      font-size: clamp(1rem, 0.92rem + 0.5vw, 1.4rem);
      color: var(--accent);
    }
    .summary {
      max-width: 34rem;
      margin: 0;
      font-size: clamp(1rem, 0.94rem + 0.3vw, 1.12rem);
      line-height: 1.7;
      color: rgba(241, 248, 255, 0.84);
    }
    .metric-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 8px;
    }
    .insight-card {
      margin-top: 16px;
      padding: 16px 18px;
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04));
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }
    .insight-label {
      display: block;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(232, 244, 255, 0.62);
    }
    .insight-main {
      display: block;
      margin-top: 8px;
      font-size: 1.04rem;
      font-weight: 600;
      color: #fff;
    }
    .insight-sub {
      display: block;
      margin-top: 6px;
      color: rgba(236, 245, 255, 0.74);
      font-size: 0.95rem;
    }
    .metric-card {
      padding: 16px 18px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }
    .metric-label {
      display: block;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(232, 244, 255, 0.66);
    }
    .metric-value {
      display: block;
      margin-top: 8px;
      font-size: 1.5rem;
      font-weight: 600;
      color: #fff;
    }
    .landmark-panel {
      position: relative;
      padding: 24px 24px 18px;
      border-radius: 28px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(9, 16, 28, 0.22));
      border: 1px solid rgba(255, 255, 255, 0.08);
      min-height: 320px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      overflow: hidden;
    }
    .landmark-panel::before {
      content: "";
      position: absolute;
      inset: 14% 12% auto auto;
      width: 8rem;
      height: 8rem;
      border-radius: 50%;
      background: var(--glow-halo);
      opacity: calc(var(--glow-opacity) * 0.76);
      filter: blur(10px);
      animation: haloPulse calc(var(--pulse-duration) * 1.2) ease-in-out infinite alternate;
    }
    .landmark-caption {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 18px;
      color: rgba(247, 251, 255, 0.84);
      font-size: 0.95rem;
    }
    .landmark-caption strong {
      font-size: 1.15rem;
      color: #fff;
    }
    .landmark-art {
      position: relative;
      z-index: 1;
      color: rgba(245, 251, 255, 0.92);
      opacity: var(--landmark-opacity);
      transform: translateY(8px);
      animation: skylineFloat calc(var(--drift-duration) * 0.92) ease-in-out infinite alternate;
    }
    .landmark-art svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .landmark-base {
      position: absolute;
      left: -4%;
      right: -4%;
      bottom: -10%;
      height: 46%;
      background:
        linear-gradient(180deg, rgba(2, 8, 18, 0), rgba(3, 10, 22, 0.7) 38%, rgba(2, 8, 18, 0.96) 100%),
        radial-gradient(circle at 50% 0%, rgba(255, 255, 255, var(--haze-opacity)), transparent 52%);
    }
    .weather-footer {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(236, 245, 255, 0.74);
      font-size: 0.96rem;
    }
    .weather-footer strong {
      color: #fff;
    }
    .stale-warning {
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(255, 108, 100, 0.16);
      border: 1px solid rgba(255, 136, 136, 0.28);
      color: #ffd7d7;
    }
    .info {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
      margin-top: 18px;
      color: rgba(228, 239, 249, 0.72);
      font-size: 0.92rem;
    }
    .entry-link {
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
    }
    @keyframes rainFall {
      0% {
        transform: translate3d(0, -30%, 0) rotate(12deg);
        opacity: 0;
      }
      18% {
        opacity: var(--rain-opacity);
      }
      100% {
        transform: translate3d(-28px, 125vh, 0) rotate(12deg);
        opacity: 0;
      }
    }
    @keyframes drift {
      from {
        transform: translate3d(-8px, 0, 0);
      }
      to {
        transform: translate3d(18px, -10px, 0);
      }
    }
    @keyframes haloPulse {
      from {
        transform: scale(0.94);
      }
      to {
        transform: scale(1.08);
      }
    }
    @keyframes skylineFloat {
      from {
        transform: translateY(10px);
      }
      to {
        transform: translateY(-4px);
      }
    }
    @keyframes starPulse {
      from {
        opacity: 0.42;
        transform: scale(0.86);
      }
      to {
        opacity: 1;
        transform: scale(1.16);
      }
    }
    @media (max-width: 880px) {
      .weather-shell {
        width: min(100vw - 20px, 760px);
        padding: 18px 0;
      }
      .weather-card {
        padding: 24px;
        border-radius: 28px;
      }
      .hero-grid {
        grid-template-columns: 1fr;
      }
      .landmark-panel {
        min-height: 240px;
      }
    }
    @media (max-width: 560px) {
      body {
        background-attachment: fixed;
      }
      .weather-shell {
        width: calc(100vw - 12px);
      }
      .weather-card {
        padding: 18px;
        border-radius: 24px;
      }
      .metric-row {
        grid-template-columns: 1fr;
      }
      .weather-footer,
      .info,
      .weather-top {
        flex-direction: column;
        align-items: flex-start;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body style="${visual.style}">
  <main class="weather-stage">
    <div class="phase-layer"></div>
    <div class="phase-stars">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <section class="weather-shell">
      <article class="weather-card">
        <div class="status-orbit">
          <span></span>
          <span></span>
          <span></span>
        </div>
        ${visual.rainLayerVisible ? `<div class="rain-layer">
          ${renderRainLines()}
        </div>` : ''}
        <div class="weather-top">
          <div class="status-chip">${safeLandmarkLabel} · ${safeRainLabel}</div>
          <div class="eyebrow">${safeDayPhaseLabel} · ${safeTimeStr}</div>
        </div>
        <div class="hero-grid">
          <div class="hero-copy">
            <div class="city">${safeCity}</div>
            <div class="temp">
              <strong>${safeTempText}</strong>
              <span>${safeThermalLabel}</span>
            </div>
            <div class="metric-row">
              <div class="metric-card">
                <span class="metric-label">Weather</span>
                <span class="metric-value">${safeCondition}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">Precipitation</span>
                <span class="metric-value">${safePrecipitationText}</span>
              </div>
            </div>
            <div class="insight-card">
              <span class="insight-label">Next Hours</span>
              <span class="insight-main">${safeShortTermTrendText}</span>
              <span class="insight-sub">${safeOutingAdvice}</span>
            </div>
          </div>
          <aside class="landmark-panel">
            <div class="landmark-caption">
              <div>
                <strong>${safeLandmarkLabel}</strong>
                <div>${safeLandmarkCaption}</div>
              </div>
            </div>
            <div class="landmark-art">${visual.landmark.svg}</div>
            <div class="landmark-base"></div>
          </aside>
        </div>
        <div class="weather-footer">
          <div><strong>城市时间</strong> ${safeTimeStr}</div>
          ${data.isStale ? '<div class="stale-warning">天气数据暂时无法更新，当前展示为缓存结果</div>' : ''}
        </div>
      </article>
    </section>
  </main>
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
