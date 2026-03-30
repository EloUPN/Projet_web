// Vérification admin
if (!isLoggedIn() || !getCurrentUser().is_admin) {
    alert("Accès réservé aux administrateurs.");
    window.location.href = "./profil.html";
}

const adminUser = getCurrentUser();
const adminId   = adminUser.id;

// ── Utilitaires ──────────────────────────────────────────────────────────────
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatPrix(prix) {
    const p = parseFloat(prix);
    if (isNaN(p)) return "—";
    return p === Math.floor(p) ? `${Math.floor(p)}\u00a0€` : `${p.toFixed(2)}\u00a0€`;
}

function statutBadgeHtml(statut) {
    const classes = {
        "En attente": "statut-badge--en-attente",
        "Validée":    "statut-badge--validee",
        "Annulée":    "statut-badge--annulee",
        "Refusée":    "statut-badge--refusee",
    };
    const cls = classes[statut] || "statut-badge--en-attente";
    return `<span class="statut-badge ${cls}">${escapeHtml(statut)}</span>`;
}

function typeLabel(type) {
    const labels = { entree: "Entrée", plat: "Plat", dessert: "Dessert", boisson: "Boisson" };
    return labels[type] || type;
}

// ── Gestion des onglets ───────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.tab;

        document.querySelectorAll(".tab-btn").forEach((b) => {
            b.classList.toggle("active", b.dataset.tab === target);
            b.setAttribute("aria-selected", b.dataset.tab === target ? "true" : "false");
        });
        document.querySelectorAll(".tab-content").forEach((panel) => {
            const show = panel.id === `tab-${target}`;
            panel.hidden = !show;
        });

        if (target === "menu") loadMenu();
    });
});

// ── RÉSERVATIONS ─────────────────────────────────────────────────────────────
let allReservations  = [];
let activeFilter     = "";   // valeur du filtre statut, synchronisée en temps réel

document.getElementById("filter-statut").addEventListener("change", function () {
    activeFilter = this.value;
    applyFilter();
});

function applyFilter() {
    const list = activeFilter
        ? allReservations.filter((r) => r.statut === activeFilter)
        : allReservations;
    renderReservations(list);
}

function loadReservations() {
    const container = document.getElementById("dashboard-reservations");
    container.innerHTML = `<p class="dashboard-loading">Chargement…</p>`;

    fetch(`./php/reservation.php?admin=1&user_id=${adminId}`)
        .then((r) => r.json())
        .then((data) => {
            if (!data.success) {
                container.innerHTML = `<p class="dashboard-error">Erreur : ${escapeHtml(data.message)}</p>`;
                return;
            }
            allReservations = data.reservations || [];
            applyFilter();   // réapplique le filtre actif (variable JS, pas de lecture DOM)
        })
        .catch(() => {
            container.innerHTML = `<p class="dashboard-error">Impossible de charger les réservations.</p>`;
        });
}

function renderReservations(list) {
    const container = document.getElementById("dashboard-reservations");

    if (list.length === 0) {
        container.innerHTML = `<p class="dashboard-empty">Aucune réservation trouvée.</p>`;
        return;
    }

    const cards = list.map((r) => {
        const isPending = r.statut === "En attente";
        const actions   = isPending
            ? `<div class="res-card-actions">
                   <button class="btn btn-sm btn-validate" data-id="${r.id}">Valider</button>
                   <button class="btn btn-sm btn-refuse" data-id="${r.id}">Refuser</button>
               </div>`
            : "";

        return `
            <div class="res-card" data-id="${r.id}">
                <div class="res-card-header">
                    <span class="res-card-client">
                        ${escapeHtml(r.user_prenom)} ${escapeHtml(r.user_nom)}
                    </span>
                    ${statutBadgeHtml(r.statut)}
                </div>
                <div class="res-card-body">
                    <p><strong>Email :</strong> ${escapeHtml(r.user_email)}</p>
                    <p><strong>Date :</strong> ${escapeHtml(r.date)} à ${escapeHtml(String(r.heure).slice(0, 5))}</p>
                    <p><strong>Personnes :</strong> ${escapeHtml(String(r.personnes))}</p>
                    ${r.message ? `<p><strong>Message :</strong> ${escapeHtml(r.message)}</p>` : ""}
                </div>
                ${actions}
            </div>
        `;
    }).join("");

    container.innerHTML = `<div class="res-card-grid">${cards}</div>`;

    container.querySelectorAll(".btn-validate").forEach((btn) => {
        btn.addEventListener("click", () => updateStatut(parseInt(btn.dataset.id, 10), "Validée"));
    });
    container.querySelectorAll(".btn-refuse").forEach((btn) => {
        btn.addEventListener("click", () => updateStatut(parseInt(btn.dataset.id, 10), "Refusée"));
    });
}

function updateStatut(reservationId, statut) {
    fetch("./php/reservation.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-HTTP-Method-Override": "PUT" },
        body: JSON.stringify({ id: reservationId, user_id: adminId, action: "update_statut", statut }),
    })
        .then((r) => r.json())
        .then((data) => {
            if (data.success) loadReservations();
            else alert(data.message || "Erreur lors de la mise à jour.");
        })
        .catch(() => alert("Impossible de joindre le serveur."));
}


// ── MENU ─────────────────────────────────────────────────────────────────────
let allMenuItems = [];

function loadMenu() {
    const container = document.getElementById("dashboard-menu-items");
    container.innerHTML = `<p class="dashboard-loading">Chargement…</p>`;

    fetch("./php/menu.php")
        .then((r) => r.json())
        .then((data) => {
            if (!data.success) {
                container.innerHTML = `<p class="dashboard-error">Erreur : ${escapeHtml(data.message)}</p>`;
                return;
            }
            allMenuItems = data.menu || [];
            renderMenu(allMenuItems);
        })
        .catch(() => {
            container.innerHTML = `<p class="dashboard-error">Impossible de charger le menu.</p>`;
        });
}

function renderMenu(items) {
    const container = document.getElementById("dashboard-menu-items");

    if (items.length === 0) {
        container.innerHTML = `<p class="dashboard-empty">Le menu est vide.</p>`;
        return;
    }

    const groups = { entree: [], plat: [], dessert: [], boisson: [] };
    items.forEach((item) => { if (groups[item.type]) groups[item.type].push(item); });

    const order = ["entree", "plat", "dessert", "boisson"];
    let html = "";

    order.forEach((type) => {
        if (groups[type].length === 0) return;
        const rows = groups[type].map((item) => `
            <tr data-id="${item.id}">
                <td>${escapeHtml(item.nom)}</td>
                <td>${formatPrix(item.prix)}</td>
                <td class="menu-table-actions">
                    <button class="btn btn-sm btn-edit-item" data-id="${item.id}"
                            data-type="${escapeHtml(item.type)}"
                            data-nom="${escapeHtml(item.nom)}"
                            data-prix="${escapeHtml(String(item.prix))}">
                        Modifier
                    </button>
                    <button class="btn btn-sm btn-delete-item" data-id="${item.id}">
                        Supprimer
                    </button>
                </td>
            </tr>
        `).join("");

        html += `
            <div class="menu-group">
                <h3 class="menu-group-title">${escapeHtml(typeLabel(type))}s</h3>
                <table class="menu-table">
                    <thead>
                        <tr><th>Nom</th><th>Prix</th><th>Actions</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    });

    container.innerHTML = html;

    container.querySelectorAll(".btn-edit-item").forEach((btn) => {
        btn.addEventListener("click", () => startEditMenuItem(btn));
    });
    container.querySelectorAll(".btn-delete-item").forEach((btn) => {
        btn.addEventListener("click", () => deleteMenuItem(parseInt(btn.dataset.id, 10)));
    });
}

// Formulaire
const formMenuItem     = document.getElementById("formMenuItem");
const menuFormTitle    = document.getElementById("menu-form-title");
const menuItemIdInput  = document.getElementById("menu-item-id");
const menuTypeInput    = document.getElementById("menu-item-type");
const menuNomInput     = document.getElementById("menu-item-nom");
const menuPrixInput    = document.getElementById("menu-item-prix");
const menuSubmitBtn    = document.getElementById("menu-submit-btn");
const menuCancelEditBtn = document.getElementById("menu-cancel-edit-btn");

function resetMenuForm() {
    menuItemIdInput.value  = "";
    menuTypeInput.value    = "entree";
    menuNomInput.value     = "";
    menuPrixInput.value    = "";
    menuFormTitle.textContent = "Ajouter un élément";
    menuSubmitBtn.textContent = "Ajouter";
    menuCancelEditBtn.hidden  = true;
}

function startEditMenuItem(btn) {
    menuItemIdInput.value  = btn.dataset.id;
    menuTypeInput.value    = btn.dataset.type;
    menuNomInput.value     = btn.dataset.nom;
    menuPrixInput.value    = btn.dataset.prix;
    menuFormTitle.textContent = "Modifier l'élément";
    menuSubmitBtn.textContent = "Enregistrer";
    menuCancelEditBtn.hidden  = false;
    menuNomInput.focus();
    menuNomInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

menuCancelEditBtn.addEventListener("click", resetMenuForm);

formMenuItem.addEventListener("submit", (e) => {
    e.preventDefault();

    const id   = menuItemIdInput.value ? parseInt(menuItemIdInput.value, 10) : null;
    const type = menuTypeInput.value;
    const nom  = menuNomInput.value.trim();
    const prix = parseFloat(menuPrixInput.value);

    if (!nom) { menuNomInput.focus(); return; }
    if (isNaN(prix) || prix < 0) { menuPrixInput.focus(); return; }

    const isEdit = id !== null;
    const payload = { user_id: adminId, type, nom, prix };
    const method  = isEdit ? "PUT" : "POST";

    if (isEdit) payload.id = id;

    fetch("./php/menu.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(isEdit ? { "X-HTTP-Method-Override": "PUT" } : {}),
        },
        body: JSON.stringify(payload),
    })
        .then((r) => r.json())
        .then((data) => {
            if (data.success) {
                resetMenuForm();
                loadMenu();
            } else {
                alert(data.message || "Erreur.");
            }
        })
        .catch(() => alert("Impossible de joindre le serveur."));
});

function deleteMenuItem(id) {
    if (!confirm("Supprimer cet élément du menu ?")) return;

    fetch("./php/menu.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-HTTP-Method-Override": "DELETE" },
        body: JSON.stringify({ user_id: adminId, id }),
    })
        .then((r) => r.json())
        .then((data) => {
            if (data.success) loadMenu();
            else alert(data.message || "Erreur.");
        })
        .catch(() => alert("Impossible de joindre le serveur."));
}

// ── Init ─────────────────────────────────────────────────────────────────────
loadReservations();
