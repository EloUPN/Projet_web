<?php
header('Content-Type: application/json');
require_once "config.php";

// --- GET : récupérer les réservations d'un utilisateur ---
if ($_SERVER["REQUEST_METHOD"] === "GET") {

    $user_id = intval($_GET["user_id"] ?? 0);

    if ($user_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Identifiant utilisateur invalide."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id, date, heure, personnes, message
            FROM reservations
            WHERE id_user = ?
            ORDER BY date, heure
        ");
        $stmt->execute([$user_id]);
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "reservations" => $reservations
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => "Erreur lors de la récupération des réservations."
        ]);
    }
    exit;
}

// --- POST : enregistrer une réservation ---
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $user_id   = intval($_POST["user_id"] ?? 0);
    $date      = trim($_POST["date"] ?? "");
    $heure     = trim($_POST["heure"] ?? "");
    // ✅ Correction : "personnes" (cohérent avec le JS et la BDD)
    $personnes = intval($_POST["personnes"] ?? 0);
    $message   = trim($_POST["message"] ?? "");

    if ($user_id <= 0 || $date === "" || $heure === "" || $personnes <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Veuillez remplir correctement tous les champs."
        ]);
        exit;
    }

    $today = date("Y-m-d");
    if ($date < $today) {
        echo json_encode([
            "success" => false,
            "message" => "La date de réservation doit être dans le futur."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO reservations (id_user, date, heure, personnes, message)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$user_id, $date, $heure, $personnes, $message]);

        echo json_encode([
            "success" => true,
            "message" => "Réservation enregistrée."
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            "success" => false,
            "message" => "Erreur SQL : " . $e->getMessage()
        ]);
    }
    exit;
}

// --- PUT : mettre à jour une réservation ---
if ($_SERVER["REQUEST_METHOD"] === "PUT") {
    // ✅ Correction : json_decode() au lieu de parse_str()
    $body = json_decode(file_get_contents("php://input"), true);

    $reservation_id = intval($body["id"] ?? 0);
    $date           = trim($body["date"] ?? "");
    $heure          = trim($body["heure"] ?? "");
    $personnes      = intval($body["personnes"] ?? 0);
    $message        = trim($body["message"] ?? "");

    if ($reservation_id <= 0 || $date === "" || $heure === "" || $personnes <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Données invalides pour la mise à jour."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE reservations
            SET date = ?, heure = ?, personnes = ?, message = ?
            WHERE id = ?
        ");
        $stmt->execute([$date, $heure, $personnes, $message, $reservation_id]);

        echo json_encode([
            "success" => true,
            "message" => "Réservation mise à jour avec succès."
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => "Erreur lors de la mise à jour de la réservation."
        ]);
    }
    exit;
}

// --- DELETE : supprimer une réservation ---
if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    // ✅ Correction : json_decode() au lieu de parse_str()
    $body = json_decode(file_get_contents("php://input"), true);

    $reservation_id = intval($body["id"] ?? 0);

    if ($reservation_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Identifiant de réservation invalide."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = ?");
        $stmt->execute([$reservation_id]);

        echo json_encode([
            "success" => true,
            "message" => "Réservation supprimée avec succès."
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => "Erreur lors de la suppression de la réservation."
        ]);
    }
    exit;
}

// Si autre méthode
echo json_encode([
    "success" => false,
    "message" => "Méthode non autorisée."
]);