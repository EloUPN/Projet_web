// Vérifier si connecté
if (!isLoggedIn()) {
    window.location.href = "connexion.html";
}

document.getElementById("formReservation").addEventListener("submit", function(event) {
    event.preventDefault();

    const form = document.getElementById("formReservation");

    const currentUser = getCurrentUser();

    if (!currentUser) {
        alert("Utilisateur non connecté.");
        window.location.href = "connexion.html";
        return;
    }

    const date = document.getElementById("date").value;
    const heure = document.getElementById("heure").value;
    const personnes = parseInt(document.getElementById("personnes").value);
    const message = document.getElementById("message").value.trim();

    const today = new Date().toISOString().split("T")[0];

    if (date < today) {
        if (window.animateFormError) animateFormError(form);
        alert("Veuillez choisir une date future.");
        return;
    }

    if (!heure) {
        if (window.animateFormError) animateFormError(form);
        alert("Veuillez choisir une heure.");
        return;
    }

    if (personnes <= 0 || isNaN(personnes)) {
        if (window.animateFormError) animateFormError(form);
        alert("Nombre de personnes invalide.");
        return;
    }

    const formData = new FormData();
    formData.append("nom", currentUser.nom);
    formData.append("prenom", currentUser.prenom);
    formData.append("date", date);
    formData.append("heure", heure);
    formData.append("personnes", personnes);
    formData.append("message", message);

    fetch("../php/reservation.php", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.animateFormSuccess) animateFormSuccess(form);

            setTimeout(() => {
                alert(data.message);
                form.reset();
            }, 520);
        } else {
            if (window.animateFormError) animateFormError(form);
            alert(data.message);
        }
    })
    .catch(error => {
        console.error("Erreur :", error);
        alert("Une erreur est survenue lors de la réservation.");
    });
});