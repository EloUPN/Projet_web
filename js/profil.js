// Rediriger si pas connecté
if (!isLoggedIn()) {
    window.location.href = "./connexion.html";
}

const user = getCurrentUser();
const userId = user.id;

document.getElementById("infosUser").innerHTML = `
    <h2>Bienvenue ${user.prenom}</h2>
    <p>Nom : ${user.nom}</p>
    <p>Email : ${user.email}</p>
`;

function todayLocalISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function escapeHtmlAttr(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;");
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function normalizeTimeForInput(t) {
    if (!t) return "";
    const s = String(t).trim();
    return s.length >= 5 ? s.slice(0, 5) : s;
}

function parseHeureHHMM(str) {
    const s = String(str).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (!Number.isFinite(h) || !Number.isFinite(min) || min < 0 || min > 59 || h < 0 || h > 23) {
        return null;
    }
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function isHeureDansCreneauService(hhmm) {
    const norm = parseHeureHHMM(hhmm);
    if (!norm) return false;
    const [h, m] = norm.split(":").map((x) => parseInt(x, 10));
    return h * 60 + m >= 12 * 60 && h * 60 + m <= 22 * 60;
}

const MSG_REQUIS = "Veuillez remplir ce champ.";
const MSG_PERSONNES = "Réservations autorisées entre 1 et 20 personnes";

function updatePersonnesValidity(el) {
    el.setCustomValidity("");
    if (el.validity.badInput) {
        el.setCustomValidity(MSG_PERSONNES);
        return;
    }
    if (el.validity.valueMissing) return;
    const v = parseInt(el.value, 10);
    if (!Number.isFinite(v) || v < 1 || v > 20) {
        el.setCustomValidity(MSG_PERSONNES);
    }
}

function formatDateISOversFR(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function updateDateMinValidity(el) {
    el.setCustomValidity("");
    if (el.validity.valueMissing) return;
    if (el.min && el.value && el.value < el.min) {
        el.setCustomValidity(
            `La date doit être le ${formatDateISOversFR(el.min)} ou ultérieure.`
        );
    }
}

function parseReservationDateTime(r) {
    const dateStr = String(r.date || "").trim();
    const timeStr = normalizeTimeForInput(r.heure || "");
    const parts = dateStr.split("-").map(Number);
    const y = parts[0];
    const mo = parts[1];
    const d = parts[2];
    if (!y || !mo || !d) return null;
    const [hh, mm] = timeStr.split(":").map((x) => parseInt(x, 10));
    const h = Number.isFinite(hh) ? hh : 0;
    const min = Number.isFinite(mm) ? mm : 0;
    const dt = new Date(y, mo - 1, d, h, min, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
}

function isReservationPast(r) {
    const dt = parseReservationDateTime(r);
    if (!dt) return false;
    return dt.getTime() < Date.now();
}

function sortByDateTimeAsc(a, b) {
    const ta = parseReservationDateTime(a)?.getTime() ?? 0;
    const tb = parseReservationDateTime(b)?.getTime() ?? 0;
    return ta - tb;
}

function sortByDateTimeDesc(a, b) {
    return sortByDateTimeAsc(b, a);
}

function reservationSectionsSkeleton() {
    return `
        <section class="reservation-section" aria-labelledby="res-futures-title">
            <h2 id="res-futures-title">Mes réservations futures</h2>
            <ul id="reservationListFuture" class="reservation-list"></ul>
        </section>
        <section class="reservation-section" aria-labelledby="res-passees-title">
            <h2 id="res-passees-title">Mes réservations passées</h2>
            <ul id="reservationListPast" class="reservation-list"></ul>
        </section>
    `;
}

function loadReservations() {
    fetch(`./php/reservation.php?user_id=${userId}`)
        .then((response) => response.json())
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
        .catch((error) => {
            console.error("Erreur lors du chargement des réservations :", error);
            document.getElementById("infosReservation").innerHTML =
                reservationSectionsSkeleton() +
                `<p class="reservation-load-error">Erreur lors du chargement des réservations.</p>`;
        });
}

function buildReservationLi(r, editable) {
    const id = parseInt(r.id, 10);
    const msgDisplay = r.message && String(r.message).trim() ? escapeHtml(r.message) : "—";
    const actions = editable
        ? `
            <div class="reservation-actions">
                <button type="button" class="edit-btn" data-id="${id}">Modifier</button>
                <button type="button" class="delete-btn" data-id="${id}">Supprimer</button>
            </div>`
        : "";
    const itemClass = editable ? "reservation-item" : "reservation-item reservation-item--past";

    const li = document.createElement("li");
    li.className = itemClass;
    li.dataset.id = String(id);
    li.dataset.editable = editable ? "1" : "0";
    li.innerHTML = `
            <div class="reservation-info">
                <p><strong>Date :</strong> ${escapeHtml(String(r.date))}</p>
                <p><strong>Heure :</strong> ${escapeHtml(String(r.heure))}</p>
                <p><strong>Personnes :</strong> ${escapeHtml(String(r.personnes))}</p>
                <p><strong>Message :</strong> ${msgDisplay}</p>
            </div>
            ${actions}
        `;
    return li;
}

function displayReservations(reservations) {
    const container = document.getElementById("infosReservation");
    container.innerHTML = reservationSectionsSkeleton();

    const ulFuture = document.getElementById("reservationListFuture");
    const ulPast = document.getElementById("reservationListPast");

    if (!reservations || reservations.length === 0) {
        ulFuture.innerHTML = `<li class="reservation-empty">Aucune réservation future.</li>`;
        ulPast.innerHTML = `<li class="reservation-empty">Aucune réservation passée.</li>`;
        return;
    }

    const futures = reservations.filter((r) => !isReservationPast(r)).sort(sortByDateTimeAsc);
    const pasts = reservations.filter((r) => isReservationPast(r)).sort(sortByDateTimeDesc);

    if (futures.length === 0) {
        ulFuture.innerHTML = `<li class="reservation-empty">Aucune réservation future.</li>`;
    } else {
        futures.forEach((r) => ulFuture.appendChild(buildReservationLi(r, true)));
    }

    if (pasts.length === 0) {
        ulPast.innerHTML = `<li class="reservation-empty">Aucune réservation passée.</li>`;
    } else {
        pasts.forEach((r) => ulPast.appendChild(buildReservationLi(r, false)));
    }

    addReservationEventListeners();
}

function showEditForm(reservationId) {
    const id = parseInt(reservationId, 10);
    const listItem = document.querySelector(`li.reservation-item[data-id="${id}"]`);
    if (!listItem) {
        console.error("Élément li introuvable pour id:", id);
        return;
    }
    if (listItem.dataset.editable !== "1") {
        alert("Les réservations passées ne peuvent pas être modifiées.");
        return;
    }

    const paragraphs = listItem.querySelectorAll(".reservation-info p");
    const currentDate = paragraphs[0]?.textContent.replace("Date : ", "").trim() || "";
    const currentHeureRaw = paragraphs[1]?.textContent.replace("Heure : ", "").trim() || "";
    const currentHeure = normalizeTimeForInput(currentHeureRaw);
    const currentPersonnes = paragraphs[2]?.textContent.replace("Personnes : ", "").trim() || "1";
    const currentMessage = paragraphs[3]?.textContent.replace("Message : ", "").trim();
    const safeMessage = currentMessage === "—" ? "" : currentMessage || "";

    listItem.innerHTML = `
        <div class="edit-form">
            <h3>Modifier la réservation</h3>
            <label>Date :
                <input type="date" id="edit-date-${id}" value="${escapeHtmlAttr(currentDate)}" required>
            </label>
            <label>Heure (ouverture de 12:00 à 22:00) :
                <input type="text" id="edit-heure-${id}" class="input-heure-hhmm" value="${escapeHtmlAttr(currentHeure)}" inputmode="numeric" autocomplete="off" placeholder="14:30" maxlength="5" spellcheck="false" required title="Format 24 h : HH:MM">
            </label>
            <label>Personnes :
                <input type="number" id="edit-personnes-${id}" value="${escapeHtmlAttr(currentPersonnes)}" min="1" max="20" required>
            </label>
            <label>Message :
                <input type="text" id="edit-message-${id}" value="${escapeHtmlAttr(safeMessage)}">
            </label>
            <div class="reservation-actions">
                <button type="button" class="save-btn" data-id="${id}">Enregistrer</button>
                <button type="button" class="cancel-btn" data-id="${id}">Annuler</button>
            </div>
        </div>
    `;
    listItem.dataset.editable = "1";

    const dateField = document.getElementById(`edit-date-${id}`);
    const heureField = document.getElementById(`edit-heure-${id}`);
    const personnesField = document.getElementById(`edit-personnes-${id}`);
    dateField.min = todayLocalISO();
    dateField.addEventListener("invalid", () => {
        if (dateField.validity.valueMissing) {
            dateField.setCustomValidity(MSG_REQUIS);
        } else {
            updateDateMinValidity(dateField);
        }
    });
    dateField.addEventListener("input", () => {
        dateField.setCustomValidity("");
        updateDateMinValidity(dateField);
    });
    dateField.addEventListener("change", () => {
        dateField.setCustomValidity("");
        updateDateMinValidity(dateField);
    });

    heureField.addEventListener("invalid", () => {
        if (heureField.validity.valueMissing) {
            heureField.setCustomValidity(MSG_REQUIS);
        }
    });
    heureField.addEventListener("input", () => heureField.setCustomValidity(""));
    heureField.addEventListener("blur", () => {
        const v = parseHeureHHMM(heureField.value);
        if (v) heureField.value = v;
    });

    personnesField.addEventListener("invalid", () => {
        if (personnesField.validity.valueMissing) {
            personnesField.setCustomValidity(MSG_REQUIS);
        } else {
            updatePersonnesValidity(personnesField);
        }
    });
    personnesField.addEventListener("input", () => {
        personnesField.setCustomValidity("");
        updatePersonnesValidity(personnesField);
    });

    listItem.querySelector(".save-btn").addEventListener("click", () => {
        dateField.min = todayLocalISO();
        dateField.setCustomValidity("");
        updateDateMinValidity(dateField);
        if (!dateField.checkValidity()) {
            dateField.reportValidity();
            return;
        }

        heureField.setCustomValidity("");
        const heureRaw = heureField.value.trim();
        if (!heureRaw) {
            heureField.setCustomValidity(MSG_REQUIS);
            heureField.reportValidity();
            return;
        }

        const heureNorm = parseHeureHHMM(heureRaw);
        if (!heureNorm) {
            heureField.setCustomValidity(
                "Indiquez une heure au format 24 h (HH:MM), par exemple 14:30."
            );
            heureField.reportValidity();
            return;
        }
        if (!isHeureDansCreneauService(heureNorm)) {
            heureField.setCustomValidity(
                "L’heure doit être comprise entre 12:00 et 22:00 (horaires d’ouverture)."
            );
            heureField.reportValidity();
            return;
        }
        heureField.value = heureNorm;
        heureField.setCustomValidity("");

        personnesField.setCustomValidity("");
        updatePersonnesValidity(personnesField);
        if (!personnesField.checkValidity()) {
            personnesField.reportValidity();
            return;
        }

        const newDate = dateField.value;
        const newHeure = heureNorm;
        const newPersonnes = parseInt(personnesField.value, 10);
        const newMessage = document.getElementById(`edit-message-${id}`).value.trim();

        updateReservation({
            id,
            user_id: parseInt(userId, 10),
            date: newDate,
            heure: newHeure,
            personnes: newPersonnes,
            message: newMessage
        });
    });

    listItem.querySelector(".cancel-btn").addEventListener("click", () => {
        loadReservations();
    });
}

function updateReservation(reservation) {
    fetch("./php/reservation.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-HTTP-Method-Override": "PUT"
        },
        body: JSON.stringify(reservation)
    })
        .then(async (response) => {
            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error("Réponse invalide du serveur.");
            }
            if (!response.ok) {
                throw new Error(data.message || `Erreur HTTP ${response.status}`);
            }
            return data;
        })
        .then((data) => {
            if (data.success) {
                loadReservations();
            } else {
                alert(data.message || "Erreur lors de la mise à jour.");
            }
        })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour :", error);
            alert(error.message || "Impossible de joindre le serveur.");
        });
}

function deleteReservation(reservationId) {
    const id = parseInt(reservationId, 10);
    if (!confirm("Supprimer cette réservation ?")) return;

    fetch("./php/reservation.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-HTTP-Method-Override": "DELETE"
        },
        body: JSON.stringify({ id, user_id: parseInt(userId, 10) })
    })
        .then(async (response) => {
            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error("Réponse invalide du serveur.");
            }
            if (!response.ok) {
                throw new Error(data.message || `Erreur HTTP ${response.status}`);
            }
            return data;
        })
        .then((data) => {
            if (data.success) {
                loadReservations();
            } else {
                alert(data.message || "Erreur lors de la suppression.");
            }
        })
        .catch((error) => {
            console.error("Erreur lors de la suppression :", error);
            alert(error.message || "Impossible de joindre le serveur.");
        });
}

function addReservationEventListeners() {
    document.querySelectorAll("#infosReservation .edit-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            showEditForm(event.currentTarget.dataset.id);
        });
    });

    document.querySelectorAll("#infosReservation .delete-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            deleteReservation(event.currentTarget.dataset.id);
        });
    });
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
    window.location.href = "./index.html";
});

loadReservations();
