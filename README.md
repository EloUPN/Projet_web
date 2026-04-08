# Le Restaurant Nylo

> Où la Chine rencontre Madagascar, au cœur de Paris.

Site web du restaurant **Nylo**, fondé par les cheffes **Elodie Zhou** et **Ny Avotiana Ratrema**, proposant une cuisine malgache-chinoise gastronomique au 1er arrondissement de Paris.

---

## Description

**Nylo** est une application web full-stack permettant de découvrir le restaurant, consulter le menu, créer un compte et effectuer des réservations en ligne. Le site comprend un système d'authentification complet, une gestion des réservations (création, modification, annulation) depuis le profil utilisateur, et un **tableau de bord administrateur** pour gérer les réservations et la carte du menu.

---

## Fonctionnalités

- **Accueil** — présentation du concept, des cheffes et de l'adresse
- **Menu** — carte organisée en quatre catégories (entrées, plats, desserts, boissons) avec recherche en temps réel ; contenu chargé dynamiquement depuis la base de données
- **Inscription / Connexion** — authentification sécurisée avec validation côté client et côté serveur
- **Réservation** — sélecteur d'horaire visuel, vérification des créneaux (12h–22h) et de la date
- **Profil** — consultation des réservations avec possibilité d'annuler les réservations futures en attente
- **Dashboard administrateur** — accès réservé aux comptes `is_admin = 1` :
  - Filtrage et mise à jour du statut des réservations (En attente / Validée / Refusée)
  - Ajout, modification et suppression des éléments du menu
- **Header / Footer** — composants chargés dynamiquement, navigation mobile responsive

---

## Technologies utilisées

**Front-end**
- HTML5, CSS3 (variables CSS, animations)
- JavaScript vanilla — auth, formulaires, sélecteur d'horaire, recherche de plats, dashboard, navigation mobile

**Back-end**
- PHP 8 — API REST (GET / POST / PUT / DELETE)
- PDO — requêtes préparées, protection contre les injections SQL
- `password_hash` / `password_verify` — mots de passe hachés
- Override de méthode HTTP via `X-HTTP-Method-Override` (compatibilité serveurs restrictifs)

**Base de données**
- MySQL — base `nylo`, tables `users`, `reservations` et `menu`

---

## Structure du projet

Projet_web/
├── index.html
├── menu.html
├── reservation.html
├── connexion.html
├── inscription.html
├── profil.html
├── dashboard.html
│
├── css/
│   └── style.css
│   └── tritopani.ttf     # La police du logo
│
├── js/
│   ├── auth.js           # Gestion session (localStorage)
│   ├── connexion.js
│   ├── inscription.js
│   ├── reservation.js    # Sélecteur d'horaire + soumission
│   ├── profil.js         # Affichage + annulation réservations
│   ├── dashboard.js      # Tableau de bord admin
│   ├── menu-load.js      # Chargement dynamique du menu
│   ├── menu-search.js    # Recherche de plats en temps réel
│   ├── header.js         # Chargement dynamique + nav mobile
│   ├── footer.js
│   └── animation.js
│
├── php/
│   ├── config.php        # Connexion PDO
│   ├── connexion.php
│   ├── inscription.php
│   ├── reservation.php   # CRUD réservations + gestion statuts
│   └── menu.php          # CRUD menu (admin)
│
└── composants/
    ├── header.html
    └── footer.html

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
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nom      VARCHAR(100)  NOT NULL,
    prenom   VARCHAR(100)  NOT NULL,
    email    VARCHAR(150)  UNIQUE NOT NULL,
    password VARCHAR(255)  NOT NULL,
    is_admin TINYINT(1)    NOT NULL DEFAULT 0
);

CREATE TABLE reservations (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    id_user   INT          NOT NULL,
    date      DATE         NOT NULL,
    heure     TIME         NOT NULL,
    personnes INT          NOT NULL,
    message   TEXT,
    statut    VARCHAR(20)  NOT NULL DEFAULT 'En attente',
    FOREIGN KEY (id_user) REFERENCES users(id)
);

CREATE TABLE menu (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(20)   NOT NULL,   -- entree | plat | dessert | boisson
    nom  VARCHAR(150)  NOT NULL,
    prix DECIMAL(6,2)  NOT NULL DEFAULT 0
);
```

Pour créer un compte administrateur, passer manuellement `is_admin = 1` sur l'utilisateur souhaité :

```sql
UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com';
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

http://localhost/Projet_web/
---

## Règles métier

- **Mot de passe** : 6 caractères minimum, 1 majuscule, 1 chiffre (validé côté client et serveur)
- **Réservations** : créneaux d'ouverture 12h00 – 22h00, entre 1 et 20 personnes
- **Modification** : uniquement sur les réservations au statut *En attente* et dans le futur
- **Annulation** : l'utilisateur peut annuler ses réservations futures (sauf déjà annulées ou refusées)
- **Statuts** : `En attente` → `Validée` / `Refusée` (par l'admin) ; `Annulée` (par l'utilisateur)
- **Accès réservation & profil** : réservés aux utilisateurs connectés (redirection automatique)
- **Dashboard** : accessible uniquement aux comptes `is_admin = 1`, vérifié côté serveur à chaque requête

---

## Licence

Ce projet est distribué sous licence **MIT** — libre d'utilisation avec attribution.

---

<div align="center">
  Fait avec soin par <a href="https://github.com/EloUPN">EloUPN</a> et <a href="https://github.com/nynyBao">nynyBao</a>
</div>
