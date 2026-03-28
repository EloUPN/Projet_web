// Vérifier si pas connecté
if (!isLoggedIn()) {
    window.location.href = "./connexion.html";
}

function todayLocalISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** « 9:30 » ou « 09:30 » → « HH:MM » ou null */
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
    const total = h * 60 + m;
    return total >= 12 * 60 && total <= 22 * 60;
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

/** AAAA-MM-JJ → JJ/MM/AAAA */
function formatDateISOversFR(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

/** Message français si la date est avant le minimum (remplace la bulle anglaise du navigateur) */
function updateDateMinValidity(el) {
    el.setCustomValidity("");
    if (el.validity.valueMissing) return;
    if (el.min && el.value && el.value < el.min) {
        el.setCustomValidity(
            `La date doit être le ${formatDateISOversFR(el.min)} ou ultérieure.`
        );
    }
}

const dateInput = document.getElementById("date");
const heureInput = document.getElementById("heure");
const personnesInput = document.getElementById("personnes");

if (dateInput) {
    dateInput.min = todayLocalISO();
    dateInput.addEventListener("invalid", () => {
        if (dateInput.validity.valueMissing) {
            dateInput.setCustomValidity(MSG_REQUIS);
        } else {
            updateDateMinValidity(dateInput);
        }
    });
    dateInput.addEventListener("input", () => {
        dateInput.setCustomValidity("");
        updateDateMinValidity(dateInput);
    });
    dateInput.addEventListener("change", () => {
        dateInput.setCustomValidity("");
        updateDateMinValidity(dateInput);
    });
}

if (heureInput) {
    heureInput.addEventListener("invalid", () => {
        if (heureInput.validity.valueMissing) {
            heureInput.setCustomValidity(MSG_REQUIS);
        }
    });
    heureInput.addEventListener("input", () => heureInput.setCustomValidity(""));
    heureInput.addEventListener("blur", () => {
        const v = parseHeureHHMM(heureInput.value);
        if (v) heureInput.value = v;
    });
}

if (personnesInput) {
    personnesInput.addEventListener("invalid", () => {
        if (personnesInput.validity.valueMissing) {
            personnesInput.setCustomValidity(MSG_REQUIS);
        } else {
            updatePersonnesValidity(personnesInput);
        }
    });
    personnesInput.addEventListener("input", () => {
        personnesInput.setCustomValidity("");
        updatePersonnesValidity(personnesInput);
    });
}

document.getElementById("formReservation").addEventListener("submit", function (event) {
    event.preventDefault();

    const form = document.getElementById("formReservation");

    const currentUser = getCurrentUser();

    if (!currentUser) {
        alert("Utilisateur non connecté.");
        window.location.href = "./connexion.html";
        return;
    }

    dateInput.min = todayLocalISO();
    dateInput.setCustomValidity("");
    updateDateMinValidity(dateInput);
    if (!dateInput.checkValidity()) {
        dateInput.reportValidity();
        return;
    }

    heureInput.setCustomValidity("");

    const heureRaw = heureInput.value.trim();
    if (!heureRaw) {
        heureInput.setCustomValidity(MSG_REQUIS);
        heureInput.reportValidity();
        return;
    }

    const heureNorm = parseHeureHHMM(heureRaw);
    if (!heureNorm) {
        heureInput.setCustomValidity(
            "Indiquez une heure au format 24 h (HH:MM), par exemple 14:30."
        );
        heureInput.reportValidity();
        return;
    }
    if (!isHeureDansCreneauService(heureNorm)) {
        heureInput.setCustomValidity("L’heure doit être comprise entre 12:00 et 22:00 (horaires d’ouverture).");
        heureInput.reportValidity();
        return;
    }
    heureInput.value = heureNorm;
    heureInput.setCustomValidity("");

    personnesInput.setCustomValidity("");
    updatePersonnesValidity(personnesInput);

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const date = dateInput.value;
    const heure = heureNorm;
    const personnes = parseInt(personnesInput.value, 10);
    const message = document.getElementById("message").value.trim();

    const formData = new FormData();
    formData.append("user_id", currentUser.id);
    formData.append("date", date);
    formData.append("heure", heure);
    formData.append("personnes", personnes);
    formData.append("message", message);

    fetch("./php/reservation.php", {
        method: "POST",
        body: formData
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                if (window.animateFormSuccess) animateFormSuccess(form);

                setTimeout(() => {
                    window.location.href = "./profil.html";
                }, 520);
            } else {
                if (window.animateFormError) animateFormError(form);
                alert(data.message);
            }
        })
        .catch((error) => {
            console.error("Erreur :", error);
            alert("Une erreur est survenue lors de la réservation.");
        });
});
