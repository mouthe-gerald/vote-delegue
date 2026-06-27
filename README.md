# VotingApp 🗳️

> Plateforme de vote électronique sécurisée par la blockchain, développée dans le cadre d'un PFE en Licence Génie Informatique — IUT Fotso Victor de Bandjoun, Université de Dschang.

---

## 🚀 Fonctionnalités

- **Authentification biométrique** via WebAuthn (empreinte digitale)
- **Sécurité blockchain** — chaque vote est enregistré sur Ethereum Sepolia
- **Vérification OTP** par email à l'inscription
- **Gestion complète du cycle électoral** (création, ouverture, clôture, résultats)
- **Résultats en temps réel** accessibles sans connexion
- **Génération de rapport PDF** officiel de l'élection
- **Interface responsive** (ordinateur et mobile)

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | React.js + Vite + Tailwind CSS |
| Base de données | PostgreSQL |
| Blockchain | Ethereum Sepolia (Web3.py + Solidity) |
| Authentification | WebAuthn (py-webauthn) + JWT |
| Email | Gmail SMTP |

---

## ⚙️ Installation locale

### Prérequis
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configurer les variables
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 👥 Équipe

- **KAMENI** — Développeur Full Stack
- **MOUTHE GERALD** — Développeur Full Stack  
- **DONGMEZA** — Développeur Full Stack

---

## 📄 Licence

Projet académique — IUT Fotso Victor de Bandjoun © 2025-2026
