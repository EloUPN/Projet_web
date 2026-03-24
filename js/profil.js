// Rediriger si pas connecté
if (!isLoggedIn()) {
    window.location.href = "./connexion.html";
}

const user = getCurrentUser();
const userId = user.id;

// Afficher les infos utilisateur
document.getElementById("infosUser").innerHTML = `
    <h2>Bienvenue ${user.prenom}</h2>
    <p>Nom : ${user.nom}</p>
    <p>Email : ${user.email}</p>
`;

// Charger les réservations depuis le serveur
function loadReservations() {
    fetch(`./php/reservation.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayReservations(data.reservations);
            } else {
                document.getElementById("infosReservation").innerHTML =
                    `<h2>Mes Réservations</h2><p>Aucune réservation pour le moment.</p>`;
            }
        })
        .catch(error => {
            console.error("Erreur lors du chargement des réservations :", error);
            document.getElementById("infosReservation").innerHTML =
                `<h2>Mes Réservations</h2><p>Erreur lors du chargement des réservations.</p>`;
        });
}

// Afficher les réservations sous forme de liste
function displayReservations(reservations) {
    const container = document.getElementById("infosReservation");
    container.innerHTML = "<h2>Mes Réservations</h2>";

    const reservationList = document.createElement("ul");
    reservationList.id = "reservationList";
    container.appendChild(reservationList);

    if (!reservations || reservations.length === 0) {
        reservationList.innerHTML = `<li>Aucune réservation pour le moment.</li>`;
        return;
    }

    reservations.forEach(r => {
        // ✅ Forcer l'id en entier dès le départ
        const id = parseInt(r.id);

        const listItem = document.createElement("li");
        listItem.dataset.id = id;
        listItem.innerHTML = `
            <div class="reservation-info">
                <p><strong>ID :</strong> ${id}</p>
                <p><strong>Date :</strong> ${r.date}</p>
                <p><strong>Heure :</strong> ${r.heure}</p>
                <p><strong>Personnes :</strong> ${r.personnes}</p>
                <p><strong>Message :</strong> ${r.message || "—"}</p>
            </div>
            <div class="reservation-actions">
                <button class="edit-btn" data-id="${id}">Modifier</button>
                <button class="delete-btn" data-id="${id}">Supprimer</button>
            </div>
        `;
        reservationList.appendChild(listItem);
    });

    addReservationEventListeners();
}

// Afficher le formulaire de modification inline
function showEditForm(reservationId) {
    const id = parseInt(reservationId);
    const listItem = document.querySelector(`li[data-id="${id}"]`);
    if (!listItem) {
        console.error("Élément li introuvable pour id:", id);
        return;
    }

    const paragraphs = listItem.querySelectorAll(".reservation-info p");
    const currentDate      = paragraphs[1]?.textContent.replace("Date : ", "").trim() || "";
    const currentHeure     = paragraphs[2]?.textContent.replace("Heure : ", "").trim() || "";
    const currentPersonnes = paragraphs[3]?.textContent.replace("Personnes : ", "").trim() || "1";
    const currentMessage   = paragraphs[4]?.textContent.replace("Message : ", "").trim();
    const safeMessage      = (currentMessage === "—" ? "" : currentMessage) || "";

    listItem.innerHTML = `
        <div class="edit-form">
            <h3>Modifier la réservation #${id}</h3>
            <label>Date :
                <input type="date" id="edit-date-${id}" value="${currentDate}">
            </label>
            <label>Heure :
                <input type="time" id="edit-heure-${id}" value="${currentHeure}">
            </label>
            <label>Personnes :
                <input type="number" id="edit-personnes-${id}" value="${currentPersonnes}" min="1">
            </label>
            <label>Message :
                <input type="text" id="edit-message-${id}" value="${safeMessage}">
            </label>
            <div class="reservation-actions">
                <button class="save-btn" data-id="${id}">Enregistrer</button>
                <button class="cancel-btn" data-id="${id}">Annuler</button>
            </div>
        </div>
    `;

    listItem.querySelector(".save-btn").addEventListener("click", () => {
        const today        = new Date().toISOString().split("T")[0];
        const newDate      = document.getElementById(`edit-date-${id}`).value;
        const newHeure     = document.getElementById(`edit-heure-${id}`).value;
        const newPersonnes = parseInt(document.getElementById(`edit-personnes-${id}`).value);
        const newMessage   = document.getElementById(`edit-message-${id}`).value.trim();

        if (!newDate || newDate < today) {
            alert("Veuillez choisir une date future.");
            return;
        }
        if (!newHeure) {
            alert("Veuillez choisir une heure.");
            return;
        }
        if (!newPersonnes || newPersonnes <= 0) {
            alert("Nombre de personnes invalide.");
            return;
        }

        // ✅ Tous les champs typés correctement (entiers pour id, user_id, personnes)
        const payload = {
            id:        id,
            user_id:   parseInt(userId),
            date:      newDate,
            heure:     newHeure,
            personnes: newPersonnes,
            message:   newMessage
        };

        console.log("PUT payload:", JSON.stringify(payload));
        updateReservation(payload);
    });

    listItem.querySelector(".cancel-btn").addEventListener("click", () => {
        loadReservations();
    });
}

// Mettre à jour une réservation
function updateReservation(reservation) {
    fetch('./php/reservation.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadReservations();
        } else {
            alert(data.message || "Erreur lors de la mise à jour.");
            console.error("PUT error:", data);
        }
    })
    .catch(error => console.error("Erreur lors de la mise à jour :", error));
}

// Supprimer une réservation
function deleteReservation(reservationId) {
    const id = parseInt(reservationId);

    if (!confirm(`Supprimer la réservation #${id} ?`)) return;

    const payload = { id: id };
    console.log("DELETE payload:", JSON.stringify(payload));

    fetch('./php/reservation.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadReservations();
        } else {
            alert(data.message || "Erreur lors de la suppression.");
            console.error("DELETE error:", data);
        }
    })
    .catch(error => console.error("Erreur lors de la suppression :", error));
}

// Gestion des boutons Modifier et Supprimer
function addReservationEventListeners() {
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", event => {
            showEditForm(event.target.dataset.id);
        });
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", event => {
            deleteReservation(event.target.dataset.id);
        });
    });
}

// Déconnexion
document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
    window.location.href = "./index.html";
});

// Charger au démarrage
loadReservations();