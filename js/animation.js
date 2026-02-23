/* ===================================
   RESTAURANT NYLO — ANIMATIONS JS
   Web Animations API · Élégant & Moderne
   =================================== */

// ─── Utilitaire central ────────────────────────────────────────────────────────
function animateEl(el, keyframes, options) {
    if (!el || !el.animate) return { onfinish: () => {} };
    return el.animate(keyframes, { fill: "both", easing: "cubic-bezier(0.4, 0, 0.2, 1)", ...options });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 1. ANIMATION DU TITRE — Apparition lettre par lettre + lueur finale
// ═══════════════════════════════════════════════════════════════════════════════

function initTitleAnimation() {

    // Le header est chargé en async via fetch() dans header.js
    // → on attend qu'il soit présent dans le DOM avec un MutationObserver
    function _run() {
        const h1 = document.querySelector("header h1, .header h1");
        if (!h1) return false;

        const anchor = h1.querySelector("a");
        const target = anchor || h1;
        const text   = target.textContent.trim();
        if (!text) return false;

        // On conserve le href du lien en enveloppant les spans DANS le <a>
        // et en vidant uniquement son contenu texte
        target.innerHTML = [...text].map((char) =>
            char === " "
                ? `<span style="display:inline-block;width:0.4em">&nbsp;</span>`
                : `<span class="nylo-letter" style="
                    display:inline-block;
                    opacity:0;
                    transform:translateY(-22px) rotate(-6deg);
                  ">${char}</span>`
        ).join("");

        const letters = target.querySelectorAll(".nylo-letter");

        letters.forEach((letter, i) => {
            animateEl(letter,
                [
                    { opacity: 0, transform: "translateY(-28px) rotate(-8deg) scale(0.7)" },
                    { opacity: 1, transform: "translateY(4px)  rotate(1deg)  scale(1.05)", offset: 0.72 },
                    { opacity: 1, transform: "translateY(0)    rotate(0deg)  scale(1)" }
                ],
                {
                    duration: 560,
                    delay: 120 + i * 75,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
                }
            ).onfinish = () => {
                letter.style.opacity   = "1";
                letter.style.transform = "none";
            };
        });

        // Lueur dorée après la dernière lettre
        const totalDelay = 120 + letters.length * 75 + 560;
        setTimeout(() => {
            animateEl(h1,
                [
                    { textShadow: "2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,220,180,0)" },
                    { textShadow: "2px 2px 4px rgba(0,0,0,0.2), 0 0 60px rgba(255,220,180,0.6), 0 0 100px rgba(255,180,120,0.3)" },
                    { textShadow: "2px 2px 4px rgba(0,0,0,0.3), 0 0 30px rgba(255,220,180,0.15)" }
                ],
                { duration: 1400, easing: "ease-in-out" }
            );
        }, totalDelay);

        return true;
    }

    // Tentative immédiate (page sans fetch)
    if (_run()) return;

    // Sinon on observe le DOM jusqu'à ce que le header soit injecté
    const observer = new MutationObserver(() => {
        if (_run()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function initTitleHover() {

    function _run() {
        const h1 = document.querySelector("header h1, .header h1");
        if (!h1 || !h1.querySelector(".nylo-letter")) return false;

        h1.style.cursor = "default";

        h1.addEventListener("mouseenter", () => {
            h1.querySelectorAll(".nylo-letter").forEach((letter, i) => {
                animateEl(letter,
                    [
                        { transform: "translateY(0)    scale(1)" },
                        { transform: "translateY(-5px) scale(1.14)" },
                        { transform: "translateY(0)    scale(1)" }
                    ],
                    { duration: 480, delay: i * 45, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
                );
            });
            h1.style.transition = "text-shadow 0.35s ease";
            h1.style.textShadow = `3px 3px 6px rgba(0,0,0,0.4), 0 0 50px rgba(255,220,180,0.38)`;
        });

        h1.addEventListener("mouseleave", () => {
            h1.style.textShadow = `2px 2px 4px rgba(0,0,0,0.3), 4px 4px 8px rgba(0,0,0,0.2), 6px 6px 12px rgba(0,0,0,0.1)`;
        });

        return true;
    }

    // Les .nylo-letter sont créés par initTitleAnimation → on attend qu'ils existent
    const observer = new MutationObserver(() => {
        if (_run()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    _run(); // tentative immédiate
}


// ═══════════════════════════════════════════════════════════════════════════════
// 2. HOVER BOUTONS — Glow + shimmer + lift
// ═══════════════════════════════════════════════════════════════════════════════

function initButtonHover() {

    // ── Bouton icône utilisateur (contient une <img>, texte uniquement dans alt) ─
    document.querySelectorAll("button, a").forEach(el => {
        const img = el.querySelector("img");
        if (!img) return;
        // On vérifie le texte hors attributs (alt compris dans textContent)
        // → on clone et retire les <img> pour ne garder que le vrai texte du DOM
        const clone = el.cloneNode(true);
        clone.querySelectorAll("img").forEach(i => i.remove());
        if (clone.textContent.trim().length > 0) return; // a du vrai texte → pas un bouton icône
        _applyIconButtonHover(el);
    });

    // ── Boutons standards (skip les boutons icône, skip les nav-btn déjà traités plus bas) ─
    document.querySelectorAll("button, .btn, a.button").forEach(btn => {
        if (btn.closest(".menu-item, .plat, .dish")) return;
        if (btn.classList.contains("nav-btn")) return; // géré dans nav a ci-dessous
        // Skip boutons icône
        const clone = btn.cloneNode(true);
        clone.querySelectorAll("img").forEach(i => i.remove());
        if (btn.querySelector("img") && clone.textContent.trim().length === 0) return;
        _applyButtonHover(btn, {
            liftY: "-5px", scaleOut: "1",
            shadowIn:  "0 4px 15px rgba(179,106,94,0.4)",
            shadowOut: "0 12px 32px rgba(179,106,94,0.62)",
            duration: 280
        });
    });

    // Boutons d'accueil
    document.querySelectorAll(
        ".home-buttons a, .accueil-buttons a, .home-buttons button, .accueil-buttons button"
    ).forEach(btn => {
        _applyButtonHover(btn, {
            liftY: "-7px", scaleOut: "1.03",
            shadowIn:  "0 6px 20px rgba(202,124,92,0.3)",
            shadowOut: "0 18px 40px rgba(202,124,92,0.58)",
            duration: 300
        });
    });

    // ── Liens de navigation (nav a + .nav-btn) avec stagger progressif ──────────
    document.querySelectorAll("nav a, .nav-btn").forEach((link, i) => {
        // Dédoublonnage : si le même élément matche les deux sélecteurs
        if (link.dataset.navAnimated) return;
        link.dataset.navAnimated = "1";

        _applyButtonHover(link, {
            liftY: "-3px", scaleOut: "1",
            shadowIn:  "none",
            shadowOut: "0 6px 18px rgba(0,0,0,0.28)",
            duration: 240
        });

        // Apparition progressive au chargement (stagger)
        link.style.opacity   = "0";
        link.style.transform = "translateY(-8px)";
        animateEl(link,
            [
                { opacity: 0, transform: "translateY(-8px)" },
                { opacity: 1, transform: "translateY(0)" }
            ],
            {
                duration: 400,
                delay: 300 + i * 100,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)"
            }
        ).onfinish = () => {
            link.style.opacity   = "";
            link.style.transform = "";
        };
    });
}

function _applyIconButtonHover(el) {
    // L'alignement est géré par .header-right a dans le CSS
    // Ici uniquement les animations

    el.addEventListener("mouseenter", () => {
        animateEl(el,
            [
                {
                    transform: "translateY(0) scale(1) rotate(0deg)",
                    boxShadow: "0 2px 8px rgba(179,106,94,0.18)",
                    filter:    "brightness(1)"
                },
                {
                    transform: "translateY(-4px) scale(1.12) rotate(-6deg)",
                    boxShadow: "0 10px 28px rgba(179,106,94,0.55), 0 0 0 4px rgba(202,124,92,0.18)",
                    filter:    "brightness(1.1) drop-shadow(0 0 6px rgba(202,124,92,0.5))"
                }
            ],
            { duration: 280, fill: "forwards", easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
        );
    });

    el.addEventListener("mouseleave", () => {
        animateEl(el,
            [
                {
                    transform: "translateY(-4px) scale(1.12) rotate(-6deg)",
                    boxShadow: "0 10px 28px rgba(179,106,94,0.55), 0 0 0 4px rgba(202,124,92,0.18)",
                    filter:    "brightness(1.1) drop-shadow(0 0 6px rgba(202,124,92,0.5))"
                },
                {
                    transform: "translateY(0) scale(1) rotate(0deg)",
                    boxShadow: "0 2px 8px rgba(179,106,94,0.18)",
                    filter:    "brightness(1)"
                }
            ],
            { duration: 260, fill: "forwards", easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
        );
    });

    el.addEventListener("mousedown", () => {
        animateEl(el,
            [
                { transform: "scale(0.9) rotate(0deg)" },
                { transform: "scale(1)   rotate(0deg)" }
            ],
            { duration: 140, fill: "forwards", easing: "ease-out" }
        );
    });
}

function _applyButtonHover(el, opts) {
    const { liftY = "-5px", scaleOut = "1", shadowIn = "none", shadowOut = "none", duration = 280 } = opts;

    el.style.position = "relative";
    el.style.overflow = "hidden";

    // Trait lumineux diagonal (shimmer)
    const shimmer = document.createElement("span");
    shimmer.style.cssText = `
        position:absolute; top:0; left:-120%;
        width:60%; height:100%;
        background:linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%);
        pointer-events:none; z-index:1; border-radius:inherit;
    `;
    el.appendChild(shimmer);

    el.addEventListener("mouseenter", () => {
        animateEl(el,
            [
                { transform: `translateY(0) scale(1)`,                    boxShadow: shadowIn  },
                { transform: `translateY(${liftY}) scale(${scaleOut})`,   boxShadow: shadowOut }
            ],
            { duration, fill: "forwards" }
        );
        animateEl(shimmer,
            [
                { left: "-120%", opacity: 0 },
                { left:  "10%",  opacity: 1,  offset: 0.1 },
                { left:  "120%", opacity: 0 }
            ],
            { duration: duration * 2.2, easing: "ease-in-out", fill: "forwards" }
        );
    });

    el.addEventListener("mouseleave", () => {
        animateEl(el,
            [
                { transform: `translateY(${liftY}) scale(${scaleOut})`, boxShadow: shadowOut },
                { transform: `translateY(0) scale(1)`,                  boxShadow: shadowIn  }
            ],
            { duration, fill: "forwards" }
        );
    });

    // Micro-rebond au clic
    el.addEventListener("mousedown", () => {
        animateEl(el,
            [
                { transform: `translateY(-2px) scale(0.97)` },
                { transform: `translateY(0) scale(1)` }
            ],
            { duration: 130, fill: "forwards", easing: "ease-out" }
        );
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 3. AFFICHAGE PROGRESSIF MENU — Entrée / Plats / Desserts
//    Déclenché par IntersectionObserver au scroll
// ═══════════════════════════════════════════════════════════════════════════════

function initMenuReveal() {
    const categoryKeywords = ["entrée","entrees","entrées","plat","plats","dessert","desserts"];
    const allSections      = document.querySelectorAll("section, .menu-section, .category-block");

    // Sections dont le titre contient un mot-clé de catégorie
    const menuSections = [...allSections].filter(sec => {
        const heading = sec.querySelector("h2, h3, h4");
        if (!heading) return false;
        const txt = heading.textContent.toLowerCase();
        return categoryKeywords.some(kw => txt.includes(kw));
    });

    // Classes explicites
    const classSections = document.querySelectorAll(
        ".entrees, .plats, .desserts, .entree-section, .plats-section, .desserts-section"
    );

    const targets = [...new Set([...menuSections, ...classSections])];
    if (targets.length === 0) return;

    // Masquage initial
    targets.forEach(sec => {
        sec.style.opacity   = "0";
        sec.style.transform = "translateY(40px)";
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            _revealMenuBlock(entry.target);
        });
    }, { threshold: 0.12 });

    targets.forEach(sec => observer.observe(sec));
}

function _revealMenuBlock(section) {

    // 1. Le bloc glisse vers le haut
    animateEl(section,
        [
            { opacity: 0, transform: "translateY(40px)" },
            { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    ).onfinish = () => {
        section.style.opacity   = "";
        section.style.transform = "";
    };

    // 2. Le titre du bloc s'écarte doucement
    const heading = section.querySelector("h2, h3");
    if (heading) {
        setTimeout(() => {
            animateEl(heading,
                [
                    { letterSpacing: "0em",    opacity: 0.5 },
                    { letterSpacing: "0.05em", opacity: 1   },
                    { letterSpacing: "0.02em", opacity: 1   }
                ],
                { duration: 650, easing: "ease-out" }
            );
        }, 180);
    }

    // 3. Items en stagger : glissent de gauche
    const items = section.querySelectorAll("li, .plat-item, .menu-row, .dish-row");
    items.forEach((item, i) => {
        item.style.opacity   = "0";
        item.style.transform = "translateX(-20px)";

        setTimeout(() => {
            animateEl(item,
                [
                    { opacity: 0, transform: "translateX(-20px)" },
                    { opacity: 1, transform: "translateX(0)" }
                ],
                { duration: 430, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
            ).onfinish = () => {
                item.style.opacity   = "";
                item.style.transform = "";
            };
        }, 320 + i * 90);
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 4. FADE-IN GÉNÉRAL — main + sections hors menu
// ═══════════════════════════════════════════════════════════════════════════════

function initFadeIn() {
    const main = document.querySelector("main");
    if (main) {
        animateEl(main,
            [
                { opacity: 0, transform: "translateY(28px)" },
                { opacity: 1, transform: "translateY(0)" }
            ],
            { duration: 700, delay: 80 }
        );
    }

    const categoryKeywords = ["entrée","entrees","entrées","plat","plats","dessert","desserts"];
    document.querySelectorAll("section").forEach((section, i) => {
        const heading = section.querySelector("h2, h3");
        const isMenu  = heading && categoryKeywords.some(kw => heading.textContent.toLowerCase().includes(kw));
        if (isMenu) return;

        section.style.opacity = "0";
        animateEl(section,
            [
                { opacity: 0, transform: "translateY(22px)" },
                { opacity: 1, transform: "translateY(0)" }
            ],
            { duration: 600, delay: 160 + i * 110 }
        ).onfinish = () => { section.style.opacity = ""; };
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 5. HOVER SECTIONS GÉNÉRIQUES
// ═══════════════════════════════════════════════════════════════════════════════

function initSectionHover() {
    document.querySelectorAll("section").forEach(section => {
        section.addEventListener("mouseenter", () => {
            animateEl(section,
                [
                    { transform: "translateY(0)",   boxShadow: "0 2px 8px rgba(179,106,94,0.1)" },
                    { transform: "translateY(-4px)", boxShadow: "0 8px 24px rgba(179,106,94,0.22)" }
                ],
                { duration: 280 }
            );
        });
        section.addEventListener("mouseleave", () => {
            animateEl(section,
                [
                    { transform: "translateY(-4px)", boxShadow: "0 8px 24px rgba(179,106,94,0.22)" },
                    { transform: "translateY(0)",    boxShadow: "0 2px 8px rgba(179,106,94,0.1)" }
                ],
                { duration: 280 }
            );
        });
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 6. HOVER ITEMS DE LISTE
// ═══════════════════════════════════════════════════════════════════════════════

function initListItemHover() {
    document.querySelectorAll("section li").forEach(li => {
        if (li.closest(".menu-section, .menu-list, .plats, .entrees, .desserts")) return;
        li.addEventListener("mouseenter", () => {
            animateEl(li,
                [
                    { paddingLeft: "2rem",   background: "rgba(202,124,92,0)" },
                    { paddingLeft: "2.5rem", background: "rgba(202,124,92,0.09)" }
                ],
                { duration: 250 }
            );
        });
        li.addEventListener("mouseleave", () => {
            animateEl(li,
                [
                    { paddingLeft: "2.5rem", background: "rgba(202,124,92,0.09)" },
                    { paddingLeft: "2rem",   background: "rgba(202,124,92,0)" }
                ],
                { duration: 250 }
            );
        });
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 7. HOVER CARTES
// ═══════════════════════════════════════════════════════════════════════════════

function initCardHover() {
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("mouseenter", () => {
            animateEl(card,
                [
                    { transform: "translateY(0)",   boxShadow: "0 2px 8px rgba(179,106,94,0.1)" },
                    { transform: "translateY(-5px)", boxShadow: "0 8px 24px rgba(179,106,94,0.22)" }
                ],
                { duration: 280 }
            );
        });
        card.addEventListener("mouseleave", () => {
            animateEl(card,
                [
                    { transform: "translateY(-5px)", boxShadow: "0 8px 24px rgba(179,106,94,0.22)" },
                    { transform: "translateY(0)",    boxShadow: "0 2px 8px rgba(179,106,94,0.1)" }
                ],
                { duration: 280 }
            );
        });
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 8. EFFET RIPPLE AU CLIC
// ═══════════════════════════════════════════════════════════════════════════════

function initRipple() {
    document.querySelectorAll("button, .btn, a.button, nav a, .home-buttons a, .accueil-buttons a").forEach(el => {
        if (el.closest(".menu-item, .plat, .dish")) return;

        el.addEventListener("click", function(e) {
            const ripple = document.createElement("span");
            const rect   = el.getBoundingClientRect();
            const size   = Math.max(rect.width, rect.height) * 1.6;
            const x      = e.clientX - rect.left - size / 2;
            const y      = e.clientY - rect.top  - size / 2;

            ripple.style.cssText = `
                position:absolute; border-radius:50%; pointer-events:none; z-index:99;
                width:${size}px; height:${size}px; left:${x}px; top:${y}px;
                background:rgba(255,255,255,0.28);
            `;
            el.appendChild(ripple);
            animateEl(ripple,
                [
                    { transform: "scale(0)", opacity: 1 },
                    { transform: "scale(1)", opacity: 0 }
                ],
                { duration: 550, easing: "ease-out" }
            ).onfinish = () => ripple.remove();
        });
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 9. FEEDBACK FORMULAIRES
// ═══════════════════════════════════════════════════════════════════════════════

function animateFormError(formEl) {
    animateEl(formEl,
        [
            { transform: "translateX(0)" },
            { transform: "translateX(-9px)" },
            { transform: "translateX(9px)" },
            { transform: "translateX(-6px)" },
            { transform: "translateX(6px)" },
            { transform: "translateX(0)" }
        ],
        { duration: 430, easing: "ease-in-out" }
    );
}

function animateFormSuccess(formEl) {
    animateEl(formEl,
        [
            { transform: "scale(1)",    boxShadow: "0 4px 16px rgba(179,106,94,0.15)" },
            { transform: "scale(1.02)", boxShadow: "0 10px 36px rgba(179,106,94,0.35)" },
            { transform: "scale(1)",    boxShadow: "0 4px 16px rgba(179,106,94,0.15)" }
        ],
        { duration: 520, easing: "ease-in-out" }
    );
}

window.animateFormError   = animateFormError;
window.animateFormSuccess = animateFormSuccess;


// ═══════════════════════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
    initTitleAnimation();   // Titre lettre par lettre + lueur (attend le header async)
    initTitleHover();        // Vague de rebond (attend les .nylo-letter)
    initFadeIn();            // Fade-in main + sections génériques
    initMenuReveal();        // Apparition progressive Entrée / Plats / Desserts

    // Boutons, nav et icône user sont dans le header chargé en async → on attend
    function _initInteractions() {
        const header = document.querySelector("header, .header");
        if (!header) return false;
        initButtonHover();
        initSectionHover();
        initListItemHover();
        initCardHover();
        initRipple();
        return true;
    }

    if (!_initInteractions()) {
        const obs = new MutationObserver(() => {
            if (_initInteractions()) obs.disconnect();
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }
});
