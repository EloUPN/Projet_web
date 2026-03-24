// Rediriger si pas connecté
if (!isLoggedIn()) {
    window.location.href = "./connexion.html";
}

let user = getCurrentUser();
let reservations = JSON.parse(localStorage.getItem("reservations")) || [];

// Filtrer les réservations de cet utilisateur
let userReservations = reservations.filter(r => r.userEmail === user.email);

// Afficher les infos utilisateur
document.getElementById("infosUser").innerHTML = `
    <h2>Bienvenue ${user.prenom}</h2>
    <p>Nom : ${user.nom}</p>
    <p>Email : ${user.email}</p>
`;

// Afficher les réservations
if (userReservations.length > 0) {
    let html = `<h3>Vos réservations :</h3>`;
    userReservations.forEach(r => {
        html += `
            <p>Date : ${r.date} à ${r.heure}</p>
            <p>Nombre de personnes : ${r.personnes}</p>
            <hr>
        `;
    });
    document.getElementById("infosReservation").innerHTML = html;
} else {
    document.getElementById("infosReservation").innerHTML = `<p>Aucune réservation pour le moment.</p>`;
}

// Déconnexion
document.getElementById("logoutBtn").addEventListener("click", function() {
    logout();
    window.location.href = "./index.html";
});

// Charger les réservations depuis le serveur
function loadReservations() {
    fetch('./php/reservation.php?action=getUserReservations', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayReservations(data.reservations);
        } else {
            document.getElementById("infosReservation").innerHTML = `<p>Aucune réservation pour le moment.</p>`;
        }
    })
    .catch(error => console.error('Erreur lors du chargement des réservations :', error));
}

// Afficher les réservations dans le tableau
function displayReservations(reservations) {
    const tbody = document.getElementById("reservationTable").querySelector("tbody");
    tbody.innerHTML = ""; // Vider le tableau

    reservations.forEach(reservation => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${reservation.id}</td>
            <td>${reservation.date}</td>
            <td>${reservation.heure}</td>
            <td>
                <button onclick="editReservation(${reservation.id})">Modifier</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Modifier une réservation
function editReservation(id) {
    const newDate = prompt("Nouvelle date (YYYY-MM-DD) :");
    const newTime = prompt("Nouvelle heure (HH:MM) :");

    if (newDate && newTime) {
        fetch('./php/reservation.php?action=updateReservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, date: newDate, heure: newTime })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Réservation mise à jour avec succès.");
                loadReservations();
            } else {
                alert("Erreur lors de la mise à jour : " + data.message);
            }
        })
        .catch(error => console.error('Erreur lors de la mise à jour :', error));
    }
}

// Charger les réservations au chargement de la page
loadReservations();