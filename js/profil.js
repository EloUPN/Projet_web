if (!isLoggedIn()) {
    window.location.href = "connexion.html";
}

let user = getUser();
let reservation = JSON.parse(localStorage.getItem("reservation"));

document.getElementById("infosUser").innerHTML = `
    <h2>Bienvenue ${user.prenom}</h2>
    <p>Nom : ${user.nom}</p>
    <p>Email : ${user.email}</p>
`;

if (reservation) {
    document.getElementById("infosReservation").innerHTML = `
        <h3>Votre réservation :</h3>
        <p>Date : ${reservation.date}</p>
        <p>Nombre de personnes : ${reservation.personnes}</p>
    `;
}

document.getElementById("logoutBtn").addEventListener("click", function() {
    logout();
    window.location.href = "index.html";
});