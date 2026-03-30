/**
 * Recherche de plats sur la page menu.
 * Appeler window.initMenuSearch() une fois que les éléments sont dans le DOM.
 */
window.initMenuSearch = function initMenuSearch() {
    const main     = document.querySelector("main");
    if (!main) return;

    const input    = document.getElementById("menu-search-input");
    const emptyMsg = document.getElementById("menu-search-empty");
    const sections = main.querySelectorAll("section.menu-category");

    if (!input || !emptyMsg || sections.length === 0) return;

    // Éviter le double-bind si appelé plusieurs fois
    input.removeEventListener("input",  applyFilter);
    input.removeEventListener("search", applyFilter);

    function normalize(str) {
        return str.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
    }

    function dishNameFromLi(li) {
        const nameSpan = li.querySelector("span:first-of-type");
        return nameSpan ? nameSpan.textContent : li.textContent;
    }

    function clearFilter() {
        emptyMsg.hidden = true;
        sections.forEach((sec) => {
            sec.classList.remove("menu-category--filtered-out");
            sec.querySelectorAll("ul li").forEach((li) => {
                li.classList.remove("menu-dish-match");
            });
        });
    }

    function applyFilter() {
        const q = normalize(input.value);
        if (!q) { clearFilter(); return; }

        let totalMatches = 0;

        sections.forEach((sec) => {
            const lis = sec.querySelectorAll(".category-content ul li:not(.menu-loading)");
            let sectionHasMatch = false;

            lis.forEach((li) => {
                const name  = normalize(dishNameFromLi(li));
                const match = name.includes(q);
                if (match) {
                    sectionHasMatch = true;
                    totalMatches++;
                    li.classList.add("menu-dish-match");
                } else {
                    li.classList.remove("menu-dish-match");
                }
            });

            sec.classList.toggle("menu-category--filtered-out", !sectionHasMatch);
        });

        emptyMsg.hidden = totalMatches > 0;
    }

    input.addEventListener("input",  applyFilter);
    input.addEventListener("search", applyFilter);

    // Rejouer le filtre si une valeur était déjà présente
    if (input.value) applyFilter();
};
