/**
 * OpenWeatherMap API Integration
 */

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org";

export interface WeatherData {
  temp: number;
  condition: string;
  description: string;
  icon: string;
}

/**
 * Get coordinates for a destination
 */
export async function getCoordinates(query: string) {
  if (!API_KEY) return null;
  
  try {
    const res = await fetch(
      `${BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${API_KEY}`
    );
    const data = await res.json();
    
    if (data && data.length > 0) {
      return {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].name
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}

/**
 * Fetch forecast for a destination and a specific date
 * Returns the closest forecast found or null
 */
export async function getDailyWeather(lat: number, lon: number, targetDate: Date): Promise<WeatherData | null> {
  if (!API_KEY) return null;

  try {
    // Using 5-day / 3-hour forecast for free tier support
    const res = await fetch(
      `${BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();

    if (!data || !data.list) return null;

    // Find forecast closest to targetDate (matching date and mid-day time)
    const targetTimestamp = targetDate.getTime();
    let bestMatch = data.list[0];
    let minDiff = Math.abs(data.list[0].dt * 1000 - targetTimestamp);

    for (const item of data.list) {
      const diff = Math.abs(item.dt * 1000 - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = item;
      }
    }

    // Only return if it's within a reasonable range (e.g., same day or very close)
    // 5-day forecast only gives 5 days. If targetDate is far, this will just return the closest (end of forecast).
    // We should check if the date actually matches.
    const matchDate = new Date(bestMatch.dt * 1000);
    const isSameDay = matchDate.getUTCDate() === targetDate.getUTCDate() &&
                     matchDate.getUTCMonth() === targetDate.getUTCMonth();

    if (!isSameDay) {
        // If not same day, we might be out of range for the 5-day forecast.
        return null;
    }

    return {
      temp: Math.round(bestMatch.main.temp),
      condition: bestMatch.weather[0].main,
      description: bestMatch.weather[0].description,
      icon: bestMatch.weather[0].icon
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
}
