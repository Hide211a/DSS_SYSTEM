# StockWise — DSS для управління запасами e-commerce

**Тема дипломної роботи:** Система підтримки прийняття рішень для управління товарними запасами вебплатформи електронної комерції.

## Що реалізовано

### Веб-магазин
- Каталог товарів, категорії, пошук, характеристики, відгуки
- **Customer accounts** — реєстрація, вхід, профіль
- Кошик і checkout (**потрібен вхід клієнта**) → mock-оплата (`/payment/:orderNumber`)
- Замовлення `PENDING` → резерв запасу → після оплати `COMPLETED` і списання
- «Мої замовлення» — для авторизованого клієнта або lookup за номером + email

### DSS (ядро диплома)
- **ABC + XYZ** класифікація SKU
- **Прогноз попиту** (Exponential Smoothing) + **MAPE holdout**
- **Планувальний попит**: 65% прогноз + 35% історичний μ
- **Safety Stock**, **ROP**, **EOQ**
- Рекомендації `ORDER / RISK_OOS / REDUCE / OK`
- What-if сценарії, блок **«Висновок системи»** на SKU page
- CSV export, experiment module, snapshots (API)

### Адміністративний модуль
- DSS Dashboard, ABC/XYZ matrix, inventory, PO (create/receive)
- CRUD товарів, restock за рекомендацією DSS
- Admin і customer сесії **взаємовиключні**

## Безпека

- `/api/dss/*` та `/api/admin/*` — Bearer admin token
- `/api/customer/*`, `/api/orders/my` — Bearer customer token
- Pay/cancel/view order — **перевірка власника** замовлення
- Публічний `GET /api/orders` (список усіх) — **видалено**

**Demo credentials** (pre-fill на login pages):
- Admin DSS: `admin / admin123`
- Customer: `client@stockwise.demo / client123`

Production: змініть `ADMIN_USER`, `ADMIN_PASSWORD`, `JWT_SECRET` у `.env`.

## Технічний стек

- **Frontend:** React 19, TypeScript, Vite, TanStack Query, Recharts
- **Backend:** Node.js, Express, Prisma
- **DB:** SQLite (dev) · PostgreSQL (Docker)
- **Tests:** Vitest — backend (math, engine, orderAccess, integration) + frontend (cart, auth guards, DSS conclusion); `npm run test` → 45 tests

## Запуск

```bash
cd "/Users/user/Desktop/DIPLOM/DIPLOM 5"
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Веб: http://localhost:5173 · API: http://localhost:3001

```bash
docker compose up --build   # UI :8080
npm run test                # backend + frontend tests
npm run build               # production build
```

## Деплой (Railway + Vercel)

Покрокова інструкція: **[DEPLOY.md](./DEPLOY.md)**

Коротко:
- **Railway** — API + PostgreSQL (Dockerfile з `railway.toml`)
- **Vercel** — frontend (`frontend/`), env `VITE_API_URL=https://YOUR-API.up.railway.app/api`
- **Railway env** — `CORS_ORIGIN` = URL Vercel, змінити `JWT_SECRET` та admin password

## Документація

- `THESIS.md` — матеріали для захисту
- `PROJECT_AUDIT.md` — повний аудит функцій, проблем, покращень

## Ліцензія

Навчальний проєкт для бакалаврської дипломної роботи.
