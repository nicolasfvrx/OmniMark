// Polyfill pour assurer la compatibilité Chrome/Firefox
if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('OmniMark: Options page loaded');
    const dataList = document.getElementById('data-list');
    const catSelect = document.getElementById('link-cat-select');
    const addCatBtn = document.getElementById('add-cat');
    const addLinkBtn = document.getElementById('add-link');
    const linkOpeningMode = document.getElementById('link-opening-mode');
    const searchEnginesList = document.getElementById('search-engines-list');
    const addSearchBtn = document.getElementById('add-search-engine');

    // Gestion des onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const targetTab = btn.dataset.tab;
            
            // Masquer tous les onglets
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            // Activer l'onglet cible (bouton cliqué + bouton correspondant dans la barre d'onglets)
            document.querySelectorAll(`.tab-btn[data-tab="${targetTab}"]`).forEach(b => b.classList.add('active'));
            const targetPane = document.getElementById(targetTab);
            if (targetPane) targetPane.classList.add('active');
            
            // Scroller vers le haut si on a cliqué sur un bouton dans le contenu
            if (!btn.closest('.tabs')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
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

    // Éléments pour les modules de statut
    const enableStatusFiveM = document.getElementById('enable-status-fivem');
    const enableWidgetYoutube = document.getElementById('enable-widget-youtube');
    const youtubeConfig = document.getElementById('youtube-config');
    const youtubeChannelsList = document.getElementById('youtube-channels-list');

    const enableWidgetTwitch = document.getElementById('enable-widget-twitch');
    const twitchConfig = document.getElementById('twitch-config');
    const twitchChannelsList = document.getElementById('twitch-channels-list');
    const addTwitchChannelBtn = document.getElementById('add-twitch-channel-btn');
    const cancelTwitchEditBtn = document.getElementById('cancel-twitch-edit-btn');
    const newTwitchChannelInput = document.getElementById('new-twitch-channel');
    const newTwitchPlatformSelect = document.getElementById('new-twitch-platform');

    // Central Worker Configuration
    const workerUrlInput = document.getElementById('worker-url');
    const workerApiKeyInput = document.getElementById('worker-api-key');
    const testWorkerBtn = document.getElementById('test-worker-btn');
    const workerStatusMsg = document.getElementById('worker-status-msg');
    const workerAdminLink = document.getElementById('worker-admin-link');
    const adminPageUrl = document.getElementById('admin-page-url');
    const copyUnifiedWorkerCodeBtn = document.getElementById('copy-unified-worker-code');
    const syncAllChannelsBtn = document.getElementById('sync-all-channels-btn');
    const syncYoutubeBtn = document.getElementById('sync-youtube-btn');
    const syncTwitchBtn = document.getElementById('sync-twitch-btn');
    const syncStatusMsg = document.getElementById('sync-status-msg');

    let editingTwitchIndex = -1;

    const widgetOrderList = document.getElementById('widget-order-list');
    const linkOpeningModeBookmarks = document.getElementById('link-opening-mode-bookmarks');
    const linkOpeningModeYoutube = document.getElementById('link-opening-mode-youtube');
    const linkOpeningModeStreams = document.getElementById('link-opening-mode-streams');

    const WIDGET_LABELS = {
        'twitch-widget': 'Widget Twitch',
        'youtube-widget': 'Widget YouTube',
        'bookmark-grid': 'Favoris & Catégories'
    };

    async function syncChannelsToWorker(type) {
        const result = await browser.storage.sync.get('settings');
        const settings = result.settings || {};
        
        const workerUrl = settings.workerUrl;
        const apiKey = settings.workerApiKey;

        if (!workerUrl || !apiKey) return false;

        const cleanWorkerUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
        const endpoint = `${cleanWorkerUrl}/config/channels`;

        let data = {};
        if (type === 'twitch' || type === 'all') {
            data.twitch = settings.twitchChannels || [];
        }
        if (type === 'youtube' || type === 'all') {
            data.youtube = settings.youtubeChannels || [];
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (e) {
            console.error(`Erreur synchronisation ${type}:`, e);
            return false;
        }
    }

    async function renderWidgetOrder() {
        if (!widgetOrderList) return;

        const result = await browser.storage.sync.get('settings');
        const settings = result.settings || {};
        
        // Ordre par défaut s'il n'existe pas
        let order = settings.widgetOrder || ['twitch-widget', 'youtube-widget', 'bookmark-grid'];
        
        // S'assurer que tous les widgets sont présents dans l'ordre (au cas où on en ajoute des nouveaux plus tard)
        Object.keys(WIDGET_LABELS).forEach(id => {
            if (!order.includes(id)) order.push(id);
        });

        widgetOrderList.replaceChildren();

        order.forEach((id, index) => {
            const isEnabled = id === 'bookmark-grid' || 
                             (id === 'twitch-widget' && settings.enableWidgetTwitch) || 
                             (id === 'youtube-widget' && settings.enableWidgetYoutube);

            const item = document.createElement('div');
            item.className = `widget-order-item ${isEnabled ? '' : 'disabled'}`;
            
            const name = document.createElement('span');
            name.className = 'widget-name';
            name.textContent = WIDGET_LABELS[id] || id;
            
            const controls = document.createElement('div');
            controls.className = 'widget-controls';
            
            const upBtn = document.createElement('button');
            upBtn.className = 'move-btn';
            upBtn.textContent = '↑';
            upBtn.disabled = index === 0;
            upBtn.onclick = () => moveWidget(index, -1);
            
            const downBtn = document.createElement('button');
            downBtn.className = 'move-btn';
            downBtn.textContent = '↓';
            downBtn.disabled = index === order.length - 1;
            downBtn.onclick = () => moveWidget(index, 1);
            
            controls.appendChild(upBtn);
            controls.appendChild(downBtn);
            
            item.appendChild(name);
            item.appendChild(controls);
            widgetOrderList.appendChild(item);
        });
    }

    async function moveWidget(index, direction) {
        const result = await browser.storage.sync.get('settings');
        const settings = result.settings || {};
        let order = settings.widgetOrder || ['twitch-widget', 'youtube-widget', 'bookmark-grid'];
        
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < order.length) {
            const temp = order[index];
            order[index] = order[newIndex];
            order[newIndex] = temp;
            
            settings.widgetOrder = order;
            await browser.storage.sync.set({ settings });
            renderWidgetOrder();
        }
    }

    async function renderTwitchChannels() {
        if (!twitchChannelsList) return;
        
        const result = await browser.storage.sync.get('settings');
        const settings = result.settings || {};
        let channels = settings.twitchChannels || [];
        
        // Migration de l'ancien format (string) vers le nouveau format (object)
        if (channels.length > 0 && typeof channels[0] === 'string') {
            channels = channels.map(name => ({ name, platform: 'twitch' }));
            settings.twitchChannels = channels;
            await browser.storage.sync.set({ settings });
        }
        
        twitchChannelsList.replaceChildren();

        if (channels.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'youtube-list-empty';
            emptyDiv.textContent = 'Aucun streamer configuré.';
            twitchChannelsList.appendChild(emptyDiv);
            return;
        }

        channels.forEach((channel, index) => {
            const item = document.createElement('div');
            item.className = 'youtube-list-item';
            
            const info = document.createElement('div');
            info.className = 'channel-info';
            info.style.display = 'flex';
            info.style.alignItems = 'center';
            info.style.gap = '8px';
            
            const platformIcon = document.createElement('span');
            platformIcon.style.fontSize = '12px';
            platformIcon.style.padding = '2px 6px';
            platformIcon.style.borderRadius = '4px';
            platformIcon.style.fontWeight = 'bold';
            platformIcon.style.textTransform = 'uppercase';
            
            if (channel.platform === 'kick') {
                platformIcon.textContent = 'Kick';
                platformIcon.style.background = '#53fc18';
                platformIcon.style.color = '#000';
            } else if (channel.platform === 'both') {
                platformIcon.textContent = 'Twitch+Kick';
                platformIcon.style.background = 'linear-gradient(90deg, #9146ff 0%, #53fc18 100%)';
                platformIcon.style.color = '#fff';
            } else {
                platformIcon.textContent = 'Twitch';
                platformIcon.style.background = '#9146ff';
                platformIcon.style.color = '#fff';
            }
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'channel-name';
            nameSpan.textContent = channel.name;
            
            info.appendChild(platformIcon);
            info.appendChild(nameSpan);
            
            const editBtn = document.createElement('button');
            editBtn.className = 'move-btn';
            editBtn.textContent = '✎';
            editBtn.title = 'Modifier ce streamer';
            editBtn.dataset.index = index;
            editBtn.style.margin = '0 0 0 10px';
            editBtn.style.padding = '5px 10px';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.dataset.index = index;
            deleteBtn.style.margin = '0 0 0 5px';
            deleteBtn.style.padding = '5px 10px';
            
            item.appendChild(info);
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(deleteBtn);
            item.appendChild(btnGroup);
            
            editBtn.onclick = () => {
                editingTwitchIndex = index;
                newTwitchChannelInput.value = channel.name;
                newTwitchPlatformSelect.value = channel.platform || 'twitch';
                addTwitchChannelBtn.textContent = 'Mettre à jour';
                if (cancelTwitchEditBtn) cancelTwitchEditBtn.style.display = 'inline-block';
                newTwitchChannelInput.focus();
                
                // Highlight editing item
                document.querySelectorAll('.youtube-list-item').forEach(i => i.style.borderColor = 'rgba(255,255,255,0.1)');
                item.style.borderColor = 'var(--primary-color)';
            };
            
            deleteBtn.onclick = async () => {
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                let currentChannels = s.twitchChannels || [];
                
                currentChannels.splice(index, 1);
                s.twitchChannels = currentChannels;
                await browser.storage.sync.set({ settings: s });
                
                // Synchroniser avec le worker
                await syncChannelsToWorker('twitch');

                // Réinitialiser l'édition si on supprime
                editingTwitchIndex = -1;
                newTwitchChannelInput.value = '';
                addTwitchChannelBtn.textContent = 'Ajouter';
                if (cancelTwitchEditBtn) cancelTwitchEditBtn.style.display = 'none';
                
                renderTwitchChannels();
            };
            
            twitchChannelsList.appendChild(item);
        });
    }

    async function renderYoutubeChannels() {
        if (!youtubeChannelsList) return;
        
        const result = await browser.storage.sync.get('settings');
        const settings = result.settings || {};
        let channels = settings.youtubeChannels || [];
        
        // Migration de l'ancien format (string) vers le nouveau format (array)
        if (typeof channels === 'string') {
            const ids = channels.split(',').map(s => s.trim()).filter(s => s);
            const workerUrl = settings.workerUrl || settings.youtubeWorkerUrl;
            
            // On convertit d'abord avec les IDs comme noms
            channels = ids.map(id => ({ id, name: id }));
            
            // Tentative de récupération des noms réels si le worker est configuré
            if (workerUrl && ids.length > 0) {
                const cleanWorkerUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
                
                // On fait ça en arrière-plan pour ne pas bloquer l'affichage initial
                Promise.all(ids.map(async (id) => {
                    try {
                        const apiKey = settings.workerApiKey;
                        const finalUrl = `${cleanWorkerUrl}/youtube?id=${encodeURIComponent(id)}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;
                        const response = await fetch(finalUrl);
                        const data = await response.json();
                        return { id, name: data.name || id };
                    } catch (e) {
                        return { id, name: id };
                    }
                })).then(async (newChannels) => {
                    const res = await browser.storage.sync.get('settings');
                    const s = res.settings || {};
                    s.youtubeChannels = newChannels;
                    await browser.storage.sync.set({ settings: s });
                    renderYoutubeChannels(); // Re-render avec les vrais noms
                });
            }

            // Sauvegarde immédiate de la structure de base
            settings.youtubeChannels = channels;
            await browser.storage.sync.set({ settings });
        }

        youtubeChannelsList.replaceChildren();

        if (channels.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'youtube-list-empty';
            emptyDiv.textContent = 'Aucune chaîne configurée.';
            youtubeChannelsList.appendChild(emptyDiv);
            return;
        }

        channels.forEach((channel, index) => {
            const item = document.createElement('div');
            item.className = 'youtube-list-item';
            
            const info = document.createElement('div');
            info.className = 'channel-info';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'channel-name';
            nameSpan.textContent = channel.name || 'Chaîne inconnue';
            
            const idSpan = document.createElement('span');
            idSpan.className = 'channel-id';
            idSpan.textContent = channel.id;
            
            info.appendChild(nameSpan);
            info.appendChild(idSpan);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.dataset.index = index;
            deleteBtn.style.margin = '0';
            deleteBtn.style.padding = '5px 10px';
            
            item.appendChild(info);
            item.appendChild(deleteBtn);
            
            deleteBtn.onclick = async () => {
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                let currentChannels = s.youtubeChannels || [];
                
                if (typeof currentChannels === 'string') {
                    currentChannels = currentChannels.split(',').map(s => s.trim()).filter(s => s).map(id => ({ id, name: id }));
                }
                
                currentChannels.splice(index, 1);
                s.youtubeChannels = currentChannels;
                await browser.storage.sync.set({ settings: s });
                
                // Synchroniser avec le worker
                await syncChannelsToWorker('youtube');

                renderYoutubeChannels();
            };
            
            youtubeChannelsList.appendChild(item);
        });
    }

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

        if (settings.enableStatusFiveM) {
            enableStatusFiveM.checked = true;
        }

        if (settings.enableWidgetYoutube) {
            if (enableWidgetYoutube) enableWidgetYoutube.checked = true;
            if (youtubeConfig) youtubeConfig.style.display = 'block';
        }

        await renderYoutubeChannels();


        if (settings.enableWidgetTwitch) {
            if (enableWidgetTwitch) enableWidgetTwitch.checked = true;
            if (twitchConfig) twitchConfig.style.display = 'block';
        }

        await renderTwitchChannels();

        await renderWidgetOrder();


        // Central Worker
        if (settings.workerUrl && workerUrlInput) {
            workerUrlInput.value = settings.workerUrl;
            
            // Afficher le lien admin si l'URL est configurée
            if (workerAdminLink && adminPageUrl) {
                const cleanUrl = settings.workerUrl.endsWith('/') ? settings.workerUrl.slice(0, -1) : settings.workerUrl;
                const key = settings.workerApiKey || '';
                adminPageUrl.href = `${cleanUrl}/admin${key ? '?key=' + encodeURIComponent(key) : ''}`;
                workerAdminLink.style.display = 'block';
            }
        }
        if (settings.workerApiKey && workerApiKeyInput) {
            workerApiKeyInput.value = settings.workerApiKey;
        }

        // Migration de l'ancienne option globale linkOpeningMode vers les nouvelles spécifiques
        if (settings.linkOpeningMode && !settings.linkOpeningModeBookmarks) {
            settings.linkOpeningModeBookmarks = settings.linkOpeningMode;
        }
        if (settings.linkOpeningMode && !settings.linkOpeningModeYoutube) {
            settings.linkOpeningModeYoutube = settings.linkOpeningMode;
        }
        if (settings.linkOpeningMode && !settings.linkOpeningModeStreams) {
            settings.linkOpeningModeStreams = settings.linkOpeningMode;
        }

        if (settings.linkOpeningModeBookmarks && linkOpeningModeBookmarks) {
            linkOpeningModeBookmarks.value = settings.linkOpeningModeBookmarks;
        } else if (linkOpeningModeBookmarks) {
            linkOpeningModeBookmarks.value = 'same';
        }

        if (settings.linkOpeningModeYoutube && linkOpeningModeYoutube) {
            linkOpeningModeYoutube.value = settings.linkOpeningModeYoutube;
        } else if (linkOpeningModeYoutube) {
            linkOpeningModeYoutube.value = 'same';
        }

        if (settings.linkOpeningModeStreams && linkOpeningModeStreams) {
            linkOpeningModeStreams.value = settings.linkOpeningModeStreams;
        } else if (linkOpeningModeStreams) {
            linkOpeningModeStreams.value = 'same';
        }

        if (enableSystemSearch) {
            enableSystemSearch.onchange = async () => {
                const isEnabled = enableSystemSearch.checked;
                if (systemSearchContainer) systemSearchContainer.style.display = isEnabled ? 'block' : 'none';
                
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.enableSystemSearch = isEnabled;
                await browser.storage.sync.set({ settings: s });
            };
        }

        if (logodevToken) {
            logodevToken.onchange = async () => {
                const token = logodevToken.value.trim();
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.logoDevToken = token;
                await browser.storage.sync.set({ settings: s });
            };
        }

        if (enableStatusFiveM) {
            enableStatusFiveM.onchange = async () => {
                const isEnabled = enableStatusFiveM.checked;
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.enableStatusFiveM = isEnabled;
                await browser.storage.sync.set({ settings: s });
            };
        }

        if (linkOpeningModeBookmarks) {
            linkOpeningModeBookmarks.onchange = async () => {
                const mode = linkOpeningModeBookmarks.value;
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.linkOpeningModeBookmarks = mode;
                await browser.storage.sync.set({ settings: s });
            };
        }

        if (linkOpeningModeYoutube) {
            linkOpeningModeYoutube.onchange = async () => {
                const mode = linkOpeningModeYoutube.value;
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.linkOpeningModeYoutube = mode;
                await browser.storage.sync.set({ settings: s });
            };
        }

        if (linkOpeningModeStreams) {
            linkOpeningModeStreams.onchange = async () => {
                const mode = linkOpeningModeStreams.value;
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.linkOpeningModeStreams = mode;
                await browser.storage.sync.set({ settings: s });
            };
        }

        if (enableWidgetYoutube) {
            enableWidgetYoutube.onchange = async () => {
                const isEnabled = enableWidgetYoutube.checked;
                if (youtubeConfig) youtubeConfig.style.display = isEnabled ? 'block' : 'none';
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.enableWidgetYoutube = isEnabled;
                await browser.storage.sync.set({ settings: s });
                renderWidgetOrder();
            };
        }

        const addChannelBtn = document.getElementById('add-channel-btn');
        const getChannelNameBtn = document.getElementById('get-channel-name-btn');
        const newChannelName = document.getElementById('new-channel-name');
        const newChannelId = document.getElementById('new-channel-id');

        if (newChannelId) {
            newChannelId.addEventListener('input', () => {
                const val = newChannelId.value.trim();
                // Extraction de l'ID si c'est une URL
                const match = val.match(/(?:youtube\.com\/(?:channel\/|@))([a-zA-Z0-9_-]+)/);
                if (match) {
                    if (match[1].startsWith('UC')) {
                        newChannelId.value = match[1];
                        // Déclencher aussi la recherche de nom si le champ nom est vide
                        if (!newChannelName.value && getChannelNameBtn) {
                            getChannelNameBtn.click();
                        }
                    }
                }
            });
        }

        if (getChannelNameBtn) {
            getChannelNameBtn.onclick = async () => {
                const id = newChannelId.value.trim();
                const workerUrl = workerUrlInput ? workerUrlInput.value.trim() : '';
                const apiKey = workerApiKeyInput ? workerApiKeyInput.value.trim() : '';

                if (!workerUrl) {
                    alert('Veuillez d\'abord renseigner l\'URL de votre Cloudflare Worker.');
                    return;
                }
                if (!id) {
                    alert('Veuillez entrer l\'ID de la chaîne.');
                    return;
                }
                if (!id.startsWith('UC')) {
                    alert('L\'ID doit commencer par "UC".');
                    return;
                }

                getChannelNameBtn.textContent = '...';
                getChannelNameBtn.disabled = true;

                try {
                    const cleanWorkerUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
                    const finalUrl = `${cleanWorkerUrl}/youtube?id=${encodeURIComponent(id)}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;

                    const response = await fetch(finalUrl);
                    const data = await response.json();

                    if (!response.ok) {
                        alert(data.error || `Erreur ${response.status}`);
                        return;
                    }

                    if (data.name) {
                        newChannelName.value = data.name;
                    } else {
                        alert('Nom non trouvé pour cet ID. Vérifiez l\'ID.');
                    }
                } catch (e) {
                    alert('Erreur lors de la récupération du nom. Vérifiez l\'URL du worker.');
                } finally {
                    getChannelNameBtn.textContent = 'Récupérer le nom';
                    getChannelNameBtn.disabled = false;
                }
            };
        }

        if (addChannelBtn) {
            addChannelBtn.onclick = async () => {
                let name = newChannelName.value.trim();
                const id = newChannelId.value.trim();

                if (!id) {
                    alert('Veuillez renseigner l\'ID de la chaîne (UC...).');
                    return;
                }

                if (!id.startsWith('UC')) {
                    alert('L\'ID de chaîne YouTube doit commencer par "UC".');
                    return;
                }

                // Si le nom est vide, on tente de le récupérer automatiquement
                if (!name) {
                    const workerUrl = workerUrlInput ? workerUrlInput.value.trim() : '';
                    const apiKey = workerApiKeyInput ? workerApiKeyInput.value.trim() : '';

                    if (workerUrl) {
                        addChannelBtn.disabled = true;
                        addChannelBtn.textContent = '...';
                        try {
                            const cleanWorkerUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
                            const finalUrl = `${cleanWorkerUrl}/youtube?id=${encodeURIComponent(id)}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;

                            const response = await fetch(finalUrl);
                            if (response.ok) {
                                const data = await response.json();
                                if (data.name) {
                                    name = data.name;
                                }
                            }
                        } catch (e) {
                            console.error("Erreur récupération nom auto:", e);
                        } finally {
                            addChannelBtn.disabled = false;
                            addChannelBtn.textContent = 'Ajouter';
                        }
                    }
                }

                // Si toujours pas de nom, on utilise l'ID par défaut
                if (!name) name = id;

                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                let channels = s.youtubeChannels || [];
                
                if (typeof channels === 'string') {
                    channels = channels.split(',').map(s => s.trim()).filter(s => s).map(cid => ({ id: cid, name: cid }));
                }

                if (channels.some(c => c.id === id)) {
                    alert('Cette chaîne est déjà dans votre liste.');
                    return;
                }

                channels.push({ id, name });
                s.youtubeChannels = channels;
                await browser.storage.sync.set({ settings: s });
                
                // Synchroniser avec le worker
                await syncChannelsToWorker('youtube');

                newChannelName.value = '';
                newChannelId.value = '';
                renderYoutubeChannels();
            };
        }


        if (enableWidgetTwitch) {
            enableWidgetTwitch.onchange = async () => {
                const isEnabled = enableWidgetTwitch.checked;
                if (twitchConfig) twitchConfig.style.display = isEnabled ? 'block' : 'none';
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.enableWidgetTwitch = isEnabled;
                await browser.storage.sync.set({ settings: s });
                renderWidgetOrder();
            };
        }

        if (addTwitchChannelBtn) {
            addTwitchChannelBtn.onclick = async () => {
                const name = newTwitchChannelInput.value.trim().toLowerCase();
                const platform = newTwitchPlatformSelect ? newTwitchPlatformSelect.value : 'twitch';
                if (!name) return;

                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                let channels = s.twitchChannels || [];
                
                // Migration si nécessaire au moment de l'ajout
                if (channels.length > 0 && typeof channels[0] === 'string') {
                    channels = channels.map(n => ({ name: n, platform: 'twitch' }));
                }

                if (editingTwitchIndex > -1) {
                    // Mode modification
                    channels[editingTwitchIndex] = { name, platform };
                    editingTwitchIndex = -1;
                    addTwitchChannelBtn.textContent = 'Ajouter';
                    if (cancelTwitchEditBtn) cancelTwitchEditBtn.style.display = 'none';
                } else {
                    // Mode ajout
                    if (channels.some(c => c.name === name && c.platform === platform)) {
                        alert('Ce streamer avec cette plateforme est déjà dans votre liste.');
                        return;
                    }
                    channels.push({ name, platform });
                }

                s.twitchChannels = channels;
                await browser.storage.sync.set({ settings: s });
                
                // Synchroniser avec le worker
                await syncChannelsToWorker('twitch');

                newTwitchChannelInput.value = '';
                renderTwitchChannels();
            };
        }

        if (cancelTwitchEditBtn) {
            cancelTwitchEditBtn.onclick = () => {
                editingTwitchIndex = -1;
                newTwitchChannelInput.value = '';
                addTwitchChannelBtn.textContent = 'Ajouter';
                cancelTwitchEditBtn.style.display = 'none';
            };
        }


        const clearWatchedBtn = document.getElementById('clear-watched-videos');
        if (clearWatchedBtn) {
            clearWatchedBtn.onclick = async () => {
                const res = await browser.storage.local.get('watchedVideos');
                if (!res.watchedVideos || res.watchedVideos.length === 0) {
                    alert('L\'historique est déjà vide.');
                    return;
                }
                if (confirm('Voulez-vous vraiment réinitialiser la liste des vidéos vues ? Elles réapparaîtront toutes sur la page d\'accueil.')) {
                    await browser.storage.local.remove('watchedVideos');
                    alert('Historique YouTube réinitialisé.');
                }
            };
        }

        // Central Worker Logic
        if (workerUrlInput) {
            workerUrlInput.onchange = async () => {
                const url = workerUrlInput.value.trim();
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.workerUrl = url;
                await browser.storage.sync.set({ settings: s });
            };
        }

        if (workerApiKeyInput) {
            workerApiKeyInput.onchange = async () => {
                const key = workerApiKeyInput.value.trim();
                const res = await browser.storage.sync.get('settings');
                const s = res.settings || {};
                s.workerApiKey = key;
                await browser.storage.sync.set({ settings: s });
            };
        }

        if (testWorkerBtn) {
            console.log('OmniMark: Test button found and listener attached');
            testWorkerBtn.onclick = async () => {
                console.log('OmniMark: Test button clicked');
                const url = workerUrlInput ? workerUrlInput.value.trim() : '';
                const key = workerApiKeyInput ? workerApiKeyInput.value.trim() : '';

                if (!url) {
                    if (workerStatusMsg) {
                        workerStatusMsg.textContent = '❌ Veuillez entrer une URL';
                        workerStatusMsg.style.color = '#f44336';
                    }
                    return;
                }

                if (workerStatusMsg) {
                    workerStatusMsg.textContent = '⏳ Test en cours...';
                    workerStatusMsg.style.color = 'var(--secondary-color)';
                }

                try {
                    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
                    const testUrl = `${cleanUrl}/test${key ? `?key=${encodeURIComponent(key)}` : ''}`;
                    console.log('OmniMark: Fetching', testUrl);
                    
                    const response = await fetch(testUrl);
                    console.log('OmniMark: Response status', response.status);
                    
                    if (response.ok) {
                        if (workerStatusMsg) {
                            workerStatusMsg.textContent = '✅ Connexion réussie !';
                            workerStatusMsg.style.color = '#53fc18';
                        }
                        
                        // Synchroniser les chaînes
                        await syncChannelsToWorker('all');

                        if (workerAdminLink && adminPageUrl) {
                            const adminUrl = `${cleanUrl}/admin${key ? '?key=' + encodeURIComponent(key) : ''}`;
                            adminPageUrl.href = adminUrl;
                            workerAdminLink.style.display = 'block';
                        }
                    } else if (response.status === 401) {
                        if (workerStatusMsg) {
                            workerStatusMsg.textContent = '❌ Erreur 401 : Clé API invalide';
                            workerStatusMsg.style.color = '#ff9800';
                        }
                        if (workerAdminLink) workerAdminLink.style.display = 'none';
                    } else {
                        if (workerStatusMsg) {
                            workerStatusMsg.textContent = `❌ Erreur ${response.status}`;
                            workerStatusMsg.style.color = '#f44336';
                        }
                        if (workerAdminLink) workerAdminLink.style.display = 'none';
                    }
                } catch (e) {
                    console.error('OmniMark: Test connection error', e);
                    if (workerStatusMsg) {
                        workerStatusMsg.textContent = '❌ Impossible de contacter le worker (CORS ou URL invalide)';
                        workerStatusMsg.style.color = '#f44336';
                    }
                    if (workerAdminLink) workerAdminLink.style.display = 'none';
                }
            };
        }

        if (copyUnifiedWorkerCodeBtn) {
            copyUnifiedWorkerCodeBtn.onclick = () => {
                const codeElement = document.getElementById('unified-worker-code-display');
                if (!codeElement) return;
                const code = codeElement.innerText;
                navigator.clipboard.writeText(code).then(() => {
                    const originalText = copyUnifiedWorkerCodeBtn.innerText;
                    copyUnifiedWorkerCodeBtn.innerText = 'Copié !';
                    const originalBg = copyUnifiedWorkerCodeBtn.style.background;
                    copyUnifiedWorkerCodeBtn.style.background = '#4caf50';
                    setTimeout(() => {
                        copyUnifiedWorkerCodeBtn.innerText = originalText;
                        copyUnifiedWorkerCodeBtn.style.background = originalBg;
                    }, 2000);
                });
            };
        }

        if (syncAllChannelsBtn) {
            syncAllChannelsBtn.onclick = async () => {
                syncAllChannelsBtn.disabled = true;
                const originalText = syncAllChannelsBtn.innerText;
                syncAllChannelsBtn.innerText = 'Synchronisation...';
                
                if (syncStatusMsg) {
                    syncStatusMsg.textContent = '⏳ Envoi des listes au worker...';
                    syncStatusMsg.style.color = 'var(--secondary-color)';
                }

                const success = await syncChannelsToWorker('all');

                if (success) {
                    if (syncStatusMsg) {
                        syncStatusMsg.textContent = '✅ Listes synchronisées avec succès !';
                        syncStatusMsg.style.color = '#53fc18';
                    }
                } else {
                    if (syncStatusMsg) {
                        syncStatusMsg.textContent = '❌ Échec de la synchronisation (Vérifiez l\'URL et la clé API)';
                        syncStatusMsg.style.color = '#f44336';
                    }
                }

                syncAllChannelsBtn.disabled = false;
                syncAllChannelsBtn.innerText = originalText;
                
                setTimeout(() => {
                    if (syncStatusMsg) syncStatusMsg.textContent = '';
                }, 5000);
            };
        }

        const handleTabSync = async (btn, type) => {
            if (!btn) return;
            const originalText = btn.innerText;
            const originalBg = btn.style.background;
            btn.disabled = true;
            btn.innerText = 'Sync...';
            
            const success = await syncChannelsToWorker(type);
            
            if (success) {
                btn.innerText = 'C\'est fait !';
                btn.style.background = '#4caf50';
                btn.style.color = 'white';
            } else {
                btn.innerText = 'Échec';
                btn.style.background = '#f44336';
                btn.style.color = 'white';
            }
            
            setTimeout(() => {
                btn.disabled = false;
                btn.innerText = originalText;
                btn.style.background = originalBg;
                btn.style.color = '';
            }, 3000);
        };

        if (syncYoutubeBtn) {
            syncYoutubeBtn.onclick = () => handleTabSync(syncYoutubeBtn, 'youtube');
        }

        if (syncTwitchBtn) {
            syncTwitchBtn.onclick = () => handleTabSync(syncTwitchBtn, 'twitch');
        }

        const findYoutubeIdBtn = document.getElementById('find-youtube-id');
        const handleInput = document.getElementById('youtube-handle-input');
        const handleResult = document.getElementById('handle-result');

        if (findYoutubeIdBtn) {
            findYoutubeIdBtn.onclick = async () => {
                const workerUrl = workerUrlInput ? workerUrlInput.value.trim() : '';
                const apiKey = workerApiKeyInput ? workerApiKeyInput.value.trim() : '';
                const handle = handleInput.value.trim();

                if (!workerUrl) {
                    alert('Veuillez d\'abord renseigner l\'URL de votre Cloudflare Worker.');
                    return;
                }
                if (!handle) {
                    alert('Veuillez entrer un nom d\'utilisateur (ex: @MrBeast).');
                    return;
                }

                handleResult.textContent = 'Recherche en cours...';
                handleResult.style.color = 'var(--secondary-color)';

                try {
                    const cleanWorkerUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
                    const finalUrl = `${cleanWorkerUrl}/youtube?handle=${encodeURIComponent(handle)}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;

                    const response = await fetch(finalUrl);
                    const data = await response.json();

                    if (!response.ok) {
                        handleResult.textContent = data.error || `Erreur ${response.status}`;
                        handleResult.style.color = '#e74c3c';
                        return;
                    }

                    if (data.channelId) {
                        const channelName = data.name || handle;
                        handleResult.textContent = `Trouvé : ${channelName} (${data.channelId})`;
                        handleResult.style.color = 'var(--primary-color)';
                        
                        const addBtn = document.createElement('button');
                        addBtn.className = 'add-id-btn';
                        addBtn.textContent = 'Ajouter';
                        addBtn.style.cssText = 'padding: 2px 6px; font-size: 10px; margin-left: 5px; width: auto; display: inline-block;';
                        handleResult.appendChild(addBtn);
                        
                        addBtn.onclick = async () => {
                            const res = await browser.storage.sync.get('settings');
                            const s = res.settings || {};
                            let current = s.youtubeChannels || [];
                            
                            if (typeof current === 'string') {
                                current = current.split(',').map(s => s.trim()).filter(s => s).map(id => ({ id, name: id }));
                            }

                            if (current.some(c => c.id === data.channelId)) {
                                alert('Cette chaîne est déjà dans votre liste.');
                                return;
                            }
                            
                            current.push({ id: data.channelId, name: channelName });
                            s.youtubeChannels = current;
                            await browser.storage.sync.set({ settings: s });
                            
                            // Synchroniser avec le worker
                            await syncChannelsToWorker('youtube');
                            
                            renderYoutubeChannels();
                            handleResult.textContent = 'Chaîne ajoutée !';
                            handleResult.style.color = '#27ae60';
                            handleInput.value = '';
                        };
                    } else {
                        handleResult.textContent = 'ID non trouvé. Vérifiez le nom d\'utilisateur.';
                        handleResult.style.color = '#e74c3c';
                    }
                } catch (e) {
                    handleResult.textContent = 'Erreur lors de la recherche. Vérifiez l\'URL du worker.';
                    handleResult.style.color = '#e74c3c';
                }
            };
        }

        systemSearchInput.oninput = async () => {
            const query = systemSearchInput.value.trim();
            if (query.length < 2) {
                systemSearchResults.textContent = '';
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
                
                systemSearchResults.textContent = '';
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
        searchEnginesList.textContent = '';
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
        dataList.textContent = '';
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

                const openingDiv = document.createElement('div');
                openingDiv.style.display = 'flex';
                openingDiv.style.alignItems = 'center';
                openingDiv.style.gap = '10px';
                openingDiv.style.width = '100%';
                openingDiv.style.fontSize = '12px';
                openingDiv.style.marginTop = '2px';

                const openingLabel = document.createElement('span');
                openingLabel.textContent = 'Ouverture :';
                openingLabel.style.color = 'var(--secondary-color)';

                const openingSelect = document.createElement('select');
                openingSelect.className = 'link-opening-mode-change';
                openingSelect.dataset.catIdx = catIdx;
                openingSelect.dataset.linkIdx = linkIdx;
                openingSelect.style.width = 'auto';
                openingSelect.style.padding = '4px';

                [{val: 'same', label: 'Même page'}, {val: 'new', label: 'Nouvelle page'}].forEach(o => {
                    const opt = document.createElement('option');
                    opt.value = o.val;
                    opt.textContent = o.label;
                    if ((link.openingMode || 'same') === o.val) opt.selected = true;
                    openingSelect.appendChild(opt);
                });

                openingDiv.appendChild(openingLabel);
                openingDiv.appendChild(openingSelect);
                iconConfig.appendChild(openingDiv);

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

        document.querySelectorAll('.link-opening-mode-change').forEach(select => {
            select.onchange = async (e) => {
                const cIdx = parseInt(e.target.dataset.catIdx);
                const lIdx = parseInt(e.target.dataset.linkIdx);
                data[cIdx].links[lIdx].openingMode = e.target.value;
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
        catSelect.textContent = '';
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
        const openingMode = linkOpeningMode.value;
        if (catIdx === "" || !title || !url) return;

        const result = await browser.storage.sync.get('bookmarkData');
        let data = result.bookmarkData;
        if (!data || (Array.isArray(data) && data.length === 0)) {
            data = JSON.parse(JSON.stringify(defaultBookmarks));
        }
        const newLink = { title, url, iconType, iconValue, openingMode };
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

    // Gestion de l'Export / Import
    const exportBookmarksBtn = document.getElementById('export-bookmarks-btn');
    const importBookmarksBtn = document.getElementById('import-bookmarks-btn');
    const exportServiceBtn = document.getElementById('export-service-btn');
    const importServiceBtn = document.getElementById('import-service-btn');
    const exportYoutubeBtn = document.getElementById('export-youtube-btn');
    const importYoutubeBtn = document.getElementById('import-youtube-btn');
    const exportTwitchBtn = document.getElementById('export-twitch-btn');
    const importTwitchBtn = document.getElementById('import-twitch-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const importStatus = document.getElementById('import-status');
    let importType = 'all';

    function downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    if (exportBookmarksBtn) {
        exportBookmarksBtn.onclick = async () => {
            try {
                const data = await browser.storage.sync.get(['bookmarkData', 'searchEngines', 'settings']);
                const filteredSettings = {};
                if (data.settings) {
                    ['enableSystemSearch', 'logoDevToken', 'enableStatusFiveM'].forEach(key => {
                        if (data.settings[key] !== undefined) filteredSettings[key] = data.settings[key];
                    });
                }
                const exportData = {
                    bookmarkData: data.bookmarkData,
                    searchEngines: data.searchEngines,
                    settings: filteredSettings,
                    type: 'bookmarks',
                    version: 1,
                    date: new Date().toISOString()
                };
                downloadJSON(exportData, `omnimark_bookmarks_${new Date().toISOString().split('T')[0]}.json`);
            } catch (err) {
                console.error('Export error:', err);
                alert('Erreur lors de l\'exportation : ' + err.message);
            }
        };
    }

    if (importBookmarksBtn) {
        importBookmarksBtn.onclick = () => {
            importType = 'bookmarks';
            importFile.click();
        };
    }

    if (exportServiceBtn) {
        exportServiceBtn.onclick = async () => {
            try {
                const syncData = await browser.storage.sync.get('settings');
                const serviceSettings = {};
                if (syncData.settings) {
                    ['workerUrl', 'workerApiKey'].forEach(key => {
                        if (syncData.settings[key] !== undefined) serviceSettings[key] = syncData.settings[key];
                    });
                }
                const exportData = {
                    settings: serviceSettings,
                    type: 'service',
                    version: 1,
                    date: new Date().toISOString()
                };
                downloadJSON(exportData, `omnimark_service_${new Date().toISOString().split('T')[0]}.json`);
            } catch (err) {
                console.error('Export error:', err);
                alert('Erreur lors de l\'exportation : ' + err.message);
            }
        };
    }

    if (importServiceBtn) {
        importServiceBtn.onclick = () => {
            importType = 'service';
            importFile.click();
        };
    }

    if (exportYoutubeBtn) {
        exportYoutubeBtn.onclick = async () => {
            try {
                const syncData = await browser.storage.sync.get('settings');
                const localData = await browser.storage.local.get('watchedVideos');
                const youtubeSettings = {};
                if (syncData.settings) {
                    ['enableWidgetYoutube', 'youtubeWorkerUrl', 'youtubeChannels', 'widgetOrder'].forEach(key => {
                        if (syncData.settings[key] !== undefined) youtubeSettings[key] = syncData.settings[key];
                    });
                }
                const exportData = {
                    settings: youtubeSettings,
                    local: localData,
                    type: 'youtube',
                    version: 1,
                    date: new Date().toISOString()
                };
                downloadJSON(exportData, `omnimark_youtube_${new Date().toISOString().split('T')[0]}.json`);
            } catch (err) {
                console.error('Export error:', err);
                alert('Erreur lors de l\'exportation : ' + err.message);
            }
        };
    }

    if (importYoutubeBtn) {
        importYoutubeBtn.onclick = () => {
            importType = 'youtube';
            importFile.click();
        };
    }

    if (exportTwitchBtn) {
        exportTwitchBtn.onclick = async () => {
            try {
                const syncData = await browser.storage.sync.get('settings');
                const twitchSettings = {};
                if (syncData.settings) {
                    ['enableWidgetTwitch', 'twitchWorkerUrl', 'twitchChannels', 'widgetOrder'].forEach(key => {
                        if (syncData.settings[key] !== undefined) twitchSettings[key] = syncData.settings[key];
                    });
                }
                const exportData = {
                    settings: twitchSettings,
                    type: 'twitch',
                    version: 1,
                    date: new Date().toISOString()
                };
                downloadJSON(exportData, `omnimark_twitch_${new Date().toISOString().split('T')[0]}.json`);
            } catch (err) {
                console.error('Export error:', err);
                alert('Erreur lors de l\'exportation : ' + err.message);
            }
        };
    }

    if (importTwitchBtn) {
        importTwitchBtn.onclick = () => {
            importType = 'twitch';
            importFile.click();
        };
    }

    if (exportBtn) {
        exportBtn.onclick = async () => {
            try {
                const syncData = await browser.storage.sync.get();
                const localData = await browser.storage.local.get('watchedVideos');
                const fullBackup = {
                    sync: syncData,
                    local: localData,
                    type: 'all',
                    version: 1,
                    date: new Date().toISOString()
                };
                downloadJSON(fullBackup, `omnimark_full_backup_${new Date().toISOString().split('T')[0]}.json`);
            } catch (err) {
                console.error('Export error:', err);
                alert('Erreur lors de l\'exportation : ' + err.message);
            }
        };
    }

    if (importBtn) {
        importBtn.onclick = () => {
            importType = 'all';
            importFile.click();
        };
    }

    if (importFile) {
        importFile.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    
                    let confirmMsg = "Êtes-vous sûr de vouloir importer ces données ?";
                    if (importType === 'bookmarks') confirmMsg = "Importer uniquement les favoris ? Cela remplacera vos catégories et tuiles actuelles.";
                    if (importType === 'service') confirmMsg = "Importer uniquement la configuration du Service ? Cela remplacera l'URL de votre worker et votre clé API.";
                    if (importType === 'youtube') confirmMsg = "Importer uniquement la configuration YouTube ? Cela remplacera votre liste de chaînes et l'historique.";
                    if (importType === 'twitch') confirmMsg = "Importer uniquement la configuration Streams (Twitch & Kick) ? Cela remplacera votre liste de streamers.";

                    if (confirm(confirmMsg)) {
                        if (importType === 'all') {
                            if (!backup.sync && !backup.bookmarkData && !backup.settings && !backup.searchEngines) {
                                throw new Error("Format de fichier invalide pour une sauvegarde complète.");
                            }
                            if (backup.sync) {
                                await browser.storage.sync.clear();
                                await browser.storage.sync.set(backup.sync);
                                if (backup.local) await browser.storage.local.set(backup.local);
                            } else {
                                await browser.storage.sync.clear();
                                await browser.storage.sync.set(backup);
                            }
                        } else if (importType === 'bookmarks') {
                            const dataToImport = backup.sync || backup;
                            if (dataToImport.bookmarkData) {
                                await browser.storage.sync.set({ bookmarkData: dataToImport.bookmarkData });
                            }
                            if (dataToImport.searchEngines) {
                                await browser.storage.sync.set({ searchEngines: dataToImport.searchEngines });
                            }
                            if (dataToImport.settings) {
                                const res = await browser.storage.sync.get('settings');
                                const currentSettings = res.settings || {};
                                // On ne merge que les clés liées aux favoris/système
                                ['enableSystemSearch', 'logoDevToken', 'enableStatusFiveM'].forEach(key => {
                                    if (dataToImport.settings[key] !== undefined) currentSettings[key] = dataToImport.settings[key];
                                });
                                await browser.storage.sync.set({ settings: currentSettings });
                            }
                        } else if (importType === 'service') {
                            const dataToImport = backup.sync || (backup.settings ? backup : { settings: backup });
                            if (dataToImport.settings) {
                                const res = await browser.storage.sync.get('settings');
                                const currentSettings = res.settings || {};
                                ['workerUrl', 'workerApiKey'].forEach(key => {
                                    if (dataToImport.settings[key] !== undefined) currentSettings[key] = dataToImport.settings[key];
                                });
                                await browser.storage.sync.set({ settings: currentSettings });
                            }
                        } else if (importType === 'youtube') {
                            const dataToImport = backup.sync || backup;
                            if (dataToImport.settings) {
                                const res = await browser.storage.sync.get('settings');
                                const currentSettings = res.settings || {};
                                // On ne merge que les clés liées à YouTube et l'ordre des widgets
                                ['enableWidgetYoutube', 'youtubeWorkerUrl', 'youtubeChannels', 'widgetOrder'].forEach(key => {
                                    if (dataToImport.settings[key] !== undefined) currentSettings[key] = dataToImport.settings[key];
                                });
                                await browser.storage.sync.set({ settings: currentSettings });
                            }
                            const localData = backup.local || (backup.watchedVideos ? backup : null);
                            if (localData && localData.watchedVideos) {
                                await browser.storage.local.set({ watchedVideos: localData.watchedVideos });
                            }
                        } else if (importType === 'twitch') {
                            const dataToImport = backup.sync || backup;
                            if (dataToImport.settings) {
                                const res = await browser.storage.sync.get('settings');
                                const currentSettings = res.settings || {};
                                // On ne merge que les clés liées à Twitch et l'ordre des widgets
                                ['enableWidgetTwitch', 'twitchWorkerUrl', 'twitchChannels', 'widgetOrder'].forEach(key => {
                                    if (dataToImport.settings[key] !== undefined) currentSettings[key] = dataToImport.settings[key];
                                });
                                await browser.storage.sync.set({ settings: currentSettings });
                            }
                        }

                        // Synchroniser avec le worker
                        await syncChannelsToWorker('all');

                        importStatus.textContent = "✅ Importation réussie ! Rechargement...";
                        importStatus.style.color = "#4caf50";
                        setTimeout(() => window.location.reload(), 1500);
                    }
                } catch (err) {
                    importStatus.textContent = "❌ Erreur : " + err.message;
                    importStatus.style.color = "#ff4444";
                }
                importFile.value = '';
            };
            reader.readAsText(file);
        };
    }

    initSettings();
    loadData();
});