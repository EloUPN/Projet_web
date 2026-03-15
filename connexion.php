<?php
$host = "localhost";
$user = "root";
$password = "";
$dbname = "test_form";

$conn = new mysqli($host, $user, $password, $dbname);

if ($conn->connect_error) {
    die("Echec de la connexion: " . $conn->connect_error);
}
echo "Connexion réussie à la base de données !";
?>