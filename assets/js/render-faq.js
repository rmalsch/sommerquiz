document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("faq-root");
  if (!root || !window.FaqEntries) return;

  root.innerHTML = "";
  window.FaqEntries.forEach((section) => {
    const block = document.createElement("section");
    block.className = "info-block";
    const items = section.items.map((item) => `
      <div class="entry" style="margin-top:0.85rem;">
        <strong>${item.question}</strong>
        <p class="inline-note" style="margin-top:0.5rem;">${item.answer}</p>
      </div>
    `).join("");

    block.innerHTML = `
      <h2>${section.section}</h2>
      ${items}
    `;
    root.appendChild(block);
  });
});
