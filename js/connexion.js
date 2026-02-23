document.getElementById("formConnexion").addEventListener("submit", function(event) {

    event.preventDefault();

    const form = document.getElementById("formConnexion");
    let email = document.getElementById("emailConnexion").value;
    let mdp = document.getElementById("mdpConnexion").value;

    let user = getUser();

    if (!user) {
        if (window.animateFormError) animateFormError(form);
        alert("Aucun utilisateur trouvé.");
        return;
    }

    if (email === user.email && mdp === user.mdp) {
        if (window.animateFormSuccess) animateFormSuccess(form);
        setTimeout(() => {
            alert("Connexion réussie !");
            window.location.href = "profil.html";
        }, 520);
    } else {
        if (window.animateFormError) animateFormError(form);
        alert("Email ou mot de passe incorrect.");
    }

});
