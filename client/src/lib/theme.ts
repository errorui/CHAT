export const THEME_KEY = "talk-tip-theme";

// runs before first paint, so dark mode never flashes white
export const THEME_SCRIPT = `try {
  var saved = null;
  try { saved = localStorage.getItem("${THEME_KEY}"); } catch (e) {}
  var dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {}`;
