<?php
header('Content-Type: application/json');

require_once "config.php";

$email = $_POST["email"] ?? "";
$password = $_POST["password"] ?? "";

if ($email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Tous les champs sont obligatoires."
    ]);
    exit;
}

// chercher utilisateur
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode([
        "success" => false,
        "message" => "Utilisateur introuvable."
    ]);
    exit;
}

// vérifier mot de passe
if (!password_verify($password, $user["password"])) {
    echo json_encode([
        "success" => false,
        "message" => "Mot de passe incorrect."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Connexion réussie",
    "user" => [
        "id"       => $user["id"],
        "nom"      => $user["nom"],
        "prenom"   => $user["prenom"],
        "email"    => $user["email"],
        "is_admin" => intval($user["is_admin"] ?? 0)
    ]
]);