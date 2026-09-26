import { useMemo } from "react";
import { Cloud, CloudFog, CloudRain, CloudSnow, CloudSun, LoaderCircle, Sun, Thermometer, Wind, Zap } from "lucide-react";
import { trip } from "../../data/itineraryData";
import { weatherConditions } from "../../services/weatherService";
import useDublinWeather from "../../hooks/useDublinWeather";

const weatherIcons = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: Zap,
};

function ForecastItem({ day }) {
  const condition = weatherConditions[day.code] ?? { label: "Variable", icon: "cloud" };
  const Icon = weatherIcons[condition.icon] ?? Cloud;
  const dayLabel = new Date(`${day.date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  return (
    <div className="min-w-[4.6rem] rounded-2xl bg-white/[0.035] px-3 py-3 text-center">
      <p className="text-[11px] font-medium capitalize text-slate-400">{dayLabel}</p>
      <Icon size={18} className="mx-auto my-2 text-mint" aria-label={condition.label} />
      <p className="text-xs font-semibold text-white"><span>{day.maximum}°</span><span className="ml-1 text-slate-500">{day.minimum}°</span></p>
    </div>
  );
}

export default function WeatherWidget() {
  const { weather, loading, error, stale } = useDublinWeather();
  const condition = useMemo(
    () => weatherConditions[weather?.current.code] ?? { label: "Conditions variables", icon: "cloud" },
    [weather?.current.code],
  );
  const Icon = weatherIcons[condition.icon] ?? Cloud;
  const latestUpdate = weather?.updatedAt
    ? new Date(weather.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <section aria-live="polite" className="glass-card flex min-w-0 flex-col justify-between gap-4 overflow-hidden rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Météo en direct · Dublin</p>
          <p className="mt-1 text-xs text-slate-400">{stale ? "Dernière prévision enregistrée" : "Centre-ville · source Open-Meteo"}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/[0.09] text-mint"><Icon size={22} /></span>
      </div>
      {loading && !weather ? (
        <div className="flex min-h-20 items-center gap-3 text-sm text-slate-300"><LoaderCircle size={19} className="animate-spin text-mint" />Récupération de la météo…</div>
      ) : weather ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Icon size={38} strokeWidth={1.6} className="shrink-0 text-mint" aria-hidden="true" />
              <div>
                <p className="text-5xl font-semibold tracking-tight text-white">{weather.current.temperature}°</p>
                <p className="mt-1 text-sm text-mint">{condition.label}</p>
              </div>
            </div>
            <p className="pb-1 text-right text-xs leading-5 text-slate-400">Ressenti {weather.current.feelsLike}°<br />{weather.today.minimum}° — {weather.today.maximum}° aujourd'hui</p>
          </div>
          {weather.forecast?.length > 0 && <div className="border-t border-white/[0.07] pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Les 7 prochains jours</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{weather.forecast.map((day) => <ForecastItem key={day.date} day={day} />)}</div>
          </div>}
          <div className="grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-3">
            <p className="flex items-center gap-2 text-xs text-slate-300"><Thermometer size={15} className="text-mint" />Max. {weather.today.maximum}° / min. {weather.today.minimum}°</p>
            <p className="flex items-center gap-2 text-xs text-slate-300"><CloudRain size={15} className="text-sky-200" />Pluie : {weather.today.precipitationChance ?? "—"} %</p>
            <p className="flex items-center gap-2 text-xs text-slate-300"><Wind size={15} className="text-mint" />Vent : {weather.current.windSpeed} km/h</p>
            <p className="text-right text-[10px] text-muted">Actualisée à {latestUpdate}</p>
          </div>
        </>
      ) : (
        <div className="min-h-20">
          <p className="text-2xl font-semibold text-white">{trip.weather.low}° — {trip.weather.high}°C</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">Tendance saisonnière indicative · {trip.weather.note}</p>
        </div>
      )}
      {error && <p role="status" className={`text-xs leading-5 ${weather ? "text-amber-100" : "text-rose-200"}`}>{error}</p>}
    </section>
  );
}
