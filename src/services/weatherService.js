const weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=53.3498&longitude=-6.2603&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=1&timezone=Europe%2FDublin";
const weatherCacheKey = "dublin-v3:weather";

export const weatherConditions = {
  0: { label: "Ciel dégagé", icon: "sun" },
  1: { label: "Plutôt dégagé", icon: "sun" },
  2: { label: "Éclaircies et nuages", icon: "cloud-sun" },
  3: { label: "Nuageux", icon: "cloud" },
  45: { label: "Brouillard", icon: "fog" },
  48: { label: "Brouillard givrant", icon: "fog" },
  51: { label: "Bruine légère", icon: "rain" },
  53: { label: "Bruine modérée", icon: "rain" },
  55: { label: "Bruine dense", icon: "rain" },
  56: { label: "Bruine verglaçante", icon: "snow" },
  57: { label: "Bruine verglaçante", icon: "snow" },
  61: { label: "Pluie légère", icon: "rain" },
  63: { label: "Pluie modérée", icon: "rain" },
  65: { label: "Pluie soutenue", icon: "rain" },
  66: { label: "Pluie verglaçante", icon: "snow" },
  67: { label: "Pluie verglaçante", icon: "snow" },
  71: { label: "Neige légère", icon: "snow" },
  73: { label: "Neige modérée", icon: "snow" },
  75: { label: "Neige soutenue", icon: "snow" },
  77: { label: "Grains de neige", icon: "snow" },
  80: { label: "Averses légères", icon: "rain" },
  81: { label: "Averses modérées", icon: "rain" },
  82: { label: "Fortes averses", icon: "rain" },
  85: { label: "Averses de neige", icon: "snow" },
  86: { label: "Fortes averses de neige", icon: "snow" },
  95: { label: "Orage", icon: "storm" },
  96: { label: "Orage et grêle", icon: "storm" },
  99: { label: "Orage et grêle", icon: "storm" },
};

export function getCachedWeather() {
  try {
    const cached = localStorage.getItem(weatherCacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function getDublinWeather(signal) {
  const response = await fetch(weatherUrl, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Le service météo répond ${response.status}.`);
  const result = await response.json();
  const current = result.current;
  const forecast = result.daily;
  if (!current || !forecast || !Array.isArray(forecast.time) || forecast.time.length === 0) {
    throw new Error("La réponse météo ne contient pas les prévisions attendues.");
  }

  const weather = {
    current: {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      code: current.weather_code,
      windSpeed: Math.round(current.wind_speed_10m),
    },
    today: {
      minimum: Math.round(forecast.temperature_2m_min[0]),
      maximum: Math.round(forecast.temperature_2m_max[0]),
      precipitationChance: forecast.precipitation_probability_max[0],
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(weatherCacheKey, JSON.stringify(weather));
  } catch {
    // Live weather remains available when browser storage is full or disabled.
  }
  return weather;
}
