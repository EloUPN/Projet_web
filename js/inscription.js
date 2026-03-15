document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formInscription");

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const nom = document.getElementById("nom").value.trim();
        const prenom = document.getElementById("prenom").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (nom === "" || prenom === "" || email === "" || password === "" || confirmPassword === "") {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        if (!emailValide(email)) {
            alert("Veuillez entrer un email valide.");
            return;
        }

        if (!motDePasseValide(password)) {
            alert("Le mot de passe doit contenir au moins 6 caractères, une majuscule et un chiffre.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        const formData = new FormData();
        formData.append("nom", nom);
        formData.append("prenom", prenom);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);

        fetch("./php/inscription.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = "./connexion.html";
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error("Erreur :", error);
            alert("Une erreur est survenue lors de l'inscription.");
        });
    });
});

function emailValide(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function motDePasseValide(password) {
    const regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    return regex.test(password);
}