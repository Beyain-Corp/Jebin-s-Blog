// Theme Engine for Jebin's Blog
(function () {
  const STORAGE_KEY = 'jebin-theme';

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    const toggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    if (themeIcon) {
      if (theme === 'light') {
        themeIcon.className = 'fa-solid fa-moon';
        if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Dark Mode');
      } else {
        themeIcon.className = 'fa-solid fa-sun';
        if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Light Mode');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getTheme());

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }
  });

  window.jebinTheme = { getTheme, applyTheme };
})();

