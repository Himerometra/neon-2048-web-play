(() => {
  if (window.WXWASMSDK) return;

  // This WebGL build routes PlayerPrefs through the WeChat storage bridge.
  const prefix = "neon-2048-web-play:";
  const session = new Map();
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    // Storage can be blocked in embedded browsers. Keep the game playable.
  }

  function read(key) {
    if (session.has(key)) return session.get(key);
    try {
      return storage?.getItem(prefix + key) ?? null;
    } catch {
      return null;
    }
  }

  function write(key, value) {
    if (storage) {
      try {
        if (value === null) storage.removeItem(prefix + key);
        else storage.setItem(prefix + key, value);
        session.delete(key);
        return;
      } catch {
        // A blocked write or full quota still allows saves for this session.
      }
    }
    session.set(key, value);
  }

  function readNumber(key, fallback) {
    const value = read(key);
    return value === null ? fallback : Number(value);
  }

  window.WXWASMSDK = {
    // The WebGL loader hides the browser's loading bar when startup finishes.
    WXHideLoadingPage() {},
    WXStorageGetIntSync: (key, fallback) => readNumber(key, fallback),
    WXStorageGetFloatSync: (key, fallback) => readNumber(key, fallback),
    WXStorageGetStringSync: (key, fallback) => read(key) ?? fallback,
    WXStorageSetIntSync: (key, value) => write(key, String(value)),
    WXStorageSetFloatSync: (key, value) => write(key, String(value)),
    WXStorageSetStringSync: (key, value) => write(key, value),
    WXStorageHasKeySync: (key) => read(key) !== null,
    WXStorageDeleteKeySync: (key) => write(key, null),
    WXStorageDeleteAllSync() {
      session.clear();
      if (!storage) return;
      try {
        for (let index = storage.length - 1; index >= 0; index--) {
          const key = storage.key(index);
          if (key?.startsWith(prefix)) write(key.slice(prefix.length), null);
        }
      } catch {
        storage = undefined;
      }
    },
  };
})();
