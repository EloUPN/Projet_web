document.getElementById("formInscription").addEventListener("submit", function(event) {

    event.preventDefault(); // empêche l'envoi automatique

    let nom = document.getElementById("nom").value;
    let prenom = document.getElementById("prenom").value;
    let email = document.getElementById("email").value;
    let mdp = document.getElementById("mdp").value;

    if (nom === "" || prenom === "" || email === "" || mdp === "") {
        alert("Veuillez remplir tous les champs !");
        return;
    }

    if (!emailValide(email)) {
    alert("Veuillez entrer un email valide.");
    return;
}

if (!motDePasseValide(mdp)) {
    alert("Le mot de passe doit contenir au moins 6 caractères, une majuscule et un chiffre.");
    return;
}

    let user = {
        nom: nom,
        prenom: prenom,
        email: email,
        mdp: mdp
    };

    saveUser(user);

    alert("Inscription réussie !");
    window.location.href = "connexion.html";

});