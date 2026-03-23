(function() {
    let lastUrl = location.href;
    let isInjecting = false;
    
    // Polyfill simple pour browser/chrome
    const webext = typeof browser !== 'undefined' ? browser : chrome;

    function getChannelInfo() {
        const metaId = document.querySelector('meta[itemprop="identifier"]');
        const metaName = document.querySelector('meta[itemprop="name"]') || document.querySelector('meta[property="og:title"]');
        
        const id = metaId ? metaId.content : null;
        const name = metaName ? metaName.content : null;

        // Alternative si meta est absent (rare sur desktop YT)
        if (!id) {
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical && canonical.href.includes('/channel/')) {
                return {
                    id: canonical.href.split('/channel/')[1],
                    name: name || document.title.replace(' - YouTube', '')
                };
            }
        }

        return { id, name };
    }

    async function isChannelInList(channelId) {
        const result = await webext.storage.sync.get('settings');
        const settings = result.settings || {};
        const channels = settings.youtubeChannels || [];
        
        if (Array.isArray(channels)) {
            return channels.some(c => c.id === channelId);
        } else if (typeof channels === 'string') {
            return channels.split(',').map(s => s.trim()).includes(channelId);
        }
        return false;
    }

    async function addChannelToList(channelId, channelName) {
        const result = await webext.storage.sync.get('settings');
        const settings = result.settings || {};
        let channels = settings.youtubeChannels || [];
        
        // Convertir en tableau si c'est encore une string (vieux format)
        if (typeof channels === 'string') {
            channels = channels.split(',').map(s => s.trim()).filter(s => s).map(id => ({ id, name: id }));
        }

        if (!channels.some(c => c.id === channelId)) {
            channels.push({ id: channelId, name: channelName });
            settings.youtubeChannels = channels;
            await webext.storage.sync.set({ settings });
            return true;
        }
        return false;
    }

    async function injectButton() {
        if (isInjecting) return;

        // Ne rien faire si on n'est pas sur une page de chaîne
        if (!location.href.includes('/channel/') && !location.href.includes('/@')) {
            return;
        }

        // Éviter les doublons si le bouton est déjà là
        if (document.getElementById('omnimark-add-channel')) {
            return;
        }

        // 1. Essayer le nouveau format "Flexible Actions" (vu dans l'issue)
        const flexibleActions = document.querySelector('yt-flexible-actions-view-model');
        let subscribeBtn = null;
        let isFlexible = false;

        if (flexibleActions) {
            // Le bouton d'abonnement a souvent aria-label="S'abonner" ou "Subscribe"
            // On cherche le bouton ou son wrapper d'action
            const sub = flexibleActions.querySelector('button[aria-label*="S\'abonner"]') || 
                        flexibleActions.querySelector('button[aria-label*="Subscribe"]') ||
                        flexibleActions.querySelector('.ytFlexibleActionsViewModelAction');
            
            if (sub) {
                isFlexible = true;
                subscribeBtn = sub.closest('.ytFlexibleActionsViewModelAction') || sub;
            }
        }

        // 2. Si pas trouvé, essayer les anciens formats basés sur l'en-tête
        if (!subscribeBtn) {
            const headerButtons = document.querySelector('#inner-header-container #buttons') || 
                                  document.querySelector('ytd-c4-tabbed-header-renderer #buttons') ||
                                  document.querySelector('ytd-channel-tagline-renderer #buttons');
            
            if (headerButtons) {
                subscribeBtn = headerButtons.querySelector('ytd-subscribe-button-renderer') || 
                               headerButtons.querySelector('#subscribe-button');
            }
        }

        // 3. Fallback sur n'importe quel bouton d'abonnement visible
        if (!subscribeBtn) {
            subscribeBtn = document.querySelector('ytd-subscribe-button-renderer:not([hidden])') || 
                           document.querySelector('#subscribe-button:not([hidden])') ||
                           document.querySelector('button[aria-label*="S\'abonner"]:not([hidden])') ||
                           document.querySelector('button[aria-label*="Subscribe"]:not([hidden])');
        }

        if (!subscribeBtn || !subscribeBtn.parentNode) {
            return;
        }

        const { id, name } = getChannelInfo();
        if (!id || !id.startsWith('UC')) return;

        isInjecting = true;
        try {
            const alreadyAdded = await isChannelInList(id);

            // Re-vérification après l'await pour éviter la condition de course
            if (document.getElementById('omnimark-add-channel')) {
                return;
            }

            const btn = document.createElement('button');
            btn.id = 'omnimark-add-channel';
            btn.className = 'omnimark-add-btn' + (alreadyAdded ? ' added' : '');
            
            const icon = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
            btn.innerHTML = `${icon} <span>${alreadyAdded ? 'Dans OmniMark' : 'Ajouter à OmniMark'}</span>`;

            if (!alreadyAdded) {
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const success = await addChannelToList(id, name);
                    if (success) {
                        btn.classList.add('added');
                        btn.querySelector('span').textContent = 'Dans OmniMark';
                        btn.onclick = null;
                    }
                };
            }

            // On insère systématiquement à la fin du conteneur pour qu'il soit tout à droite
            // Si on est dans le format flexible, on enveloppe dans une div pour garder la structure
            if (isFlexible) {
                const wrapper = document.createElement('div');
                wrapper.className = 'ytFlexibleActionsViewModelAction';
                wrapper.id = 'omnimark-add-channel-wrapper';
                wrapper.appendChild(btn);
                subscribeBtn.parentNode.appendChild(wrapper);
            } else {
                subscribeBtn.parentNode.appendChild(btn);
            }
        } finally {
            isInjecting = false;
        }
    }

    // Observer les changements de navigation (YT est une SPA)
    let debounceTimer;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            // Supprimer l'ancien bouton (et son wrapper si présent) lors d'un changement de page
            const oldBtn = document.getElementById('omnimark-add-channel');
            if (oldBtn) {
                const wrapper = document.getElementById('omnimark-add-channel-wrapper');
                if (wrapper) {
                    wrapper.remove();
                } else {
                    oldBtn.remove();
                }
            }
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(injectButton, 1000);
            return;
        }
        
        // Limiter la fréquence des tentatives d'injection
        if (!isInjecting && (location.href.includes('/channel/') || location.href.includes('/@')) && !document.getElementById('omnimark-add-channel')) {
             clearTimeout(debounceTimer);
             debounceTimer = setTimeout(injectButton, 200);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Premier essai
    setTimeout(injectButton, 1000);
})();
