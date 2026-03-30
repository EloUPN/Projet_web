if (!isLoggedIn()) {
    window.location.href = "./connexion.html";
}

const user   = getCurrentUser();
const userId = user.id;

// ── Informations utilisateur ─────────────────────────────────────────────────
const dashboardBtn = user.is_admin
    ? `<a href="./dashboard.html" class="btn btn-secondary profil-dashboard-btn">
           &#9881; Tableau de bord admin
       </a>`
    : "";

document.getElementById("infosUser").innerHTML = `
    <div class="profil-card">
        <h2>Bienvenue, ${escapeHtml(user.prenom)}</h2>
        <p><strong>Nom :</strong> ${escapeHtml(user.nom)}</p>
        <p><strong>Email :</strong> ${escapeHtml(user.email)}</p>
        <div class="profil-actions">
            ${dashboardBtn}
            <button id="logoutBtn" class="btn btn-outline">Déconnexion</button>
        </div>
    </div>
`;

document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
    window.location.href = "./index.html";
});

// ── Utilitaires ──────────────────────────────────────────────────────────────
function todayLocalISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;");
}

function normalizeTimeForInput(t) {
    if (!t) return "";
    const s = String(t).trim();
    return s.length >= 5 ? s.slice(0, 5) : s;
}


function formatDateFR(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const [y, mo, d] = iso.split("-");
    return `${d}/${mo}/${y}`;
}

function parseReservationDateTime(r) {
    const dateStr = String(r.date || "").trim();
    const timeStr = normalizeTimeForInput(r.heure || "");
    const parts   = dateStr.split("-").map(Number);
    if (!parts[0] || !parts[1] || !parts[2]) return null;
    const [hh, mm] = timeStr.split(":").map((x) => parseInt(x, 10));
    const h   = Number.isFinite(hh) ? hh : 0;
    const min = Number.isFinite(mm) ? mm : 0;
    const dt  = new Date(parts[0], parts[1] - 1, parts[2], h, min, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
}

function isReservationPast(r) {
    const dt = parseReservationDateTime(r);
    if (!dt) return false;
    return dt.getTime() < Date.now();
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

const MSG_REQUIS    = "Veuillez remplir ce champ.";
const MSG_PERSONNES = "Réservations autorisées entre 1 et 20 personnes.";

function updatePersonnesValidity(el) {
    el.setCustomValidity("");
    if (el.validity.badInput) { el.setCustomValidity(MSG_PERSONNES); return; }
    if (el.validity.valueMissing) return;
    const v = parseInt(el.value, 10);
    if (!Number.isFinite(v) || v < 1 || v > 20) el.setCustomValidity(MSG_PERSONNES);
}

function updateDateMinValidity(el) {
    el.setCustomValidity("");
    if (el.validity.valueMissing) return;
    if (el.min && el.value && el.value < el.min) {
        el.setCustomValidity(`La date doit être le ${formatDateFR(el.min)} ou ultérieure.`);
    }
}

// ── Squelette HTML des sections ──────────────────────────────────────────────
function reservationSectionsSkeleton() {
    return `
        <section class="reservation-section" aria-labelledby="res-futures-title">
            <h2 id="res-futures-title">Mes réservations à venir</h2>
            <ul id="reservationListFuture" class="reservation-list"></ul>
        </section>
        <section class="reservation-section" aria-labelledby="res-passees-title">
            <h2 id="res-passees-title">Mes réservations passées</h2>
            <ul id="reservationListPast" class="reservation-list"></ul>
        </section>
    `;
}

// ── Chargement ────────────────────────────────────────────────────────────────
function loadReservations() {
    fetch(`./php/reservation.php?user_id=${userId}`)
        .then((r) => r.json())
        .then((data) => {
            const container = document.getElementById("infosReservation");
            if (data.success) {
                displayReservations(data.reservations);
            } else {
                container.innerHTML =
                    reservationSectionsSkeleton() +
                    `<p class="reservation-load-error">Aucune réservation pour le moment.</p>`;
            }
        })
        .catch(() => {
            document.getElementById("infosReservation").innerHTML =
                reservationSectionsSkeleton() +
                `<p class="reservation-load-error">Erreur lors du chargement des réservations.</p>`;
        });
}

// ── Construction d'un élément de liste ────────────────────────────────────────
function buildReservationLi(r) {
    const id     = parseInt(r.id, 10);
    const isPast = isReservationPast(r);
    const statut = r.statut || "En attente";
    const msg    = r.message && String(r.message).trim() ? escapeHtml(r.message) : "—";

    const canModify = !isPast && statut === "En attente";
    const canCancel = !isPast && statut !== "Annulée" && statut !== "Refusée";

    const actions = (canModify || canCancel)
        ? `<div class="reservation-actions">
               ${canModify ? `<button type="button" class="edit-btn" data-id="${id}">Modifier</button>` : ""}
               ${canCancel ? `<button type="button" class="cancel-reservation-btn" data-id="${id}">Annuler</button>` : ""}
           </div>`
        : "";

    const li = document.createElement("li");
    li.className    = "reservation-item" + (isPast ? " reservation-item--past" : "");
    li.dataset.id   = String(id);
    li.dataset.editable = canModify ? "1" : "0";
    li.innerHTML = `
        <div class="reservation-info">
            <p><strong>Date :</strong> ${escapeHtml(String(r.date))}</p>
            <p><strong>Heure :</strong> ${escapeHtml(normalizeTimeForInput(String(r.heure)))}</p>
            <p><strong>Personnes :</strong> ${escapeHtml(String(r.personnes))}</p>
            <p><strong>Message :</strong> ${msg}</p>
            <p><strong>Statut :</strong> ${statutBadgeHtml(statut)}</p>
        </div>
        ${actions}
    `;
    return li;
}

// ── Affichage ─────────────────────────────────────────────────────────────────
function displayReservations(reservations) {
    const container = document.getElementById("infosReservation");
    container.innerHTML = reservationSectionsSkeleton();

    const ulFuture = document.getElementById("reservationListFuture");
    const ulPast   = document.getElementById("reservationListPast");

    if (!reservations || reservations.length === 0) {
        ulFuture.innerHTML = `<li class="reservation-empty">Aucune réservation à venir.</li>`;
        ulPast.innerHTML   = `<li class="reservation-empty">Aucune réservation passée.</li>`;
        return;
    }

    const futures = reservations.filter((r) => !isReservationPast(r))
        .sort((a, b) => (parseReservationDateTime(a)?.getTime() ?? 0) - (parseReservationDateTime(b)?.getTime() ?? 0));
    const pasts = reservations.filter((r) => isReservationPast(r))
        .sort((a, b) => (parseReservationDateTime(b)?.getTime() ?? 0) - (parseReservationDateTime(a)?.getTime() ?? 0));

    if (futures.length === 0) {
        ulFuture.innerHTML = `<li class="reservation-empty">Aucune réservation à venir.</li>`;
    } else {
        futures.forEach((r) => ulFuture.appendChild(buildReservationLi(r)));
    }

    if (pasts.length === 0) {
        ulPast.innerHTML = `<li class="reservation-empty">Aucune réservation passée.</li>`;
    } else {
        pasts.forEach((r) => ulPast.appendChild(buildReservationLi(r)));
    }

    addReservationEventListeners();
}

// ── Générateur de créneaux horaires ──────────────────────────────────────────
function buildTimePicker(container, hiddenInput, errorEl, preselected) {
    for (let h = 12; h <= 22; h++) {
        const minutes = (h === 22) ? [0] : [0, 30];
        minutes.forEach((m) => {
            const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            const btn  = document.createElement("button");
            btn.type         = "button";
            btn.className    = "time-slot";
            btn.textContent  = time;
            btn.dataset.time = time;
            btn.setAttribute("aria-pressed", "false");

            if (time === preselected) {
                btn.classList.add("time-slot--selected");
                btn.setAttribute("aria-pressed", "true");
            }

            btn.addEventListener("click", () => {
                container.querySelectorAll(".time-slot").forEach((s) => {
                    s.classList.remove("time-slot--selected");
                    s.setAttribute("aria-pressed", "false");
                });
                btn.classList.add("time-slot--selected");
                btn.setAttribute("aria-pressed", "true");
                hiddenInput.value = time;
                if (errorEl) errorEl.hidden = true;
            });

            container.appendChild(btn);
        });
    }
}

// ── Formulaire de modification ────────────────────────────────────────────────
function showEditForm(reservationId) {
    const id       = parseInt(reservationId, 10);
    const listItem = document.querySelector(`li.reservation-item[data-id="${id}"]`);
    if (!listItem || listItem.dataset.editable !== "1") return;

    const paragraphs   = listItem.querySelectorAll(".reservation-info p");
    const currentDate  = paragraphs[0]?.textContent.replace("Date : ", "").trim() || "";
    const currentHeure = normalizeTimeForInput(paragraphs[1]?.textContent.replace("Heure : ", "").trim() || "");
    const currentPerso = paragraphs[2]?.textContent.replace("Personnes : ", "").trim() || "1";
    const rawMsg       = paragraphs[3]?.textContent.replace("Message : ", "").trim();
    const safeMsg      = rawMsg === "—" ? "" : rawMsg || "";

    listItem.innerHTML = `
        <div class="edit-form">
            <h3>Modifier la réservation</h3>
            <label>Date :
                <input type="date" id="edit-date-${id}" value="${escapeHtmlAttr(currentDate)}" required>
            </label>
            <label>Horaire :</label>
            <input type="hidden" id="edit-heure-${id}" value="${escapeHtmlAttr(currentHeure)}">
            <div id="edit-time-picker-${id}" class="time-picker"></div>
            <p id="edit-heure-error-${id}" class="field-error" hidden>Veuillez sélectionner un horaire.</p>
            <label>Personnes :
                <input type="number" id="edit-personnes-${id}"
                       value="${escapeHtmlAttr(currentPerso)}" min="1" max="20" required>
            </label>
            <label>Message :
                <input type="text" id="edit-message-${id}" value="${escapeHtmlAttr(safeMsg)}">
            </label>
            <div class="reservation-actions">
                <button type="button" class="save-btn" data-id="${id}">Enregistrer</button>
                <button type="button" class="cancel-btn" data-id="${id}">Annuler</button>
            </div>
        </div>
    `;
    listItem.dataset.editable = "1";

    const dateField      = document.getElementById(`edit-date-${id}`);
    const heureHidden    = document.getElementById(`edit-heure-${id}`);
    const timePickerEl   = document.getElementById(`edit-time-picker-${id}`);
    const heureError     = document.getElementById(`edit-heure-error-${id}`);
    const personnesField = document.getElementById(`edit-personnes-${id}`);

    // Générer la grille de créneaux, pré-sélectionner l'heure actuelle
    buildTimePicker(timePickerEl, heureHidden, heureError, currentHeure);

    dateField.min = todayLocalISO();
    dateField.addEventListener("invalid", () => {
        if (dateField.validity.valueMissing) dateField.setCustomValidity(MSG_REQUIS);
        else updateDateMinValidity(dateField);
    });
    dateField.addEventListener("input",  () => { dateField.setCustomValidity(""); updateDateMinValidity(dateField); });
    dateField.addEventListener("change", () => { dateField.setCustomValidity(""); updateDateMinValidity(dateField); });

    personnesField.addEventListener("invalid", () => {
        if (personnesField.validity.valueMissing) personnesField.setCustomValidity(MSG_REQUIS);
        else updatePersonnesValidity(personnesField);
    });
    personnesField.addEventListener("input", () => { personnesField.setCustomValidity(""); updatePersonnesValidity(personnesField); });

    listItem.querySelector(".save-btn").addEventListener("click", () => {
        dateField.min = todayLocalISO();
        dateField.setCustomValidity(""); updateDateMinValidity(dateField);
        if (!dateField.checkValidity()) { dateField.reportValidity(); return; }

        if (!heureHidden.value) {
            heureError.hidden = false;
            heureError.scrollIntoView({ behavior: "smooth", block: "nearest" });
            return;
        }

        personnesField.setCustomValidity(""); updatePersonnesValidity(personnesField);
        if (!personnesField.checkValidity()) { personnesField.reportValidity(); return; }

        updateReservation({
            id,
            user_id:   parseInt(userId, 10),
            date:      dateField.value,
            heure:     heureHidden.value,
            personnes: parseInt(personnesField.value, 10),
            message:   document.getElementById(`edit-message-${id}`).value.trim(),
            action:    "update",
        });
    });

    listItem.querySelector(".cancel-btn").addEventListener("click", () => loadReservations());
}

// ── API calls ─────────────────────────────────────────────────────────────────
function apiCallJSON(url, payload, onSuccess) {
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-HTTP-Method-Override": "PUT" },
        body: JSON.stringify(payload),
    })
        .then(async (res) => {
            const text = await res.text();
            let data;
            try { data = text ? JSON.parse(text) : {}; }
            catch { throw new Error("Réponse invalide du serveur."); }
            return data;
        })
        .then((data) => {
            if (data.success) { onSuccess(); }
            else { alert(data.message || "Une erreur est survenue."); }
        })
        .catch((err) => {
            console.error(err);
            alert(err.message || "Impossible de joindre le serveur.");
        });
}

function updateReservation(reservation) {
    apiCallJSON("./php/reservation.php", reservation, loadReservations);
}

function cancelReservation(reservationId) {
    if (!confirm("Voulez-vous annuler cette réservation ?")) return;
    apiCallJSON(
        "./php/reservation.php",
        { id: parseInt(reservationId, 10), user_id: parseInt(userId, 10), action: "cancel" },
        loadReservations
    );
}

// ── Listeners ─────────────────────────────────────────────────────────────────
function addReservationEventListeners() {
    document.querySelectorAll("#infosReservation .edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => showEditForm(e.currentTarget.dataset.id));
    });
    document.querySelectorAll("#infosReservation .cancel-reservation-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => cancelReservation(e.currentTarget.dataset.id));
    });
}

loadReservations();
