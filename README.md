# Carnet de voyage · Dublin

Application React + Vite installable sur mobile, avec cartes modifiables, documents privés, programme familial temps réel et partage GPS approximatif à la demande. Le projet fonctionne aussi en mode carnet local, sans configuration Supabase : les cartes d'origine de la V1 restent alors disponibles.

## 1. Dépendances et lancement

```powershell
npm install
npm run dev
```

Les dépendances V2 sont `@supabase/supabase-js`, `react-leaflet` (version 4, compatible avec React 18), `leaflet` et `idb`. Pour refaire leur installation dans un nouveau projet :

```powershell
npm install @supabase/supabase-js react-leaflet@4 leaflet idb
npm run build
```

## 2. Créer le backend gratuit Supabase

1. Créez un projet Supabase sur le palier gratuit et notez son URL de projet et sa clé **publishable/anon**. L'offre dépend de ses quotas et de ses règles de disponibilité. Ne mettez jamais une clé `service_role` dans le navigateur, le dépôt ou les variables `VITE_*`.
2. Dans **SQL Editor**, exécutez le contenu de [`supabase/schema.sql`](./supabase/schema.sql). Ce script crée les tables, les politiques Row Level Security, les deux buckets et active Realtime pour les cartes, le programme et le partage de position.
3. Dans **Authentication → Users**, créez deux comptes avec les adresses de connexion d'Enola et d'Evan. Désactivez l'inscription publique.
4. Ajoutez **uniquement** ces deux identifiants à la liste des administrateurs. Remplacez les adresses d'exemple avant d'exécuter la requête :

   ```sql
   insert into public.trip_admins (user_id)
   select id
   from auth.users
   where email in ('EVAN_EMAIL', 'ENOLA_EMAIL')
   on conflict (user_id) do nothing;
   ```

5. Créez un fichier local ignoré par Git :

   ```powershell
   Copy-Item .env.example .env
   ```

   Renseignez ces valeurs dans `.env` :

   ```dotenv
   VITE_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLISHABLE_OU_ANON
   ```

6. Redémarrez `npm run dev`, connectez-vous à `/admin`, puis choisissez **Importer les cartes de la V1**. Cet import n'écrase pas les lieux déjà présents. Vous pouvez ensuite ajouter, modifier et supprimer les visites, restaurants et pubs, et programmer les visites du 20 au 23 octobre.

La connexion est limitée aux lignes de `trip_admins` par RLS. Tous les navigateurs peuvent lire les adresses et les visites explicitement ajoutées au programme ; seuls Enola et Evan peuvent les modifier. Les photos de couverture sont publiées avec les adresses ; leur téléversement les réencode en JPEG optimisé pour retirer les métadonnées EXIF de localisation.

## 3. Documents et mode hors ligne

`/documents` demande une session administrateur. Les quatre emplacements Enola/Evan et l'upload libre acceptent les fichiers PDF, JPEG, PNG et WebP (15 Mo maximum). Les documents résident dans un bucket privé : téléchargement temporaire signé, aperçu intégré et suppression sont réservés aux administrateurs. Aucun document de voyage n'est publié dans l'espace famille.

Avant le départ, ouvrez le coffre-fort sur chaque téléphone et utilisez **Enregistrer hors ligne / Télécharger** ou **Ouvrir** pour chaque document requis. La copie privée est conservée dans IndexedDB sur cet appareil ; le document peut alors être ouvert dans l'aperçu même sans réseau. L'application n'enregistre pas automatiquement les billets. L'ouverture hors ligne nécessite le même profil de navigateur et la session administrateur conservée sur ce téléphone.

La PWA précache l'interface et mémorise les photos publiques consultées (couvertures de lieux et photos du journal familial) ainsi que les tuiles de carte déjà chargées. La météo conserve sa dernière réponse et utilise également un cache réseau. Les changements Realtime, la checklist et les nouvelles tuiles cartographiques nécessitent une connexion. Les documents privés restent disponibles hors ligne uniquement après leur enregistrement explicite dans le coffre-fort.

## 4. Checklist et météo

La page `/checklist` est réservée aux administrateurs : Evan et Enola peuvent ajouter, cocher et supprimer les éléments. La liste est synchronisée en temps réel entre les appareils connectés. Elle n'est pas enregistrée localement ; une connexion à Supabase est nécessaire pour la charger ou la modifier.

Le tableau de bord récupère la météo du centre de Dublin auprès d'Open-Meteo, sans clé API. La dernière réponse est conservée dans le navigateur pour fournir un affichage de secours lorsque le réseau est indisponible.

## 5. Espace famille, journal et géolocalisation

Envoyez `/family` à vos proches en France. Cette page est publique : toute personne à qui le lien est communiqué peut lire les adresses, le programme, les messages et les photos publiés, ainsi que la position lorsque celle-ci est activée. Depuis `/admin`, les administrateurs peuvent publier un message avec une date, une heure et une photo ; les publications sont classées par ordre chronologique. La bucket `family-updates` est publique afin que les proches puissent consulter les photos sans compte : n'y téléversez aucun document privé.

La position est **désactivée par défaut**, et le navigateur ne demande le GPS qu'après le clic explicite sur **Activer et partager ma position**. Les coordonnées sont arrondies au millième de degré (environ 100 m), limitées au temps nécessaire et actualisées en temps réel. Un garde-fou de cinq minutes masque automatiquement la position si le téléphone ferme la PWA sans arrêter le suivi ; le bouton d'arrêt efface immédiatement les coordonnées. Si vous ne souhaitez aucune localisation publique, n'activez pas ce contrôle.

Le suivi fonctionne tant que la page admin reste ouverte et que le système autorise la géolocalisation. iOS/Android peuvent interrompre un onglet placé en arrière-plan ; rouvrir la page admin permet de reprendre le partage. Les visites du programme ne sont affichées qu'après que vous leur avez attribué une date dans `/admin` ; aucun jour n'est inventé à partir du PDF.

## 6. Déployer gratuitement sur Vercel

Importez le dépôt dans Vercel, puis définissez :

| Paramètre | Valeur |
| --- | --- |
| Commande de build | `npm run build` |
| Répertoire de sortie | `dist` |
| Variable | `VITE_SUPABASE_URL` |
| Variable | `VITE_SUPABASE_ANON_KEY` |

Redéployez après avoir ajouté ou changé une variable. La règle dans [`vercel.json`](./vercel.json) réécrit les routes React (`/admin`, `/documents`, `/checklist`, `/family`, etc.) vers la page de l'application. Dans Supabase Authentication, ajoutez aussi l'URL de production à **Site URL** et **Redirect URLs**. La géolocalisation du navigateur requiert HTTPS (fourni sur Vercel).

## Structure V3

```text
public/manifest.json
src/
  auth/            AdminAuth, LocationSharing
  assets/dublin-skyline.svg
  components/
    admin/       formulaires de lieux, planification et géolocalisation
    documents/   coffre-fort privé et zones de dépôt
    family/      carte, timeline et formulaire de publication
    layout/      Header, BottomNavigation
    weather/     widget météo
  hooks/         lieux, programme, checklist, journal familial et météo
  pages/         Home, Visites, Food, Pubs, Checklist, Family, Admin
  services/      Supabase, lieux, programme, documents, checklist, journal, météo
supabase/schema.sql
```
