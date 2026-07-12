(function () {
  function getConfig() {
    return window.FormConfig || {};
  }

  function getMode(kind) {
    return getConfig().modes?.[kind] || 'placeholder';
  }

  function getRemoteFormType(kind) {
    return getConfig().remoteFormTypes?.[kind] || kind;
  }

  function getEndpoint() {
    return getConfig().endpoint || '';
  }

  function getMessage(key, fallback) {
    return getConfig().messages?.[key] || fallback;
  }

  function getKindSuccessMessage(kind) {
    return getConfig().messages?.byKind?.[kind] || getMessage('success', 'Gesendet.');
  }

  function getKindErrorMessage(kind, specificKey) {
    if (specificKey && getConfig().messages?.errorByKind?.[specificKey]) {
      return getConfig().messages.errorByKind[specificKey];
    }
    return (
      getConfig().messages?.errorByKind?.[kind] ||
      getConfig().messages?.errorByKind?.default ||
      getMessage('error', 'Das Absenden hat gerade nicht funktioniert.')
    );
  }

  function showMessage(form, tone, text) {
    const box = form.parentElement.querySelector('[data-form-status]');
    if (!box) return;
    box.hidden = false;
    box.dataset.tone = tone;
    box.textContent = text;
  }

  function hideMessage(form) {
    const box = form.parentElement.querySelector('[data-form-status]');
    if (!box) return;
    box.hidden = true;
    box.textContent = '';
    delete box.dataset.tone;
  }

  function serializeForm(form) {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (!checkbox.name) return;
      const checkedValues = Array.from(
        form.querySelectorAll(`input[name="${checkbox.name}"]:checked`)
      ).map((entry) => entry.value);
      if (checkedValues.length > 0) {
        data[checkbox.name] = checkedValues;
      }
    });

    return normalizePayload(form.dataset.formKind, data);
  }

  function normalizePayload(kind, payload) {
    const normalized = { ...payload };

    if (kind === 'rsvp') {
      const namesRaw = typeof normalized.names === 'string' ? normalized.names : '';
      normalized.names = namesRaw
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .join('\n');
      normalized.comment = typeof normalized.comment === 'string' ? normalized.comment.trim() : '';
    }

    if (kind === 'bring') {
      normalized.item = typeof normalized.item === 'string' ? normalized.item.trim() : '';
      normalized.quantity = typeof normalized.quantity === 'string' ? normalized.quantity.trim() : '';
    }

    if (kind === 'games') {
      normalized.contribution_type = normalized.contribution_type || '';
      normalized.description = typeof normalized.description === 'string' ? normalized.description.trim() : '';
    }

    if (kind === 'newsletter') {
      normalized.email = typeof normalized.email === 'string' ? normalized.email.trim() : '';
    }

    if (kind === 'teams') {
      [
        'classic_knowledge',
        'recognition',
        'estimation_curiosity',
        'patterns_puzzling',
        'clue_combination',
        'fine_motor_skills',
        'movement_coordination',
        'explain_coordinate',
        'motivate_perform',
      ].forEach((field) => {
        normalized[field] = typeof normalized[field] === 'string' ? normalized[field].trim() : '';
      });
    }

    return normalized;
  }

  function createMirrorForm(endpoint, kind, payload, iframeName) {
    const mirror = document.createElement('form');
    mirror.method = 'POST';
    mirror.action = endpoint;
    mirror.target = iframeName;
    mirror.style.display = 'none';

    const fields = {
      formType: getRemoteFormType(kind),
      ...payload,
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = Array.isArray(value) ? value.join(' | ') : (value == null ? '' : String(value));
      mirror.appendChild(input);
    });

    document.body.appendChild(mirror);
    return mirror;
  }

  function getOrCreateIframe(kind) {
    const iframeId = `submit-target-${kind}`;
    let iframe = document.getElementById(iframeId);
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.name = iframeId;
      iframe.id = iframeId;
      iframe.hidden = true;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    return iframe;
  }

  async function submitPlaceholder(form, kind, payload) {
    form.reset();
    showMessage(form, 'success', getKindSuccessMessage(kind));
    document.dispatchEvent(new CustomEvent('sq:form-submitted', { detail: { kind, payload, mode: 'placeholder' } }));
    return { ok: true, kind, payload, mode: 'placeholder' };
  }

  async function submitRemote(form, kind, payload) {
    const endpoint = getEndpoint();
    const missingPlaceholder = !endpoint || endpoint.includes('PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE');
    if (missingPlaceholder) {
      showMessage(form, 'error', getMessage('remoteMissing', 'Das Formular ist gerade nicht erreichbar. Versuch es bitte gleich noch einmal.'));
      return { ok: false, kind, mode: 'remote-missing' };
    }

    const iframe = getOrCreateIframe(kind);
    const iframeName = iframe.name;
    showMessage(form, 'success', getMessage('sending', 'Wird gesendet ...'));

    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        iframe.removeEventListener('load', onLoad);
        clearTimeout(timeoutId);
      };
      const onLoad = () => {
        if (settled) return;
        settled = true;
        cleanup();
        form.reset();
        showMessage(form, 'success', getKindSuccessMessage(kind));
        document.dispatchEvent(new CustomEvent('sq:form-submitted', { detail: { kind, payload, mode: 'remote' } }));
        resolve({ ok: true, kind, mode: 'remote', payload });
      };
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        showMessage(form, 'error', getMessage('remoteTimeout', 'Das hat gerade etwas zu lange gedauert. Versuch es bitte noch einmal.'));
        resolve({ ok: false, kind, mode: 'remote-timeout', payload });
      }, 12000);

      iframe.addEventListener('load', onLoad, { once: true });
      const mirror = createMirrorForm(endpoint, kind, payload, iframeName);
      mirror.submit();
      setTimeout(() => mirror.remove(), 1000);
    });
  }

  async function dispatchSubmit(form, kind, payload) {
    const mode = getMode(kind);
    if (mode === 'remote') return submitRemote(form, kind, payload);
    return submitPlaceholder(form, kind, payload);
  }

  function validateForm(kind, payload) {
    if (kind === 'teams') {
      const requiredFields = [
        'classic_knowledge',
        'recognition',
        'estimation_curiosity',
        'patterns_puzzling',
        'clue_combination',
        'fine_motor_skills',
        'movement_coordination',
        'explain_coordinate',
        'motivate_perform',
      ];
      const missingProfileValue = requiredFields.some((field) => !payload[field]);
      if (missingProfileValue) {
        return getKindErrorMessage(kind, 'teamsMissingChoice');
      }
    }
    return '';
  }

  function initForms() {
    const forms = document.querySelectorAll('[data-form-kind]');
    forms.forEach((form) => {
      const kind = form.dataset.formKind;
      if (!kind) return;
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessage(form);
        if (!form.reportValidity()) {
          if (kind === 'teams') {
            showMessage(form, 'error', getKindErrorMessage(kind, 'teamsMissingChoice'));
          }
          return;
        }
        const payload = serializeForm(form);
        const validationError = validateForm(kind, payload);
        if (validationError) {
          showMessage(form, 'error', validationError);
          return;
        }
        const submitButtons = Array.from(form.querySelectorAll('button[type="submit"], input[type="submit"]'));
        submitButtons.forEach((button) => { button.disabled = true; });
        try {
          await dispatchSubmit(form, kind, payload);
        } finally {
          submitButtons.forEach((button) => { button.disabled = false; });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initForms);
})();
