import { LoaderCircle, MapPin, Radio, ShieldOff } from "lucide-react";
import { useLocationSharing } from "../../auth/LocationSharing";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function LocationSharingControl() {
  const { sharing, tracking, busy, error, startSharing, disableSharing } = useLocationSharing();

  return (
    <section className="glass-card rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/[0.08] text-mint"><MapPin size={19} /></span>
          <div><h2 className="font-semibold text-white">Partage familial de position</h2><p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">Chaque coordonnée est arrondie à trois décimales (environ 100 m). L’activation demande l’autorisation GPS. À l’arrêt, le suivi cesse mais la dernière position reste visible publiquement et passe hors ligne après cinq minutes.</p></div>
        </div>
        <Badge tone={tracking ? "mint" : "neutral"} icon={Radio}>{tracking ? "Suivi GPS en cours" : sharing ? "Dernière position publiée" : "Suivi arrêté"}</Badge>
      </div>
      {error && <p role="alert" className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        {(!sharing || !tracking) && <Button type="button" icon={busy ? LoaderCircle : MapPin} disabled={busy} onClick={() => void startSharing()}>{busy ? "Activation…" : sharing ? "Reprendre le partage GPS" : "Activer le partage de position"}</Button>}
        {sharing && <Button type="button" variant="secondary" icon={ShieldOff} disabled={busy} onClick={() => void disableSharing()}>Arrêter le suivi GPS</Button>}
      </div>
      <p className="mt-4 text-xs text-muted">Seuls les administrateurs connectés peuvent émettre la position. Les dernières coordonnées approximatives d’Evan et d’Enola restent visibles publiquement, même après l’arrêt du suivi.</p>
    </section>
  );
}
