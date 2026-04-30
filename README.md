# Arba Minch University — Letter Management System (LMS)

A centralized letter tracking and dispatch system for university offices.

## Tech Stack
- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **Auth:** JWT

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/DuolPuot/letter-management-system.git
cd letter-management-system
```

### 2. Server setup
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm start
```

### 3. Frontend setup
```bash
cd lms
npm install
npm run dev
```

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `SMTP_*` | Email settings (optional) |

## First Login

After seeding the database (`node server/seed.js`), log in with the Record Officer account created during seed. The Record Officer is the system administrator.

## Features
- Incoming/Outgoing letter management
- Record Office dispatch workflow
- Staff inbox system
- Group & direct messaging
- Role-based access control
- Recycle bin with accountability trail
- Reports & analytics
