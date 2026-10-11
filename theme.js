/* Shared by every page: Tailwind (CDN) config with the uniteuow.com palette, and the saved light/dark theme
   (dark by default, like the Unite app). Loaded right after the Tailwind CDN script, before the body paints. */
tailwind.config = {
  darkMode: "class",
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      fontFamily: { sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"] },
      colors: {
        navy: { 50: "#eef3fb", 100: "#dbe5f5", 200: "#b8cbe9", 300: "#8aa8d6", 400: "#5a80bd", 500: "#3a5f9e", 600: "#1f4380", 700: "#163466", 800: "#10264d", 900: "#0a192f", 950: "#06101f" },
        crimson: { 50: "#fbf1f2", 100: "#f5dde0", 200: "#e9b6bc", 300: "#d98691", 400: "#c45a68", 500: "#a83446", 600: "#8c1d32", 700: "#741629", 800: "#5e1222", 900: "#4a0e1b", 950: "#2e0811" },
        slate: { 900: "#0a192f", 950: "#06101f" },
      },
    },
  },
};
(function () {
  var KEY = "unite-theme-v2";
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  root.classList.toggle("dark", saved !== "light");
  window.uniteToggleTheme = function () {
    var dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    try { localStorage.setItem(KEY, dark ? "dark" : "light"); } catch (e) {}
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) { b.setAttribute("aria-checked", String(dark)); });
  };
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-checked", String(root.classList.contains("dark")));
      b.addEventListener("click", window.uniteToggleTheme);
    });
  });
})();
