fetch("./composants/header.html")
  .then((response) => response.text())
  .then((data) => {
    const el = document.getElementById("header-container");
    if (!el) return;
    el.innerHTML = data;
    initMobileNav();
  })
  .catch((error) => console.error("Erreur chargement header :", error));

function initMobileNav() {
  const header = document.getElementById("site-header");
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  const backdrop = document.getElementById("nav-backdrop");
  if (!header || !toggle || !nav) return;

  syncNavAria(false);

  function isMobileNav() {
    return window.innerWidth <= 768;
  }

  function syncNavAria(open) {
    if (!isMobileNav()) {
      nav.removeAttribute("aria-hidden");
      return;
    }
    nav.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function setOpen(open, opts = {}) {
    const skipToggleFocus = opts.skipToggleFocus === true;
    header.classList.toggle("nav-is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.classList.toggle("nav-menu-open", open);
    syncNavAria(open);
    if (backdrop) {
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }
    if (open) {
      const first = nav.querySelector("a");
      if (first) window.requestAnimationFrame(() => first.focus());
    } else if (!skipToggleFocus) {
      toggle.focus();
    }
  }

  function isOpen() {
    return header.classList.contains("nav-is-open");
  }

  toggle.addEventListener("click", () => setOpen(!isOpen()));

  if (backdrop) {
    backdrop.addEventListener("click", () => setOpen(false));
  }

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false, { skipToggleFocus: true }));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && isOpen()) setOpen(false);
    syncNavAria(isOpen());
  });
}
