

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
                    window.location.href = firstResult.href;
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

    async function updateFiveMStatus() {
        const fivemEl = document.getElementById('fivem-status');
        const tooltip = document.getElementById('fivem-tooltip');
        if (!settings.enableStatusFiveM || !fivemEl) {
            if (fivemEl) fivemEl.style.display = 'none';
            return;
        }

        fivemEl.style.display = 'flex';
        const valEl = fivemEl.querySelector('.status-value');

        try {
            const response = await fetch('https://status.cfx.re/api/v2/summary.json');
            const data = await response.json();
            
            const status = data.status.indicator; // none, minor, major, critical
            valEl.textContent = data.status.description === 'All Systems Operational' ? 'Opérationnel' : data.status.description;
            
            if (status === 'none') valEl.className = 'status-value status-up';
            else if (status === 'minor') valEl.className = 'status-value status-warn';
            else valEl.className = 'status-value status-down';

            tooltip.textContent = '';
            
            // Définition des catégories et de leurs composants respectifs (mots-clés pour le match)
            const categories = [
                {
                    name: 'Game Services',
                    keywords: ['CNL', 'Policy', 'Keymaster']
                },
                {
                    name: 'Games',
                    keywords: ['FiveM', 'RedM', 'FXServer', 'Platform Server']
                },
                {
                    name: 'Web Services',
                    keywords: ['IDMS', 'Runtime', 'Portal']
                }
            ];

            let totalFound = 0;

            categories.forEach(cat => {
                // Trouver les composants qui matchent cette catégorie
                const catComponents = data.components.filter(comp => 
                    cat.keywords.some(keyword => comp.name.toLowerCase().includes(keyword.toLowerCase()))
                );

                if (catComponents.length > 0) {
                    totalFound += catComponents.length;
                    
                    // Ajouter l'en-tête de catégorie
                    const header = document.createElement('div');
                    header.className = 'tooltip-category';
                    header.textContent = cat.name;
                    tooltip.appendChild(header);

                    catComponents.forEach(comp => {
                        const item = document.createElement('div');
                        item.className = 'tooltip-item';
                        let statusClass = 'status-up';
                        if (comp.status === 'partial_outage' || comp.status === 'degraded_performance') statusClass = 'status-warn';
                        else if (comp.status === 'major_outage' || comp.status === 'critical_outage') statusClass = 'status-down';
                        
                        // Nettoyer le nom pour l'affichage
                        let displayName = comp.name.replace(/CitizenFX |Cfx.re /g, '');
                        if (displayName.includes('Platform Server')) displayName = 'FXServer';
                        
                        const nameSpan = document.createElement('span');
                        nameSpan.textContent = displayName;
                        const statusSpan = document.createElement('span');
                        statusSpan.className = statusClass;
                        statusSpan.textContent = comp.status.replace(/_/g, ' ');
                        item.appendChild(nameSpan);
                        item.appendChild(statusSpan);
                        
                        tooltip.appendChild(item);
                    });
                }
            });

            if (totalFound === 0) {
                tooltip.textContent = 'Aucun détail disponible pour le moment.';
            }
        } catch (e) {
            valEl.textContent = 'Erreur';
            valEl.className = 'status-value status-down';
            tooltip.textContent = 'Impossible de récupérer les détails.';
        }
    }

    if (settings.enableStatusFiveM) {
        updateFiveMStatus();
        setInterval(updateFiveMStatus, 60000 * 5);
    }

    // --- Widget YouTube ---

    async function updateYoutubeWidget() {
        const youtubeEl = document.getElementById('youtube-widget');
        const videosGrid = document.getElementById('youtube-videos');
        const refreshBtn = document.getElementById('refresh-youtube');

        if (!settings.enableWidgetYoutube || !settings.youtubeWorkerUrl || !youtubeEl) {
            if (youtubeEl) youtubeEl.style.display = 'none';
            return;
        }

        // Positionnement du widget (bottom par défaut)
        if (settings.youtubeWidgetPosition === 'top') {
            youtubeEl.classList.add('pos-top');
            youtubeEl.classList.remove('pos-bottom');
            grid.insertAdjacentElement('beforebegin', youtubeEl);
        } else {
            youtubeEl.classList.add('pos-bottom');
            youtubeEl.classList.remove('pos-top');
            const footer = document.getElementById('status-bar');
            if (footer) {
                footer.insertAdjacentElement('beforebegin', youtubeEl);
            } else {
                grid.insertAdjacentElement('afterend', youtubeEl);
            }
        }

        youtubeEl.style.display = 'block';
        videosGrid.innerHTML = '';
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
                videosGrid.innerHTML = '';
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'youtube-error';
                emptyDiv.textContent = 'Aucune chaîne configurée.';
                videosGrid.appendChild(emptyDiv);
                return;
            }

            const url = new URL(settings.youtubeWorkerUrl);
            url.searchParams.set('channels', channels.join(','));

            const response = await fetch(url);
            if (!response.ok) throw new Error('Erreur lors de la récupération');
            
            let videos = await response.json();
            
            // Filtrer les vidéos déjà vues
            videos = videos.filter(v => !watchedVideos.includes(v.id));

            if (videos.length === 0) {
                videosGrid.innerHTML = '';
                const noneFoundDiv = document.createElement('div');
                noneFoundDiv.className = 'youtube-error';
                noneFoundDiv.textContent = 'Aucune nouvelle vidéo trouvée.';
                videosGrid.appendChild(noneFoundDiv);
                return;
            }

            videosGrid.innerHTML = '';
            
            videos.forEach(video => {
                const card = document.createElement('div');
                card.className = 'video-card';
                
                const link = document.createElement('a');
                link.href = video.link;
                link.target = '_blank';
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
                        videosGrid.innerHTML = '';
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
            videosGrid.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'youtube-error';
            errorDiv.textContent = `Impossible de charger les vidéos : ${e.message}`;
            videosGrid.appendChild(errorDiv);
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