// OpenWeatherMap API client
// Provides weather data fetching with timeout and error handling

const CURRENT_WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const TIMEOUT_MS = 5000; // 5 second timeout

async function fetchJson(url, { city, allowNotFound = false } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404 && allowNotFound && city) {
        throw new Error(`City "${city}" not found. Please check the city name.`);
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
      }
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Weather API request timed out after 5 seconds');
    }

    if (error.message.includes('fetch')) {
      throw new Error(`Failed to connect to weather API: ${error.message}`);
    }

    throw error;
  }
}

function toPrecipitationPercent(pop) {
  if (typeof pop !== 'number' || !Number.isFinite(pop)) {
    return null;
  }

  const rawPercent = pop <= 1 ? pop * 100 : pop;
  const clamped = Math.max(0, Math.min(100, rawPercent));
  return Math.round(clamped);
}

function extractPrecipitationProbability(forecast) {
  const nextWithPop = forecast?.list?.find((item) => typeof item?.pop === 'number');
  return toPrecipitationPercent(nextWithPop?.pop);
}

async function fetchForecastByCoords(apiKey, lat, lon) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    appid: apiKey,
    units: 'metric',
    cnt: '3'
  });

  return fetchJson(`${FORECAST_API_URL}?${params.toString()}`);
}

async function withPrecipitationProbability(apiKey, weather) {
  const lat = weather?.coord?.lat;
  const lon = weather?.coord?.lon;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      ...weather,
      precipitationProbability: null
    };
  }

  try {
    const forecast = await fetchForecastByCoords(apiKey, lat, lon);
    return {
      ...weather,
      precipitationProbability: extractPrecipitationProbability(forecast)
    };
  } catch {
    return {
      ...weather,
      precipitationProbability: null
    };
  }
}

/**
 * Fetch weather data from OpenWeatherMap API
 * @param {string} apiKey - OpenWeatherMap API key
 * @param {string} city - City name (e.g., 'Beijing', 'Shanghai')
 * @returns {Promise<Object>} Weather data JSON
 * @throws {Error} If API request fails or times out
 */
export async function fetchWeather(apiKey, city) {
  // Build URL with query parameters
  const params = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: 'metric' // Get temperature in Celsius
  });

  const url = `${CURRENT_WEATHER_API_URL}?${params.toString()}`;
  const weather = await fetchJson(url, { city, allowNotFound: true });
  return withPrecipitationProbability(apiKey, weather);
}

/**
 * Fetch weather by geographic coordinates (lat/lon)
 * @param {string} apiKey - OpenWeatherMap API key
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data JSON
 * @throws {Error} If API request fails or times out
 */
export async function fetchWeatherByCoords(apiKey, lat, lon) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    appid: apiKey,
    units: 'metric'
  });

  const url = `${CURRENT_WEATHER_API_URL}?${params.toString()}`;
  const weather = await fetchJson(url);
  return withPrecipitationProbability(apiKey, weather);
}
