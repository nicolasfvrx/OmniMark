

// Polyfill pour assurer la compatibilité Chrome/Firefox
if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('bookmark-grid');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let allLinks = [];
    let searchEngines = {};
    let settings = {};

    const defaultEngines = {
        'g:': { name: 'Google', url: 'https://www.google.com/search?q=', icon: '🔍' },
        'gh:': { name: 'GitHub', url: 'https://github.com/search?q=', icon: '🐙' },
        'yt:': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', icon: '📺' },
        'w:': { name: 'Wikipedia', url: 'https://fr.wikipedia.org/wiki/Special:Search?search=', icon: '📖' },
        'd:': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: '🦆' }
    };

    // Configuration par défaut (si le stockage est vide)
    const defaultBookmarks = [
        {
            name: "Outils",
            column: 1,
            links: [
                { title: "Google", url: "https://www.google.com", iconType: "favicon", iconValue: "" },
                { title: "GitHub", url: "https://github.com", iconType: "simpleicons", iconValue: "github" },
                { title: "ChatGPT", url: "https://chatgpt.com", iconType: "simpleicons", iconValue: "openai" }
            ]
        },
        {
            name: "Loisirs",
            column: 2,
            links: [
                { title: "YouTube", url: "https://www.youtube.com", iconType: "favicon", iconValue: "" },
                { title: "Reddit", url: "https://www.reddit.com", iconType: "simpleicons", iconValue: "reddit" },
                { title: "Twitch", url: "https://www.twitch.tv", iconType: "simpleicons", iconValue: "twitch" }
            ]
        }
    ];


    async function loadSearchEngines() {
        const result = await browser.storage.sync.get(['searchEngines', 'settings']);
        searchEngines = result.searchEngines || defaultEngines;
        settings = result.settings || {};
        
        // Ordre par défaut si absent
        if (!settings.widgetOrder) {
            settings.widgetOrder = ['twitch-widget', 'youtube-widget', 'bookmark-grid'];
        }
    }

    async function getFavicon(url) {
        try {
            const hostname = new URL(url).hostname;
            const cacheKey = `favicon_${hostname}`;
            const cached = await browser.storage.local.get(cacheKey);
            
            if (cached[cacheKey]) {
                return cached[cacheKey];
            }

            const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
            const response = await fetch(faviconUrl);
            if (!response.ok) return null;

            const blob = await response.blob();
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            await browser.storage.local.set({ [cacheKey]: dataUrl });
            return dataUrl;
        } catch (e) {
            return null;
        }
    }

    async function loadDynamicBookmarks() {
        const result = await browser.storage.sync.get('bookmarkData');
        let data = result.bookmarkData;
        
        // Si aucune donnée n'est trouvée, utiliser les favoris par défaut
        if (!data || (Array.isArray(data) && data.length === 0)) {
            data = defaultBookmarks;
        }

        allLinks = [];

        // Grouper les catégories par colonne
        const columns = {};
        data.forEach(cat => {
            const colIdx = cat.column || 1;
            if (!columns[colIdx]) {
                columns[colIdx] = [];
            }
            columns[colIdx].push(cat);
        });

        // Trier les colonnes par numéro pour l'affichage
        const sortedColKeys = Object.keys(columns).sort((a, b) => a - b);

        for (const colKey of sortedColKeys) {
            const colDiv = document.createElement('div');
            // Pas de classe "card" ici pour respecter le choix de l'utilisateur (pas de style card sur index)

            for (const cat of columns[colKey]) {
                const title = document.createElement('h3');
                title.textContent = cat.name;
                colDiv.appendChild(title);

                for (const link of cat.links) {
                    allLinks.push({ ...link, categoryName: cat.name });
                    const p = document.createElement('p');
                    const a = document.createElement('a');
                    a.href = link.url;
                    if (link.openingMode === 'new' || (!link.openingMode && settings.linkOpeningModeBookmarks === 'new')) {
                        a.target = '_blank';
                    } else {
                        a.target = '_self';
                    }
                    
                    const iconContainer = document.createElement('span');
                    iconContainer.className = 'link-icon';

                    if (link.iconType === 'emoji') {
                        iconContainer.textContent = link.iconValue || '⭐';
                    } else if (link.iconType === 'simpleicons') {
                        const img = document.createElement('img');
                        img.src = `https://cdn.simpleicons.org/${link.iconValue || 'simpleicons'}`;
                        img.alt = '';
                        img.style.width = '14px';
                        img.style.height = '14px';
                        iconContainer.appendChild(img);
                    } else if (link.iconType === 'logodev') {
                        const img = document.createElement('img');
                        let domain = link.iconValue;
                        if (!domain && link.url) {
                            try { domain = new URL(link.url).hostname; } catch (e) { domain = ''; }
                        }
                        const theme = link.iconTheme || 'dark';
                        img.src = `https://img.logo.dev/${domain}?token=${settings.logoDevToken || ''}&theme=${theme}&format=webp&fallback=monogram`;
                        img.alt = '';
                        img.style.width = '14px';
                        img.style.height = '14px';
                        iconContainer.appendChild(img);
                    } else if (link.iconType === 'custom') {
                        const img = document.createElement('img');
                        img.src = link.iconValue;
                        img.alt = '';
                        img.style.width = '14px';
                        img.style.height = '14px';
                        iconContainer.appendChild(img);
                    } else {
                        // Default favicon
                        let favSrc = await getFavicon(link.url);
                        
                        if (!favSrc) {
                            // Fallback à l'URL directe si le fetch (pour le cache) a échoué
                            const hostname = new URL(link.url).hostname;
                            favSrc = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
                        }

                        const img = document.createElement('img');
                        img.src = favSrc;
                        img.alt = '';
                        img.style.width = '14px';
                        img.style.height = '14px';
                        iconContainer.appendChild(img);
                    }

                    a.appendChild(iconContainer);
                    a.appendChild(document.createTextNode(link.title));

                    p.appendChild(a);
                    colDiv.appendChild(p);
                }
            }
            grid.appendChild(colDiv);
        }
    }


    // Logique de recherche
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const fullQuery = e.target.value.toLowerCase().trim();
            searchResults.textContent = '';
            
            if (fullQuery.length < 1) {
                searchResults.style.display = 'none';
                return;
            }

            // Détection du moteur externe
            let engine = null;
            let searchTerm = fullQuery;
            for (const prefix in searchEngines) {
                if (fullQuery.startsWith(prefix)) {
                    engine = searchEngines[prefix];
                    searchTerm = fullQuery.slice(prefix.length).trim();
                    break;
                }
            }

            // Si un moteur est trouvé, l'ajouter en haut
            if (engine) {
                const a = document.createElement('a');
                
                // Gérer le remplacement de %s ou l'ajout à la fin
                const searchUrl = engine.url.includes('%s') 
                    ? engine.url.replace('%s', encodeURIComponent(searchTerm))
                    : engine.url + encodeURIComponent(searchTerm);
                
                a.href = searchUrl;
                if (settings.linkOpeningModeBookmarks === 'new') {
                    a.target = '_blank';
                }
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'link-icon';
                
                // Gérer les icônes de moteur (Emoji ou URL)
                if (engine.icon.startsWith('http') || engine.icon.startsWith('data:')) {
                    const img = document.createElement('img');
                    img.src = engine.icon;
                    img.style.width = '16px';
                    img.style.height = '16px';
                    iconSpan.appendChild(img);
                } else {
                    iconSpan.textContent = engine.icon || '🔍';
                }
                
                a.appendChild(iconSpan);
                const text = searchTerm ? `Rechercher "${searchTerm}" sur ${engine.name}` : `Rechercher sur ${engine.name}...`;
                a.appendChild(document.createTextNode(text));
                
                const catLabel = document.createElement('span');
                catLabel.className = 'category-label';
                catLabel.textContent = 'Moteur externe';
                a.appendChild(catLabel);
                
                searchResults.appendChild(a);
            }

            const filterQuery = engine ? searchTerm : fullQuery;
            let filtered = [];
            
            if (filterQuery.length > 0) {
                filtered = allLinks.filter(link => 
                    link.title.toLowerCase().includes(filterQuery) || 
                    link.url.toLowerCase().includes(filterQuery)
                );
            }

            if (filtered.length > 0 || engine) {
                for (const link of filtered) {
                    const a = document.createElement('a');
                    a.href = link.url;
                    if (link.openingMode === 'new' || (!link.openingMode && settings.linkOpeningModeBookmarks === 'new')) {
                        a.target = '_blank';
                    } else {
                        a.target = '_self';
                    }
                    
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'link-icon';
                    
                    if (link.iconType === 'emoji') {
                        iconSpan.textContent = link.iconValue || '⭐';
                    } else if (link.iconType === 'simpleicons') {
                        const img = document.createElement('img');
                        img.src = `https://cdn.simpleicons.org/${link.iconValue || 'simpleicons'}`;
                        img.style.width = '16px';
                        img.style.height = '16px';
                        iconSpan.appendChild(img);
                    } else if (link.iconType === 'logodev') {
                        const img = document.createElement('img');
                        let domain = link.iconValue;
                        if (!domain && link.url) {
                            try { domain = new URL(link.url).hostname; } catch (e) { domain = ''; }
                        }
                        const theme = link.iconTheme || 'dark';
                        img.src = `https://img.logo.dev/${domain}?token=${settings.logoDevToken || ''}&theme=${theme}&format=webp&fallback=monogram`;
                        img.style.width = '16px';
                        img.style.height = '16px';
                        iconSpan.appendChild(img);
                    } else if (link.iconType === 'custom') {
                        const img = document.createElement('img');
                        img.src = link.iconValue;
                        img.style.width = '16px';
                        img.style.height = '16px';
                        iconSpan.appendChild(img);
                    } else {
                        let favSrc = await getFavicon(link.url);
                        if (!favSrc) {
                            const hostname = new URL(link.url).hostname;
                            favSrc = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
                        }
                        const img = document.createElement('img');
                        img.src = favSrc;
                        img.style.width = '16px';
                        img.style.height = '16px';
                        iconSpan.appendChild(img);
                    }

                    a.appendChild(iconSpan);
                    a.appendChild(document.createTextNode(link.title));
                    
                    const catLabel = document.createElement('span');
                    catLabel.className = 'category-label';
                    catLabel.textContent = link.categoryName;
                    a.appendChild(catLabel);
                    
                    searchResults.appendChild(a);
                }
                searchResults.style.display = 'block';
            } else {
                searchResults.style.display = 'none';
            }
        });

        // Gérer la touche Entrée pour valider le premier résultat
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstResult = searchResults.querySelector('a');
                if (firstResult) {
                    if (firstResult.target === '_blank') {
                        window.open(firstResult.href, '_blank');
                    } else {
                        window.location.href = firstResult.href;
                    }
                }
            }
        });

        // Fermer les résultats si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    await loadSearchEngines();
    loadDynamicBookmarks();
    
    // Focus par défaut
    if (searchInput) {
        searchInput.focus();
    }

    // Gestion de l'horloge et de la date
    function updateDateTime() {
        const dateEl = document.getElementById('footer-date');
        const timeEl = document.getElementById('footer-time');
        if (!dateEl || !timeEl) return;

        const now = new Date();
        
        // Date formatée (ex: Samedi 14 Mars 2026)
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let dateStr = now.toLocaleDateString('fr-FR', dateOptions);
        // Mettre la première lettre en majuscule
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        
        dateEl.textContent = dateStr;
        timeEl.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    // --- Modules de statut ---
    // Le module FiveM est désactivé car l'API officielle ne répond plus.

    // --- Widget Twitch ---

    async function applyWidgetOrder() {
        if (!settings.widgetOrder || !Array.isArray(settings.widgetOrder)) return;

        settings.widgetOrder.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // On déplace chaque élément à la fin du body (avant le script de fin)
                // Mais pour garder l'ordre relatif, on les insère avant le footer s'il existe
                const footer = document.getElementById('status-bar');
                if (footer) {
                    footer.insertAdjacentElement('beforebegin', el);
                } else {
                    document.body.appendChild(el);
                }
            }
        });
    }

    async function updateTwitchWidget() {
        const twitchEl = document.getElementById('twitch-widget');
        const livesGrid = document.getElementById('twitch-lives');
        
        const workerUrl = settings.workerUrl || settings.twitchWorkerUrl;
        const apiKey = settings.workerApiKey;

        if (!settings.enableWidgetTwitch || !workerUrl || !twitchEl) {
            if (twitchEl) twitchEl.style.display = 'none';
            return;
        }

        twitchEl.style.display = 'block';
        
        // Fixer la hauteur actuelle pour éviter le saut pendant le rafraîchissement
        if (livesGrid.offsetHeight > 0) {
            livesGrid.style.minHeight = `${livesGrid.offsetHeight}px`;
        }
        
        livesGrid.replaceChildren();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'twitch-loading';
        loadingDiv.textContent = 'Recherche des lives en cours...';
        livesGrid.appendChild(loadingDiv);

        try {
            const channels = settings.twitchChannels || [];
            if (channels.length === 0) {
                livesGrid.replaceChildren();
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'twitch-error';
                emptyDiv.textContent = 'Aucun streamer configuré.';
                livesGrid.appendChild(emptyDiv);
                livesGrid.style.minHeight = '';
                return;
            }

            const cleanWorkerUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
            let finalUrl;

            if (settings.workerUrl) {
                const url = new URL(`${cleanWorkerUrl}/streams`);
                if (apiKey) url.searchParams.set('key', apiKey);
                finalUrl = url.toString();
            } else {
                const url = new URL(cleanWorkerUrl);
                const channelsParam = channels.map(c => {
                    if (typeof c === 'string') return `${c}:twitch`;
                    return `${c.name}:${c.platform}`;
                }).join(',');
                url.searchParams.set('channels', channelsParam);
                finalUrl = url.toString();
            }

            const response = await fetch(finalUrl);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${response.status}`);
            }
            
            let rawStreams = await response.json();
            if (!Array.isArray(rawStreams)) rawStreams = [];

            // Regroupement par pseudo (user_login)
            const groupedStreams = {};
            rawStreams.forEach(s => {
                const key = s.user_login.toLowerCase();
                if (!groupedStreams[key]) {
                    groupedStreams[key] = {
                        ...s,
                        platforms: [s.platform]
                    };
                } else {
                    // Si déjà présent, on ajoute la plateforme et on cumule les spectateurs
                    if (!groupedStreams[key].platforms.includes(s.platform)) {
                        groupedStreams[key].platforms.push(s.platform);
                    }
                    groupedStreams[key].viewer_count += (s.viewer_count || 0);
                    // On privilégie Twitch pour les infos de base (titre, jeu, miniature) si disponible
                    if (s.platform === 'twitch') {
                        groupedStreams[key].title = s.title;
                        groupedStreams[key].game_name = s.game_name;
                        groupedStreams[key].thumbnail_url = s.thumbnail_url;
                        groupedStreams[key].user_name = s.user_name;
                    }
                }
            });

            const streams = Object.values(groupedStreams);

            if (streams.length === 0) {
                livesGrid.replaceChildren();
                const noneFoundDiv = document.createElement('div');
                noneFoundDiv.className = 'twitch-error';
                noneFoundDiv.textContent = 'Aucun live en cours.';
                livesGrid.appendChild(noneFoundDiv);
                livesGrid.style.minHeight = '';
                return;
            }

            livesGrid.replaceChildren();
            livesGrid.style.minHeight = '';
            
            streams.forEach(stream => {
                const card = document.createElement('a');
                const isKickOnly = stream.platforms.length === 1 && stream.platforms[0] === 'kick';
                card.className = `twitch-card ${isKickOnly ? 'kick-card' : ''}`;
                if (stream.platforms.length > 1) card.classList.add('multi-platform-card');

                const hasTwitch = stream.platforms.includes('twitch');
                const baseUrl = hasTwitch ? 'https://www.twitch.tv/' : 'https://kick.com/';
                card.href = `${baseUrl}${stream.user_login}`;
                if (settings.linkOpeningModeStreams === 'new') {
                    card.target = '_blank';
                } else {
                    card.target = '_self';
                }
                
                const thumbContainer = document.createElement('div');
                thumbContainer.className = 'twitch-thumbnail-container';
                
                const thumb = document.createElement('div');
                thumb.className = 'twitch-thumbnail';
                // Remplacer les placeholders {width} et {height} pour Twitch
                let thumbUrl = stream.thumbnail_url || '';
                if (hasTwitch && thumbUrl.includes('{width}')) {
                    thumbUrl = thumbUrl.replace('{width}', '400').replace('{height}', '225');
                }
                thumb.style.backgroundImage = `url(${thumbUrl})`;
                
                const liveBadge = document.createElement('div');
                liveBadge.className = 'twitch-live-badge';
                liveBadge.textContent = 'LIVE';
                
                const badgesContainer = document.createElement('div');
                badgesContainer.className = 'platform-badges-container';
                
                stream.platforms.sort().forEach(p => {
                    const badge = document.createElement('div');
                    badge.className = `platform-badge ${p}-badge`;
                    badge.textContent = p;
                    badgesContainer.appendChild(badge);
                });
                
                const viewers = document.createElement('div');
                viewers.className = 'twitch-viewer-count';
                viewers.textContent = `${stream.viewer_count.toLocaleString()} spectateurs`;
                
                thumbContainer.appendChild(thumb);
                thumbContainer.appendChild(liveBadge);
                thumbContainer.appendChild(badgesContainer);
                thumbContainer.appendChild(viewers);
                
                const info = document.createElement('div');
                info.className = 'twitch-info';
                
                const title = document.createElement('div');
                title.className = 'twitch-title';
                title.textContent = stream.title;
                title.title = stream.title;
                
                const meta = document.createElement('div');
                meta.className = 'twitch-meta';
                
                const channel = document.createElement('span');
                channel.className = `twitch-channel ${isKickOnly ? 'kick-channel' : ''}`;
                if (stream.platforms.length > 1) channel.classList.add('multi-platform-channel');
                channel.textContent = stream.user_name;
                
                const game = document.createElement('span');
                game.className = 'twitch-game';
                game.textContent = stream.game_name;
                
                meta.appendChild(channel);
                meta.appendChild(game);
                info.appendChild(title);
                info.appendChild(meta);
                
                card.appendChild(thumbContainer);
                card.appendChild(info);
                
                livesGrid.appendChild(card);
            });

        } catch (e) {
            console.error('Erreur Twitch:', e);
            livesGrid.replaceChildren();
            const errorDiv = document.createElement('div');
            errorDiv.className = 'twitch-error';
            errorDiv.textContent = `Erreur : ${e.message}`;
            livesGrid.appendChild(errorDiv);
            livesGrid.style.minHeight = '';
        }
    }

    if (settings.enableWidgetTwitch) {
        updateTwitchWidget();
        const refreshBtn = document.getElementById('refresh-twitch');
        if (refreshBtn) {
            refreshBtn.onclick = updateTwitchWidget;
        }
        // Rafraîchir toutes les 5 minutes
        setInterval(updateTwitchWidget, 60000 * 5);
    }

    // Appliquer l'ordre des widgets après avoir chargé les favoris
    applyWidgetOrder();

    // --- Widget YouTube ---

    async function updateYoutubeWidget() {
        const youtubeEl = document.getElementById('youtube-widget');
        const videosGrid = document.getElementById('youtube-videos');
        const refreshBtn = document.getElementById('refresh-youtube');

        const workerUrl = settings.workerUrl || settings.youtubeWorkerUrl;
        const apiKey = settings.workerApiKey;

        if (!settings.enableWidgetYoutube || !workerUrl || !youtubeEl) {
            if (youtubeEl) youtubeEl.style.display = 'none';
            return;
        }

        youtubeEl.style.display = 'block';
        
        // Fixer la hauteur actuelle pour éviter le saut pendant le rafraîchissement
        if (videosGrid.offsetHeight > 0) {
            videosGrid.style.minHeight = `${videosGrid.offsetHeight}px`;
        }
        
        videosGrid.replaceChildren();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'youtube-loading';
        loadingDiv.textContent = 'Chargement des vidéos...';
        videosGrid.appendChild(loadingDiv);

        try {
            const watchedResult = await browser.storage.local.get('watchedVideos');
            const watchedVideos = watchedResult.watchedVideos || [];

            let channels = [];
            if (Array.isArray(settings.youtubeChannels)) {
                channels = settings.youtubeChannels.map(c => typeof c === 'object' ? c.id : c).filter(id => id);
            } else if (typeof settings.youtubeChannels === 'string') {
                channels = settings.youtubeChannels.split(',').map(s => s.trim()).filter(s => s);
            }

            if (channels.length === 0) {
                videosGrid.replaceChildren();
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'youtube-error';
                emptyDiv.textContent = 'Aucune chaîne configurée.';
                videosGrid.appendChild(emptyDiv);
                videosGrid.style.minHeight = '';
                return;
            }

            const cleanWorkerUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
            let finalUrl;

            if (settings.workerUrl) {
                finalUrl = `${cleanWorkerUrl}/youtube${apiKey ? `?key=${encodeURIComponent(apiKey)}` : ''}`;
            } else {
                finalUrl = `${cleanWorkerUrl}?channels=${encodeURIComponent(channels.map(c => typeof c === 'string' ? c : c.id).join(','))}`;
            }

            const response = await fetch(finalUrl);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${response.status}`);
            }
            
            let videos = await response.json();
            if (!Array.isArray(videos)) videos = [];
            
            // Filtrer les vidéos déjà vues et les shorts (sécurité supplémentaire)
            videos = videos.filter(v => v && v.id && !watchedVideos.includes(v.id) && !v.title?.toLowerCase().includes('shorts') && !v.link?.includes('/shorts/'));

            // Trier par date de publication (plus récent en premier)
            videos.sort((a, b) => {
                const dateA = new Date(a.published || 0);
                const dateB = new Date(b.published || 0);
                return dateB - dateA;
            });

            if (videos.length === 0) {
                videosGrid.replaceChildren();
                const noneFoundDiv = document.createElement('div');
                noneFoundDiv.className = 'youtube-error';
                noneFoundDiv.textContent = 'Aucune nouvelle vidéo trouvée.';
                videosGrid.appendChild(noneFoundDiv);
                videosGrid.style.minHeight = '';
                return;
            }

            videosGrid.replaceChildren();
            videosGrid.style.minHeight = '';
            
            videos.forEach(video => {
                const card = document.createElement('div');
                card.className = 'video-card';
                
                const link = document.createElement('a');
                link.href = video.link;
                if (settings.linkOpeningModeYoutube === 'new') {
                    link.target = '_blank';
                } else {
                    link.target = '_self';
                }
                link.style.textDecoration = 'none';
                link.style.color = 'inherit';

                const hideBtn = document.createElement('button');
                hideBtn.className = 'video-hide-btn';
                hideBtn.textContent = '✕';
                hideBtn.title = 'Marquer comme vu';
                hideBtn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentWatched = await browser.storage.local.get('watchedVideos');
                    const newList = currentWatched.watchedVideos || [];
                    if (!newList.includes(video.id)) {
                        newList.push(video.id);
                        // Limiter la taille de l'historique (ex: 200 dernières vidéos)
                        if (newList.length > 200) newList.shift();
                        await browser.storage.local.set({ watchedVideos: newList });
                    }
                    card.remove();
                    if (videosGrid.children.length === 0) {
                        videosGrid.replaceChildren();
                        const allSeenDiv = document.createElement('div');
                        allSeenDiv.className = 'youtube-error';
                        allSeenDiv.textContent = 'Toutes les vidéos ont été vues !';
                        videosGrid.appendChild(allSeenDiv);
                    }
                };
                
                const thumb = document.createElement('div');
                thumb.className = 'video-thumbnail';
                thumb.style.backgroundImage = `url(${video.thumbnail || 'https://i.ytimg.com/vi/' + video.id + '/hqdefault.jpg'})`;
                
                const info = document.createElement('div');
                info.className = 'video-info';
                
                const title = document.createElement('div');
                title.className = 'video-title';
                title.textContent = video.title;
                
                const meta = document.createElement('div');
                meta.className = 'video-meta';
                
                const channel = document.createElement('span');
                channel.className = 'video-channel';
                channel.textContent = video.author;
                
                const date = document.createElement('span');
                const pubDate = new Date(video.published);
                date.textContent = pubDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                
                meta.appendChild(channel);
                meta.appendChild(date);
                info.appendChild(title);
                info.appendChild(meta);
                
                link.appendChild(thumb);
                link.appendChild(info);
                
                card.appendChild(hideBtn);
                card.appendChild(link);
                
                videosGrid.appendChild(card);
            });

        } catch (e) {
            console.error('Erreur YouTube:', e);
            videosGrid.replaceChildren();
            const errorDiv = document.createElement('div');
            errorDiv.className = 'youtube-error';
            errorDiv.textContent = `Impossible de charger les vidéos : ${e.message}`;
            videosGrid.appendChild(errorDiv);
            videosGrid.style.minHeight = '';
        }
    }

    if (settings.enableWidgetYoutube) {
        updateYoutubeWidget();
        const refreshBtn = document.getElementById('refresh-youtube');
        if (refreshBtn) {
            refreshBtn.onclick = updateYoutubeWidget;
        }
    }
});