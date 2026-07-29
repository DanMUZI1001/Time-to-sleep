# Time to sleep

Sleep tracking app split into separate frontend and backend projects.

## Project structure

- `frontend/` - React + Vite client
- `backend/` - Express API server

## Run locally

Install dependencies in each project:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start the backend:

```bash
cd backend
npm start
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:4000`.

## Checks

```bash
cd frontend
npm test
npm run build

cd ../backend
npm test
```
