import { useMemo, useState } from "react";
import { CalendarDays, Check, CloudUpload, LoaderCircle, LogIn, LogOut, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useAdminAuth } from "../auth/AdminAuth";
import { useLocationSharing } from "../auth/LocationSharing";
import LocationSharingControl from "../components/admin/LocationSharingControl";
import PlaceEditorForm from "../components/admin/PlaceEditorForm";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import PlaceCard from "../components/ui/PlaceCard";
import SectionHeading from "../components/ui/SectionHeading";
import usePlaces from "../hooks/usePlaces";
import useSchedule from "../hooks/useSchedule";
import { setActivityDate, setActivityVisited } from "../services/familyService";
import { deletePlace, deletePlaceCover, savePlace, seedInitialPlaces, uploadPlaceCover } from "../services/placeService";
import { hasSupabaseConfig, supabase } from "../services/supabaseClient";

const placeKinds = [
  { key: "visite", label: "Visites" },
  { key: "food", label: "Food" },
  { key: "pub", label: "Pubs" },
];
const dates = ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"];
function SignInForm({ onSignIn, authError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSignIn(email, password);
    } catch (signInError) {
      setError(signInError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="glass-card mx-auto max-w-lg space-y-5 rounded-3xl p-6 sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/[0.1] text-mint"><ShieldCheck size={21} /></div>
      <div><h2 className="text-xl font-semibold text-white">Connexion des administrateurs</h2><p className="mt-2 text-sm leading-6 text-slate-400">Utilisez l'adresse et le mot de passe Supabase autorisés pour Enola ou Evan.</p></div>
      <label className="block text-xs font-medium text-slate-300">Adresse e-mail<input className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none focus:border-mint/40" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="block text-xs font-medium text-slate-300">Mot de passe<input className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none focus:border-mint/40" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {(error || authError) && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200">{error || authError}</p>}
      <Button type="submit" icon={busy ? LoaderCircle : LogIn} disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</Button>
    </form>
  );
}

function AdminWorkspace({ auth }) {
  const locationSharing = useLocationSharing();
  const [kind, setKind] = useState("visite");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const visits = usePlaces("visite");
  const food = usePlaces("food");
  const pubs = usePlaces("pub");
  const { schedule, error: scheduleError, refresh: refreshSchedule } = useSchedule();
  const dataByKind = { visite: visits, food, pub: pubs };
  const scheduleByPlace = useMemo(() => new Map(schedule.map((item) => [item.place_id, item])), [schedule]);
  const placeError = [visits.error, food.error, pubs.error].filter(Boolean).join(" ");
  const active = dataByKind[kind];

  async function save(values, image) {
    setError("");
    setNotice("");
    let uploadedPath = null;
    let committed = false;
    try {
      if (image) {
        if (image.size > 8 * 1024 * 1024) throw new Error("La photo de couverture ne peut pas dépasser 8 Mo.");
        if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new Error("Formats photo acceptés : JPEG, PNG ou WebP.");
        uploadedPath = await uploadPlaceCover(image);
      }
      const place = {
        ...values,
        id: editing?.id ?? crypto.randomUUID(),
        imagePath: uploadedPath ?? values.imagePath ?? null,
      };
      const saved = await savePlace(place, kind);
      committed = true;
      if (uploadedPath && values.imagePath && values.imagePath !== uploadedPath) await deletePlaceCover(values.imagePath);
      await active.refresh();
      setEditing(null);
      setAdding(false);
      setNotice(`« ${saved.name} » a bien été enregistré.`);
    } catch (saveError) {
      if (uploadedPath && !committed) {
        try {
          await deletePlaceCover(uploadedPath);
        } catch (cleanupError) {
          setError(`${saveError.message} La photo importée n'a pas pu être nettoyée : ${cleanupError.message}`);
          throw new Error(`${saveError.message} (la photo importée n'a pas pu être nettoyée)`);
        }
      }
      setError(saveError.message);
      throw saveError;
    }
  }

  async function remove(place) {
    if (!window.confirm(`Supprimer « ${place.name} » et son éventuelle photo ?`)) return;
    setError("");
    let removeError = "";
    try {
      await deletePlace(place);
      setNotice("L'adresse a été supprimée.");
    } catch (deleteError) {
      removeError = deleteError.message;
    } finally {
      await Promise.all([active.refresh(), refreshSchedule()]);
      if (removeError) setError(removeError);
    }
  }

  async function initialize() {
    setBusy("initialize");
    setError("");
    setNotice("");
    try {
      await seedInitialPlaces();
      await Promise.all([visits.refresh(), food.refresh(), pubs.refresh()]);
      setNotice("Les cartes de la V1 sont maintenant disponibles dans la base partagée. Les adresses existantes ont été conservées.");
    } catch (seedError) {
      setError(`Initialisation impossible : ${seedError.message}`);
    } finally {
      setBusy("");
    }
  }

  async function updateDate(placeId, visitDate) {
    setBusy(placeId);
    setError("");
    try {
      await setActivityDate(placeId, visitDate);
      await refreshSchedule();
    } catch (scheduleUpdateError) {
      setError(scheduleUpdateError.message);
    } finally {
      setBusy("");
    }
  }

  async function toggleVisited(activity) {
    setBusy(activity.place_id);
    setError("");
    try {
      await setActivityVisited(activity.id, !activity.visited);
      await refreshSchedule();
    } catch (scheduleUpdateError) {
      setError(scheduleUpdateError.message);
    } finally {
      setBusy("");
    }
  }

  async function logOut() {
    setError("");
    try {
      if (locationSharing.sharing) {
        await locationSharing.disableSharing();
        if (locationSharing.error) setError(locationSharing.error);
      }
      await auth.signOut();
    } catch (signOutError) {
      setError(`Impossible de fermer la session : ${signOutError.message}`);
    }
  }

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div><Badge tone="mint" icon={ShieldCheck}>Session administrateur · {auth.session.user.email}</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Le mode édition</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Gérez les adresses, le programme partagé et votre position familiale.</p><a href="/documents" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-mint hover:text-emerald-200"><CloudUpload size={16} />Ouvrir le coffre-fort</a></div>
        <Button variant="secondary" icon={LogOut} onClick={() => void logOut()}>Déconnexion</Button>
      </section>

      <LocationSharingControl />

      <section>
        <SectionHeading eyebrow="Carnet partagé" title="Adresses du voyage" description="Les modifications sont enregistrées dans Supabase et apparaissent en direct chez votre famille." action={<Button icon={Plus} onClick={() => { setAdding(true); setEditing(null); }}>Ajouter</Button>} />
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Catégorie d'adresses">
          {placeKinds.map((item) => <button key={item.key} type="button" role="tab" aria-selected={kind === item.key} onClick={() => { setKind(item.key); setEditing(null); setAdding(false); }} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${kind === item.key ? "border-mint/30 bg-mint/[0.1] text-mint" : "border-white/10 bg-white/[0.025] text-slate-400 hover:text-white"}`}>{item.label}<span className="ml-2 text-xs opacity-70">{dataByKind[item.key].places.length}</span></button>)}
        </div>

        {(placeError || scheduleError || error) && <p role="alert" className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{placeError || scheduleError || error}</p>}
        {notice && <p role="status" className="mb-4 rounded-2xl border border-mint/20 bg-mint/[0.06] p-4 text-sm text-mint">{notice}</p>}

        {active.places.length === 0 && <div className="glass-card mb-5 rounded-3xl p-5"><p className="text-sm text-slate-300">Initialisez la base avec les cartes de la V1. Les adresses déjà modifiées dans Supabase ne seront pas écrasées.</p><Button className="mt-4" icon={busy === "initialize" ? LoaderCircle : CloudUpload} disabled={busy === "initialize"} onClick={() => void initialize()}>{busy === "initialize" ? "Initialisation…" : "Importer les cartes de la V1"}</Button></div>}

        {(adding || editing) && <div className="mb-5"><PlaceEditorForm key={editing?.id ?? `${kind}-new`} place={editing} kind={kind} onSave={save} onCancel={() => { setEditing(null); setAdding(false); }} /></div>}
        {active.loading && <p className="py-6 text-sm text-muted">Chargement des adresses…</p>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.places.map((place) => {
            const activity = scheduleByPlace.get(place.id);
            return (
              <div key={place.id} className="space-y-3">
                <PlaceCard place={place} />
                <div className="glass-card space-y-3 rounded-2xl p-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300"><CalendarDays size={15} className="text-mint" />Programmer la visite</label>
                  <select value={activity?.visit_date ?? ""} disabled={busy === place.id} onChange={(event) => void updateDate(place.id, event.target.value)} className="min-h-10 w-full rounded-xl border border-white/10 bg-panel px-3 text-sm text-white outline-none focus:border-mint/40">
                    <option value="">Pas encore planifiée</option>
                    {dates.map((date) => <option key={date} value={date}>{new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</option>)}
                  </select>
                  {activity && <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={activity.visited} disabled={busy === place.id} onChange={() => void toggleVisited(activity)} className="accent-[#79f2b2]" /><Check size={15} className="text-mint" />Visité · visible pour la famille</label>}
                  <div className="flex gap-2 border-t border-white/[0.06] pt-3"><button type="button" onClick={() => { setKind(place.kind); setAdding(false); setEditing(place); window.scrollTo({ top: 300, behavior: "smooth" }); }} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-medium text-slate-300 transition hover:text-mint"><Pencil size={14} />Modifier</button><button type="button" onClick={() => void remove(place)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-medium text-slate-400 transition hover:text-rose-200"><Trash2 size={14} />Supprimer</button></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function Admin() {
  const auth = useAdminAuth();

  if (!hasSupabaseConfig) return <div className="glass-card mx-auto max-w-xl rounded-3xl p-6"><h1 className="text-2xl font-semibold text-white">Configurez Supabase</h1><p className="mt-3 text-sm leading-6 text-slate-400">Créez un fichier .env à partir de .env.example, renseignez l'URL du projet et sa clé anon, puis exécutez supabase/schema.sql.</p></div>;
  if (auth.loading) return <div className="flex items-center justify-center gap-3 py-24 text-sm text-slate-300"><LoaderCircle size={19} className="animate-spin text-mint" />Vérification de la session…</div>;
  if (!auth.session) return <div className="space-y-5"><SectionHeading eyebrow="Enola & Evan" title="Votre espace privé" description="Connectez-vous pour modifier le carnet, gérer les billets et activer le partage de position." /><SignInForm onSignIn={auth.signIn} authError={auth.error} /></div>;
  if (!auth.isAdmin) return <DeniedSession auth={auth} />;
  return <AdminWorkspace auth={auth} />;
}

function DeniedSession({ auth }) {
  const [error, setError] = useState("");
  async function signOut() {
    setError("");
    try {
      await auth.signOut();
    } catch (signOutError) {
      setError(`Impossible de fermer la session : ${signOutError.message}`);
    }
  }
  return <div className="glass-card mx-auto max-w-xl space-y-4 rounded-3xl p-6"><h1 className="text-2xl font-semibold text-white">Accès administrateur requis</h1><p className="text-sm leading-6 text-slate-400">{error || auth.error || `Le compte ${auth.session.user.email} n'est pas autorisé à modifier ce carnet.`}</p><Button variant="secondary" icon={LogOut} onClick={() => void signOut()}>Se déconnecter</Button></div>;
}
