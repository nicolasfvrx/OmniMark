# OmniMark

**OmniMark** est une extension de navigateur qui remplace votre page de nouvel onglet par une interface personnalisée, élégante et ultra-efficace pour accéder à vos favoris et effectuer des recherches rapides.

## ✨ Caractéristiques

- 🚀 **Accès Instantané** : Remplace la page "Nouvel Onglet" par un tableau de bord épuré.
- 📂 **Organisation par Catégories** : Regroupez vos liens par thématiques (Travail, Loisirs, Outils, etc.) et organisez-les en colonnes.
- 🔍 **Raccourcis de Recherche Puissants** : Effectuez des recherches sur différents moteurs directement depuis la barre de recherche en utilisant des préfixes (ex: `g:`, `yt:`, `gh:`).
- 🎨 **Personnalisation des Icônes** :
    - **Favicon automatique** : Récupération automatique de l'icône du site.
    - **Simple Icons** : Utilisez des milliers d'icônes de marques via leur slug (ex: `github`, `reddit`).
    - **Logo.dev** : Intégration pour des logos de haute qualité.
    - **Emoji / Texte** : Utilisez un simple emoji ou du texte comme icône.
    - **Custom** : Lien direct vers une image ou un SVG.
- 🔄 **Synchronisation** : Vos données sont synchronisées sur tous vos navigateurs connectés grâce à `browser.storage.sync`.
- 🔖 **Import Facilité** : Recherchez et ajoutez facilement vos favoris existants du navigateur directement depuis les options.
- 🌙 **Design Moderne** : Interface sombre (dark mode) inspirée par les meilleurs dashboards de productivité.
- 🕒 **Barre d'état** : Affichage de la date et de l'heure en temps réel.

## 🛠️ Installation

### Pour les développeurs (chargement temporaire)

1. Clonez ce dépôt ou téléchargez les fichiers.
2. Ouvrez votre navigateur (Firefox, Chrome, Edge).
3. Accédez à la page des extensions :
    - **Firefox** : `about:debugging#/runtime/this-firefox` -> "Charger un module complémentaire temporaire" -> Sélectionnez le fichier `manifest.json`.
    - **Chrome/Edge** : `chrome://extensions/` -> Activez le "Mode développeur" -> "Charger l'extension décompressée" -> Sélectionnez le dossier racine du projet.

### Compilation / Build

Le projet utilise `web-ext` pour la gestion et le packaging.
```bash
# Pour tester l'extension
npx web-ext run

# Pour créer une archive prête à être distribuée
npx web-ext build
```

## ⌨️ Utilisation des Raccourcis de Recherche

Dans la barre de recherche centrale, tapez un préfixe suivi de votre recherche :

- `g: [recherche]` -> Recherche sur **Google**
- `gh: [recherche]` -> Recherche sur **GitHub**
- `yt: [recherche]` -> Recherche sur **YouTube**
- `w: [recherche]` -> Recherche sur **Wikipedia**
- `d: [recherche]` -> Recherche sur **DuckDuckGo**

*Vous pouvez ajouter vos propres raccourcis personnalisés dans les réglages !*

## ⚙️ Configuration

Cliquez sur l'icône d'engrenage (⚙️) en haut à droite de la page d'accueil pour accéder aux options. Vous pourrez :
- Ajouter/Supprimer des catégories.
- Gérer vos liens et choisir le type d'icône.
- Configurer vos propres moteurs de recherche.
- Activer l'aide à l'importation depuis vos favoris système.

## 🧰 Technologies utilisées

- HTML5 / CSS3 (Variables CSS, Flexbox, Grid)
- JavaScript (WebExtension API)
- [Simple Icons](https://simpleicons.org/) pour les icônes de marques.
- [Logo.dev](https://logo.dev/) pour les logos d'entreprises.
- [Google Favicon Service](https://www.google.com/s2/favicons) pour les icônes automatiques.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---
*Design inspiré par le [Codepen de Otto (base0)](https://codepen.io/base0/pen/wvaLxPv).*
