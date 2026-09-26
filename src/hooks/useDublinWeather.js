import { useEffect, useState } from "react";
import { getCachedWeather, getDublinWeather } from "../services/weatherService";

export default function useDublinWeather() {
  const [weather, setWeather] = useState(() => getCachedWeather());
  const [loading, setLoading] = useState(!weather);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function refresh() {
      try {
        setWeather(await getDublinWeather(controller.signal));
        setStale(false);
        setError("");
      } catch (weatherError) {
        if (weatherError.name === "AbortError") return;
        const cachedWeather = getCachedWeather();
        if (cachedWeather) {
          setWeather(cachedWeather);
          setStale(true);
          setError(`Mise à jour indisponible : ${weatherError.message}`);
        } else {
          setError(`Impossible de charger la météo : ${weatherError.message}`);
        }
      } finally {
        setLoading(false);
      }
    }

    void refresh();
    const refreshTimer = window.setInterval(() => void refresh(), 10 * 60_000);
    return () => {
      controller.abort();
      window.clearInterval(refreshTimer);
    };
  }, []);

  return { weather, loading, error, stale };
}
