// Vérifier si connecté
if (!isLoggedIn()) {
    window.location.href = "connexion.html";
}

document.getElementById("formReservation").addEventListener("submit", function(event) {

    event.preventDefault();

    let date = document.getElementById("date").value;
    let personnes = document.getElementById("personnes").value;

    let today = new Date().toISOString().split("T")[0];

    if (date < today) {
        alert("Veuillez choisir une date future.");
        return;
    }

    if (personnes <= 0) {
        alert("Nombre de personnes invalide.");
        return;
    }

    let reservation = {
        date: date,
        personnes: personnes
    };

    localStorage.setItem("reservation", JSON.stringify(reservation));

    alert("Réservation enregistrée !");
});