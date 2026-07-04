/* Light/dark theme toggle. */
document.getElementById("theme-toggle").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});