# Journal des modifications / Changelog - OmniMark

Toutes les modifications notables de ce projet seront documentées dans ce fichier.
All notable changes to this project will be documented in this file.

---

## [2.0.3] - 2026-03-26

### FR:
#### 🚀 Nouvelles fonctionnalités
- **Ouverture des liens à la carte** :
    - **Favoris** : Choix du mode d'ouverture (**Même page** ou **Nouvelle page**) individuellement pour chaque favori.
    - **YouTube & Streams** : Options globales dédiées dans les onglets respectifs.
    - **Raccourcis de recherche** : Nouvelle option dans l'onglet "Recherche" pour le comportement par défaut des résultats.
- **Synchronisation manuelle** : Ajout de boutons de synchronisation dans les onglets **Service**, **YouTube** et **Twitch** pour forcer l'envoi des données vers le Cloudflare Worker.

#### 🛠️ Améliorations & Sécurité
- **Sécurité renforcée** : Suppression de la permission globale `*://*/*` au profit d'une liste restrictive de domaines spécifiques.
- **Nettoyage de l'interface** : Retrait des anciennes options de positionnement ("Haut" / "Bas") devenues obsolètes.
- **Expérience Utilisateur** : La touche "Entrée" dans la barre de recherche respecte désormais le mode d'ouverture configuré.

---

### EN:
#### 🚀 New Features
- **Custom Link Opening**:
    - **Bookmarks**: Choose opening mode (**Same page** or **New page**) individually for each bookmark.
    - **YouTube & Streams**: Dedicated global options in their respective tabs.
    - **Search Shortcuts**: New option in the "Search" tab for default result behavior.
- **Manual Synchronization**: Added sync buttons in **Service**, **YouTube**, and **Twitch** tabs to force data upload to Cloudflare Worker.

#### 🛠️ Improvements & Security
- **Enhanced Security**: Removed global `*://*/*` permission in favor of a restrictive list of specific domains.
- **UI Cleanup**: Removed obsolete positioning options ("Top" / "Bottom").
- **User Experience**: "Enter" key in the search bar now respects the configured opening mode.

---

## [2.0.2] - 2026-03-24

### FR:
#### 🎨 UI & Design
- **Stabilité du Widget** : La taille des widgets YouTube et Twitch ne change plus lors du rafraîchissement des données grâce à une gestion dynamique de la hauteur minimale.
- **Amélioration du défilement** : Augmentation de l'espace entre les vidéos/streams et la barre de défilement horizontale pour un meilleur confort visuel.

---

### EN:
#### 🎨 UI & Design
- **Widget Stability**: YouTube and Twitch widget sizes no longer jump during data refresh thanks to dynamic minimum height management.
- **Scrolling Improvement**: Increased space between videos/streams and the horizontal scrollbar for better visual comfort.

---

## [2.0.1] - 2026-03-24

### FR:
#### 📺 Améliorations YouTube
- **Suppression du bouton d'ajout** : Retrait du bouton "Ajouter à OmniMark" sur les pages de chaînes YouTube pour épurer l'interface du site original.

#### ☁️ Optimisations Cloudflare Worker
- **Support des Queues** : Intégration de Cloudflare Queues pour traiter un nombre illimité de chaînes (YouTube et Twitch) sans dépasser les limites de sous-requêtes.
- **Cache Intelligent** : Nouveau système de cache composite (`cache_id`) permettant de suivre un même streamer sur plusieurs plateformes (Twitch + Kick) simultanément sans conflit.
- **Nettoyage Automatique** : Suppression automatique des streams "zombies" (hors-ligne depuis plus de 10 minutes) pour une précision accrue.
- **Performance YouTube** : Augmentation de la profondeur d'analyse RSS (10 vidéos) et mise en cache du statut des Shorts pour réduire la charge serveur.

#### 🛠️ Interface d'Administration
- **Monitoring du Cache** : Visualisation en temps réel du contenu du cache (vidéos et streams actifs) directement sur la page `/admin`.
- **Gestion des Chaînes** : Affichage détaillé des listes de chaînes suivies par plateforme pour un meilleur diagnostic.

#### 🐞 Correctifs & Robustesse
- **Gestion des Doublons** : Refonte de la logique de fusion (`mergeCache`) pour éliminer radicalement les entrées en double dans le stockage KV.
- **Traitement par Lots** : Implémentation du batching (par 100) pour les appels API Twitch, garantissant la stabilité pour les gros comptes.

---

### EN:
#### 📺 YouTube Improvements
- **Add Button Removal**: Removed the "Add to OmniMark" button on YouTube channel pages to keep the original site interface clean.

#### ☁️ Cloudflare Worker Optimizations
- **Queue Support**: Integrated Cloudflare Queues to process an unlimited number of channels (YouTube and Twitch) without hitting sub-request limits.
- **Smart Cache**: New composite cache system (`cache_id`) allowing the tracking of the same streamer on multiple platforms (Twitch + Kick) simultaneously without conflicts.
- **Automatic Cleanup**: Automatic removal of "zombie" streams (offline for more than 10 minutes) for increased accuracy.
- **YouTube Performance**: Increased RSS analysis depth (10 videos) and Short status caching to reduce server load.

#### 🛠️ Administration Interface
- **Cache Monitoring**: Real-time visualization of cache content (active videos and streams) directly on the `/admin` page.
- **Channel Management**: Detailed display of followed channel lists per platform for better diagnostics.

#### 🐞 Bug Fixes & Robustness
- **Duplicate Handling**: Overhauled merge logic (`mergeCache`) to radically eliminate duplicate entries in KV storage.
- **Batch Processing**: Implemented batching (per 100) for Twitch API calls, ensuring stability for large accounts.

---

## [2.0.0] - 2026-03-24

### FR:
#### 🛡️ Sécurité & Modernisation
- **Sécurité** : Correction finale des avertissements Firefox (AMO) en remplaçant `innerHTML` et `insertAdjacentHTML` par des méthodes DOM pures (`createElementNS`, `prepend`, `textContent`).
- **Modernisation** : Remplacement de toutes les occurrences de `innerHTML` par des méthodes DOM plus sûres et performantes comme `replaceChildren()` et `textContent`.
#### 📺 Streaming Unifié
- **Widget Multi-Plateforme** : Support complet de **Twitch** et **Kick** sur la page d'accueil.
- **Fusion Multistream** : Regroupement automatique des lives d'un même streamer diffusant sur plusieurs plateformes (badges cumulés et total spectateurs).
- **Gestion Avancée** : Ajout, modification et suppression facilitée des streamers depuis un onglet dédié.

#### 🚀 Rework Infrastructure (Cloudflare Worker)
- **Worker Unifié** : Un seul script pour YouTube, Twitch et Kick.
- **Sécurité Renforcée** : Authentification par clé API (`X-API-Key`) et page d'administration sécurisée.
- **Synchronisation Automatique** : Les chaînes suivies sont désormais stockées en KV (Cloudflare) pour des performances optimales (chargement instantané via cache).
- **Automatisation** : Vérification des lives toutes les 5 minutes (Cron Trigger).

#### 📺 Améliorations YouTube
- **Filtrage Anti-Shorts Radical** : Nouveau système de détection côté serveur (HEAD request) pour masquer les shorts.
- **Tri Chronologique** : Les vidéos de toutes les chaînes suivies sont désormais triées par date de publication.
- **Résolution d'ID Améliorée** : Meilleure gestion des handles (@nom) et extraction d'ID robuste.

#### ⚙️ Interface & Options
- **Organisation des Widgets** : Possibilité de trier librement l'ordre d'affichage (YouTube, Twitch/Kick, Favoris).
- **Interface Épurée** : Onglets séparés pour YouTube, Twitch et le Service Cloudflare.
- **Support Multi-Navigateur** : Amélioration de la compatibilité Chrome et Firefox.
- **Import/Export Complet** : Sauvegarde incluant désormais la configuration Twitch et l'ordre des widgets.

---

### EN:
#### 🛡️ Security & Modernization
- **Security**: Final fix for Firefox (AMO) warnings by replacing `innerHTML` and `insertAdjacentHTML` with pure DOM methods (`createElementNS`, `prepend`, `textContent`).
- **Modernization**: Replaced all `innerHTML` occurrences with safer and faster DOM methods such as `replaceChildren()` and `textContent`.
#### 📺 Unified Streaming
- **Multi-Platform Widget**: Full support for **Twitch** and **Kick** on the home page.
- **Multistream Fusion**: Automatic grouping of streams for creators broadcasting on multiple platforms (combined badges and total viewers count).
- **Advanced Management**: Easy addition, modification, and removal of streamers from a dedicated tab.

#### 🚀 Infrastructure Rework (Cloudflare Worker)
- **Unified Worker**: A single script for YouTube, Twitch, and Kick.
- **Enhanced Security**: API key authentication (`X-API-Key`) and a secured administration page.
- **Automatic Sync**: Followed channels are now stored in KV (Cloudflare) for optimal performance (instant loading via cache).
- **Automation**: Live status checks every 5 minutes (Cron Trigger).

#### 📺 YouTube Improvements
- **Radical Anti-Shorts Filtering**: New server-side detection system (HEAD request) to hide shorts.
- **Chronological Sorting**: Videos from all followed channels are now sorted by publication date.
- **Improved ID Resolution**: Better handling of handles (@name) and robust ID extraction.

#### ⚙️ Interface & Options
- **Widget Organization**: Freedom to sort the display order (YouTube, Twitch/Kick, Bookmarks).
- **Clean Interface**: Separate tabs for YouTube, Twitch, and the Cloudflare Service.
- **Multi-Browser Support**: Improved compatibility for both Chrome and Firefox.
- **Full Import/Export**: Backups now include Twitch configuration and widget order.

---

## [1.3.0] - 2026-03-24
### FR:
- **Bouton d'ajout YouTube direct** : Ajout d'un bouton "Ajouter à OmniMark" directement sur les pages YouTube.
- **Intégration YouTube intelligente** : Détection dynamique et insertion robuste dans la barre d'actions YouTube.
### EN:
- **Direct YouTube Add Button**: Added "Add to OmniMark" button directly on YouTube channel pages.
- **Smart YouTube Integration**: Dynamic detection and robust insertion in the YouTube actions bar.

---

## [1.2.0] - 2026-03-23
### FR:
- **Récupération automatique du nom** : Extraction automatique des IDs et noms depuis les URLs.
- **Migration intelligente** : Mise à jour automatique des noms via le Worker.
- **Sécurité** : Remplacement d'innerHTML par des méthodes DOM sécurisées.
### EN:
- **Automatic Name Retrieval**: Automatic extraction of IDs and names from URLs.
- **Smart Migration**: Automatic update of names via the Worker.
- **Security**: Replaced innerHTML with secure DOM methods.

---

## [1.1.0] - 2026-03-23
### FR:
- **Widget YouTube** : Flux de vidéos récentes sur l'accueil.
- **Relais Cloudflare** : Performance accrue via Worker RSS + KV.
- **Filtrage Anti-Shorts** : Masquage automatique des shorts.
- **Gestion des vues** : Masquage des vidéos déjà regardées.
- **Design** : Nouveau thème "Neon Night" et organisation compacte.
### EN:
- **YouTube Widget**: Recent video feed on the home page.
- **Cloudflare Relay**: Increased performance via RSS Worker + KV.
- **Anti-Shorts Filtering**: Automatic hiding of shorts.
- **View Management**: Option to hide already watched videos.
- **Design**: New "Neon Night" theme and compact layout.

---

## [1.0.7] - Version initiale consolidée / Initial release
- Gestion des favoris / Bookmark management.
- Synchronisation / Sync (`browser.storage.sync`).
- Support icônes / Icon support (Simple Icons, Logo.dev).
