document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("faq-root");
  if (!root || !window.FaqEntries) return;

  root.innerHTML = "";
  window.FaqEntries.forEach((section) => {
    const block = document.createElement("section");
    block.className = "info-block";
    const items = section.items.map((item) => {
      const connections = Array.isArray(item.connections) && item.connections.length
        ? `<ul class="travel-connections">${item.connections.map((connection) => `<li>${connection}</li>`).join("")}</ul>`
        : "";
      const pickupTarget = item.pickupInterest ? '<div data-pickup-interest-target></div>' : "";
      return `
        <div class="entry" style="margin-top:0.85rem;">
          <strong>${item.question}</strong>
          <p class="inline-note" style="margin-top:0.5rem;">${item.answer}</p>
          ${connections}
          ${pickupTarget}
        </div>
      `;
    }).join("");

    block.innerHTML = `
      <h2>${section.section}</h2>
      ${items}
    `;
    root.appendChild(block);
  });

  const pickupInterest = document.querySelector("[data-pickup-interest]");
  const pickupTarget = root.querySelector("[data-pickup-interest-target]");
  if (pickupInterest && pickupTarget) pickupTarget.appendChild(pickupInterest);
});
