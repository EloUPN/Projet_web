<?php
header('Content-Type: application/json');

require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Méthode non autorisée."
    ]);
    exit;
}

$nom = trim($_POST["nom"] ?? "");
$prenom = trim($_POST["prenom"] ?? "");
$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";
$confirmPassword = $_POST["confirmPassword"] ?? "";

// Vérification des champs
if ($nom === "" || $prenom === "" || $email === "" || $password === "" || $confirmPassword === "") {
    echo json_encode([
        "success" => false,
        "message" => "Tous les champs sont obligatoires."
    ]);
    exit;
}

// Vérification email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Email invalide."
    ]);
    exit;
}

// Vérification mot de passe
if (strlen($password) < 6 || !preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
    echo json_encode([
        "success" => false,
        "message" => "Le mot de passe doit contenir au moins 6 caractères, une majuscule et un chiffre."
    ]);
    exit;
}

// Vérification confirmation
if ($password !== $confirmPassword) {
    echo json_encode([
        "success" => false,
        "message" => "Les mots de passe ne correspondent pas."
    ]);
    exit;
}

// Vérifier si email existe déjà
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);

if ($stmt->fetch()) {
    echo json_encode([
        "success" => false,
        "message" => "Cet email est déjà utilisé."
    ]);
    exit;
}

// Hasher le mot de passe
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// Insertion
$stmt = $pdo->prepare("INSERT INTO users (nom, prenom, email, password) VALUES (?, ?, ?, ?)");
$stmt->execute([$nom, $prenom, $email, $passwordHash]);

echo json_encode([
    "success" => true,
    "message" => "Inscription réussie."
]);
?>