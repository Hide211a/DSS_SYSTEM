# Деплой StockWise (Railway + Vercel)

Інструкція для публічного demo: **API + PostgreSQL на Railway**, **React UI на Vercel**.

---

## Архітектура

```
Користувач → https://your-app.vercel.app (frontend)
                    ↓ fetch
             https://your-api.up.railway.app/api (backend)
                    ↓
             PostgreSQL (Railway plugin)
```

Локально та в Docker UI звертається до `/api` (same-origin). На Vercel потрібна змінна **`VITE_API_URL`**.

---

## Крок 1 — Railway: PostgreSQL

1. [railway.app](https://railway.app) → **New Project**
2. **Add plugin** → **PostgreSQL**
3. Відкрийте Postgres → **Variables** → скопіюйте `DATABASE_URL` (або `DATABASE_PRIVATE_URL` для internal)

---

## Крок 2 — Railway: Backend API

1. У тому ж проєкті: **New** → **GitHub Repo** → цей репозиторій
2. **Settings** → **Root Directory**: залиште `/` (корінь monorepo)
3. **Settings** → **Build**: Railway прочитає `railway.toml` (Dockerfile `backend/Dockerfile`)
4. **Variables** (обов’язково):

| Variable | Значення |
|----------|----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference з Postgres service) |
| `JWT_SECRET` | довгий випадковий рядок (32+ символи) |
| `ADMIN_USER` | `admin` (або своє) |
| `ADMIN_PASSWORD` | **не** `admin123` для публічного URL |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL Vercel (додасте після кроку 3), напр. `https://stockwise.vercel.app` |

5. **Deploy** → дочекайтесь build. Перший деплой **автоматично seed** порожню БД (12 міс. продажів, demo customer).
6. **Settings** → **Networking** → **Generate Domain** → скопіюйте URL, напр.  
   `https://stockwise-api-production.up.railway.app`
7. Перевірка: відкрийте `https://YOUR-API.up.railway.app/api/health` → `{"status":"ok",...}`

### Перезапуск seed (обережно — стирає дані)

Встановіть `FORCE_DB_SEED=true`, redeploy, потім приберіть змінну.

---

## Крок 3 — Vercel: Frontend

1. [vercel.com](https://vercel.com) → **Add New Project** → цей репозиторій
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite (auto)
4. **Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://YOUR-API.up.railway.app/api` |

5. **Deploy**
6. Скопіюйте URL Vercel, напр. `https://stockwise.vercel.app`
7. Поверніться в **Railway → API → Variables** і оновіть:

```
CORS_ORIGIN=https://stockwise.vercel.app,https://stockwise-xxx.vercel.app
```

(додайте preview URL, якщо потрібні PR-preview)

8. Redeploy API на Railway після зміни CORS.

---

## Крок 4 — Перевірка demo

| Дія | Очікування |
|-----|------------|
| Відкрити Vercel URL | Каталог з товарами |
| Customer login | `client@stockwise.demo` / `client123` (якщо seed пройшов) |
| Admin login `/login` | ваш `ADMIN_USER` / `ADMIN_PASSWORD` |
| Купівля → оплата | Замовлення COMPLETED, DSS оновлюється |
| `/admin` | Dashboard з KPI |

---

## Альтернатива: Docker Compose (VPS)

Один сервер, один URL — без CORS і `VITE_API_URL`:

```bash
docker compose up --build
# UI: http://localhost:8080
```

Для VPS замініть `CORS_ORIGIN` у `docker-compose.yml` на ваш домен.

---

## Railway без Docker (Nixpacks)

Якщо не використовуєте Dockerfile:

**Build command:**
```bash
npm ci -w backend --include-workspace-root && npm run build:prod -w backend
```

**Start command:**
```bash
npm run start:prod -w backend
```

Ті самі env-змінні, що в таблиці вище.

---

## Змінні середовища (довідник)

### Backend

| Variable | Опис |
|----------|------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Railway підставляє автоматично |
| `JWT_SECRET` | Підпис admin/customer token |
| `ADMIN_USER` / `ADMIN_PASSWORD` | DSS admin |
| `CORS_ORIGIN` | Comma-separated origins для Vercel |
| `FORCE_DB_SEED` | `true` = повний re-seed (wipe) |
| `DSS_CACHE_TTL_MS` | TTL кешу DSS (default 60000) |

### Frontend (Vercel build-time)

| Variable | Опис |
|----------|------|
| `VITE_API_URL` | Повний URL API з `/api` suffix |

---

## Типові проблеми

| Симптом | Рішення |
|---------|---------|
| CORS error у браузері | Додайте Vercel URL у `CORS_ORIGIN`, redeploy API |
| `Network error` / 404 на `/api` | Перевірте `VITE_API_URL`, redeploy **frontend** |
| Порожній каталог | Перевірте seed: Railway logs → «Seeding database» |
| Admin login fail | Перевірте `ADMIN_USER` / `ADMIN_PASSWORD` на Railway |
| DB connection error | `DATABASE_URL` має бути PostgreSQL, не SQLite |

---

## Безпека для публічного demo

- Змініть admin password і `JWT_SECRET`
- Demo customer credentials у UI — прийнятно для диплому, не для production
- Не комітьте `.env` (в `.gitignore`)

---

## Локальна розробка (без змін)

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

`VITE_API_URL` не потрібен — Vite proxy на `:3001`.
