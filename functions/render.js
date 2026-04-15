import { escapeHtml } from './html.js';
import { getVisualState } from './weather-rules.js';

function renderRainLines(visual) {
  const rainLineCount = Number.isFinite(visual?.rainLineCount) ? Math.max(4, Math.round(visual.rainLineCount)) : 9;
  const baseDuration = typeof visual?.rainBaseDuration === 'number'
    ? visual.rainBaseDuration
    : 1.8;
  const spread = rainLineCount > 1 ? 84 / (rainLineCount - 1) : 0;

  return Array.from({ length: rainLineCount }, (_, index) => {
    const left = 8 + (index * spread);
    const delay = (index * 0.42).toFixed(2);
    const duration = (baseDuration + ((index % 4) * 0.22)).toFixed(2);

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
  const safeCity = escapeHtml(data.cityDisplayName || data.city);
  const safeCondition = escapeHtml(data.condition);
  const safePrecipitationText = escapeHtml(data.precipitationText);
  const safeTimeStr = escapeHtml(data.timeStr);
  const safeDayPhaseLabel = escapeHtml(data.dayPhaseLabel || visual.dayPhaseLabel);
  const safeShortTermTrendText = escapeHtml(data.shortTermTrendText || '短时趋势暂缺');
  const safeOutingAdvice = escapeHtml(data.outingAdvice || '适合按计划出行');
  const safeTempText = escapeHtml(`${data.temp}°C`);
  const safeLandmarkLabel = escapeHtml(visual.landmark.label);
  const safeLandmarkCaption = escapeHtml(visual.landmark.caption);
  const safeThermalLabel = escapeHtml(visual.thermalLabel);
  const safeRainLabel = escapeHtml(visual.rainLabel);
  const cityMotif = typeof visual.motif?.svg === 'string' ? visual.motif.svg : '';

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
        radial-gradient(circle at 72% 76%, var(--city-wash-strong) 0%, transparent 28%),
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
        linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 32%),
        radial-gradient(circle at 78% 82%, var(--city-wash-soft) 0%, transparent 24%);
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
      transform: rotate(var(--rain-tilt));
      animation: rainFall var(--line-duration) linear infinite;
      animation-delay: var(--line-delay);
    }
    .fog-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: var(--fog-opacity);
      mask-image: linear-gradient(180deg, transparent 0%, black 20%, black 94%, transparent 100%);
      mix-blend-mode: screen;
    }
    .fog-layer span {
      position: absolute;
      display: block;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.12) 46%, transparent 74%);
      filter: blur(10px);
      animation: fogSweep var(--fog-duration) ease-in-out infinite alternate;
    }
    .fog-layer span:nth-child(1) {
      top: 12%;
      left: -6%;
      width: 54%;
      height: 30%;
    }
    .fog-layer span:nth-child(2) {
      bottom: 18%;
      right: -8%;
      width: 48%;
      height: 26%;
      animation-duration: calc(var(--fog-duration) * 0.86);
    }
    .fog-layer span:nth-child(3) {
      top: 42%;
      left: 18%;
      width: 42%;
      height: 22%;
      animation-duration: calc(var(--fog-duration) * 1.08);
    }
    .storm-flash {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: var(--thunder-opacity);
      background:
        radial-gradient(circle at 72% 14%, rgba(255, 248, 221, 0.56), transparent 18%),
        radial-gradient(circle at 66% 22%, rgba(185, 222, 255, 0.28), transparent 24%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 34%);
      mix-blend-mode: screen;
      animation: lightningFlash var(--thunder-flash-duration) linear infinite;
    }
    .hero-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
      gap: 20px;
      align-items: stretch;
    }
    .hero-copy {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-top: 6px;
    }
    .hero-primary {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .city {
      font-size: clamp(1.12rem, 0.96rem + 0.7vw, 1.6rem);
      letter-spacing: 0.08em;
      color: rgba(247, 251, 255, 0.86);
    }
    .temp {
      display: flex;
      align-items: baseline;
      gap: 14px;
      flex-wrap: wrap;
    }
    .temp strong {
      font-size: clamp(4.7rem, 12vw, 7.8rem);
      line-height: 0.95;
      font-weight: 650;
      letter-spacing: -0.06em;
    }
    .temp span {
      font-size: clamp(1rem, 0.92rem + 0.5vw, 1.4rem);
      color: var(--accent);
    }
    .weather-top {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 2px;
    }
    .eyebrow,
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 10px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.018));
      border: 1px solid rgba(255, 255, 255, 0.04);
      letter-spacing: 0.01em;
      font-size: 11.5px;
      color: rgba(233, 244, 255, 0.68);
      backdrop-filter: blur(10px);
    }
    .status-chip {
      border-color: var(--city-outline);
    }
    .eyebrow::before,
    .status-chip::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 14px var(--accent-shadow);
      opacity: 0.82;
    }
    .status-chip::before {
      background: var(--city-accent);
      box-shadow: 0 0 14px var(--city-halo);
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
      gap: 0;
      margin-top: 10px;
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.042), rgba(255, 255, 255, 0.018));
      border: 1px solid rgba(255, 255, 255, 0.05);
      overflow: hidden;
    }
    .insight-card {
      margin-top: 12px;
      padding-top: 12px;
      max-width: 32rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .insight-label {
      display: block;
      font-size: 11.5px;
      letter-spacing: 0.03em;
      color: rgba(232, 244, 255, 0.58);
    }
    .insight-main {
      display: block;
      margin-top: 10px;
      font-size: 1.08rem;
      font-weight: 600;
      color: #fff;
      line-height: 1.55;
    }
    .insight-sub {
      display: block;
      margin-top: 7px;
      color: rgba(236, 245, 255, 0.68);
      font-size: 0.94rem;
      line-height: 1.6;
    }
    .metric-card {
      padding: 14px 18px 13px;
      min-width: 0;
    }
    .metric-card + .metric-card {
      border-left: 1px solid rgba(255, 255, 255, 0.05);
    }
    .metric-label {
      display: block;
      font-size: 11.5px;
      letter-spacing: 0.03em;
      color: rgba(232, 244, 255, 0.58);
    }
    .metric-value {
      display: block;
      margin-top: 6px;
      font-size: 1.4rem;
      font-weight: 600;
      color: #fff;
      line-height: 1.3;
    }
    .landmark-panel {
      position: relative;
      padding: 20px 18px 16px;
      border-radius: 32px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.012) 22%, var(--city-wash-soft) 100%),
        radial-gradient(circle at 26% 18%, var(--city-motif-fill) 0%, transparent 38%);
      border: 1px solid var(--city-outline);
      min-height: 398px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      margin-top: 6px;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.06),
        0 18px 42px rgba(3, 7, 20, 0.18);
    }
    .landmark-backdrop {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      mask-image: linear-gradient(180deg, transparent 0%, transparent 30%, black 42%, black 100%);
    }
    .landmark-panel::before {
      content: "";
      position: absolute;
      inset: 10% 8% auto auto;
      width: 11rem;
      height: 11rem;
      border-radius: 50%;
      background: var(--city-halo);
      opacity: calc(var(--glow-opacity) * 0.88);
      filter: blur(14px);
      animation: haloPulse calc(var(--pulse-duration) * 1.2) ease-in-out infinite alternate;
    }
    .landmark-backdrop::before {
      content: "";
      position: absolute;
      left: 7%;
      right: 7%;
      top: 26%;
      height: 31%;
      border-radius: 32px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.016) 44%, rgba(255, 255, 255, 0)),
        radial-gradient(circle at 48% 12%, rgba(255, 255, 255, 0.12), transparent 46%),
        radial-gradient(circle at 50% 18%, var(--city-halo), transparent 56%);
      opacity: 0.52;
      filter: blur(1px);
    }
    .landmark-motif {
      position: absolute;
      left: 8%;
      right: 8%;
      top: 33%;
      bottom: 24%;
      z-index: 0;
      color: var(--city-motif-stroke);
      opacity: calc(var(--city-motif-opacity) * 0.88);
      mix-blend-mode: screen;
      filter: drop-shadow(0 0 24px rgba(255, 255, 255, 0.04));
    }
    .landmark-motif svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .landmark-plate {
      position: absolute;
      left: 8%;
      right: 8%;
      bottom: 13%;
      height: 33%;
      border-radius: 28px 28px 0 0;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0) 30%),
        linear-gradient(180deg, rgba(6, 12, 24, 0), var(--city-plate) 28%, rgba(4, 10, 22, 0.56) 100%);
      border-top: 1px solid var(--city-outline-soft);
      opacity: 0.92;
    }
    .landmark-caption {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-bottom: 0;
      min-height: 62px;
      padding: 0;
      color: rgba(231, 242, 255, 0.64);
      font-size: 0.84rem;
    }
    .landmark-caption > div {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      gap: 2px;
      max-width: min(82%, 240px);
      padding: 10px 14px 11px;
      border-radius: 18px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.024) 46%, rgba(255, 255, 255, 0.012) 100%),
        linear-gradient(180deg, rgba(8, 15, 30, 0.46), rgba(8, 15, 30, 0.18));
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 8px 24px rgba(4, 8, 20, 0.14);
      backdrop-filter: blur(14px);
    }
    .landmark-caption > div::before {
      content: "";
      position: absolute;
      left: 14px;
      right: 14px;
      top: 0;
      height: 1px;
      background: linear-gradient(90deg, var(--city-accent), rgba(255, 255, 255, 0));
      opacity: 0.72;
    }
    .landmark-caption strong {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
    }
    .landmark-caption div div {
      color: rgba(231, 242, 255, 0.58);
    }
    .landmark-art {
      position: relative;
      z-index: 1;
      color: rgba(245, 251, 255, 0.92);
      opacity: var(--landmark-opacity);
      transform: translateY(0);
      animation: skylineFloat calc(var(--drift-duration) * 0.92) ease-in-out infinite alternate;
      max-width: 100%;
      width: 100%;
      margin-left: auto;
      margin-right: auto;
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
      bottom: -4%;
      height: 54%;
      background:
        linear-gradient(180deg, rgba(2, 8, 18, 0), rgba(3, 10, 22, 0.7) 38%, rgba(2, 8, 18, 0.96) 100%),
        radial-gradient(circle at 50% 0%, rgba(255, 255, 255, var(--haze-opacity)), transparent 52%);
    }
    .weather-footer {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: flex-start;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      color: rgba(236, 245, 255, 0.7);
      font-size: 0.9rem;
    }
    .weather-footer strong {
      color: rgba(255, 255, 255, 0.82);
      font-weight: 600;
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
        transform: translate3d(calc(var(--rain-shift-x) * -0.12), -30%, 0) rotate(var(--rain-tilt));
        opacity: 0;
      }
      18% {
        opacity: var(--rain-opacity);
      }
      100% {
        transform: translate3d(var(--rain-shift-x), 125vh, 0) rotate(var(--rain-tilt));
        opacity: 0;
      }
    }
    @keyframes drift {
      from {
        transform: translate3d(calc(var(--drift-x) * -0.35), calc(var(--drift-y) * -0.18), 0);
      }
      to {
        transform: translate3d(var(--drift-x), var(--drift-y), 0);
      }
    }
    @keyframes fogSweep {
      from {
        transform: translate3d(calc(var(--fog-drift-x) * -0.28), calc(var(--fog-drift-y) * -0.18), 0) scale(0.96);
      }
      to {
        transform: translate3d(var(--fog-drift-x), var(--fog-drift-y), 0) scale(1.04);
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
    @keyframes lightningFlash {
      0%,
      84%,
      100% {
        opacity: 0;
      }
      86% {
        opacity: calc(var(--thunder-opacity) * 0.9);
      }
      88% {
        opacity: 0.06;
      }
      89% {
        opacity: var(--thunder-opacity);
      }
      91% {
        opacity: 0;
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
        gap: 14px;
      }
      .landmark-panel {
        min-height: 280px;
        margin-top: 2px;
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
        ${visual.thunderFlashVisible ? '<div class="storm-flash"></div>' : ''}
        ${visual.rainLayerVisible ? `<div class="rain-layer">
          ${renderRainLines(visual)}
        </div>` : ''}
        ${visual.fogLayerVisible ? `<div class="fog-layer">
          <span></span>
          <span></span>
          <span></span>
        </div>` : ''}
        <div class="hero-grid">
          <div class="hero-copy">
            <div class="hero-primary">
              <div class="city">${safeCity}</div>
              <div class="temp">
                <strong>${safeTempText}</strong>
                <span>${safeThermalLabel}</span>
              </div>
            </div>
            <div class="weather-top">
              <div class="status-chip">${safeLandmarkLabel} · ${safeRainLabel}</div>
              <div class="eyebrow">${safeDayPhaseLabel} · ${safeTimeStr}</div>
            </div>
            <div class="metric-row">
              <div class="metric-card">
                <span class="metric-label">天气</span>
                <span class="metric-value">${safeCondition}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">降水</span>
                <span class="metric-value">${safePrecipitationText}</span>
              </div>
            </div>
            <div class="insight-card">
              <span class="insight-label">接下来</span>
              <span class="insight-main">${safeShortTermTrendText}</span>
              <span class="insight-sub">${safeOutingAdvice}</span>
            </div>
          </div>
          <aside class="landmark-panel">
            <div class="landmark-backdrop">
              ${cityMotif ? `<div class="landmark-motif">${cityMotif}</div>` : ''}
              <div class="landmark-plate"></div>
            </div>
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
          ${data.isStale ? '<div class="stale-warning">天气暂未刷新，当前为缓存内容</div>' : ''}
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
