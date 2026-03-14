document.addEventListener('DOMContentLoaded', async () => {
    const dataList = document.getElementById('data-list');
    const catSelect = document.getElementById('link-cat-select');
    const addCatBtn = document.getElementById('add-cat');
    const addLinkBtn = document.getElementById('add-link');
    const searchEnginesList = document.getElementById('search-engines-list');
    const addSearchBtn = document.getElementById('add-search-engine');

    // Gestion des onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        };
    });

    // Aide à l'ajout via les favoris système
    const enableSystemSearch = document.getElementById('enable-system-search');
    const systemSearchContainer = document.getElementById('system-bookmark-search');
    const systemSearchInput = document.getElementById('system-search-input');
    const systemSearchResults = document.getElementById('system-bookmark-results');
    const logodevToken = document.getElementById('logodev-token');
    const linkTitleInput = document.getElementById('link-title');
    const linkUrlInput = document.getElementById('link-url');
    const linkIconType = document.getElementById('link-icon-type');
    const logoDevThemeContainer = document.getElementById('logodev-theme-container');
    const linkIconTheme = document.getElementById('link-icon-theme');

    async function initSettings() {
        const result = await browser.storage.sync.get('settings');
        const settings = result.settings || {};
        
        if (settings.enableSystemSearch) {
            enableSystemSearch.checked = true;
            systemSearchContainer.style.display = 'block';
        }

        if (settings.logoDevToken) {
            logodevToken.value = settings.logoDevToken;
        }

        enableSystemSearch.onchange = async () => {
            const isEnabled = enableSystemSearch.checked;
            systemSearchContainer.style.display = isEnabled ? 'block' : 'none';
            
            const res = await browser.storage.sync.get('settings');
            const s = res.settings || {};
            s.enableSystemSearch = isEnabled;
            await browser.storage.sync.set({ settings: s });
        };

        logodevToken.onchange = async () => {
            const token = logodevToken.value.trim();
            const res = await browser.storage.sync.get('settings');
            const s = res.settings || {};
            s.logoDevToken = token;
            await browser.storage.sync.set({ settings: s });
        };

        systemSearchInput.oninput = async () => {
            const query = systemSearchInput.value.trim();
            if (query.length < 2) {
                systemSearchResults.innerHTML = '';
                systemSearchResults.style.display = 'none';
                return;
            }

            if (!browser.bookmarks) {
                console.error("L'API bookmarks n'est pas disponible. Vérifiez les permissions.");
                return;
            }

            try {
                const results = await browser.bookmarks.search(query);
                const bookmarks = results.filter(b => b.url);
                
                systemSearchResults.innerHTML = '';
                if (bookmarks.length > 0) {
                    systemSearchResults.style.display = 'block';
                    bookmarks.slice(0, 10).forEach(b => {
                        const div = document.createElement('div');
                        div.className = 'system-bookmark-item';
                        const strong = document.createElement('strong');
                        strong.textContent = b.title || '(Sans nom)';
                        const small = document.createElement('small');
                        small.textContent = b.url;
                        div.appendChild(strong);
                        div.appendChild(small);
                        div.onclick = () => {
                            linkUrlInput.value = b.url;
                            if (b.title) {
                                linkTitleInput.value = b.title;
                                linkTitleInput.classList.remove('is-invalid');
                            } else {
                                linkTitleInput.value = '';
                                linkTitleInput.classList.add('is-invalid');
                                linkTitleInput.placeholder = "Nom manquant dans le favori !";
                            }
                            systemSearchResults.style.display = 'none';
                            systemSearchInput.value = '';
                        };
                        systemSearchResults.appendChild(div);
                    });
                } else {
                    systemSearchResults.style.display = 'none';
                }
            } catch (e) {
                console.error("Erreur recherche favoris:", e);
            }
        };

        linkTitleInput.addEventListener('input', () => {
            linkTitleInput.classList.remove('is-invalid');
            linkTitleInput.placeholder = "Nom du site";
        });

        document.addEventListener('click', (e) => {
            if (!systemSearchInput.contains(e.target) && !systemSearchResults.contains(e.target)) {
                systemSearchResults.style.display = 'none';
            }
        });

        linkIconType.onchange = () => {
            logoDevThemeContainer.style.display = linkIconType.value === 'logodev' ? 'block' : 'none';
        };
    }

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

    // Charger les données
    async function loadData() {
        const result = await browser.storage.sync.get(['bookmarkData', 'searchEngines']);
        let data = result.bookmarkData;
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
            data = JSON.parse(JSON.stringify(defaultBookmarks));
        }

        const engines = result.searchEngines || defaultEngines;
        
        renderList(data);
        updateSelect(data);
        renderEngines(engines);
    }

    function renderEngines(engines) {
        searchEnginesList.innerHTML = '';
        for (const prefix in engines) {
            const engine = engines[prefix];
            const div = document.createElement('div');
            div.className = 'search-engine-item';
            const infoDiv = document.createElement('div');
            infoDiv.className = 'engine-info';
            
            const strong = document.createElement('strong');
            strong.textContent = prefix;
            
            const span = document.createElement('span');
            span.textContent = ` ${engine.icon} ${engine.name}`;
            
            const br = document.createElement('br');
            const small = document.createElement('small');
            small.textContent = engine.url;
            
            infoDiv.appendChild(strong);
            infoDiv.appendChild(span);
            infoDiv.appendChild(br);
            infoDiv.appendChild(small);
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.dataset.prefix = prefix;
            delBtn.textContent = 'Supprimer';
            
            div.appendChild(infoDiv);
            div.appendChild(delBtn);
            searchEnginesList.appendChild(div);
        }

        document.querySelectorAll('#search-engines-list .delete-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const prefix = e.target.dataset.prefix;
                const result = await browser.storage.sync.get('searchEngines');
                const engines = result.searchEngines || { ...defaultEngines };
                delete engines[prefix];
                await browser.storage.sync.set({ searchEngines: engines });
                loadData();
            };
        });
    }

    addSearchBtn.onclick = async () => {
        const prefix = document.getElementById('search-prefix').value.trim();
        const name = document.getElementById('search-name').value.trim();
        const url = document.getElementById('search-url').value.trim();
        const icon = document.getElementById('search-icon').value.trim();

        if (!prefix || !name || !url) return;

        const result = await browser.storage.sync.get('searchEngines');
        const engines = result.searchEngines || { ...defaultEngines };
        engines[prefix] = { name, url, icon: icon || '🔍' };

        await browser.storage.sync.set({ searchEngines: engines });
        
        document.getElementById('search-prefix').value = '';
        document.getElementById('search-name').value = '';
        document.getElementById('search-url').value = '';
        document.getElementById('search-icon').value = '';
        
        loadData();
    };

    function renderList(data) {
        dataList.innerHTML = '';
        data.forEach((cat, catIdx) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'cat-item';
            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.alignItems = 'center';
            
            const strong = document.createElement('strong');
            strong.textContent = `${cat.name} (Colonne: `;
            
            const colInput = document.createElement('input');
            colInput.type = 'number';
            colInput.className = 'col-change';
            colInput.dataset.catIdx = catIdx;
            colInput.value = cat.column || 1;
            colInput.style.width = '50px';
            colInput.style.display = 'inline';
            colInput.style.margin = '0 5px';
            
            strong.appendChild(colInput);
            strong.appendChild(document.createTextNode(')'));
            
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group';
            
            const upBtn = document.createElement('button');
            upBtn.className = 'move-btn';
            upBtn.dataset.move = 'up';
            upBtn.dataset.catIdx = catIdx;
            upBtn.textContent = '↑';
            
            const downBtn = document.createElement('button');
            downBtn.className = 'move-btn';
            downBtn.dataset.move = 'down';
            downBtn.dataset.catIdx = catIdx;
            downBtn.textContent = '↓';
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.dataset.catIdx = catIdx;
            delBtn.textContent = 'Supprimer la catégorie';
            
            btnGroup.appendChild(upBtn);
            btnGroup.appendChild(downBtn);
            btnGroup.appendChild(delBtn);
            
            headerDiv.appendChild(strong);
            headerDiv.appendChild(btnGroup);
            
            catDiv.appendChild(headerDiv);

            cat.links.forEach((link, linkIdx) => {
                const linkDiv = document.createElement('div');
                linkDiv.className = 'link-item';
                linkDiv.style.flexDirection = 'column';
                linkDiv.style.alignItems = 'flex-start';
                const topDiv = document.createElement('div');
                topDiv.style.width = '100%';
                topDiv.style.display = 'flex';
                topDiv.style.justifyContent = 'space-between';
                topDiv.style.alignItems = 'center';
                
                const span = document.createElement('span');
                span.textContent = `${link.title} - `;
                const small = document.createElement('small');
                small.textContent = link.url;
                span.appendChild(small);
                
                const btnGroup = document.createElement('div');
                btnGroup.className = 'btn-group';
                
                const upBtn = document.createElement('button');
                upBtn.className = 'move-btn';
                upBtn.dataset.move = 'up';
                upBtn.dataset.catIdx = catIdx;
                upBtn.dataset.linkIdx = linkIdx;
                upBtn.textContent = '↑';
                
                const downBtn = document.createElement('button');
                downBtn.className = 'move-btn';
                downBtn.dataset.move = 'down';
                downBtn.dataset.catIdx = catIdx;
                downBtn.dataset.linkIdx = linkIdx;
                downBtn.textContent = '↓';
                
                const delBtn = document.createElement('button');
                delBtn.className = 'delete-btn';
                delBtn.dataset.catIdx = catIdx;
                delBtn.dataset.linkIdx = linkIdx;
                delBtn.textContent = 'X';
                
                btnGroup.appendChild(upBtn);
                btnGroup.appendChild(downBtn);
                btnGroup.appendChild(delBtn);
                
                topDiv.appendChild(span);
                topDiv.appendChild(btnGroup);
                
                const iconConfig = document.createElement('div');
                iconConfig.className = 'icon-config';
                iconConfig.style.flexDirection = 'column';
                iconConfig.style.gap = '5px';
                
                const mainConfig = document.createElement('div');
                mainConfig.style.display = 'flex';
                mainConfig.style.gap = '10px';
                mainConfig.style.width = '100%';

                const select = document.createElement('select');
                select.className = 'link-icon-type-change';
                select.dataset.catIdx = catIdx;
                select.dataset.linkIdx = linkIdx;
                
                ['favicon', 'emoji', 'simpleicons', 'logodev', 'custom'].forEach(type => {
                    const opt = document.createElement('option');
                    opt.value = type;
                    let label = type.charAt(0).toUpperCase() + type.slice(1);
                    if (type === 'simpleicons') label = 'Simple Icons';
                    if (type === 'logodev') label = 'Logo.dev';
                    opt.textContent = label;
                    if (link.iconType === type) opt.selected = true;
                    select.appendChild(opt);
                });
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'link-icon-value-change';
                input.dataset.catIdx = catIdx;
                input.dataset.linkIdx = linkIdx;
                input.value = link.iconValue || '';
                input.placeholder = 'Emoji, slug, domaine ou URL';
                
                mainConfig.appendChild(select);
                mainConfig.appendChild(input);
                iconConfig.appendChild(mainConfig);

                if (link.iconType === 'logodev') {
                    const themeDiv = document.createElement('div');
                    themeDiv.style.display = 'flex';
                    themeDiv.style.alignItems = 'center';
                    themeDiv.style.gap = '10px';
                    themeDiv.style.width = '100%';
                    themeDiv.style.fontSize = '12px';

                    const themeLabel = document.createElement('span');
                    themeLabel.textContent = 'Thème :';
                    themeLabel.style.color = 'var(--secondary-color)';

                    const themeSelect = document.createElement('select');
                    themeSelect.className = 'link-icon-theme-change';
                    themeSelect.dataset.catIdx = catIdx;
                    themeSelect.dataset.linkIdx = linkIdx;
                    themeSelect.style.width = 'auto';
                    themeSelect.style.padding = '4px';

                    [{val: 'light', label: 'Clair'}, {val: 'dark', label: 'Sombre'}].forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.val;
                        opt.textContent = t.label;
                        if (link.iconTheme === t.val || (!link.iconTheme && t.val === 'dark')) opt.selected = true;
                        themeSelect.appendChild(opt);
                    });

                    themeDiv.appendChild(themeLabel);
                    themeDiv.appendChild(themeSelect);
                    iconConfig.appendChild(themeDiv);
                }
                
                linkDiv.appendChild(topDiv);
                linkDiv.appendChild(iconConfig);
                catDiv.appendChild(linkDiv);
            });
            dataList.appendChild(catDiv);
        });

        // Event listeners for move buttons
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const cIdx = parseInt(e.target.dataset.catIdx);
                const lIdx = e.target.dataset.linkIdx !== undefined ? parseInt(e.target.dataset.linkIdx) : undefined;
                const dir = e.target.dataset.move;

                if (lIdx !== undefined) {
                    // Déplacer un lien
                    if (dir === 'up' && lIdx > 0) {
                        [data[cIdx].links[lIdx], data[cIdx].links[lIdx - 1]] = [data[cIdx].links[lIdx - 1], data[cIdx].links[lIdx]];
                    } else if (dir === 'down' && lIdx < data[cIdx].links.length - 1) {
                        [data[cIdx].links[lIdx], data[cIdx].links[lIdx + 1]] = [data[cIdx].links[lIdx + 1], data[cIdx].links[lIdx]];
                    }
                } else {
                    // Déplacer une catégorie
                    if (dir === 'up' && cIdx > 0) {
                        [data[cIdx], data[cIdx - 1]] = [data[cIdx - 1], data[cIdx]];
                    } else if (dir === 'down' && cIdx < data.length - 1) {
                        [data[cIdx], data[cIdx + 1]] = [data[cIdx + 1], data[cIdx]];
                    }
                }
                await browser.storage.sync.set({ bookmarkData: data });
                loadData();
            };
        });

        // Event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const cIdx = e.target.dataset.catIdx;
                const lIdx = e.target.dataset.linkIdx;
                if (lIdx !== undefined) {
                    data[cIdx].links.splice(lIdx, 1);
                } else {
                    if (confirm('Supprimer cette catégorie et tous ses liens ?')) {
                        data.splice(cIdx, 1);
                    }
                }
                await browser.storage.sync.set({ bookmarkData: data });
                loadData();
            };
        });

        // Event listener for column change
        document.querySelectorAll('.col-change').forEach(input => {
            input.onchange = async (e) => {
                const cIdx = parseInt(e.target.dataset.catIdx);
                const newVal = parseInt(e.target.value) || 1;
                data[cIdx].column = newVal;
                await browser.storage.sync.set({ bookmarkData: data });
                loadData();
            };
        });

        // Event listener for link icon changes
        document.querySelectorAll('.link-icon-type-change').forEach(select => {
            select.onchange = async (e) => {
                const cIdx = parseInt(e.target.dataset.catIdx);
                const lIdx = parseInt(e.target.dataset.linkIdx);
                data[cIdx].links[lIdx].iconType = e.target.value;
                if (e.target.value === 'logodev' && !data[cIdx].links[lIdx].iconTheme) {
                    data[cIdx].links[lIdx].iconTheme = 'dark';
                }
                await browser.storage.sync.set({ bookmarkData: data });
                loadData();
            };
        });

        document.querySelectorAll('.link-icon-value-change').forEach(input => {
            input.onchange = async (e) => {
                const cIdx = parseInt(e.target.dataset.catIdx);
                const lIdx = parseInt(e.target.dataset.linkIdx);
                data[cIdx].links[lIdx].iconValue = e.target.value;
                await browser.storage.sync.set({ bookmarkData: data });
                loadData();
            };
        });

        document.querySelectorAll('.link-icon-theme-change').forEach(select => {
            select.onchange = async (e) => {
                const cIdx = parseInt(e.target.dataset.catIdx);
                const lIdx = parseInt(e.target.dataset.linkIdx);
                data[cIdx].links[lIdx].iconTheme = e.target.value;
                await browser.storage.sync.set({ bookmarkData: data });
                loadData();
            };
        });
    }

    function updateSelect(data) {
        catSelect.innerHTML = '';
        data.forEach((cat, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = cat.name;
            catSelect.appendChild(opt);
        });
    }

    addCatBtn.onclick = async () => {
        const name = document.getElementById('new-cat-name').value;
        const column = parseInt(document.getElementById('new-cat-column').value) || 1;
        if (!name) return;
        const result = await browser.storage.sync.get('bookmarkData');
        let data = result.bookmarkData;
        if (!data || (Array.isArray(data) && data.length === 0)) {
            data = JSON.parse(JSON.stringify(defaultBookmarks));
        }
        data.push({ name: name, column: column, links: [] });
        await browser.storage.sync.set({ bookmarkData: data });
        document.getElementById('new-cat-name').value = '';
        document.getElementById('new-cat-column').value = '1';
        loadData();
    };

    addLinkBtn.onclick = async () => {
        const catIdx = catSelect.value;
        const title = document.getElementById('link-title').value;
        const url = document.getElementById('link-url').value;
        const iconType = document.getElementById('link-icon-type').value;
        const iconValue = document.getElementById('link-icon-value').value;
        const iconTheme = document.getElementById('link-icon-theme').value;
        if (catIdx === "" || !title || !url) return;

        const result = await browser.storage.sync.get('bookmarkData');
        let data = result.bookmarkData;
        if (!data || (Array.isArray(data) && data.length === 0)) {
            data = JSON.parse(JSON.stringify(defaultBookmarks));
        }
        const newLink = { title, url, iconType, iconValue };
        if (iconType === 'logodev') {
            newLink.iconTheme = iconTheme;
        }
        data[catIdx].links.push(newLink);
        await browser.storage.sync.set({ bookmarkData: data });
        
        document.getElementById('link-title').value = '';
        document.getElementById('link-url').value = '';
        document.getElementById('link-icon-value').value = '';
        logoDevThemeContainer.style.display = 'none';
        document.getElementById('link-icon-type').value = 'favicon';
        loadData();
    };

    initSettings();
    loadData();
});