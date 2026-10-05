# Muro de Peticiones

FastAPI + PostgreSQL + React (Vite, TypeScript, Tailwind, TanStack Query), con actualización en vivo por WebSocket.

## Con Docker (producción / pruebas)

```bash
cp .env.example .env     # cambia ADMIN_PASSWORD y JWT_SECRET
docker compose up --build
```

Abre http://localhost:8080. nginx sirve el front y reenvía `/api` (REST y WebSocket) a FastAPI; la base de datos y la API no se exponen al exterior.

Comandos útiles: `docker compose logs -f api`, `docker compose down` (conserva datos), `docker compose down -v` (borra la base).

## Desarrollo local sin Docker

```bash
# Backend (usa SQLite por defecto)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload     # http://localhost:8000
pytest

# Frontend (en otra terminal; Vite hace proxy de /api y del WebSocket)
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

## Permisos

- Cualquiera puede ver y crear peticiones (máx. 10 por minuto por IP).
- Cualquiera puede editar una petición en cualquier momento (máx. 30 por minuto por IP).
- Eliminar requiere iniciar sesión como administrador (enlace al pie de la página).

## Pendiente

- Alembic para migraciones (hoy las tablas se crean al arrancar).
- Varios workers: reemplazar el `ConnectionManager` en memoria por Redis pub/sub.
- HTTPS: poner Caddy o Traefik delante de `web`.
