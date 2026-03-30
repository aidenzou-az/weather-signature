// Weather condition code to Chinese translation
// Maps OpenWeatherMap condition codes to Chinese descriptions

/**
 * Weather condition code mapping to Chinese
 * Based on OpenWeatherMap weather condition codes
 * @see https://openweathermap.org/weather-conditions
 */
export const WEATHER_MAP = {
  // Clear (晴朗)
  800: '晴朗',

  // Clouds (多云/阴)
  801: '少云',
  802: '多云',
  803: '阴',
  804: '阴',

  // Drizzle (毛毛雨)
  300: '毛毛雨',
  301: '毛毛雨',
  302: '毛毛雨',
  310: '毛毛雨',
  311: '毛毛雨',
  312: '毛毛雨',
  313: '毛毛雨',
  314: '毛毛雨',
  321: '毛毛雨',

  // Rain (雨)
  500: '小雨',
  501: '中雨',
  502: '大雨',
  503: '暴雨',
  504: '大暴雨',
  511: '冻雨',
  520: '阵雨',
  521: '阵雨',
  522: '强阵雨',
  531: '局部阵雨',

  // Thunderstorm (雷暴)
  200: '雷阵雨',
  201: '雷阵雨',
  202: '强雷阵雨',
  210: '雷暴',
  211: '雷暴',
  212: '强雷暴',
  221: '局部雷暴',
  230: '雷阵雨伴 drizzle',
  231: '雷阵雨伴 drizzle',
  232: '强雷阵雨伴 drizzle',

  // Snow (雪)
  600: '小雪',
  601: '中雪',
  602: '大雪',
  611: '雨夹雪',
  612: '雨夹雪',
  613: '雨夹雪',
  615: '雨雪',
  616: '雨雪',
  620: '阵雪',
  621: '阵雪',
  622: '强阵雪',

  // Atmosphere (大气现象)
  701: '雾',
  711: '霾',
  721: '霾',
  731: '沙尘',
  741: '雾',
  751: '沙',
  761: '尘',
  762: '火山灰',
  771: '飑',
  781: '龙卷风',

  // Additional Chinese-specific mappings for common descriptions
  'clear sky': '晴朗',
  'few clouds': '少云',
  'scattered clouds': '多云',
  'broken clouds': '阴',
  'overcast clouds': '阴',
  'light rain': '小雨',
  'moderate rain': '中雨',
  'heavy rain': '大雨',
  'light snow': '小雪',
  'heavy snow': '大雪'
};

/**
 * Get Chinese weather description for a weather condition code
 * @param {number} weatherId - OpenWeatherMap weather condition ID
 * @param {string} [fallback] - Optional fallback description
 * @returns {string} Chinese weather description
 */
export function getWeatherDescription(weatherId, fallback = '未知') {
  // Direct ID lookup
  if (WEATHER_MAP[weatherId] !== undefined) {
    return WEATHER_MAP[weatherId];
  }

  // Range-based fallback for unknown codes
  if (weatherId >= 200 && weatherId < 300) {
    return '雷阵雨';
  }
  if (weatherId >= 300 && weatherId < 400) {
    return '毛毛雨';
  }
  if (weatherId >= 500 && weatherId < 600) {
    return '雨';
  }
  if (weatherId >= 600 && weatherId < 700) {
    return '雪';
  }
  if (weatherId >= 700 && weatherId < 800) {
    return '雾/霾';
  }
  if (weatherId >= 801 && weatherId < 900) {
    return '多云';
  }

  return fallback;
}

/**
 * Get all available weather condition codes
 * @returns {number[]} Array of weather condition IDs
 */
export function getWeatherCodes() {
  return Object.keys(WEATHER_MAP)
    .filter(key => typeof key === 'number' || !isNaN(Number(key)))
    .map(Number);
}
