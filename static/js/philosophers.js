/* Philosopher buttons: checkbox = active in the chart, name click = opens the
   "caixinha" (info card) about that philosopher. */

function philosopherByKey(key) {
  return App.philosophers.find(p => p.key === key);
}

function getPhilButtons() {
  return document.querySelectorAll("#phil-buttons .phil-btn");
}

function closeAllPhilCards() {
  document.querySelectorAll(".phil-card.open").forEach(card => {
    card.classList.remove("open");
    const key = card.id.replace("card-", "");
    const trigger = document.querySelector(`.phil-info-btn[data-key="${key}"]`);
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
  const backdrop = document.getElementById("modal-backdrop");
  if (backdrop) backdrop.classList.remove("open");
}

function togglePhilCard(key) {
  const card = document.getElementById(`card-${key}`);
  if (!card) return;
  const trigger = document.querySelector(`.phil-info-btn[data-key="${key}"]`);
  const wasOpen = card.classList.contains("open");
  closeAllPhilCards();
  if (!wasOpen) {
    card.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    const backdrop = document.getElementById("modal-backdrop");
    if (backdrop) backdrop.classList.add("open");
  }
}

function updateCheckboxVisual(btn) {
  const checkbox = btn.querySelector(".phil-checkbox");
  btn.classList.toggle("active", checkbox.checked);
}

function initPhilButtons(onSelectionChange) {
  getPhilButtons().forEach(btn => {
    const key = btn.dataset.key;
    const checkbox = btn.querySelector(".phil-checkbox");
    const infoBtn = btn.querySelector(".phil-info-btn");

    btn.style.setProperty("--phil-color", "var(--color-science)");

    if (checkbox.checked) App.activePhils.add(key);
    updateCheckboxVisual(btn);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        App.activePhils.add(key);
      } else if (App.activePhils.size > 1) {
        App.activePhils.delete(key);
      } else {
        checkbox.checked = true; // always keep at least one philosopher active
        return;
      }
      updateCheckboxVisual(btn);
      onSelectionChange();
    });

    btn.addEventListener("click", (e) => {
      if (e.target === checkbox || e.target.closest(".phil-info-btn")) return;
      checkbox.click();
    });

    infoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePhilCard(key);
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".phil-btn") && !e.target.closest(".phil-card")) {
      closeAllPhilCards();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllPhilCards();
    }
  });
}