document.getElementById("formConnexion").addEventListener("submit", function(event) {

    event.preventDefault();

    const form = document.getElementById("formConnexion");
    let email = document.getElementById("emailConnexion").value;
    let mdp = document.getElementById("mdpConnexion").value;

    let users = getUsers(); // récupère tous les utilisateurs

    // chercher l'utilisateur correspondant
    let userFound = users.find(u => 
        u.email === email && u.mdp === mdp
    );

    if (userFound) {
        localStorage.setItem("currentUser", JSON.stringify(userFound));
        alert("Connexion réussie !");
        window.location.href = "profil.html";
    } else {
        if (window.animateFormError) animateFormError(form);
        alert("Email ou mot de passe incorrect.");
    }

});
