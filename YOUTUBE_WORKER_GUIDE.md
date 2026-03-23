### Guide d'installation du Cloudflare Worker YouTube

Pour faire fonctionner le widget YouTube de manière optimale, vous devez déployer un Cloudflare Worker qui servira de relais pour récupérer les flux RSS de YouTube, les mettre en cache dans KV et les mettre à jour en arrière-plan via des Queues.

#### 1. Prérequis : Créer les ressources Cloudflare
1. **KV Namespace** :
   - Allez dans **Workers & Pages** > **KV**.
   - Cliquez sur **Create namespace**, nommez-le `YOUTUBE_KV`.
2. **Queue** :
   - Allez dans **Workers & Pages** > **Queues**.
   - Cliquez sur **Create queue**, nommez-la `youtube-queue`.
3. **Créer le Worker** :
   - Allez dans **Workers & Pages** > **Create application** > **Create Worker**.
   - Nommez-le (ex: `youtube-feed-worker`) et cliquez sur **Deploy**.

#### 2. Configurer le Worker (Code et Liaisons)
1. **Lier les ressources** :
   - Dans la page de votre Worker, allez dans **Settings** > **Variables** (ou **Bindings**).
   - Sous **KV Namespace Bindings**, ajoutez une liaison : Variable = `YOUTUBE_KV`, Namespace = `YOUTUBE_KV`.
   - Sous **Queue Bindings**, ajoutez une liaison : Variable = `YOUTUBE_QUEUE`, Queue = `youtube-queue`.
   - Cliquez sur **Save and Deploy**.
2. **Ajouter le consommateur de Queue** :
   - Toujours dans votre Worker, allez dans **Settings** > **Triggers**.
   - Sous **Queue Consumers**, cliquez sur **Add Consumer**.
   - Sélectionnez la queue `youtube-queue`.
3. **Ajouter un déclencheur Cron** :
   - Sous **Cron Triggers**, cliquez sur **Add Cron Trigger**.
   - Choisissez un intervalle (ex: `*/30 * * * *` pour toutes les 30 minutes).
4. **Mettre à jour le code** :
   - Cliquez sur **Edit code** et remplacez le contenu de `worker.js` par :

> **Note** : L'utilisation des Queues nécessite un compte Cloudflare avec un plan "Paid" (5$/mois). Si vous n'en avez pas, vous pouvez ignorer la partie Queue et simplement utiliser le cache KV dans la fonction `fetch`.

```javascript
export default {
  // 1. Gérer les requêtes de l'extension
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const channels = url.searchParams.get('channels');
    const handle = url.searchParams.get('handle');
    const id = url.searchParams.get('id');

    // Optionnel : Résoudre un handle (@username) en Channel ID et Nom
    if (handle) {
      const data = await this.resolveHandle(handle);
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Optionnel : Récupérer le nom d'une chaîne via son ID
    if (id) {
      const data = await this.resolveChannelNameById(id);
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (!channels) {
      return new Response(JSON.stringify({ error: "No channels provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const channelList = [...new Set(channels.split(',').map(s => s.trim()).filter(s => s))];
    
    // Mettre à jour la liste globale des chaînes pour le Cron (en arrière-plan)
    ctx.waitUntil(this.updateGlobalChannelList(channelList, env));

    // Récupérer les vidéos depuis KV (en parallèle pour plus de rapidité)
    const videoPromises = channelList.map(async (channelId) => {
      const cached = await env.YOUTUBE_KV.get(`videos_${channelId}`, { type: 'json' });
      if (cached) return cached;

      // Si pas en cache, on récupère immédiatement et on cache
      const videos = await this.fetchAndParseRSS(channelId);
      if (videos.length > 0) {
        await env.YOUTUBE_KV.put(`videos_${channelId}`, JSON.stringify(videos), { expirationTtl: 3600 });
      }
      return videos;
    });

    const results = await Promise.all(videoPromises);
    // Prendre la seule vidéo retournée par chaque flux RSS (filtrée des shorts)
    let latestVideos = results.flat().filter(v => v);

    // Trier par date de publication (plus récent en premier)
    latestVideos.sort((a, b) => new Date(b.published) - new Date(a.published));

    return new Response(JSON.stringify(latestVideos), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  },

  // 2. Déclencheur Cron : Envoyer les chaînes à la Queue pour mise à jour
  async scheduled(event, env, ctx) {
    const channels = await env.YOUTUBE_KV.get('channel_list', { type: 'json' }) || [];
    for (const channelId of channels) {
      if (env.YOUTUBE_QUEUE) await env.YOUTUBE_QUEUE.send({ channelId });
      else await this.fetchAndParseRSS(channelId); // Fallback sans Queue
    }
  },

  // 3. Consommateur de Queue : Mettre à jour les données RSS
  async queue(batch, env) {
    for (const message of batch.messages) {
      const { channelId } = message.body;
      const videos = await this.fetchAndParseRSS(channelId);
      if (videos.length > 0) {
        await env.YOUTUBE_KV.put(`videos_${channelId}`, JSON.stringify(videos), { expirationTtl: 3600 });
      }
    }
  },

  // Utilitaires
  async resolveHandle(handle) {
    try {
      if (!handle.startsWith('@')) handle = '@' + handle;
      const response = await fetch(`https://www.youtube.com/${handle}`);
      if (!response.ok) return { channelId: null, name: handle };
      const html = await response.text();
      // On cherche l'ID et le Nom de la chaîne dans le code source
      const idMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/) || 
                      html.match(/itemprop="identifier" content="(UC[a-zA-Z0-9_-]+)"/);
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
      
      return { 
        channelId: idMatch ? idMatch[1] : null,
        name: titleMatch ? titleMatch[1] : handle
      };
    } catch (e) {
      return { channelId: null, name: handle };
    }
  },

  async resolveChannelNameById(id) {
    try {
      const response = await fetch(`https://www.youtube.com/channel/${id}`);
      if (!response.ok) return { name: null };
      const html = await response.text();
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
      return { name: titleMatch ? titleMatch[1] : null };
    } catch (e) {
      return { name: null };
    }
  },

  async updateGlobalChannelList(channels, env) {
    const existing = await env.YOUTUBE_KV.get('channel_list', { type: 'json' }) || [];
    const newList = Array.from(new Set([...existing, ...channels]));
    if (newList.length !== existing.length) {
      await env.YOUTUBE_KV.put('channel_list', JSON.stringify(newList));
    }
  },

  async isShort(videoId) {
    try {
      // Les YouTube Shorts ne redirigent pas quand on accède à /shorts/ID
      // Les vidéos classiques redirigent vers /watch?v=ID
      const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
        method: 'HEAD',
        redirect: 'manual'
      });
      // Si status 200, c'est un Short. Si 302/301, c'est une vidéo classique.
      return response.status === 200;
    } catch (e) {
      return false;
    }
  },

  async fetchAndParseRSS(channelId) {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const response = await fetch(rssUrl);
      if (!response.ok) return [];
      const xml = await response.text();

      const entries = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
      
      for (const match of entries) {
        const entry = match[1];
        const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
        const title = entry.match(/<title>(.*?)<\/title>/)?.[1];
        const link = entry.match(/<link rel="alternate" href="(.*?)"\/>/)?.[1];
        const author = entry.match(/<name>(.*?)<\/name>/)?.[1];
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1];

        if (videoId && title) {
          // Vérifier si c'est un Short
          if (await this.isShort(videoId)) {
            continue; // Passer au suivant si c'est un Short
          }

          // On retourne la première vidéo trouvée qui n'est pas un Short
          return [{
            id: videoId,
            title: this.decodeHTMLEntities(title),
            link,
            author,
            published,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          }];
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  decodeHTMLEntities(text) {
    const entities = {
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'"
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, m => entities[m]);
  }
};
```

3. Cliquez sur **Save and Deploy**.

#### 3. Configurer l'extension
1. Copiez l'URL de votre worker (ex: `https://youtube-feed-worker.votre-nom.workers.dev`).
2. Allez dans les options d'OmniMark (icône ⚙️).
3. Onglet **Général** > Section **Widget YouTube**.
4. Cochez **Activer le widget YouTube**.
5. Collez l'URL de votre worker.
6. Ajoutez les IDs de vos chaînes préférées (séparés par des virgules).
   - Vous pouvez utiliser l'outil de recherche intégré dans les options pour trouver l'ID à partir du nom d'utilisateur (ex: `@MrBeast`).
   - Sinon : Allez sur la page de la chaîne, faites un clic droit > Code source de la page, et cherchez `channelId` ou `UC...`.
7. Choisissez la position du widget (Haut ou Bas).
8. Les dernières vidéos apparaîtront sur votre page d'accueil !
