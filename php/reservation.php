<?php
header('Content-Type: application/json');
require_once "config.php";

$rawMethod     = $_SERVER["REQUEST_METHOD"] ?? "GET";
$requestMethod = $rawMethod;
if ($rawMethod === "POST") {
    $ov = strtoupper(trim($_SERVER["HTTP_X_HTTP_METHOD_OVERRIDE"] ?? ""));
    if ($ov === "PUT" || $ov === "DELETE") {
        $requestMethod = $ov;
    }
}

function isAdmin(PDO $pdo, int $user_id): bool {
    if ($user_id <= 0) return false;
    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row && intval($row['is_admin']) === 1;
}

function reservation_heure_dans_creneau_service($heure): bool {
    $h = trim((string) $heure);
    if ($h === "" || !preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $h, $m)) return false;
    $hour = (int) $m[1];
    $min  = (int) $m[2];
    if ($min < 0 || $min > 59 || $hour < 0 || $hour > 23) return false;
    $total = $hour * 60 + $min;
    return $total >= 12 * 60 && $total <= 22 * 60;
}

function reservation_slot_timestamp($date, $heure) {
    $d = trim((string) $date);
    $h = trim((string) $heure);
    if ($d === "" || $h === "") return null;
    $t = strtotime($d . " " . $h);
    return $t !== false ? $t : null;
}

// ── GET ─────────────────────────────────────────────────────────────────────
if ($rawMethod === "GET") {

    // Admin : toutes les réservations avec info utilisateur
    $is_admin_req = intval($_GET["admin"] ?? 0);
    $user_id      = intval($_GET["user_id"] ?? 0);

    if ($is_admin_req === 1) {
        if (!isAdmin($pdo, $user_id)) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Accès refusé."]);
            exit;
        }
        try {
            $stmt = $pdo->query("
                SELECT r.id, r.date, r.heure, r.personnes, r.message, r.statut,
                       r.id_user,
                       u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email
                FROM reservations r
                JOIN users u ON r.id_user = u.id
                ORDER BY r.date ASC, r.heure ASC
            ");
            echo json_encode(["success" => true, "reservations" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Erreur lors de la récupération."]);
        }
        exit;
    }

    // Utilisateur : ses propres réservations
    if ($user_id <= 0) {
        echo json_encode(["success" => false, "message" => "Identifiant utilisateur invalide."]);
        exit;
    }
    try {
        $stmt = $pdo->prepare("
            SELECT id, date, heure, personnes, message, statut
            FROM reservations
            WHERE id_user = ?
            ORDER BY date ASC, heure ASC
        ");
        $stmt->execute([$user_id]);
        echo json_encode(["success" => true, "reservations" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Erreur lors de la récupération des réservations."]);
    }
    exit;
}

// ── POST : créer une réservation ─────────────────────────────────────────────
if ($rawMethod === "POST" && $requestMethod === "POST") {
    $user_id   = intval($_POST["user_id"]   ?? 0);
    $date      = trim($_POST["date"]        ?? "");
    $heure     = trim($_POST["heure"]       ?? "");
    $personnes = intval($_POST["personnes"] ?? 0);
    $message   = trim($_POST["message"]     ?? "");

    if ($user_id <= 0 || $date === "" || $heure === "" || $personnes <= 0) {
        echo json_encode(["success" => false, "message" => "Veuillez remplir correctement tous les champs."]);
        exit;
    }
    if ($date < date("Y-m-d")) {
        echo json_encode(["success" => false, "message" => "La date de réservation doit être dans le futur."]);
        exit;
    }
    if (!reservation_heure_dans_creneau_service($heure)) {
        echo json_encode(["success" => false, "message" => "Les réservations sont possibles uniquement entre 12h00 et 22h00."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO reservations (id_user, date, heure, personnes, message, statut)
            VALUES (?, ?, ?, ?, ?, 'En attente')
        ");
        $stmt->execute([$user_id, $date, $heure, $personnes, $message]);
        echo json_encode(["success" => true, "message" => "Réservation enregistrée."]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Erreur SQL : " . $e->getMessage()]);
    }
    exit;
}

// ── PUT ──────────────────────────────────────────────────────────────────────
if ($requestMethod === "PUT") {
    $body   = json_decode(file_get_contents("php://input"), true) ?? [];
    $action = trim($body["action"] ?? "update");

    // ── Mise à jour du statut par un admin ──────────────────────────────────
    if ($action === "update_statut") {
        $admin_id       = intval($body["user_id"] ?? 0);
        $reservation_id = intval($body["id"]      ?? 0);
        $statut         = trim($body["statut"]    ?? "");

        if (!isAdmin($pdo, $admin_id)) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Accès refusé."]);
            exit;
        }
        if ($reservation_id <= 0 || !in_array($statut, ["Validée", "Refusée", "En attente"])) {
            echo json_encode(["success" => false, "message" => "Données invalides."]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE reservations SET statut = ? WHERE id = ?");
            $stmt->execute([$statut, $reservation_id]);
            echo json_encode(["success" => true, "message" => "Statut mis à jour."]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Erreur lors de la mise à jour du statut."]);
        }
        exit;
    }

    // ── Annulation par l'utilisateur ────────────────────────────────────────
    if ($action === "cancel") {
        $user_id        = intval($body["user_id"] ?? 0);
        $reservation_id = intval($body["id"]      ?? 0);

        if ($user_id <= 0 || $reservation_id <= 0) {
            echo json_encode(["success" => false, "message" => "Données invalides."]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT id_user, date, heure, statut FROM reservations WHERE id = ?");
            $stmt->execute([$reservation_id]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$existing) {
                echo json_encode(["success" => false, "message" => "Réservation introuvable."]);
                exit;
            }
            if (intval($existing["id_user"]) !== $user_id) {
                echo json_encode(["success" => false, "message" => "Action non autorisée."]);
                exit;
            }
            if (in_array($existing["statut"], ["Annulée", "Refusée"])) {
                echo json_encode(["success" => false, "message" => "Cette réservation ne peut plus être annulée."]);
                exit;
            }
            $slot = reservation_slot_timestamp($existing["date"], $existing["heure"]);
            if ($slot === null || $slot < time()) {
                echo json_encode(["success" => false, "message" => "Les réservations passées ne peuvent pas être annulées."]);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE reservations SET statut = 'Annulée' WHERE id = ?");
            $stmt->execute([$reservation_id]);
            echo json_encode(["success" => true, "message" => "Réservation annulée."]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Erreur lors de l'annulation."]);
        }
        exit;
    }

    // ── Modification des détails par l'utilisateur ──────────────────────────
    $reservation_id = intval($body["id"]        ?? 0);
    $user_id_body   = intval($body["user_id"]   ?? 0);
    $date           = trim($body["date"]        ?? "");
    $heure          = trim($body["heure"]       ?? "");
    $personnes      = intval($body["personnes"] ?? 0);
    $message        = trim($body["message"]     ?? "");

    if ($reservation_id <= 0 || $user_id_body <= 0 || $date === "" || $heure === "" || $personnes <= 0) {
        echo json_encode(["success" => false, "message" => "Données invalides pour la mise à jour."]);
        exit;
    }
    if (!reservation_heure_dans_creneau_service($heure)) {
        echo json_encode(["success" => false, "message" => "Les réservations sont possibles uniquement entre 12h00 et 22h00."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id_user, date, heure, statut FROM reservations WHERE id = ?");
        $stmt->execute([$reservation_id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            echo json_encode(["success" => false, "message" => "Réservation introuvable."]);
            exit;
        }
        if (intval($existing["id_user"]) !== $user_id_body) {
            echo json_encode(["success" => false, "message" => "Action non autorisée."]);
            exit;
        }
        if ($existing["statut"] !== "En attente") {
            echo json_encode(["success" => false, "message" => "Seules les réservations « En attente » peuvent être modifiées."]);
            exit;
        }
        $slot = reservation_slot_timestamp($existing["date"], $existing["heure"]);
        if ($slot === null || $slot < time()) {
            echo json_encode(["success" => false, "message" => "Les réservations passées ne peuvent pas être modifiées."]);
            exit;
        }

        $stmt = $pdo->prepare("
            UPDATE reservations SET date = ?, heure = ?, personnes = ?, message = ? WHERE id = ?
        ");
        $stmt->execute([$date, $heure, $personnes, $message, $reservation_id]);
        echo json_encode(["success" => true, "message" => "Réservation mise à jour avec succès."]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Erreur lors de la mise à jour."]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "Méthode non autorisée."]);
?>
