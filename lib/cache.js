// KV cache module for weather data
// Provides TTL-based caching with fallback on API errors

import { fetchWeather } from './weather.js';

// TTL: 30 minutes (in milliseconds)
export const KV_TTL_MS = 30 * 60 * 1000;

/**
 * Get cached weather data, or fetch fresh data if cache is expired/missing
 * @param {Object} kv - KV namespace binding from context.env.WEATHER_KV
 * @param {string} apiKey - OpenWeatherMap API key
 * @param {string} city - City name
 * @returns {Promise<{data: Object, stale: boolean}>} Weather data with stale flag
 * @throws {Error} If no cache exists and API fails
 */
export async function getCachedWeather(kv, apiKey, city) {
  const cacheKey = `weather:${city.toLowerCase()}`;

  try {
    // Try to read from cache
    const cached = await kv.get(cacheKey, 'json');

    if (cached && cached.data && cached.timestamp) {
      const age = Date.now() - cached.timestamp;

      // If cache is still fresh (within TTL), return it
      if (age < KV_TTL_MS) {
        return {
          data: cached.data,
          stale: false
        };
      }

      // Cache is expired, try to fetch fresh data
      try {
        const freshData = await fetchWeather(apiKey, city);

        // Store fresh data in cache
        await kv.put(cacheKey, JSON.stringify({
          data: freshData,
          timestamp: Date.now()
        }));

        return {
          data: freshData,
          stale: false
        };

      } catch (apiError) {
        // API failed - return expired cache data with stale flag (graceful degradation)
        return {
          data: cached.data,
          stale: true
        };
      }
    }

    // No cache exists - fetch fresh data
    const freshData = await fetchWeather(apiKey, city);

    // Store in cache
    await kv.put(cacheKey, JSON.stringify({
      data: freshData,
      timestamp: Date.now()
    }));

    return {
      data: freshData,
      stale: false
    };

  } catch (error) {
    // If it's an API error from fetchWeather and we have no cache, re-throw
    if (error.message.includes('API') || error.message.includes('timed out') || error.message.includes('not found')) {
      throw error;
    }

    // KV operation error - try direct API fetch as fallback
    const freshData = await fetchWeather(apiKey, city);
    return {
      data: freshData,
      stale: false
    };
  }
}

/**
 * Manually invalidate cache for a city
 * @param {Object} kv - KV namespace binding
 * @param {string} city - City name
 * @returns {Promise<void>}
 */
export async function invalidateCache(kv, city) {
  const cacheKey = `weather:${city.toLowerCase()}`;
  await kv.delete(cacheKey);
}

/**
 * Get cache status for debugging
 * @param {Object} kv - KV namespace binding
 * @param {string} city - City name
 * @returns {Promise<{exists: boolean, age: number|null, isFresh: boolean|null}>}
 */
export async function getCacheStatus(kv, city) {
  const cacheKey = `weather:${city.toLowerCase()}`;

  try {
    const cached = await kv.get(cacheKey, 'json');

    if (!cached || !cached.timestamp) {
      return {
        exists: false,
        age: null,
        isFresh: null
      };
    }

    const age = Date.now() - cached.timestamp;
    return {
      exists: true,
      age,
      isFresh: age < KV_TTL_MS
    };

  } catch (error) {
    return {
      exists: false,
      age: null,
      isFresh: null,
      error: error.message
    };
  }
}
