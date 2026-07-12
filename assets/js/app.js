(function () {
  function el(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text) node.textContent = options.text;
    if (options.html) node.innerHTML = options.html;
    if (options.href) node.href = options.href;
    if (options.type) node.type = options.type;
    if (options.id) node.id = options.id;
    return node;
  }

  function formatDate(isoDate) {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function formatTime(isoDate) {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function hasAccess() {
    return localStorage.getItem(window.SiteConfig.accessStorageKey) === "true";
  }

  function setAccess(value) {
    localStorage.setItem(window.SiteConfig.accessStorageKey, value ? "true" : "false");
    document.body.classList.toggle("has-access", value);
    if (value) {
      document.dispatchEvent(new CustomEvent('sq:access-granted'));
    }
  }

  function buildNav() {
    const nav = document.querySelector("[data-site-nav]");
    const toggle = document.querySelector("[data-nav-toggle]");
    if (!nav) return;

    const currentPage = location.pathname.split("/").pop() || "index.html";
    const entries = [...window.SiteConfig.publicNav];
    if (hasAccess()) {
      entries.push(...window.SiteConfig.protectedNav);
    }

    nav.innerHTML = "";
    entries.forEach((item) => {
      const link = el("a", { href: item.href, text: item.label });
      if (item.href === currentPage) {
        link.setAttribute("aria-current", "page");
      }
      nav.appendChild(link);
    });

    if (hasAccess()) {
      const status = el("span", { className: "site-nav__status", text: window.SiteConfig.accessGrantedLabel });
      nav.appendChild(status);
    }

    if (toggle && !toggle.dataset.navToggleReady) {
      toggle.dataset.navToggleReady = "true";
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
    }
  }

  function buildFooter() {
    const footer = document.querySelector("[data-site-footer]");
    if (!footer) return;
    const year = new Date().getFullYear();
    footer.innerHTML = `
      <div>© ${year} ${window.SiteConfig.siteName}</div>
      <div>${window.SiteConfig.socialHint}</div>
    `;
  }

  function buildAccessNextSteps() {
    const config = window.SiteConfig.accessNextSteps;
    if (!config) return;

    document.querySelectorAll("[data-access-next-steps]").forEach((root) => {
      root.innerHTML = "";
      const isCompact = root.dataset.accessNextSteps === "compact";
      const isPlain = root.dataset.accessNextSteps === "plain";

      if (isCompact) {
        const text = el("p", { text: config.compactText });
        const links = el("div", { className: "access-next-steps__links" });
        (config.compactItems || []).forEach((item) => {
          const link = el("a", { href: item.href, text: item.label });
          if (item.important) link.classList.add("is-important");
          links.appendChild(link);
        });
        root.classList.add("is-compact");
        root.append(text, links);
        return;
      }

      const heading = el("h3", { text: config.title });
      const intro = el("p", { text: config.intro });
      const list = el("ul", { className: "access-next-steps__list" });

      (config.items || []).forEach((item) => {
        const entry = el("li");
        if (item.important) entry.classList.add("is-important");
        const label = isPlain
          ? el("span", { className: "access-next-steps__label", text: item.label })
          : el("a", { href: item.href, text: item.label });
        const text = el("span", { text: item.text });
        entry.append(label, text);
        list.appendChild(entry);
      });

      root.append(heading, intro, list);
    });
  }

  function initAccessRequired() {
    const requiredNotice = document.querySelector("[data-access-required]");
    const protectedContent = document.querySelector("[data-protected-content]");
    const isProtectedPage = document.body.dataset.protected === "true";

    document.body.classList.toggle("has-access", hasAccess());
    if (hasAccess()) {
      document.dispatchEvent(new CustomEvent('sq:access-granted'));
    }

    if (!isProtectedPage) return;

    if (hasAccess()) {
      if (requiredNotice) requiredNotice.hidden = true;
      if (protectedContent) protectedContent.hidden = false;
    } else {
      if (requiredNotice) requiredNotice.hidden = false;
      if (protectedContent) protectedContent.hidden = true;
    }
  }

  function updateAfterAccess() {
    buildNav();
    initAccessRequired();

    if (window.LiveData && typeof window.LiveData.refreshAll === "function") {
      window.LiveData.refreshAll();
    }

    const passwordArea = document.querySelector("[data-password-panel]");
    const accessGranted = document.querySelector("[data-access-granted]");
    const accessRiddleCallout = document.querySelector("[data-access-riddle-callout]");
    const accessResetActions = document.querySelector("[data-access-reset-actions]");
    if (passwordArea && accessGranted) {
      passwordArea.classList.toggle("hidden", hasAccess());
      accessGranted.classList.toggle("hidden", !hasAccess());
    }
    if (accessRiddleCallout) {
      accessRiddleCallout.classList.toggle("hidden", hasAccess());
    }
    if (accessResetActions) {
      accessResetActions.classList.toggle("hidden", !hasAccess());
    }
  }

  function initPasswordGate() {
    const form = document.querySelector("[data-password-form]");
    const feedback = document.querySelector("[data-password-feedback]");
    if (!form) return;

    function showFeedback(tone, text) {
      if (!feedback) return;
      feedback.hidden = false;
      feedback.dataset.tone = tone;
      feedback.textContent = text;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input[name='password']");
      const submitted = (input.value || "").trim();

      if (submitted === window.SiteConfig.accessPassword) {
        setAccess(true);
        updateAfterAccess();
        showFeedback("success", "Zugang freigeschaltet. Weitere Navigationspunkte sind nun verfügbar.");
        input.value = "";
        return;
      }

      const messages = window.SiteConfig.wrongPasswordMessages || ["Falsches Passwort."];
      const message = messages[Math.floor(Math.random() * messages.length)];
      showFeedback("error", message);
    });
  }

  function initLogout() {
    const button = document.querySelector("[data-reset-access]");
    if (!button) return;
    button.addEventListener("click", () => {
      setAccess(false);
      updateAfterAccess();
      location.href = "index.html";
    });
  }

  window.SiteApp = {
    el,
    formatDate,
    formatTime,
    hasAccess,
    setAccess
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.brand__title').forEach((node) => {
      node.textContent = window.SiteConfig.siteName;
    });
    document.querySelectorAll('.brand__subtitle').forEach((node) => {
      node.textContent = window.SiteConfig.siteTagline;
    });
    const intro = document.getElementById('intro-text');
    if (intro) intro.textContent = window.SiteConfig.introText;
    const eventDate = document.querySelector('[data-event-date]');
    if (eventDate) eventDate.textContent = formatDate(window.SiteConfig.eventDate);
    const eventAdmissionTime = document.querySelector('[data-event-admission-time]');
    if (eventAdmissionTime) eventAdmissionTime.textContent = `${formatTime(window.SiteConfig.eventAdmissionDate || window.SiteConfig.eventDate)} Uhr`;
    const eventStartTime = document.querySelector('[data-event-start-time]');
    if (eventStartTime) eventStartTime.textContent = `${formatTime(window.SiteConfig.eventDate)} Uhr`;
    const eventLocation = document.querySelector('[data-event-location]');
    if (eventLocation) eventLocation.textContent = window.SiteConfig.eventLocation || 'wird noch bekanntgegeben';

    buildNav();
    buildFooter();
    buildAccessNextSteps();
    initAccessRequired();
    initPasswordGate();
    initLogout();
    updateAfterAccess();
  });
})();
