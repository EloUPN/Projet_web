document.getElementById("formConnexion").addEventListener("submit", function(event) {

    event.preventDefault();

    let email = document.getElementById("emailConnexion").value;
    let mdp = document.getElementById("mdpConnexion").value;

    let user = getUser();

    if (!user) {
        alert("Aucun utilisateur trouvé.");
        return;
    }

    if (email === user.email && mdp === user.mdp) {
        alert("Connexion réussie !");
        window.location.href = "profil.html";
    } else {
        alert("Email ou mot de passe incorrect.");
    }

});