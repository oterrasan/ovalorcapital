(() => {
  const storageKey = "valor-command-theme";
  const themes = ["command", "orbital", "aurora", "pulse"];

  function readTheme() {
    try {
      const saved = localStorage.getItem(storageKey);
      return themes.includes(saved) ? saved : "command";
    } catch {
      return "command";
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Local preference persistence is optional.
    }
  }

  function applyTheme(theme, persist = true) {
    const active = themes.includes(theme) ? theme : "command";
    document.body.dataset.theme = active;
    if (persist) saveTheme(active);
    document.querySelectorAll(".theme-swatch").forEach((button) => {
      const selected = button.dataset.themeOption === active;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  applyTheme(readTheme(), false);

  document.querySelectorAll(".theme-swatch").forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.themeOption));
  });
})();
