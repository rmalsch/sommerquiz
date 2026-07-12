(function () {
  function getRemaining(targetDate) {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { expired: false, days, hours, minutes, seconds };
  }

  function renderCountdown() {
    const root = document.querySelector("[data-countdown]");
    if (!root || !window.SiteConfig) return;

    const target = new Date(window.SiteConfig.eventDate);
    const values = getRemaining(target);

    root.querySelector("[data-unit='days']").textContent = values.days;
    root.querySelector("[data-unit='hours']").textContent = values.hours;
    root.querySelector("[data-unit='minutes']").textContent = values.minutes;
    root.querySelector("[data-unit='seconds']").textContent = values.seconds;

    const status = root.querySelector("[data-countdown-status]");
    if (status) status.textContent = "";
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCountdown();
    setInterval(renderCountdown, 1000);
  });
})();
