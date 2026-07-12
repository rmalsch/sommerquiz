(function () {
  const REFRESH_MS = 15000;

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

  function renderRsvpInlineSummary() {
    const nodes = document.querySelectorAll('[data-rsvp-counter-inline]');
    if (!nodes.length) return;
    if (document.body.dataset.protected === 'true' && !document.body.classList.contains('has-access')) return;

    const valueNodes = document.querySelectorAll('[data-rsvp-counter-inline-value]');
    if (!endpointReady()) {
      nodes.forEach((node) => { node.hidden = false; node.classList.add('muted'); });
      valueNodes.forEach((node) => { node.textContent = '–'; });
      return;
    }

    jsonp('rsvpSummary')
      .then((result) => {
        if (!result || !result.ok) throw new Error('invalid-response');
        const totalPersons = Number(result.totalPersons || 0);
        nodes.forEach((node) => { node.hidden = false; node.classList.remove('muted'); });
        valueNodes.forEach((node) => { node.textContent = String(totalPersons); });
      })
      .catch(() => {
        nodes.forEach((node) => { node.hidden = false; node.classList.add('muted'); });
        valueNodes.forEach((node) => { node.textContent = '–'; });
      });
  }

  function renderBringList() {
    const list = document.querySelector('[data-contribution-list]');
    const loading = document.querySelector('[data-contribution-loading]');
    const error = document.querySelector('[data-contribution-error]');
    if (!list) return;
    if (document.body.dataset.protected === 'true' && !document.body.classList.contains('has-access')) return;

    if (!endpointReady()) {
      if (loading) loading.hidden = true;
      if (error) {
        error.hidden = false;
        error.textContent = 'Die aktuellen Daten sind gerade nicht verfügbar.';
      }
      return;
    }

    if (loading) loading.hidden = false;
    if (error) error.hidden = true;

    jsonp('bringList')
      .then((result) => {
        if (!result || !result.ok) throw new Error('invalid-response');
        const entries = Array.isArray(result.entries) ? result.entries : [];
        if (loading) loading.hidden = true;
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
      })
      .catch(() => {
        if (loading) loading.hidden = true;
        if (error) error.hidden = false;
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
