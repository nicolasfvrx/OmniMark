

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
            searchResults.innerHTML = '';
            
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
});