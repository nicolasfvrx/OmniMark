(function initBrowserApi(globalScope) {
    if (globalScope.browser) {
        return;
    }

    const chromeApi = globalScope.chrome;
    if (!chromeApi) {
        throw new Error('No compatible extension API found.');
    }

    function promisify(method, context) {
        return (...args) => new Promise((resolve, reject) => {
            try {
                method.call(context, ...args, (result) => {
                    const runtimeError = chromeApi.runtime && chromeApi.runtime.lastError;
                    if (runtimeError) {
                        reject(new Error(runtimeError.message));
                        return;
                    }
                    resolve(result);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    const browserApi = {
        storage: {
            sync: {
                get: promisify(chromeApi.storage.sync.get, chromeApi.storage.sync),
                set: promisify(chromeApi.storage.sync.set, chromeApi.storage.sync),
                clear: promisify(chromeApi.storage.sync.clear, chromeApi.storage.sync),
                remove: promisify(chromeApi.storage.sync.remove, chromeApi.storage.sync)
            },
            local: {
                get: promisify(chromeApi.storage.local.get, chromeApi.storage.local),
                set: promisify(chromeApi.storage.local.set, chromeApi.storage.local),
                clear: promisify(chromeApi.storage.local.clear, chromeApi.storage.local),
                remove: promisify(chromeApi.storage.local.remove, chromeApi.storage.local)
            }
        }
    };

    if (chromeApi.bookmarks && chromeApi.bookmarks.search) {
        browserApi.bookmarks = {
            search: promisify(chromeApi.bookmarks.search, chromeApi.bookmarks)
        };
    }

    globalScope.browser = browserApi;
})(globalThis);
