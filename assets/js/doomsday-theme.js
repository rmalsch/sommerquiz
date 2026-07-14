(function () {
  const particleRoot = document.querySelector("[data-doom-particles]");

  function createParticles() {
    if (!particleRoot) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const particleCount = window.matchMedia("(max-width: 760px)").matches ? 14 : 70;

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

  document.addEventListener("DOMContentLoaded", () => {
    createParticles();
  });
})();
