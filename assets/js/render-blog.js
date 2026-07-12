document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("blog-root");
  if (!root || !window.BlogEntries || !window.SiteApp) return;

  function getSortDate(value) {
    if (/^\d{4}$/.test(String(value || ""))) {
      return new Date(`${value}-01-01`).getTime();
    }
    return new Date(value).getTime();
  }

  function formatBlogDate(value) {
    const dateValue = String(value || "");
    if (/^\d{4}$/.test(dateValue)) return dateValue;
    return window.SiteApp.formatDate(dateValue);
  }

  const sorted = [...window.BlogEntries].sort((a, b) => getSortDate(b.date) - getSortDate(a.date));
  root.innerHTML = "";
  sorted.forEach((entry, index) => {
    const article = document.createElement("article");
    article.className = "entry";
    const contentId = `blog-content-${index}`;
    article.innerHTML = `
      <button class="blog-toggle" type="button" aria-expanded="false" aria-controls="${contentId}">
        <span class="blog-toggle__icon" aria-hidden="true"></span>
        <span class="blog-toggle__body">
          <h2>${entry.title}</h2>
          <span class="entry__meta">${formatBlogDate(entry.date)}</span>
          <span class="blog-toggle__teaser">${entry.teaser}</span>
        </span>
      </button>
      <div class="blog-content" id="${contentId}" hidden>
        <p>${entry.body}</p>
      </div>
    `;
    const button = article.querySelector(".blog-toggle");
    const content = article.querySelector(".blog-content");
    button.addEventListener("click", () => {
      const next = content.hidden;
      content.hidden = !next;
      button.setAttribute("aria-expanded", String(next));
    });
    root.appendChild(article);
  });
});
