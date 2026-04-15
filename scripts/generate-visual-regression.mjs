import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getCityDisplayName } from '../lib/city-config.js';
import { getWeatherDescription } from '../lib/i18n.js';
import { renderContentPage } from '../functions/render.js';
import {
  getDayPhaseLabel,
  getOutingAdvice,
  getShortTermTrendText,
  getVisualState,
  normalizePrecipitationProbability,
  normalizeShortTermForecast
} from '../functions/weather-rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const outputDir = path.join(projectRoot, '.tmp', 'visual-regression');
const scenariosDir = path.join(outputDir, 'scenarios');
const currentSnapshotPath = path.join(outputDir, 'snapshots.json');
const previousSnapshotPath = path.join(outputDir, 'previous-snapshots.json');
const diffSummaryPath = path.join(outputDir, 'diff-summary.json');
const indexPath = path.join(outputDir, 'index.html');

const STYLE_KEYS = [
  '--rain-opacity',
  '--cloud-opacity',
  '--haze-opacity',
  '--fog-opacity',
  '--thunder-opacity',
  '--drift-duration',
  '--rain-tilt',
  '--rain-shift-x',
  '--landmark-opacity',
  '--phase-overlay-top'
];

const SCENARIOS = [
  {
    key: 'clear-heat',
    title: '晴热',
    description: '高体感、轻风、低降水，检查热感和晴空状态。',
    city: 'Beijing',
    temp: 31,
    feelsLike: 34,
    humidity: 72,
    windSpeed: 2.4,
    windDirection: 210,
    conditionCode: 800,
    precipitationProbability: 10,
    timeStr: '13:20',
    dayPhase: 'day',
    shortTermForecast: {
      nextPrecipitationProbability: 8,
      peakPrecipitationProbability: 18,
      peakOffsetHours: 3,
      trendDirection: 'steady',
      nextConditionCode: 800
    }
  },
  {
    key: 'overcast-humid',
    title: '阴云高湿',
    description: '厚云和高湿叠加，检查阴天压感与潮湿氛围。',
    city: 'Beijing',
    temp: 22,
    feelsLike: 24,
    humidity: 88,
    windSpeed: 2.8,
    windDirection: 165,
    conditionCode: 804,
    precipitationProbability: 68,
    timeStr: '17:48',
    dayPhase: 'dusk',
    shortTermForecast: {
      nextPrecipitationProbability: 72,
      peakPrecipitationProbability: 78,
      peakOffsetHours: 2,
      humidityRiseOffsetHours: 1,
      peakHumidity: 92,
      trendDirection: 'up',
      nextConditionCode: 804
    }
  },
  {
    key: 'drizzle-humid',
    title: '毛毛雨',
    description: '细雨和高湿并存，检查雨幕和雾层是否都克制可读。',
    city: 'Beijing',
    temp: 18,
    feelsLike: 18,
    humidity: 92,
    windSpeed: 4.2,
    windDirection: 145,
    conditionCode: 301,
    precipitationProbability: 72,
    timeStr: '11:10',
    dayPhase: 'day',
    shortTermForecast: {
      nextPrecipitationProbability: 70,
      peakPrecipitationProbability: 78,
      peakOffsetHours: 2,
      trendDirection: 'steady',
      nextConditionCode: 301
    }
  },
  {
    key: 'fog-heavy',
    title: '浓雾',
    description: '高湿低风雾态，检查雾层存在时不要误出雨幕。',
    city: 'Beijing',
    temp: 16,
    feelsLike: 15,
    humidity: 95,
    windSpeed: 1.3,
    windDirection: 100,
    conditionCode: 741,
    precipitationProbability: 8,
    timeStr: '06:10',
    dayPhase: 'morning',
    shortTermForecast: null
  },
  {
    key: 'windy-clear',
    title: '大风晴天',
    description: '高风速晴天，检查方向性漂移增强但不误出雨雾层。',
    city: 'Beijing',
    temp: 17,
    feelsLike: 15,
    humidity: 46,
    windSpeed: 10.5,
    windDirection: 290,
    conditionCode: 800,
    precipitationProbability: 0,
    timeStr: '14:40',
    dayPhase: 'day',
    shortTermForecast: {
      nextPrecipitationProbability: 0,
      peakPrecipitationProbability: 8,
      peakOffsetHours: 2,
      windRiseOffsetHours: 1,
      peakWindSpeed: 11,
      trendDirection: 'steady',
      nextConditionCode: 800
    }
  },
  {
    key: 'active-thunder',
    title: '雷雨',
    description: '强风高降水雷雨，检查闪层和横向雨幕是否稳定。',
    city: 'Beijing',
    temp: 24,
    feelsLike: 25,
    humidity: 84,
    windSpeed: 11.2,
    windDirection: 230,
    conditionCode: 211,
    precipitationProbability: 92,
    timeStr: '18:25',
    dayPhase: 'dusk',
    shortTermForecast: {
      nextPrecipitationProbability: 90,
      peakPrecipitationProbability: 94,
      peakOffsetHours: 1,
      trendDirection: 'steady',
      nextConditionCode: 211
    }
  }
];

function parseInlineStyle(styleText) {
  return styleText.split(';').reduce((accumulator, entry) => {
    const [rawKey, rawValue] = entry.split(':');
    if (!rawKey || rawValue === undefined) {
      return accumulator;
    }

    accumulator[rawKey.trim()] = rawValue.trim();
    return accumulator;
  }, {});
}

function buildPageData(scenario) {
  const cityDisplayName = getCityDisplayName(scenario.city);
  const condition = getWeatherDescription(scenario.conditionCode);
  const precipitationProbability = normalizePrecipitationProbability(scenario.precipitationProbability);
  const precipitationText = precipitationProbability === null ? '暂无数据' : `${precipitationProbability}%`;
  const shortTermForecast = normalizeShortTermForecast(scenario.shortTermForecast);
  const shortTermTrendText = getShortTermTrendText(
    shortTermForecast,
    scenario.conditionCode,
    precipitationProbability
  );
  const outingAdvice = getOutingAdvice(
    shortTermForecast,
    scenario.conditionCode,
    precipitationProbability,
    scenario.temp,
    scenario.feelsLike
  );
  const dayPhaseLabel = getDayPhaseLabel(scenario.dayPhase);
  const precipitationTitlePart = precipitationProbability === null
    ? ' 降水暂无'
    : ` 降水${precipitationProbability}%`;
  const title = `${scenario.city} ${scenario.temp}°C ${condition}${precipitationTitlePart} - ${scenario.timeStr}`;

  return {
    title,
    city: scenario.city,
    cityDisplayName,
    temp: scenario.temp,
    feelsLike: scenario.feelsLike,
    humidity: scenario.humidity,
    windSpeed: scenario.windSpeed,
    windDirection: scenario.windDirection,
    condition,
    conditionCode: scenario.conditionCode,
    precipitationProbability,
    precipitationText,
    timeStr: scenario.timeStr,
    dayPhase: scenario.dayPhase,
    dayPhaseLabel,
    shortTermForecast,
    shortTermTrendText,
    outingAdvice,
    timezoneOffsetSeconds: 8 * 60 * 60,
    isStale: false
  };
}

function createScenarioSnapshot(scenario, pageData, visual) {
  const styleVars = parseInlineStyle(visual.style);

  return {
    key: scenario.key,
    title: scenario.title,
    description: scenario.description,
    city: pageData.cityDisplayName,
    time: `${pageData.dayPhaseLabel} · ${pageData.timeStr}`,
    condition: pageData.condition,
    precipitation: pageData.precipitationText,
    shortTermTrendText: pageData.shortTermTrendText,
    outingAdvice: pageData.outingAdvice,
    thermalLabel: visual.thermalLabel,
    rainLabel: visual.rainLabel,
    weatherFamily: visual.weatherFamily,
    weatherVariant: visual.weatherVariant,
    style: STYLE_KEYS.reduce((accumulator, key) => {
      accumulator[key] = styleVars[key] ?? null;
      return accumulator;
    }, {})
  };
}

function flattenSnapshot(snapshot, prefix = '', accumulator = {}) {
  for (const [key, value] of Object.entries(snapshot)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenSnapshot(value, nextKey, accumulator);
      continue;
    }
    accumulator[nextKey] = value;
  }
  return accumulator;
}

function createDiffSummary(previousSnapshots, currentSnapshots) {
  if (!Array.isArray(previousSnapshots) || previousSnapshots.length === 0) {
    return {
      hasPrevious: false,
      changedScenarios: []
    };
  }

  const previousByKey = new Map(previousSnapshots.map((snapshot) => [snapshot.key, snapshot]));
  const changedScenarios = [];

  for (const currentSnapshot of currentSnapshots) {
    const previousSnapshot = previousByKey.get(currentSnapshot.key);
    if (!previousSnapshot) {
      changedScenarios.push({
        key: currentSnapshot.key,
        status: 'new',
        changedFields: ['*']
      });
      continue;
    }

    const previousFlat = flattenSnapshot(previousSnapshot);
    const currentFlat = flattenSnapshot(currentSnapshot);
    const changedFields = Object.keys(currentFlat).filter((key) => previousFlat[key] !== currentFlat[key]);

    if (changedFields.length > 0) {
      changedScenarios.push({
        key: currentSnapshot.key,
        status: 'changed',
        changedFields
      });
    }
  }

  return {
    hasPrevious: true,
    changedScenarios
  };
}

function renderIndexPage(snapshots) {
  const cards = snapshots.map((snapshot) => {
    const styleVars = Object.entries(snapshot.style)
      .map(([key, value]) => `<li><code>${key}</code><span>${value}</span></li>`)
      .join('');

    return `
      <section class="scenario-card">
        <div class="scenario-meta">
          <div>
            <h2>${snapshot.title}</h2>
            <p>${snapshot.description}</p>
          </div>
          <a href="./scenarios/${snapshot.key}.html" target="_blank" rel="noreferrer">打开单页</a>
        </div>
        <div class="scenario-copy">
          <div>${snapshot.city} · ${snapshot.time}</div>
          <div>${snapshot.condition} · ${snapshot.precipitation}</div>
          <div>${snapshot.rainLabel} / ${snapshot.thermalLabel}</div>
          <div>${snapshot.shortTermTrendText}</div>
          <div>${snapshot.outingAdvice}</div>
        </div>
        <iframe src="./scenarios/${snapshot.key}.html" title="${snapshot.title}"></iframe>
        <ul class="style-grid">${styleVars}</ul>
      </section>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>天气页面视觉回归</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "SF Pro Display", "Segoe UI", sans-serif;
      background: #07111d;
      color: #eef6ff;
    }
    main {
      width: min(1320px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 28px 0 48px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 2rem;
    }
    .intro {
      margin: 0 0 24px;
      color: rgba(238, 246, 255, 0.72);
      line-height: 1.6;
    }
    .scenario-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 18px;
    }
    .scenario-card {
      padding: 16px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
    }
    .scenario-meta {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .scenario-meta h2 {
      margin: 0;
      font-size: 1.1rem;
    }
    .scenario-meta p {
      margin: 8px 0 0;
      color: rgba(238, 246, 255, 0.68);
      line-height: 1.5;
      font-size: 0.95rem;
    }
    .scenario-meta a {
      color: #bfe7ff;
      text-decoration: none;
      white-space: nowrap;
    }
    .scenario-copy {
      margin-top: 14px;
      display: grid;
      gap: 6px;
      color: rgba(238, 246, 255, 0.82);
      font-size: 0.93rem;
    }
    iframe {
      margin-top: 14px;
      width: 100%;
      height: 420px;
      border: 0;
      border-radius: 20px;
      background: #091624;
    }
    .style-grid {
      list-style: none;
      padding: 0;
      margin: 14px 0 0;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 12px;
      color: rgba(238, 246, 255, 0.74);
      font-size: 0.84rem;
    }
    .style-grid li {
      display: grid;
      gap: 4px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .style-grid code {
      color: #9fdcff;
    }
    @media (max-width: 720px) {
      main { width: calc(100vw - 16px); }
      .style-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <h1>天气页面视觉回归</h1>
    <p class="intro">这组本地场景覆盖晴热、阴云高湿、毛毛雨、浓雾、大风晴天和雷雨。每次调整天气规则或页面样式后，重新生成这里的单页和快照，就能快速发现明显的视觉退化。</p>
    <div class="scenario-list">${cards}</div>
  </main>
</body>
</html>`;
}

async function readSnapshotsIfPresent(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

await mkdir(scenariosDir, { recursive: true });
await rm(indexPath, { force: true });

const previousCurrentSnapshots = await readSnapshotsIfPresent(currentSnapshotPath);
if (previousCurrentSnapshots) {
  await writeFile(previousSnapshotPath, JSON.stringify(previousCurrentSnapshots, null, 2));
}

const snapshots = [];

for (const scenario of SCENARIOS) {
  const pageData = buildPageData(scenario);
  const visual = getVisualState(pageData);
  const html = renderContentPage(pageData, {
    canonicalUrl: `https://example.com/visual-regression/${scenario.key}`,
    ogImageUrl: 'https://example.com/og-image'
  });
  const scenarioPath = path.join(scenariosDir, `${scenario.key}.html`);

  await writeFile(scenarioPath, html, 'utf8');
  snapshots.push(createScenarioSnapshot(scenario, pageData, visual));
}

const diffSummary = createDiffSummary(previousCurrentSnapshots, snapshots);

await writeFile(currentSnapshotPath, JSON.stringify(snapshots, null, 2));
await writeFile(diffSummaryPath, JSON.stringify(diffSummary, null, 2));
await writeFile(indexPath, renderIndexPage(snapshots), 'utf8');

console.log(JSON.stringify({
  outputDir,
  indexPath,
  snapshotsPath: currentSnapshotPath,
  previousSnapshotsPath: previousCurrentSnapshots ? previousSnapshotPath : null,
  diffSummaryPath,
  scenarioCount: snapshots.length,
  scenarioKeys: snapshots.map((snapshot) => snapshot.key)
}, null, 2));
