document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("news-root");
  if (!root || !window.NewsEntries || !window.SiteApp) return;

  const sorted = [...window.NewsEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
  root.innerHTML = "";
  sorted.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "entry";
    article.innerHTML = `
      <h2>${entry.title}</h2>
      <div class="entry__meta">${window.SiteApp.formatDate(entry.date)}</div>
      <p>${entry.excerpt}</p>
      <p>${entry.body}</p>
    `;
    root.appendChild(article);
  });
});
