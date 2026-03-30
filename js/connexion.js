document.getElementById("formConnexion").addEventListener("submit", function (event) {
    event.preventDefault();

    const form     = document.getElementById("formConnexion");
    const errorBox = document.getElementById("connexion-error");
    const email    = document.getElementById("emailConnexion").value.trim();
    const password = document.getElementById("mdpConnexion").value;

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.hidden      = false;
        errorBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (window.animateFormError) animateFormError(form);
    }

    function clearError() {
        errorBox.hidden      = true;
        errorBox.textContent = "";
    }

    clearError();

    if (email === "" || password === "") {
        showError("Veuillez remplir tous les champs.");
        return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    fetch("./php/connexion.php", {
        method: "POST",
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                localStorage.setItem("currentUser", JSON.stringify(data.user));
                window.location.href = "./profil.html";
            } else {
                showError(data.message || "Identifiants incorrects.");
            }
        })
        .catch(() => {
            showError("Impossible de joindre le serveur. Vérifiez votre connexion.");
        });
});
