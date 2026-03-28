/**
 * Recherche de plats sur la page menu : filtre les catégories, met en gras les correspondances.
 */
(function () {
    const main = document.querySelector("main");
    if (!main) return;

    const input = document.getElementById("menu-search-input");
    const emptyMsg = document.getElementById("menu-search-empty");
    const sections = main.querySelectorAll("section.menu-category");

    if (!input || !emptyMsg || sections.length === 0) return;

    function normalize(str) {
        return str
            .normalize("NFD")
            .replace(/\p{M}/gu, "")
            .toLowerCase()
            .trim();
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

        if (!q) {
            clearFilter();
            return;
        }

        let totalMatches = 0;

        sections.forEach((sec) => {
            const lis = sec.querySelectorAll(".category-content ul li");
            let sectionHasMatch = false;

            lis.forEach((li) => {
                const name = normalize(dishNameFromLi(li));
                const match = name.includes(q);
                if (match) {
                    sectionHasMatch = true;
                    totalMatches++;
                    li.classList.add("menu-dish-match");
                } else {
                    li.classList.remove("menu-dish-match");
                }
            });

            if (sectionHasMatch) {
                sec.classList.remove("menu-category--filtered-out");
            } else {
                sec.classList.add("menu-category--filtered-out");
            }
        });

        emptyMsg.hidden = totalMatches > 0;
    }

    input.addEventListener("input", applyFilter);
    input.addEventListener("search", applyFilter);
})();
