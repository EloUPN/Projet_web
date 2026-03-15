document.getElementById("formConnexion").addEventListener("submit", function(event) {

    event.preventDefault();

    const form = document.getElementById("formConnexion");

    const email = document.getElementById("emailConnexion").value.trim();
    const password = document.getElementById("mdpConnexion").value;

    if (email === "" || password === "") {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    fetch("./php/connexion.php", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {

        if (data.success) {

            // stocker utilisateur connecté
            localStorage.setItem("currentUser", JSON.stringify(data.user));

            alert("Connexion réussie !");
            window.location.href = "./profil.html";

        } else {

            if (window.animateFormError) animateFormError(form);
            alert(data.message);

        }

    })
    .catch(error => {
        console.error(error);
        alert("Erreur serveur.");
    });

});