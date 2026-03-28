<?php
header('Content-Type: application/json');
require_once "config.php";

$rawMethod = $_SERVER["REQUEST_METHOD"] ?? "GET";
$requestMethod = $rawMethod;
if ($rawMethod === "POST") {
    $ov = strtoupper(trim($_SERVER["HTTP_X_HTTP_METHOD_OVERRIDE"] ?? ""));
    if ($ov === "PUT" || $ov === "DELETE") {
        $requestMethod = $ov;
    }
}

/** Heure entre 12:00 et 22:00 inclus (HH:MM ou HH:MM:SS) */
function reservation_heure_dans_creneau_service($heure) {
    $h = trim((string) $heure);
    if ($h === "" || !preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $h, $m)) {
        return false;
    }
    $hour = (int) $m[1];
    $min  = (int) $m[2];
    if ($min < 0 || $min > 59 || $hour < 0 || $hour > 23) {
        return false;
    }
    $total = $hour * 60 + $min;
    return $total >= 12 * 60 && $total <= 22 * 60;
}

/** Instant de la réservation (fuseau serveur), ou null si invalide */
function reservation_slot_timestamp($date, $heure) {
    $d = trim((string) $date);
    $h = trim((string) $heure);
    if ($d === "" || $h === "") {
        return null;
    }
    $t = strtotime($d . " " . $h);
    return $t !== false ? $t : null;
}

// --- GET : récupérer les réservations d'un utilisateur ---
if ($rawMethod === "GET") {

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
if ($rawMethod === "POST" && $requestMethod === "POST") {

    $user_id   = intval($_POST["user_id"] ?? 0);
    $date      = trim($_POST["date"] ?? "");
    $heure     = trim($_POST["heure"] ?? "");
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

    if (!reservation_heure_dans_creneau_service($heure)) {
        echo json_encode([
            "success" => false,
            "message" => "Les réservations sont possibles uniquement entre 12h00 et 22h00."
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
if ($requestMethod === "PUT") {
    $body = json_decode(file_get_contents("php://input"), true);
    if (!is_array($body)) {
        $body = [];
    }

    $reservation_id = intval($body["id"] ?? 0);
    $user_id_body   = intval($body["user_id"] ?? 0);
    $date           = trim($body["date"] ?? "");
    $heure          = trim($body["heure"] ?? "");
    $personnes      = intval($body["personnes"] ?? 0);
    $message        = trim($body["message"] ?? "");

    if ($reservation_id <= 0 || $user_id_body <= 0 || $date === "" || $heure === "" || $personnes <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Données invalides pour la mise à jour."
        ]);
        exit;
    }

    if (!reservation_heure_dans_creneau_service($heure)) {
        echo json_encode([
            "success" => false,
            "message" => "Les réservations sont possibles uniquement entre 12h00 et 22h00."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id_user, date, heure FROM reservations WHERE id = ?");
        $stmt->execute([$reservation_id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            echo json_encode([
                "success" => false,
                "message" => "Réservation introuvable."
            ]);
            exit;
        }

        if (intval($existing["id_user"]) !== $user_id_body) {
            echo json_encode([
                "success" => false,
                "message" => "Action non autorisée."
            ]);
            exit;
        }

        $slot = reservation_slot_timestamp($existing["date"], $existing["heure"]);
        if ($slot === null || $slot < time()) {
            echo json_encode([
                "success" => false,
                "message" => "Les réservations passées ne peuvent pas être modifiées."
            ]);
            exit;
        }

        $stmt = $pdo->prepare("
            UPDATE reservations
            SET date = ?, heure = ?, personnes = ?, message = ?
            WHERE id = ?
        ");
        $stmt->execute([$date, $heure, $personnes, $message, $reservation_id]);

        if ($stmt->rowCount() === 0) {
            $check = $pdo->prepare("SELECT id FROM reservations WHERE id = ?");
            $check->execute([$reservation_id]);
            if (!$check->fetch()) {
                echo json_encode([
                    "success" => false,
                    "message" => "Réservation introuvable."
                ]);
                exit;
            }
        }

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
if ($requestMethod === "DELETE") {
    $body = json_decode(file_get_contents("php://input"), true);
    if (!is_array($body)) {
        $body = [];
    }

    $reservation_id = intval($body["id"] ?? 0);
    $user_id_body   = intval($body["user_id"] ?? 0);

    if ($reservation_id <= 0 || $user_id_body <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Données invalides pour la suppression."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id_user, date, heure FROM reservations WHERE id = ?");
        $stmt->execute([$reservation_id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            echo json_encode([
                "success" => false,
                "message" => "Réservation introuvable."
            ]);
            exit;
        }

        if (intval($existing["id_user"]) !== $user_id_body) {
            echo json_encode([
                "success" => false,
                "message" => "Action non autorisée."
            ]);
            exit;
        }

        $slot = reservation_slot_timestamp($existing["date"], $existing["heure"]);
        if ($slot === null || $slot < time()) {
            echo json_encode([
                "success" => false,
                "message" => "Les réservations passées ne peuvent pas être supprimées."
            ]);
            exit;
        }

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

echo json_encode([
    "success" => false,
    "message" => "Méthode non autorisée."
]);
