// Vérifier si connecté
if (!isLoggedIn()) {
    window.location.href = "connexion.html";
}

document.getElementById("formReservation").addEventListener("submit", function(event) {
    event.preventDefault();

    const form = document.getElementById("formReservation");
    let date = document.getElementById("date").value;
    let heure = document.getElementById("heure").value;
    let personnes = parseInt(document.getElementById("personnes").value);

    let today = new Date().toISOString().split("T")[0];

    if (date < today) {
        if (window.animateFormError) animateFormError(form);
        alert("Veuillez choisir une date future.");
        return;
    }

    if (personnes <= 0) {
        if (window.animateFormError) animateFormError(form);
    if (!heure) {
        alert("Veuillez choisir une heure.");
        return;
    }

    if (personnes <= 0 || isNaN(personnes)) {
        alert("Nombre de personnes invalide.");
        return;
    }

    let reservation = {
        date: date,
        heure: heure,
        personnes: personnes,
        userEmail: getCurrentUser().email
    };

    let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
    reservations.push(reservation);
    localStorage.setItem("reservations", JSON.stringify(reservations));

    if (window.animateFormSuccess) animateFormSuccess(form);

    setTimeout(() => {
        alert("Réservation enregistrée !");
    }, 520);

});
