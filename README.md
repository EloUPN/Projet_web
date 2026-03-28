# Le Restaurant Nylo

> Où la Chine rencontre Madagascar, au cœur de Paris.

Site web du restaurant **Nylo**, fondé par les cheffes **Elodie Zhou** et **Ny Avotiana Ratrema**, proposant une cuisine malgache-chinoise gastronomique au 1er arrondissement de Paris.

---

## Description

**Nylo** est une application web full-stack permettant de découvrir le restaurant, consulter le menu, créer un compte et effectuer des réservations en ligne. Le site comprend un système d'authentification complet et une gestion des réservations (création, modification, suppression) depuis le profil utilisateur.

---

## Fonctionnalités

- **Accueil** — présentation du concept, des cheffes et de l'adresse
- **Menu** — carte organisée en trois catégories (entrées, plats, desserts) avec recherche en temps réel
- **Inscription / Connexion** — authentification sécurisée avec validation côté client et côté serveur
- **Réservation** — formulaire avec vérification des horaires (12h–22h) et de la date
- **Profil** — consultation et gestion des réservations futures et passées
- **Header / Footer** — composants chargés dynamiquement, navigation mobile responsive

---

## Technologies utilisées

**Front-end**
- HTML5, CSS3 (variables CSS, animations)
- JavaScript vanilla — auth, formulaires, recherche de plats, navigation mobile

**Back-end**
- PHP 8 — API REST (GET / POST / PUT / DELETE)
- PDO — requêtes préparées, protection contre les injections SQL
- `password_hash` / `password_verify` — mots de passe hachés

**Base de données**
- MySQL — base `nylo`, tables `users` et `reservations`

---

## Structure du projet

```
Projet_web/
├── index.html
├── menu.html
├── reservation.html
├── connexion.html
├── inscription.html
├── profil.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── auth.js          # Gestion session (localStorage)
│   ├── connexion.js
│   ├── inscription.js
│   ├── reservation.js
│   ├── profil.js
│   ├── menu-search.js   # Recherche de plats en temps réel
│   ├── header.js        # Chargement dynamique + nav mobile
│   ├── footer.js
│   └── animation.js
│
├── php/
│   ├── config.php       # Connexion PDO
│   ├── connexion.php
│   ├── inscription.php
│   └── reservation.php  # CRUD réservations
│
└── composants/
    ├── header.html
    └── footer.html
```

---

## Installation & Démarrage

### Prérequis

- PHP 8+
- MySQL
- Un serveur local : [XAMPP](https://www.apachefriends.org/), [MAMP](https://www.mamp.info/) ou [Laragon](https://laragon.org/)

### 1. Cloner le dépôt

```bash
git clone https://github.com/EloUPN/Projet_web.git
```

### 2. Créer la base de données

Dans phpMyAdmin (ou via le terminal MySQL), créer une base `nylo` et y exécuter :

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    personnes INT NOT NULL,
    message TEXT,
    FOREIGN KEY (id_user) REFERENCES users(id)
);
```

### 3. Configurer la connexion

Vérifier les paramètres dans `php/config.php` :

```php
$host     = "localhost";
$dbname   = "nylo";
$username = "root";
$password = "";
```

### 4. Lancer le projet

Placer le dossier dans le répertoire web de ton serveur (`htdocs` pour XAMPP) et ouvrir :

```
http://localhost/Projet_web/
```

---

## Règles métier

- **Mot de passe** : 6 caractères minimum, 1 majuscule, 1 chiffre (validé côté client et serveur)
- **Réservations** : horaires d'ouverture 12h00 – 22h00, entre 1 et 20 personnes
- **Modifications / suppressions** : uniquement sur les réservations futures
- **Accès réservation** : réservé aux utilisateurs connectés (redirection automatique)

---

## Licence

Ce projet est distribué sous licence **MIT** — libre d'utilisation avec attribution.

---

<div align="center">
  Fait avec soin par <a href="https://github.com/EloUPN">EloUPN</a>
</div>
