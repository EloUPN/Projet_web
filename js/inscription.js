document.getElementById("formInscription").addEventListener("submit", function(event) {
<<<<<<< Updated upstream

    event.preventDefault();

    const form = document.getElementById("formInscription");
    let nom = document.getElementById("nom").value;
    let prenom = document.getElementById("prenom").value;
    let email = document.getElementById("email").value;
    let mdp = document.getElementById("mdp").value;

    if (nom === "" || prenom === "" || email === "" || mdp === "") {
        if (window.animateFormError) animateFormError(form);
=======
    event.preventDefault(); // empêche l'envoi automatique

    let nom = document.getElementById("nom").value.trim();
    let prenom = document.getElementById("prenom").value.trim();
    let email = document.getElementById("email").value.trim();
    let mdp = document.getElementById("password").value;
    let confirmMdp = document.getElementById("confirmPassword").value;  

    // Vérifications basiques
    if (!nom || !prenom || !email || !mdp) {
>>>>>>> Stashed changes
        alert("Veuillez remplir tous les champs !");
        return;
    }

    if (!emailValide(email)) {
<<<<<<< Updated upstream
        if (window.animateFormError) animateFormError(form);
=======
>>>>>>> Stashed changes
        alert("Veuillez entrer un email valide.");
        return;
    }

    if (!motDePasseValide(mdp)) {
<<<<<<< Updated upstream
        if (window.animateFormError) animateFormError(form);
=======
>>>>>>> Stashed changes
        alert("Le mot de passe doit contenir au moins 6 caractères, une majuscule et un chiffre.");
        return;
    }

    // Vérifier si email déjà utilisé
    let users = getUsers();
    let emailExiste = users.find(u => u.email === email);

    if (emailExiste) {
        alert("Cet email est déjà utilisé.");
        return;
    }

    // Créer l'utilisateur
    let user = {
        nom: nom,
        prenom: prenom,
        email: email,
        mdp: mdp
    };

    // Ajouter utilisateur dans localStorage
    addUser(user);

    // Connecter l'utilisateur directement
    localStorage.setItem("currentUser", JSON.stringify(user));

    if (window.animateFormSuccess) animateFormSuccess(form);

    setTimeout(() => {
        alert("Inscription réussie !");
        window.location.href = "connexion.html";
    }, 520);

});
