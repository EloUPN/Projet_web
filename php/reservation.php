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

$user_id = intval($_POST["user_id"] ?? 0);
$date = trim($_POST["date"] ?? "");
$heure = trim($_POST["heure"] ?? "");
$personnes = intval($_POST["personnes"] ?? 0);
$message = trim($_POST["message"] ?? "");

// Vérification des champs obligatoires
if ($user_id <= 0 || $date === "" || $heure === "" || $personnes <= 0) {
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
try {
    $stmt = $pdo->prepare("
        INSERT INTO reservations (id_user, date, heure, personnes, message)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->execute([$user_id, $date, $heure, $personnes, $message]);

    echo json_encode([
        "success" => true,
        "message" => "Réservation enregistrée avec succès."
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Erreur lors de l'enregistrement : " . $e->getMessage()
    ]);
}
?>