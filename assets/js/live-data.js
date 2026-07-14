(function () {
  const REFRESH_MS = 15000;
  const RSVP_CACHE_KEY = 'sq_rsvp_total_persons_v1';
  const BRING_CACHE_KEY = 'sq_bring_entries_v1';
  const BRING_UNAVAILABLE_MESSAGE = 'Die Mitbringen-Liste konnte gerade nicht geladen werden. Falls sie partout auf keinem deiner Geräte erscheinen möchte, kontaktiere bitte den Quizmaster. Er kann dir den aktuellen Stand der Mitbringsel mitteilen.';
  let rsvpRequestInFlight = false;
  let bringRequestInFlight = false;

  function getEndpoint() {
    return window.FormConfig?.endpoint || '';
  }

  function endpointReady() {
    const endpoint = getEndpoint();
    return endpoint && !endpoint.includes('PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE');
  }

  function buildUrl(action, extra = {}) {
    const endpoint = getEndpoint();
    const url = new URL(endpoint);
    url.searchParams.set('action', action);
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
    return url;
  }

  function jsonp(action, extra = {}) {
    return new Promise((resolve, reject) => {
      if (!endpointReady()) {
        reject(new Error('missing-endpoint'));
        return;
      }

      const callbackName = `sqJsonp_${action}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const url = buildUrl(action, { ...extra, callback: callbackName });
      const script = document.createElement('script');
      let settled = false;

      function cleanup() {
        delete window[callbackName];
        script.remove();
        clearTimeout(timeoutId);
      }

      window[callbackName] = (payload) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(payload);
      };

      script.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('script-load-failed'));
      };

      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('timeout'));
      }, 12000);

      script.src = url.toString();
      document.body.appendChild(script);
    });
  }

  function fetchJson(action, extra = {}) {
    if (!endpointReady()) return Promise.reject(new Error('missing-endpoint'));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    return fetch(buildUrl(action, extra).toString(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`http-${response.status}`);
        return response.json();
      })
      .finally(() => clearTimeout(timeoutId));
  }

  function requestLiveData(action, extra = {}) {
    return fetchJson(action, extra).catch(() => jsonp(action, extra));
  }

  function getCachedRsvpTotal() {
    try {
      const cachedValue = localStorage.getItem(RSVP_CACHE_KEY);
      if (cachedValue === null) return null;
      const value = Number(cachedValue);
      return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : null;
    } catch (error) {
      return null;
    }
  }

  function cacheRsvpTotal(value) {
    try {
      localStorage.setItem(RSVP_CACHE_KEY, String(value));
    } catch (error) {
      // Der Live-Zähler funktioniert auch ohne lokalen Speicher.
    }
  }

  function showRsvpTotal(nodes, valueNodes, value, muted = false) {
    nodes.forEach((node) => {
      node.hidden = false;
      node.classList.toggle('muted', muted);
    });
    valueNodes.forEach((node) => { node.textContent = String(value); });
  }

  function renderRsvpInlineSummary() {
    const nodes = document.querySelectorAll('[data-rsvp-counter-inline]');
    if (!nodes.length) return;
    if (document.body.dataset.protected === 'true' && !document.body.classList.contains('has-access')) return;

    const valueNodes = document.querySelectorAll('[data-rsvp-counter-inline-value]');
    const cachedTotal = getCachedRsvpTotal();
    if (cachedTotal !== null) {
      showRsvpTotal(nodes, valueNodes, cachedTotal);
    }

    if (!endpointReady()) {
      if (cachedTotal === null) showRsvpTotal(nodes, valueNodes, 'einige', true);
      return;
    }
    if (rsvpRequestInFlight) return;
    rsvpRequestInFlight = true;

    requestLiveData('rsvpSummary')
      .then((result) => {
        if (!result || !result.ok) throw new Error('invalid-response');
        const totalPersons = Number(result.totalPersons);
        if (!Number.isFinite(totalPersons) || totalPersons < 0) throw new Error('invalid-total');
        const normalizedTotal = Math.trunc(totalPersons);
        cacheRsvpTotal(normalizedTotal);
        showRsvpTotal(nodes, valueNodes, normalizedTotal);
      })
      .catch(() => {
        if (cachedTotal === null) showRsvpTotal(nodes, valueNodes, 'einige', true);
      })
      .finally(() => {
        rsvpRequestInFlight = false;
      });
  }

  function normalizeBringEntries(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.map((entry) => ({
      name: String(entry?.name || ''),
      item: String(entry?.item || ''),
      quantity: String(entry?.quantity || ''),
    }));
  }

  function getCachedBringEntries() {
    try {
      const cachedValue = localStorage.getItem(BRING_CACHE_KEY);
      if (cachedValue === null) return null;
      const entries = JSON.parse(cachedValue);
      return Array.isArray(entries) ? normalizeBringEntries(entries) : null;
    } catch (error) {
      return null;
    }
  }

  function cacheBringEntries(entries) {
    try {
      localStorage.setItem(BRING_CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      // Die Live-Liste funktioniert auch ohne lokalen Speicher.
    }
  }

  function showBringEntries(list, entries) {
    list.innerHTML = '';
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'info-block';
      empty.innerHTML = '<strong>Noch nichts eingetragen</strong><p class="inline-note">Sobald die ersten Beiträge eingehen, erscheinen sie hier automatisch.</p>';
      list.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'entry';

      const header = document.createElement('div');
      header.className = 'entry__header';

      const title = document.createElement('div');
      title.className = 'entry__title';
      title.textContent = entry.item || 'Unbenannter Beitrag';
      header.appendChild(title);

      if (entry.quantity) {
        const quantity = document.createElement('div');
        quantity.className = 'entry__quantity';
        quantity.textContent = entry.quantity;
        header.appendChild(quantity);
      }

      const meta = document.createElement('div');
      meta.className = 'entry__meta';
      meta.textContent = entry.name || 'Unbekannt';

      item.appendChild(header);
      item.appendChild(meta);
      list.appendChild(item);
    });
  }

  function renderBringList() {
    const list = document.querySelector('[data-contribution-list]');
    const loading = document.querySelector('[data-contribution-loading]');
    const error = document.querySelector('[data-contribution-error]');
    if (!list) return;
    if (document.body.dataset.protected === 'true' && !document.body.classList.contains('has-access')) return;

    const cachedEntries = getCachedBringEntries();
    if (cachedEntries !== null) {
      showBringEntries(list, cachedEntries);
      if (loading) loading.hidden = true;
      if (error) error.hidden = true;
    }

    if (!endpointReady()) {
      if (loading) loading.hidden = true;
      if (error && cachedEntries === null) {
        error.hidden = false;
        error.textContent = BRING_UNAVAILABLE_MESSAGE;
      }
      return;
    }
    if (bringRequestInFlight) return;
    bringRequestInFlight = true;

    if (loading) loading.hidden = cachedEntries !== null;
    if (error) error.hidden = true;

    requestLiveData('bringList')
      .then((result) => {
        if (!result || !result.ok) throw new Error('invalid-response');
        const entries = normalizeBringEntries(result.entries);
        cacheBringEntries(entries);
        if (loading) loading.hidden = true;
        showBringEntries(list, entries);
      })
      .catch(() => {
        if (loading) loading.hidden = true;
        if (error && cachedEntries === null) {
          error.hidden = false;
          error.textContent = BRING_UNAVAILABLE_MESSAGE;
        }
      })
      .finally(() => {
        bringRequestInFlight = false;
      });
  }

  function refreshAll() {
    renderRsvpInlineSummary();
    renderBringList();
  }

  document.addEventListener('DOMContentLoaded', () => {
    refreshAll();
    setInterval(refreshAll, REFRESH_MS);
  });

  document.addEventListener('sq:access-granted', refreshAll);
  document.addEventListener('sq:form-submitted', refreshAll);

  window.LiveData = {
    renderRsvpInlineSummary,
    renderBringList,
    refreshAll,
  };
})();
