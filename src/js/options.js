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
    const linkTitleInput = document.getElementById('link-title');
    const linkUrlInput = document.getElementById('link-url');

    async function initSystemSearch() {
        const result = await browser.storage.sync.get('settings');
        const settings = result.settings || {};
        
        if (settings.enableSystemSearch) {
            enableSystemSearch.checked = true;
            systemSearchContainer.style.display = 'block';
        }

        enableSystemSearch.onchange = async () => {
            const isEnabled = enableSystemSearch.checked;
            systemSearchContainer.style.display = isEnabled ? 'block' : 'none';
            
            const res = await browser.storage.sync.get('settings');
            const s = res.settings || {};
            s.enableSystemSearch = isEnabled;
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
                        div.innerHTML = `<strong>${b.title || '(Sans nom)'}</strong><small>${b.url}</small>`;
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
    }

    const defaultEngines = {
        'g:': { name: 'Google', url: 'https://www.google.com/search?q=', icon: '🔍' },
        'gh:': { name: 'GitHub', url: 'https://github.com/search?q=', icon: '🐙' },
        'yt:': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', icon: '📺' },
        'w:': { name: 'Wikipedia', url: 'https://fr.wikipedia.org/wiki/Special:Search?search=', icon: '📖' },
        'd:': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: '🦆' }
    };

    // Charger les données
    async function loadData() {
        const result = await browser.storage.sync.get(['bookmarkData', 'searchEngines']);
        const data = result.bookmarkData || [];
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
            div.innerHTML = `
                <div class="engine-info">
                    <strong>${prefix}</strong>
                    <span>${engine.icon} ${engine.name}</span>
                    <br><small>${engine.url}</small>
                </div>
                <button class="delete-btn" data-prefix="${prefix}">Supprimer</button>
            `;
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
            catDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${cat.name} (Colonne: <input type="number" class="col-change" data-cat-idx="${catIdx}" value="${cat.column || 1}" style="width: 50px; display: inline; margin: 0 5px;">)</strong>
                    <div class="btn-group">
                        <button class="move-btn" data-move="up" data-cat-idx="${catIdx}">↑</button>
                        <button class="move-btn" data-move="down" data-cat-idx="${catIdx}">↓</button>
                        <button class="delete-btn" data-cat-idx="${catIdx}">Supprimer la catégorie</button>
                    </div>
                </div>
            `;

            cat.links.forEach((link, linkIdx) => {
                const linkDiv = document.createElement('div');
                linkDiv.className = 'link-item';
                linkDiv.style.flexDirection = 'column';
                linkDiv.style.alignItems = 'flex-start';
                linkDiv.innerHTML = `
                    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                        <span>${link.title} - <small>${link.url}</small></span>
                        <div class="btn-group">
                            <button class="move-btn" data-move="up" data-cat-idx="${catIdx}" data-link-idx="${linkIdx}">↑</button>
                            <button class="move-btn" data-move="down" data-cat-idx="${catIdx}" data-link-idx="${linkIdx}">↓</button>
                            <button class="delete-btn" data-cat-idx="${catIdx}" data-link-idx="${linkIdx}">X</button>
                        </div>
                    </div>
                    <div class="icon-config">
                        <select class="link-icon-type-change" data-cat-idx="${catIdx}" data-link-idx="${linkIdx}">
                            <option value="favicon" ${link.iconType === 'favicon' ? 'selected' : ''}>Favicon</option>
                            <option value="emoji" ${link.iconType === 'emoji' ? 'selected' : ''}>Emoji</option>
                            <option value="custom" ${link.iconType === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                        <input type="text" class="link-icon-value-change" data-cat-idx="${catIdx}" data-link-idx="${linkIdx}" value="${link.iconValue || ''}" placeholder="Emoji ou URL">
                    </div>
                `;
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
        const data = result.bookmarkData || [];
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
        if (catIdx === "" || !title || !url) return;

        const result = await browser.storage.sync.get('bookmarkData');
        const data = result.bookmarkData || [];
        data[catIdx].links.push({ title, url, iconType, iconValue });
        await browser.storage.sync.set({ bookmarkData: data });
        
        document.getElementById('link-title').value = '';
        document.getElementById('link-url').value = '';
        document.getElementById('link-icon-value').value = '';
        loadData();
    };

    initSystemSearch();
    loadData();
});