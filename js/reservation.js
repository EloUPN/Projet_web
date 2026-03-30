if (!isLoggedIn()) {
    window.location.href = "./connexion.html";
}

// ── Utilitaires ──────────────────────────────────────────────────────────────
function todayLocalISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateFR(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function updateDateMinValidity(el) {
    el.setCustomValidity("");
    if (el.validity.valueMissing) return;
    if (el.min && el.value && el.value < el.min) {
        el.setCustomValidity(`La date doit être le ${formatDateFR(el.min)} ou ultérieure.`);
    }
}

// ── Sélecteur d'horaires ──────────────────────────────────────────────────────
const heureHidden  = document.getElementById("heure");
const timePicker   = document.getElementById("time-picker");
const heureError   = document.getElementById("heure-error");

(function generateTimeSlots() {
    for (let h = 12; h <= 22; h++) {
        const minutes = (h === 22) ? [0] : [0, 30];
        minutes.forEach((m) => {
            const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            const btn  = document.createElement("button");
            btn.type        = "button";
            btn.className   = "time-slot";
            btn.textContent = time;
            btn.dataset.time = time;
            btn.setAttribute("aria-pressed", "false");
            btn.addEventListener("click", () => selectSlot(btn, time));
            timePicker.appendChild(btn);
        });
    }
})();

function selectSlot(btn, time) {
    timePicker.querySelectorAll(".time-slot").forEach((s) => {
        s.classList.remove("time-slot--selected");
        s.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("time-slot--selected");
    btn.setAttribute("aria-pressed", "true");
    heureHidden.value  = time;
    heureError.hidden  = true;
}

// ── Validation date ───────────────────────────────────────────────────────────
const dateInput      = document.getElementById("date");
const personnesInput = document.getElementById("personnes");
const MSG_REQUIS     = "Veuillez remplir ce champ.";
const MSG_PERSONNES  = "Réservations autorisées entre 1 et 20 personnes.";

dateInput.min = todayLocalISO();

dateInput.addEventListener("invalid", () => {
    if (dateInput.validity.valueMissing) dateInput.setCustomValidity(MSG_REQUIS);
    else updateDateMinValidity(dateInput);
});
dateInput.addEventListener("input",  () => { dateInput.setCustomValidity(""); updateDateMinValidity(dateInput); });
dateInput.addEventListener("change", () => { dateInput.setCustomValidity(""); updateDateMinValidity(dateInput); });

function updatePersonnesValidity(el) {
    el.setCustomValidity("");
    if (el.validity.badInput) { el.setCustomValidity(MSG_PERSONNES); return; }
    if (el.validity.valueMissing) return;
    const v = parseInt(el.value, 10);
    if (!Number.isFinite(v) || v < 1 || v > 20) el.setCustomValidity(MSG_PERSONNES);
}

personnesInput.addEventListener("invalid", () => {
    if (personnesInput.validity.valueMissing) personnesInput.setCustomValidity(MSG_REQUIS);
    else updatePersonnesValidity(personnesInput);
});
personnesInput.addEventListener("input", () => {
    personnesInput.setCustomValidity("");
    updatePersonnesValidity(personnesInput);
});

// ── Soumission ────────────────────────────────────────────────────────────────
document.getElementById("formReservation").addEventListener("submit", function (event) {
    event.preventDefault();

    const form        = this;
    const currentUser = getCurrentUser();

    if (!currentUser) {
        window.location.href = "./connexion.html";
        return;
    }

    // Validation date
    dateInput.min = todayLocalISO();
    dateInput.setCustomValidity("");
    updateDateMinValidity(dateInput);
    if (!dateInput.checkValidity()) {
        dateInput.reportValidity();
        return;
    }

    // Validation horaire
    if (!heureHidden.value) {
        heureError.hidden = false;
        heureError.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (window.animateFormError) animateFormError(form);
        return;
    }

    // Validation personnes
    personnesInput.setCustomValidity("");
    updatePersonnesValidity(personnesInput);
    if (!personnesInput.checkValidity()) {
        personnesInput.reportValidity();
        return;
    }

    const formData = new FormData();
    formData.append("user_id",   currentUser.id);
    formData.append("date",      dateInput.value);
    formData.append("heure",     heureHidden.value);
    formData.append("personnes", parseInt(personnesInput.value, 10));
    formData.append("message",   document.getElementById("message").value.trim());

    fetch("./php/reservation.php", {
        method: "POST",
        body: formData,
    })
        .then((r) => r.json())
        .then((data) => {
            if (data.success) {
                if (window.animateFormSuccess) animateFormSuccess(form);
                setTimeout(() => { window.location.href = "./profil.html"; }, 520);
            } else {
                if (window.animateFormError) animateFormError(form);
                // Afficher l'erreur serveur sous le formulaire
                let errBox = document.getElementById("reservation-server-error");
                if (!errBox) {
                    errBox = document.createElement("p");
                    errBox.id        = "reservation-server-error";
                    errBox.className = "field-error";
                    form.appendChild(errBox);
                }
                errBox.textContent = data.message || "Une erreur est survenue.";
                errBox.hidden      = false;
            }
        })
        .catch(() => {
            let errBox = document.getElementById("reservation-server-error");
            if (!errBox) {
                errBox = document.createElement("p");
                errBox.id        = "reservation-server-error";
                errBox.className = "field-error";
                form.appendChild(errBox);
            }
            errBox.textContent = "Impossible de joindre le serveur.";
            errBox.hidden      = false;
        });
});
