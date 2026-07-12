document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("gallery-root");
  if (!root || !window.GalleryEntries) return;

  root.innerHTML = "";
  renderMemory(root, window.GallerySlides2025 || [], {
    kicker: "Sommerquiz 2025",
    title: "Eindrücke vom Domnitzer Sommerquiz 2025"
  });
  renderMemory(root, window.GallerySlides2023 || [], {
    kicker: "Sommerquiz 2023",
    title: "Eindrücke vom Domnitzer Sommerquiz 2023"
  });
  window.GalleryEntries.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "chronicle-item";

    const visual = entry.image
      ? `<img src="${entry.image}" alt="${entry.title}" />`
      : `<div class="media-placeholder">Sommerquiz-Moment<br>${entry.title}</div>`;

    article.innerHTML = `
      <div>${visual}</div>
      <div>
        <div class="chronicle-meta">
          <span class="badge">${entry.year}</span>
          <span class="badge">${entry.category}</span>
        </div>
        <h2>${entry.title}</h2>
        <p>${entry.text}</p>
      </div>
    `;
    root.appendChild(article);
  });

  function renderMemory(target, slides, options) {
    if (!slides.length) return;

    const section = document.createElement("details");
    section.className = "sq-memory";

    section.innerHTML = `
      <summary class="sq-memory__toggle">
        <span>
          <span class="kicker">${options.kicker}</span>
          <span class="sq-memory__title">${options.title}</span>
        </span>
        <span class="sq-memory__arrow" aria-hidden="true"></span>
      </summary>
      <div class="sq-memory__content"></div>
    `;

    const content = section.querySelector(".sq-memory__content");

    function stripHtml(value) {
      const temp = document.createElement("div");
      temp.innerHTML = value || "";
      return temp.textContent || "";
    }

    slides.forEach((slide) => {
      const figure = document.createElement("figure");
      figure.className = "sq-memory__figure";
      figure.innerHTML = `
        <img class="sq-memory__image" src="${slide.src}" alt="${stripHtml(slide.caption)}" loading="lazy" />
        <figcaption class="sq-memory__caption">
          <span>${slide.caption}</span>
        </figcaption>
      `;
      content.appendChild(figure);
    });

    target.appendChild(section);
  }
});
