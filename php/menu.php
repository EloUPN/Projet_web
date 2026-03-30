<?php
header('Content-Type: application/json');
require_once "config.php";

$rawMethod    = $_SERVER["REQUEST_METHOD"] ?? "GET";
$requestMethod = $rawMethod;
if ($rawMethod === "POST") {
    $ov = strtoupper(trim($_SERVER["HTTP_X_HTTP_METHOD_OVERRIDE"] ?? ""));
    if (in_array($ov, ["PUT", "DELETE"])) {
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

// GET : récupérer tous les éléments du menu
if ($requestMethod === "GET") {
    try {
        $stmt = $pdo->query("
            SELECT id, type, nom, prix
            FROM menu
            ORDER BY FIELD(type,'entree','plat','dessert','boisson'), nom
        ");
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "menu" => $items]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Erreur lors de la récupération du menu."]);
    }
    exit;
}

// POST : ajouter un élément (admin)
if ($requestMethod === "POST") {
    $body    = json_decode(file_get_contents("php://input"), true) ?? [];
    $user_id = intval($body["user_id"] ?? 0);

    if (!isAdmin($pdo, $user_id)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Accès refusé."]);
        exit;
    }

    $type = trim($body["type"] ?? "");
    $nom  = trim($body["nom"]  ?? "");
    $prix = floatval($body["prix"] ?? 0);

    if (!in_array($type, ['entree','plat','dessert','boisson']) || $nom === "") {
        echo json_encode(["success" => false, "message" => "Type ou nom invalide."]);
        exit;
    }
    if ($prix < 0) {
        echo json_encode(["success" => false, "message" => "Le prix ne peut pas être négatif."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO menu (type, nom, prix) VALUES (?, ?, ?)");
        $stmt->execute([$type, $nom, $prix]);
        echo json_encode(["success" => true, "message" => "Élément ajouté.", "id" => intval($pdo->lastInsertId())]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Erreur lors de l'ajout."]);
    }
    exit;
}

// PUT : modifier un élément (admin)
if ($requestMethod === "PUT") {
    $body    = json_decode(file_get_contents("php://input"), true) ?? [];
    $user_id = intval($body["user_id"] ?? 0);

    if (!isAdmin($pdo, $user_id)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Accès refusé."]);
        exit;
    }

    $id   = intval($body["id"]   ?? 0);
    $type = trim($body["type"]   ?? "");
    $nom  = trim($body["nom"]    ?? "");
    $prix = floatval($body["prix"] ?? 0);

    if ($id <= 0 || !in_array($type, ['entree','plat','dessert','boisson']) || $nom === "") {
        echo json_encode(["success" => false, "message" => "Données invalides."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE menu SET type = ?, nom = ?, prix = ? WHERE id = ?");
        $stmt->execute([$type, $nom, $prix, $id]);
        echo json_encode(["success" => true, "message" => "Élément modifié."]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Erreur lors de la modification."]);
    }
    exit;
}

// DELETE : supprimer un élément (admin)
if ($requestMethod === "DELETE") {
    $body    = json_decode(file_get_contents("php://input"), true) ?? [];
    $user_id = intval($body["user_id"] ?? 0);

    if (!isAdmin($pdo, $user_id)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Accès refusé."]);
        exit;
    }

    $id = intval($body["id"] ?? 0);
    if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "ID invalide."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM menu WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true, "message" => "Élément supprimé."]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Erreur lors de la suppression."]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "Méthode non autorisée."]);
?>
