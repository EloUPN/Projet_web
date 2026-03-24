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

// Vérifier l'action demandée
$action = $_GET['action'] ?? '';

if ($action === 'getUserReservations') {
    // Récupérer les réservations de l'utilisateur connecté
    session_start();
    $user_id = $_SESSION['user_id'] ?? 0;

    if ($user_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Utilisateur non connecté."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, date, heure FROM reservations WHERE id_user = ?");
        $stmt->execute([$user_id]);
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "reservations" => $reservations
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            "success" => false,
            "message" => "Erreur lors de la récupération des réservations : " . $e->getMessage()
        ]);
    }
    exit;
}

if ($action === 'updateReservation') {
    // Mettre à jour une réservation existante
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    $date = trim($data['date'] ?? '');
    $heure = trim($data['heure'] ?? '');

    if ($id <= 0 || $date === '' || $heure === '') {
        echo json_encode([
            "success" => false,
            "message" => "Données invalides."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE reservations SET date = ?, heure = ? WHERE id = ?");
        $stmt->execute([$date, $heure, $id]);

        echo json_encode([
            "success" => true,
            "message" => "Réservation mise à jour avec succès."
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            "success" => false,
            "message" => "Erreur lors de la mise à jour : " . $e->getMessage()
        ]);
    }
    exit;
}