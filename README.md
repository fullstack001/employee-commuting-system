# Employee Commuting System

Web app for employee attendance: **React (Create React App / `react-scripts`)** + **Express** + **MongoDB**, with JWT auth, units/roles/members, QR-based attendance (USB camera), manual attendance, reports (Excel/PDF), and analytics.

## Requirements

- **Node.js 10+** (tested with Node 10; newer LTS is better when possible)
- **npm** 6.x (comes with Node 10)
- **MongoDB** running locally or a connection string

## Quick start

1. **MongoDB** — start `mongod` or use Atlas and set `MONGODB_URI`.

2. **Server**

   ```bash
   cd server
   cp .env.example .env
   npm install
   npm start
   ```

   Default API: `http://localhost:5000`  
   On first run, a **Super Admin** is created:

   - Email: `admin@example.com`
   - Password: `admin123`

3. **Client**

   ```bash
   cd client
   npm install
   npm start
   ```

   Opens **Create React App** at `http://localhost:3000`. The dev server’s `package.json` **proxy** forwards `/api` and `/uploads` to `http://localhost:5000`.

## Environment

**Server (`server/.env`)**

| Variable       | Description                          |
|----------------|----------------------------------------|
| `PORT`         | API port (default 5000)              |
| `MONGODB_URI`  | MongoDB connection string              |
| `JWT_SECRET`   | Secret for JWT signing                 |
| `CLIENT_URL`   | CORS origin (e.g. `http://localhost:3000`) |

**Client (`client/.env` — optional)**

- `REACT_APP_API_URL` — API origin **without** `/api` (e.g. `http://localhost:5000`). If unset, the app uses `/api` relative to the dev server (proxy) or your static host.

## Roles

| Role          | Capabilities (summary)                                      |
|---------------|---------------------------------------------------------------|
| `super_admin` | Full access, settings, manual attendance for anyone         |
| `admin`       | CRUD units/roles/members, scan, reports; manual attendance if enabled in settings |
| `user`        | Own unit: dashboard, daily attendance, analytics (scoped)    |

Create additional **User** accounts by inserting into MongoDB or extending the API; the seed only creates the super admin.

## API overview

Base path: `/api`

- `POST /auth/login`, `GET /auth/me`
- `GET|POST|PUT|DELETE /units`, `/roles`
- `GET|POST|PUT|DELETE /members`, `GET /members/:id/qrcode`
- `POST /attendance/scan`, `POST /attendance/manual`, `GET /attendance`, `/attendance/daily`, etc.
- `GET /reports/*`, `GET /reports/export/excel|pdf`
- `GET /analytics/dashboard`, `/analytics/unit-summary`, etc.
- `GET|PUT /settings` (PUT: super admin only)

## Project layout

```
employee-commuting-system/
├── client/          # React (CRA: react-scripts)
├── server/          # Express API
└── README.md
```

## Production notes

- Set strong `JWT_SECRET` and restrict CORS to your frontend origin.
- Build the client: `cd client && npm run build` — static files are in `client/build`.
- Serve `client/build` with nginx/IIS or any static host; point API calls to your server (or same host with a reverse proxy).
