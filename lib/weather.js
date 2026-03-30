// OpenWeatherMap API client
// Provides weather data fetching with timeout and error handling

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const TIMEOUT_MS = 5000; // 5 second timeout

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

  const url = `${WEATHER_API_URL}?${params.toString()}`;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`City "${city}" not found. Please check the city name.`);
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
      }
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Weather API request timed out after 5 seconds');
    }

    // Re-throw with more context if it's a network error
    if (error.message.includes('fetch')) {
      throw new Error(`Failed to connect to weather API: ${error.message}`);
    }

    throw error;
  }
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

  const url = `${WEATHER_API_URL}?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
      }
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Weather API request timed out after 5 seconds');
    }

    throw error;
  }
}
