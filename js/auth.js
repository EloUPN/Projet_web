// =============================
// Gestion des utilisateurs
// =============================

// Récupérer tous les utilisateurs
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

// Ajouter un nouvel utilisateur
function addUser(user) {
    let users = getUsers();
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
}

// =============================
// Gestion de la session
// =============================

// Définir l'utilisateur connecté
function setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
}

// Récupérer l'utilisateur connecté
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

// Vérifier si connecté
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Déconnexion
function logout() {
    localStorage.removeItem("currentUser");
}

// =============================
// Validations
// =============================

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