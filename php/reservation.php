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
$date = trim($_POST["date"] ?? "");
$heure = trim($_POST["heure"] ?? "");
$personnes = intval($_POST["personnes"] ?? 0);
$message = trim($_POST["message"] ?? "");

// Vérification des champs obligatoires
if ($nom === "" || $prenom === "" || $date === "" || $heure === "" || $personnes <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Veuillez remplir correctement tous les champs obligatoires."
    ]);
    exit;
}

// Vérifier que la date n'est pas passée
$today = date("Y-m-d");
if ($date < $today) {
    echo json_encode([
        "success" => false,
        "message" => "La date de réservation doit être dans le futur."
    ]);
    exit;
}

// Insertion dans la base
$stmt = $pdo->prepare("
    INSERT INTO reservations (nom, prenom, date, heure, personnes, message)
    VALUES (?, ?, ?, ?, ?, ?)
");

$stmt->execute([$nom, $prenom, $date, $heure, $personnes, $message]);

echo json_encode([
    "success" => true,
    "message" => "Réservation enregistrée avec succès."
]);
?>