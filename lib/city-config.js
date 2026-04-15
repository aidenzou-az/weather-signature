const DEFAULT_CITY_VISUAL = Object.freeze({
  key: 'default',
  aliases: [],
  landmark: {
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
  },
  theme: {}
});

const CITY_VISUALS = [
  Object.freeze({
    key: 'beijing',
    aliases: ['beijing', '北京'],
    landmark: {
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
    },
    theme: {}
  })
];

const CITY_VISUALS_BY_ALIAS = new Map();

for (const cityVisual of CITY_VISUALS) {
  for (const alias of cityVisual.aliases) {
    CITY_VISUALS_BY_ALIAS.set(alias, cityVisual);
  }
}

function normalizeCityName(city) {
  if (typeof city !== 'string') {
    return '';
  }

  return city.trim().toLowerCase();
}

export function getCityVisualConfig(city) {
  const normalized = normalizeCityName(city);

  if (!normalized) {
    return DEFAULT_CITY_VISUAL;
  }

  return CITY_VISUALS_BY_ALIAS.get(normalized) || DEFAULT_CITY_VISUAL;
}
