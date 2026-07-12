(function () {
  const particleRoot = document.querySelector("[data-doom-particles]");
  const audioToggle = document.querySelector("[data-doom-audio-toggle]");
  const tickSources = [
    "assets/audio/theme/tick1.mp3",
    "assets/audio/theme/tick2.mp3",
  ];

  function createParticles() {
    if (!particleRoot) return;
    const particleCount = window.matchMedia("(max-width: 760px)").matches ? 34 : 70;

    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement("span");
      particle.className = "doom-particle";
      particle.style.setProperty("--particle-left", `${Math.random() * 100}vw`);
      particle.style.setProperty("--particle-size", `${Math.random() * 3.8 + 1.2}px`);
      particle.style.setProperty("--particle-alpha", `${Math.random() * 0.32 + 0.08}`);
      particle.style.setProperty("--particle-duration", `${Math.random() * 14 + 10}s`);
      particle.style.setProperty("--particle-delay", `${Math.random() * -24}s`);
      particle.style.setProperty("--particle-drift", `${(Math.random() - 0.5) * 120}px`);
      particleRoot.appendChild(particle);
    }
  }

  function createAudioController() {
    if (!audioToggle) return;

    const storageKey = "sqDoomTickSound";
    let active = false;
    let tickTimer = null;
    let tickIndex = 0;
    let lastSecond = -1;
    const tickPlayers = tickSources.map((src) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = 0.10;
      return audio;
    });

    function updateButton(label) {
      audioToggle.textContent = label || (active ? "Tickger\u00e4usche ausschalten" : "Tickger\u00e4usche einschalten");
      audioToggle.classList.toggle("is-active", active);
    }

    function getSecondMarker() {
      if (window.SiteConfig?.eventDate) {
        const target = new Date(window.SiteConfig.eventDate).getTime();
        const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
        return remaining;
      }
      return Math.floor(Date.now() / 1000);
    }

    function playTick() {
      const tick = tickPlayers[tickIndex % tickPlayers.length];
      tickIndex += 1;
      tick.currentTime = 0;
      return tick.play();
    }

    function syncTick() {
      const secondMarker = getSecondMarker();
      if (secondMarker === lastSecond) return;
      lastSecond = secondMarker;
      playTick().catch(() => {
        stop({ remember: false });
        updateButton("Tickger\u00e4usche starten");
      });
    }

    function start({ remember = true } = {}) {
      if (tickTimer) return;
      active = true;
      updateButton();
      if (remember) localStorage.setItem(storageKey, "on");
      lastSecond = -1;
      tickTimer = window.setInterval(syncTick, 180);
      syncTick();
    }

    function stop({ remember = true } = {}) {
      active = false;
      window.clearInterval(tickTimer);
      tickTimer = null;
      tickPlayers.forEach((tick) => {
        tick.pause();
        tick.currentTime = 0;
      });
      if (remember) localStorage.setItem(storageKey, "off");
      updateButton();
    }

    audioToggle.addEventListener("click", () => {
      if (active) stop();
      else start();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && active) {
        window.clearInterval(tickTimer);
        tickTimer = null;
      } else if (!document.hidden && active && !tickTimer) {
        lastSecond = -1;
        tickTimer = window.setInterval(syncTick, 180);
      }
    });

    updateButton();
    if (localStorage.getItem(storageKey) !== "off") {
      start({ remember: false });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    createParticles();
    createAudioController();
  });
})();
