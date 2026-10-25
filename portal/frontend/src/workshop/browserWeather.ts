/** The browser implementation of the real Open-Meteo tool. No portal backend. */
const TOWNS: Record<string, [string, number, number]> = {
  revnice: ['Řevnice', 49.91395, 14.23589],
  dobrichovice: ['Dobřichovice', 49.92749, 14.27469],
  karlstejn: ['Karlštejn', 49.93735, 14.18605],
  'zadni treban': ['Zadní Třebaň', 49.91802, 14.20808],
  lety: ['Lety', 49.921, 14.2552],
};
const SOURCE = 'Weather data by Open-Meteo (https://open-meteo.com/), CC BY 4.0';
const DAILY = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max';
const cache = new Map<string, { at: number; result: Record<string, unknown> }>();
function condition(code: number): string {
  if (code === 0) return 'clear';
  if ([1, 2].includes(code)) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if ([45, 48].includes(code)) return 'foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'thunderstorm';
  return `WMO code ${code}`;
}
export async function browserWeather(city: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<Record<string, unknown>> {
  signal.throwIfAborted();
  const key = city.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const stored = cache.get(key);
  if (stored && Date.now() - stored.at < 300_000) return stored.result;
  const toolSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
  async function get(url: URL) {
    // Never pass the model key, cookies or referrer to the weather provider.
    const response = await fetcher(url, { signal: toolSignal, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('Weather request failed');
    return response.json();
  }
  try {
    let location = TOWNS[key];
    if (!location) {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.search = new URLSearchParams({ name: city, count: '1', language: 'en' }).toString();
      const place = (await get(url)).results?.[0];
      if (!place || typeof place.name !== 'string' || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) throw new Error('Location not found');
      location = [place.name, place.latitude, place.longitude];
    }
    const [name, latitude, longitude] = location;
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), timezone: 'auto', forecast_days: '1', daily: DAILY, current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation' }).toString();
    const data = await get(url);
    const c = data.current; const d = data.daily;
    const numbers = [c?.temperature_2m, c?.relative_humidity_2m, c?.weather_code, c?.wind_speed_10m, c?.precipitation, d?.weather_code?.[0], d?.temperature_2m_max?.[0], d?.temperature_2m_min?.[0], d?.precipitation_probability_max?.[0], d?.precipitation_sum?.[0], d?.wind_speed_10m_max?.[0]];
    if (!numbers.every(Number.isFinite) || typeof c.time !== 'string' || typeof d.time?.[0] !== 'string' || typeof data.timezone !== 'string') throw new Error('Incomplete weather response');
    const result = {
      city: name, latitude, longitude, timezone: data.timezone, source: SOURCE,
      data_kind: 'weather-model estimate and forecast, not a local station observation', fetched_at: new Date().toISOString(),
      as_of: c.time, temperature: `${c.temperature_2m}°C`, condition: condition(c.weather_code), humidity: `${c.relative_humidity_2m}%`, wind: `${c.wind_speed_10m} km/h`, precipitation_mm: c.precipitation,
      today: { date: d.time[0], condition: condition(d.weather_code[0]), temperature_max_c: d.temperature_2m_max[0], temperature_min_c: d.temperature_2m_min[0], precipitation_probability_max_pct: d.precipitation_probability_max[0], precipitation_sum_mm: d.precipitation_sum[0], wind_max_kmh: d.wind_speed_10m_max[0] },
    };
    if (cache.size >= 50) cache.clear();
    cache.set(key, { at: Date.now(), result });
    return result;
  } catch {
    signal.throwIfAborted();
    return { city, source: SOURCE, error: 'Open-Meteo request failed. Check network, CORS or location.', fallback: false };
  }
}
