# Journal des modifications - OmniMark

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.3.0] - 2026-03-24

### ✨ Nouvelles fonctionnalités
- **Bouton d'ajout YouTube direct** : Ajout d'un bouton "Ajouter à OmniMark" directement sur les pages de chaînes YouTube (à droite du bouton S'abonner/Rejoindre) pour simplifier la gestion des chaînes suivies.

### 🔧 Améliorations techniques
- **Intégration YouTube intelligente** : Détection dynamique du bouton d'abonnement et insertion robuste dans la barre d'actions, compatible avec les nouvelles interfaces YouTube (view-model).
- **Gestion de la navigation SPA** : Utilisation d'un `MutationObserver` et d'un système de nettoyage pour assurer la présence et l'unicité du bouton lors de la navigation interne sur YouTube.

---

## [1.2.0] - 2026-03-23

### ✨ Nouvelles fonctionnalités
- **Récupération automatique du nom** : Ajout de l'extraction automatique des IDs de chaîne à partir des URLs et récupération du nom en arrière-plan lors de la migration et de la saisie manuelle.
- **Migration intelligente** : Les listes de chaînes YouTube existantes sont désormais automatiquement mises à jour avec les noms réels via le Cloudflare Worker.
- **Récupération d'ID manuelle** : Ajout d'un bouton pour récupérer automatiquement le nom d'une chaîne YouTube à partir de son ID lors d'un ajout manuel.

### 🛡️ Sécurité
- **Manipulation sécurisée du DOM** : Remplacement de toutes les utilisations d'`innerHTML` par des méthodes DOM sécurisées (`textContent`, `createElement`) pour répondre aux exigences de sécurité du Firefox Add-on Store.

---

## [1.1.0] - 2026-03-23

### ✨ Nouvelles fonctionnalités
- **Widget YouTube intelligent** : Intégration d'un flux de vidéos récentes directement sur la page d'accueil.
- **Relais Cloudflare Worker** : Utilisation d'un worker personnel pour une récupération ultra-rapide des vidéos via RSS, avec support du cache KV et des Queues pour des mises à jour régulières.
- **Filtrage Anti-Shorts** : Le widget ignore automatiquement les YouTube Shorts pour ne garder que le contenu long format.
- **Gestion des vidéos vues** : Possibilité de masquer les vidéos déjà regardées en un clic (stockage local jusqu'à 200 vidéos).
- **Outil de recherche d'ID** : Système intégré pour trouver l'ID d'une chaîne YouTube simplement à partir de son handle (ex: @YouTube).
- **Import/Export segmenté** : Possibilité de sauvegarder et restaurer les favoris/moteurs de recherche et la configuration YouTube séparément.
- **Guide d'installation intégré** : Ajout d'un onglet d'aide complet dans les options incluant le code source du Worker et les étapes de configuration Cloudflare.

### 🎨 Améliorations de l'interface
- **Mise en page compacte** : Le widget YouTube est passé à une seule ligne horizontale avec défilement pour un encombrement minimal.
- **Positionnement flexible** : Option pour placer le widget en haut ou en bas des favoris (bas par défaut pour une intégration fluide avec le footer).
- **Design "Neon Night"** : Ajustement des styles, des polices et des marges pour une cohérence visuelle parfaite.
- **Optimisation des onglets** : Noms raccourcis et ajustements CSS pour éviter le passage sur deux lignes dans les options.
- **Structure Flexbox** : Refonte de la mise en page principale pour garantir que le widget "colle" au footer sans espace blanc parasite.

### 🔧 Améliorations techniques
- Migration de la configuration des chaînes YouTube d'un texte brut vers une liste d'objets structurés (ID + Nom).
- Utilisation de `insertAdjacentElement` pour un positionnement DOM robuste et dynamique.
- Réduction du poids total des vignettes et optimisation des requêtes réseau.
- Amélioration de la gestion du cache dans le Cloudflare Worker.

---

## [1.0.7] - Version initiale consolidée
- Gestion des favoris par catégories.
- Raccourcis de recherche personnalisables.
- Synchronisation via `browser.storage.sync`.
- Support automatique des icônes (Favicon, Simple Icons, Logo.dev).
