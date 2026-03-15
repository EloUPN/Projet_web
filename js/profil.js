// Rediriger si pas connecté
if (!isLoggedIn()) {
    window.location.href = "connexion.html";
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
    window.location.href = "index.html";
});