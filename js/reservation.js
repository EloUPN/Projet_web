// Vérifier si connecté
if (!isLoggedIn()) {
    window.location.href = "connexion.html";
}

document.getElementById("formReservation").addEventListener("submit", function(event) {

    event.preventDefault();

    const form = document.getElementById("formReservation");
    let date = document.getElementById("date").value;
    let personnes = document.getElementById("personnes").value;

    let today = new Date().toISOString().split("T")[0];

    if (date < today) {
        if (window.animateFormError) animateFormError(form);
        alert("Veuillez choisir une date future.");
        return;
    }

    if (personnes <= 0) {
        if (window.animateFormError) animateFormError(form);
        alert("Nombre de personnes invalide.");
        return;
    }

    let reservation = {
        date: date,
        personnes: personnes
    };

    localStorage.setItem("reservation", JSON.stringify(reservation));

    if (window.animateFormSuccess) animateFormSuccess(form);

    setTimeout(() => {
        alert("Réservation enregistrée !");
    }, 520);

});
