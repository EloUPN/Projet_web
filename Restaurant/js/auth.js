// Sauvegarder un utilisateur
function saveUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

// Récupérer l'utilisateur connecté
function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}

// Déconnexion
function logout() {
    localStorage.removeItem("user");
}

// Vérifier si connecté
function isLoggedIn() {
    return localStorage.getItem("user") !== null;
}

// Vérifier si email valide
function emailValide(email) {
    let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Vérifier si mot de passe valide (6 caractères minimum + 1 majuscule + 1 chiffre)
function motDePasseValide(mdp) {
    let regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    return regex.test(mdp);
}