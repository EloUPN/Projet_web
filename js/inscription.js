document.addEventListener("DOMContentLoaded", function () {
    const form    = document.getElementById("formInscription");
    const msgBox  = document.getElementById("inscription-message");

    function showMessage(msg, type = "error") {
        msgBox.textContent = msg;
        msgBox.className   = `form-message form-message--${type}`;
        msgBox.hidden      = false;
        msgBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (type === "error" && window.animateFormError) animateFormError(form);
    }

    function clearMessage() {
        msgBox.hidden      = true;
        msgBox.textContent = "";
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        clearMessage();

        const nom             = document.getElementById("nom").value.trim();
        const prenom          = document.getElementById("prenom").value.trim();
        const email           = document.getElementById("email").value.trim();
        const password        = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!nom || !prenom || !email || !password || !confirmPassword) {
            showMessage("Veuillez remplir tous les champs.");
            return;
        }
        if (!emailValide(email)) {
            showMessage("Veuillez entrer une adresse email valide.");
            return;
        }
        if (!motDePasseValide(password)) {
            showMessage("Le mot de passe doit contenir au moins 6 caractères, une majuscule et un chiffre.");
            return;
        }
        if (password !== confirmPassword) {
            showMessage("Les mots de passe ne correspondent pas.");
            return;
        }

        const formData = new FormData();
        formData.append("nom",             nom);
        formData.append("prenom",          prenom);
        formData.append("email",           email);
        formData.append("password",        password);
        formData.append("confirmPassword", confirmPassword);

        fetch("./php/inscription.php", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    showMessage("Inscription réussie ! Redirection en cours…", "success");
                    setTimeout(() => {
                        window.location.href = "./connexion.html";
                    }, 1200);
                } else {
                    showMessage(data.message || "Une erreur est survenue.");
                }
            })
            .catch(() => {
                showMessage("Impossible de joindre le serveur. Vérifiez votre connexion.");
            });
    });
});

function emailValide(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function motDePasseValide(password) {
    return /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
}
