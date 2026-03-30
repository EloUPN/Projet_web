/**
 * Charge les éléments du menu depuis l'API PHP et peuple les listes.
 * Lance initMenuSearch() une fois le contenu injecté.
 */
(function () {
    function formatPrix(prix) {
        const p = parseFloat(prix);
        if (isNaN(p)) return "";
        return p === Math.floor(p) ? `${Math.floor(p)}\u00a0€` : `${p.toFixed(2)}\u00a0€`;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function populateCategory(type, items) {
        const ul = document.getElementById(`menu-list-${type}`);
        if (!ul) return;

        ul.innerHTML = "";

        if (items.length === 0) {
            const li = document.createElement("li");
            li.className = "menu-empty";
            li.innerHTML = "<span>Aucun élément pour le moment.</span>";
            ul.appendChild(li);
            return;
        }

        items.forEach((item) => {
            const li = document.createElement("li");
            li.dataset.id = String(item.id);
            li.innerHTML = `<span>${escapeHtml(item.nom)}</span><span class="price">${formatPrix(item.prix)}</span>`;
            ul.appendChild(li);
        });
    }

    function hideEmptyCategories() {
        document.querySelectorAll("section.menu-category").forEach((sec) => {
            const ul = sec.querySelector(".category-content ul");
            if (!ul) return;
            const hasItems = ul.querySelector("li:not(.menu-empty)");
            sec.classList.toggle("menu-category--empty-section", !hasItems);
        });
    }

    fetch("./php/menu.php")
        .then((r) => r.json())
        .then((data) => {
            if (!data.success) {
                console.error("Erreur chargement menu :", data.message);
                return;
            }

            const byType = { entree: [], plat: [], dessert: [], boisson: [] };
            data.menu.forEach((item) => {
                if (byType[item.type]) byType[item.type].push(item);
            });

            Object.keys(byType).forEach((type) => populateCategory(type, byType[type]));
            hideEmptyCategories();

            // Activer la recherche après injection du contenu
            if (typeof window.initMenuSearch === "function") {
                window.initMenuSearch();
            }
        })
        .catch((err) => {
            console.error("Impossible de charger le menu :", err);
            ["entree", "plat", "dessert", "boisson"].forEach((type) => {
                const ul = document.getElementById(`menu-list-${type}`);
                if (ul) {
                    ul.innerHTML = '<li class="menu-empty"><span>Erreur de chargement.</span></li>';
                }
            });
        });
})();
