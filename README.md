# Carnet de voyage · Dublin

Application React + Vite installable sur mobile, avec galeries photo multi-images, documents privés, checklist partagée, météo à sept jours, programme familial temps réel et partage GPS approximatif à la demande. Le projet fonctionne aussi en mode carnet local, sans configuration Supabase : les cartes d'origine de la V1 restent alors disponibles.

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
2. Dans **SQL Editor**, exécutez le contenu de [`supabase/schema.sql`](./supabase/schema.sql). Pour un projet déjà configuré en V2/V3, réexécutez ce script : il ajoute les colonnes `image_paths` aux lieux et aux publications en conservant les anciennes images. Le script crée les tables, les politiques Row Level Security, les buckets et active Realtime.
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

L'accès aux tables applicatives est limité par RLS : seule la lecture de `family_updates` est publique. Les autres tables ne sont accessibles qu'aux comptes administrateurs enregistrés dans `trip_admins` (Evan et Enola). Les pages publiques des lieux utilisent le carnet statique local ; le programme détaillé et la localisation ne sont pas exposés aux proches. Les objets des buckets `place-covers` et `family-updates` sont, eux, publiquement lisibles pour l'affichage des galeries : ne pas y placer d'image privée. Les téléversements multiples sont réencodés en JPEG optimisé pour retirer les métadonnées EXIF de localisation. Chaque galerie peut contenir jusqu'à huit images.

## 3. Documents et mode hors ligne

`/documents` demande une session administrateur. Les quatre emplacements Evan/Enola et l'upload libre acceptent les fichiers PDF, JPEG, PNG et WebP (15 Mo maximum). Les documents résident dans un bucket privé : téléchargement temporaire signé, aperçu intégré et suppression sont réservés aux administrateurs. Aucun document de voyage n'est publié dans l'espace famille.

Les billets importés dans les quatre emplacements prévus sont automatiquement copiés dans IndexedDB sur l'appareil courant. Pour les documents déjà présents, utilisez **Enregistrer hors ligne / Télécharger** ou **Ouvrir** sur chaque appareil avant le départ ; vérifiez que les quatre billets indiquent « Disponible hors ligne ». L'aperçu lit alors le blob local, sans dépendre du réseau ni du cache HTTP. L'accès hors ligne nécessite que la PWA et la session administrateur soient déjà disponibles sur l'appareil. La persistance dépend des quotas et règles d'éviction du navigateur : gardez également une copie des billets dans l'application de fichiers sécurisée de l'appareil.

La PWA précache l'interface et mémorise les photos publiques consultées (couvertures de lieux et photos du journal familial) ainsi que les tuiles de carte satellite et leurs labels déjà chargés (durée maximale de 30 jours). Les tuiles ne sont pas téléchargées par avance : ouvrez la zone cartographique voulue avant le départ pour mettre ses tuiles en cache. La météo conserve sa dernière réponse et utilise également un cache réseau. La checklist et le budget nécessitent une connexion. Les documents privés restent disponibles hors ligne uniquement après leur enregistrement explicite dans le coffre-fort.

Les souvenirs du journal peuvent être rédigés hors ligne depuis l'espace admin. Le texte et les images déjà compressées sont conservés dans IndexedDB sur l'appareil, puis envoyés automatiquement au retour du réseau, tant qu'une session administrateur valide est disponible.

## 4. Checklist et météo

La page `/checklist` est réservée aux administrateurs : Evan et Enola peuvent ajouter, cocher et supprimer les éléments. La liste est synchronisée en temps réel entre les appareils connectés. Elle n'est pas enregistrée localement ; une connexion à Supabase est nécessaire pour la charger ou la modifier.

La page `/budget` est réservée aux comptes administrateurs et permet d'enregistrer toutes les dépenses du voyage, avec leur date et le choix de les diviser ou non. Les remboursements sont identifiés comme des transferts, exclus du coût total et appliqués à la balance sans être comptés comme des achats. Les dépenses sont protégées par RLS et synchronisées en temps réel ; le mini-dashboard sépare le coût total, la balance restante et les dépenses personnelles payées par chacun. Pour un projet Supabase existant, exécutez d'abord `supabase/migrations/20260927230000_create_expenses.sql`, puis `supabase/migrations/20260927232000_add_expense_date_and_sharing.sql` et enfin `supabase/migrations/20260927235300_add_expense_reimbursement.sql` dans SQL Editor.

Le tableau de bord récupère la météo actuelle et les prévisions sur sept jours du centre de Dublin auprès d'Open-Meteo, sans clé API. La dernière réponse est conservée dans le navigateur pour fournir un affichage de secours lorsque le réseau est indisponible.

## 5. Espace famille, journal et géolocalisation

Envoyez `/family` à vos proches en France. Cette page est publique : toute personne ayant le lien peut lire les publications et les photos du journal. Depuis l'onglet **Journal Famille** de `/admin`, les administrateurs peuvent publier un message avec une date, une heure et plusieurs photos ; les publications sont classées par ordre chronologique. La bucket `family-updates` est publique afin que les proches puissent consulter les photos sans compte : n'y téléversez aucun document privé. Le programme détaillé et la localisation sont réservés aux comptes voyageurs.

La position est **désactivée par défaut**, et le navigateur ne demande le GPS qu'après le clic explicite sur **Activer et partager la position**. Les coordonnées sont arrondies au millième de degré (environ 100 m), limitées au temps nécessaire et actualisées en temps réel pour les comptes voyageurs autorisés. Un garde-fou de cinq minutes masque automatiquement la position si le téléphone ferme la PWA sans arrêter le suivi ; le bouton d'arrêt efface immédiatement les coordonnées.

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

## Administration V5

Le tableau de bord `/admin` est organisé en quatre onglets : **Lieux & Programme**, **Journal Famille**, **Coffre-fort** et **Checklist**. Les zones photo permettent la sélection multiple ou le glisser-déposer. Dans les pages publiques, les galeries ouvrent une lightbox navigable au clavier (Échap, flèches gauche/droite). Les routes de page sont chargées à la demande ; l'interface et les chunks générés sont précachés par le service worker.

## Structure V5

```text
public/manifest.json
src/
  auth/            AdminAuth, LocationSharing
  assets/dublin-skyline.svg
  components/
    admin/       formulaires de lieux, planification et géolocalisation
    checklist/   aperçu interactif de la checklist sur l'accueil
    documents/   coffre-fort privé et zones de dépôt
    family/      carte, timeline et formulaire de publication
    layout/      Header, BottomNavigation
    ui/          ImageGallery et Lightbox
    weather/     widget météo et prévisions
  hooks/         lieux, programme, checklist, journal familial et météo
  pages/         Home, Visites, Food, Pubs, Checklist, Family, Admin
  services/      Supabase, lieux, programme, documents, checklist, journal, météo
supabase/schema.sql
```