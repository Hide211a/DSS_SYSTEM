# Звіт з аудиту проєкту StockWise

**Тема:** Система підтримки та прийняття рішень щодо управління товарними запасами електронної комерції  
**Шлях:** `/Users/user/Desktop/DIPLOM/DIPLOM 5`  
**Дата аудиту:** 14.06.2026  
**Стек:** React 19 + Vite + TanStack Query · Express 5 + Prisma · SQLite / PostgreSQL (Docker)  
**Тести:** 45/45 passed (`npm run test`: backend 31 + frontend 14)

---

## 1. Загальний висновок

| Критерій | Оцінка | Коментар |
|----------|--------|----------|
| Відповідність темі диплому | ✅ Висока | E-commerce + DSS інтегровані в один контур |
| Працездатність (happy path) | ✅ Працює | Каталог → кошик → оплата → DSS → поповнення |
| DSS-ядро | ✅ Повне | ABC/XYZ, прогноз, ROP, EOQ, what-if, висновок |
| Тестове покриття | ✅ Покращено | Backend 31 + Frontend 14 (Vitest) |
| Безпека | ✅ Покращено | Order ownership check; public list видалено |
| Адаптивна верстка | ✅ Покращено | Breakpoints + `.table-scroll` для ключових таблиць |
| Документація | ✅ Оновлено | `THESIS.md`, `README.md` синхронізовано з кодом |

**Висновок:** проєкт **готовий до захисту**. Після полірування (06.2026): безпека order API, тести engine, table-scroll, оновлена документація.

---

## 2. Архітектура

```
Клієнт (React)  →  /api/* (Express)  →  Prisma  →  SQLite / PostgreSQL
                         ↓
                   DSS Engine (кеш 60 с, snapshots у БД)
Адмін (/admin/*)  →  Bearer admin token
Клієнт (shop)   →  Bearer customer token (кошик, checkout, відгуки)
```

**Замкнутий бізнес-контур:**

1. Клієнт оформлює замовлення → резерв на складі (`PENDING`)
2. Mock-оплата → `COMPLETED` → списання → `invalidateDssCache()`
3. DSS перераховує попит, ROP, рекомендації
4. Адмін поповнює склад або створює PO → знову invalidate cache

---

## 3. Frontend — маршрути та функції

### 3.1 Магазин (публічна частина)

| Маршрут | Файл | Функціонал | Статус |
|---------|------|------------|--------|
| `/` | `HomePage.tsx` | Hero, категорії, 8 популярних товарів, переваги | ✅ Працює |
| `/catalog` | `CatalogPage.tsx` | Пошук, фільтр категорії, сітка товарів | ✅ Працює |
| `/product/:id` | `ProductPage.tsx` | Фото, ціна, залишок, tabs (опис / specs / відгуки), кошик | ✅ Працює |
| `/cart` | `CartPage.tsx` | Кошик, syncStock(), зміна qty | ✅ Працює (потрібен customer login) |
| `/checkout` | `CheckoutPage.tsx` | Оформлення замовлення | ✅ Працює (потрібен customer login) |
| `/payment/:orderNumber` | `PaymentPage.tsx` | Mock-оплата / скасування | ✅ Працює |
| `/orders` | `MyOrdersPage.tsx` | Історія (акаунт / email / номер) | ✅ Працює |
| `/account` | `AccountPage.tsx` | Профіль, зміна імені | ✅ Працює |
| `/about` | `AboutPage.tsx` | Опис системи для диплому | ✅ Працює |

**Поведінка за ролями (shop):**

| Роль | Кошик | Купівля | DSS-посилання на товар |
|------|-------|---------|------------------------|
| Гість | ❌ | ❌ (redirect на login) | ❌ |
| Клієнт | ✅ | ✅ | ❌ (DSS приховано в nav) |
| Admin DSS | ❌ (на `/admin/*`) | ❌ | ✅ «DSS →» замість «У кошик» |

### 3.2 Авторизація

| Маршрут | Файл | Функціонал | Статус |
|---------|------|------------|--------|
| `/login` | `LoginPage.tsx` | Вхід admin DSS; demo pre-fill | ✅ Працює |
| `/account/login` | `CustomerLoginPage.tsx` | Вхід клієнта; demo pre-fill | ✅ Працює |
| `/account/register` | `CustomerRegisterPage.tsx` | Реєстрація клієнта | ✅ Працює |

**Контексти:**

| Контекст | Файл | Зберігання | API |
|----------|------|------------|-----|
| Admin | `AuthContext.tsx` | `sessionStorage` | `POST /api/auth/login` |
| Customer | `CustomerAuthContext.tsx` | `localStorage` | `/api/customer/*` |
| Unified | `useAppAuth.ts` | — | `isAdmin = admin && !customer` |

**Взаємовиключність:** вхід в DSS скидає customer-сесію і навпаки.

### 3.3 Адмін / DSS

| Маршрут | Файл | Функціонал | Статус |
|---------|------|------------|--------|
| `/admin` | `AdminDashboardPage.tsx` | KPI, ABC chart, продажі, top risks | ✅ Працює |
| `/admin/products` | `AdminProductsPage.tsx` | Таблиця всіх SKU + DSS метрики | ✅ Працює |
| `/admin/catalog` | `AdminManageProductsPage.tsx` | CRUD товарів (soft delete) | ✅ Працює |
| `/admin/inventory` | `AdminInventoryPage.tsx` | Залишки, ручне поповнення, рухи | ✅ Працює |
| `/admin/abc` | `AdminAbcPage.tsx` | Матриця ABC/XYZ | ✅ Працює |
| `/admin/experiment` | `AdminExperimentPage.tsx` | Порівняння «без DSS vs з DSS» | ⚠️ Baseline синтетичний |
| `/admin/purchase-orders` | `AdminPurchaseOrdersPage.tsx` | PO: створення, прийом | ⚠️ Cancel API без UI |
| `/admin/product/:id` | `DssProductPage.tsx` | Прогноз, what-if, висновок, restock, PO | ✅ Працює |

**Захист:** `AdminRoute.tsx` — без admin token → `/login`; якщо залогінений клієнт → `/catalog`.

### 3.4 Компоненти та хуки

| Файл | Призначення | Статус |
|------|-------------|--------|
| `Layout.tsx` | Header, nav, cart, footer; auth pages без header | ✅ |
| `AuthPageLayout.tsx` | Split-layout для login/register | ✅ |
| `ProductCard.tsx` | Картка товару; admin → DSS link | ✅ |
| `ProductReviews.tsx` | Відгуки (лише customer може писати) | ✅ |
| `DemandChart.tsx` | Графік історії + прогнозу (Recharts) | ✅ |
| `DssConclusion.tsx` | Блок «Висновок системи» | ✅ |
| `RecommendationBadge.tsx` | Бейдж ORDER/RISK/REDUCE/OK | ✅ |
| `Pagination.tsx` | Пагінація списків | ✅ |
| `CartContext.tsx` | localStorage кошик + syncStock | ✅ |
| `useAddToCart.ts` | Gate: лише customer може купувати | ✅ |
| `useAppAuth.ts` | Єдина сесія admin/customer | ✅ |
| `CustomerRoute.tsx` | Guard для customer routes | ✅ | cart, checkout, payment, account |
| `api/client.ts` | HTTP-клієнт до всіх API | ✅ |

---

## 4. Backend — API та сервіси

### 4.1 Публічні endpoints

| Method | Endpoint | Файл | Призначення | Статус |
|--------|----------|------|-------------|--------|
| GET | `/api/health` | `app.ts` | Health check | ✅ |
| GET | `/api/categories` | `categories.ts` | Список категорій | ✅ |
| GET | `/api/products` | `products.ts` | Каталог (search, category) | ✅ |
| GET | `/api/products/:id` | `products.ts` | Картка товару + specs + reviewSummary | ✅ |
| POST | `/api/products/stock-check` | `products.ts` | Перевірка залишків для кошика | ✅ |
| GET | `/api/products/:id/reviews` | `products.ts` | Список відгуків | ✅ |
| POST | `/api/products/:id/reviews` | `products.ts` | Створити відгук (customer token) | ✅ |
| POST | `/api/orders` | `orders.ts` | Створити замовлення + резерв | ✅ |
| POST | `/api/orders/:n/pay` | `orders.ts` | Mock-оплата | ⚠️ Без auth |
| POST | `/api/orders/:n/cancel` | `orders.ts` | Скасування PENDING | ⚠️ Без auth |
| GET | `/api/orders/my` | `orders.ts` | Замовлення (token або email) | ⚠️ Email без верифікації |
| GET | `/api/orders/number/:n` | `orders.ts` | Замовлення за номером | ⚠️ Публічно |
| GET | `/api/orders` | `orders.ts` | Останні 100 замовлень | ❌ **Публічний leak** |
| POST | `/api/auth/login` | `auth.ts` | Admin login | ✅ |
| POST | `/api/customer/register` | `customer.ts` | Реєстрація (bcrypt) | ✅ |
| POST | `/api/customer/login` | `customer.ts` | Customer login | ✅ |
| GET/PATCH | `/api/customer/me` | `customer.ts` | Профіль | ✅ |

### 4.2 Admin endpoints (Bearer token)

| Група | Ключові endpoints | Файл | Статус |
|-------|-------------------|------|--------|
| DSS | dashboard, products, export, abc, experiment, what-if, params, snapshots, cache/invalidate | `dss.ts` | ✅ |
| Admin | products CRUD, inventory, restock, movements, stats/sales | `admin.ts` | ✅ |
| PO | list, create, receive, cancel | `purchaseOrders.ts` | ✅ (cancel без UI) |

### 4.3 Сервіс замовлень та складу

**Файли:** `services/orders.ts`, `services/inventory.ts`

| Функція | Що робить |
|---------|-----------|
| `reserveStock()` | Резервує qty при створенні замовлення |
| `releaseReservation()` | Повертає резерв при cancel |
| `fulfillReservation()` | Списує зі складу після оплати + StockMovement |
| `completeOrderPayment()` | PENDING → COMPLETED + invalidateDssCache |
| `cancelPendingOrder()` | Cancel + release + invalidateDssCache |
| `availableStock()` | quantity − reservedQty |

---

## 5. DSS Engine — функції

### 5.1 `backend/src/services/dss/engine.ts`

| Функція | Призначення | Використання |
|---------|-------------|--------------|
| `buildDailyDemandSeries()` | 90-денна серія продажів з COMPLETED orders | Прогноз, μ, σ |
| `computeForecast()` | ES (α=0.35) або MA; projected array | Dashboard, SKU page |
| `computeForecastMape()` | Holdout MAPE (83% train / 17% test) | Точність прогнозу |
| `classifyRecommendation()` | ORDER / RISK_OOS / REDUCE / OK + riskScore | Ядро рішень |
| `analyzeProduct()` | Повний аналіз одного SKU | DSS product page, lists |
| `computeAbcClassification()` | Pareto 80/15/5 за revenue | ABC matrix |
| `getAllProductAnalyses()` | Всі SKU через cache | Dashboard, export |
| `buildKpisFromAnalyses()` | Агреговані KPI | Dashboard |
| `getDashboardData()` | KPI + top 10 risks | `/api/dss/dashboard` |
| `runWhatIf()` | baseline vs scenario + deltas | What-if UI |

**Ключові константи:**

- `PLANNING_BLEND_FORECAST = 0.65` → плановий попит = 65% прогноз + 35% μ
- `HISTORY_DAYS = 90`
- `MA_WINDOW = 14`

### 5.2 `backend/src/services/dss/math.ts`

| Функція | Формула |
|---------|---------|
| `zScoreFromServiceLevel()` | Lookup Z для 90/95/97/99% |
| `safetyStock()` | max(Z·σ·√LT, μ·days) |
| `reorderPoint()` | μ·LT + SS |
| `economicOrderQuantity()` | √(2DS/H) |
| `daysOfSupply()` | stock / μ |
| `exponentialSmoothing()` | ES з α |
| `mape()` | Mean Absolute Percentage Error |
| `coefficientOfVariation()` | σ/μ |
| `classifyXyz()` | X≤0.5, Y≤1.0, Z>1.0 |

**Тести:** 7 unit-тестів у `math.test.ts` — ✅ всі проходять.

### 5.3 Cache та snapshots

| Функція | Файл | Призначення |
|---------|------|-------------|
| `getCachedAnalyses()` | `cache.ts` | Memory + DB cache, TTL 60 с |
| `invalidateDssCache()` | `cache.ts` | Скидання після змін складу/продажів |
| `saveDssSnapshot()` | `snapshots.ts` | Audit trail (what-if, restock, PO) |
| `getRecentSnapshots()` | `snapshots.ts` | API без UI |

**Проблема:** `PATCH /api/dss/products/:id/params` **не викликає** `invalidateDssCache()` — dashboard може показувати застарілі дані до 60 с.

### 5.4 Frontend DSS висновок

| Функція | Файл | Призначення |
|---------|------|-------------|
| `buildDssConclusion()` | `lib/dssConclusion.ts` | Текст: аналіз + рішення + кроки |
| `DssConclusion` | `components/DssConclusion.tsx` | UI-блок в кінці SKU page |

---

## 6. Адаптивна верстка

### 6.1 Що реалізовано

**Файл стилів:** `frontend/src/index.css`

| Breakpoint | Що адаптується |
|------------|----------------|
| `max-width: 768px` | Hero → 1 колонка; product-detail → 1 колонка; hero image зверху |
| `min-width: 900px` | Auth pages → 2 колонки (brand + form) |

**Responsive без media queries (auto-layout):**

- `.container` — `min(1200px, 100% - 2rem)`
- `.grid-kpi`, `.product-grid`, `.shop-perks`, `.about-grid` — CSS Grid `auto-fit`
- `.catalog-toolbar`, nav у Layout — `flex-wrap`
- Auth pages — `100dvh`, full-screen на mobile

### 6.2 Що працює добре на mobile

- ✅ Сторінки входу (login/register) — одна колонка, повний екран
- ✅ Каталог, картки товарів — сітка стискається
- ✅ KPI dashboard — grid auto-fit
- ✅ Product detail — зображення над текстом

### 6.3 Слабкі місця на mobile

| Проблема | Де | Ризик |
|----------|-----|-------|
| Широкі HTML-таблиці без scroll wrapper | `CartPage`, `MyOrdersPage`, `AdminProductsPage` (14 кол.) | Горизонтальний overflow |
| Header nav — багато пунктів inline | `Layout.tsx` | Переноситься, але без burger menu |
| Admin tables — частково `overflowX: auto` | 5 admin pages | Не всюди однаково |
| Inline styles замість CSS classes | Layout, багато admin pages | Важче підтримувати responsive |

### 6.4 Висновок по адаптивності

**Верстка частково адаптивна:** базовий mobile layout є (grid, flex-wrap, 2 breakpoint), але **не оптимізована для вузьких екранів** адмін-таблиць і навігації. Для дипломного демо на ноутбуці/проекторі — **достатньо**. Для mobile-first admin panel — потрібні доопрацювання (розділ 8).

---

## 7. Проблеми проєкту

### 7.1 Критичні (безпека — для production)

1. **`GET /api/orders`** — публічний список замовлень
2. **`POST .../pay` і `.../cancel`** — без перевірки власника
3. **`GET /api/orders/my?email=`** — перегляд за email без OTP
4. **Demo credentials** у frontend + README
5. **Open CORS**, немає rate limiting
6. **Custom HMAC token** замість стандартного JWT + httpOnly cookies

> Для **дипломного demo** — прийнятно, якщо описано в розділі «Обмеження».

### 7.2 Функціональні

| # | Проблема | Файл |
|---|----------|------|
| 1 | Experiment baseline — фіксовані 40%/25%, не симуляція | `routes/dss.ts` |
| 2 | Cache не скидається після save DSS params | `routes/dss.ts` PATCH params |
| 3 | Snapshots API без UI | `GET /api/dss/snapshots` |
| 4 | PO cancel API без UI | `purchaseOrders.ts` |
| 5 | ~~`CustomerRoute.tsx` — dead code~~ | Підключено в `App.tsx` |
| 6 | Guest checkout видалено; лише lookup by email | design choice |

### 7.3 Документація

| Файл | Розбіжність з кодом |
|------|---------------------|
| `THESIS.md` | «Немає PO» — PO є |
| `THESIS.md` | «Лише math tests» — є 16 integration tests |
| `README.md` | Немає customer accounts, reviews у списку features |
| `README.md` | Не згадує checkout requires login |

### 7.4 Тести

**Є (45):** backend — math (7) + engine (3) + orderAccess (4) + integration (17); frontend — CartContext, useAddToCart, CustomerRoute, dssConclusion (14)  
**Немає:** E2E, security negative tests, visual/responsive tests

---

## 8. Рекомендації та покращення

### P0 — перед production (не обов'язково для захисту)

- [ ] Auth на pay/cancel/view orders
- [ ] Прибрати публічний `GET /api/orders`
- [ ] CORS whitelist, rate limit login
- [ ] Env secrets без defaults у коді

### P1 — коректність DSS (1–2 год)

- [ ] `invalidateDssCache()` після PATCH dss params
- [ ] Disclaimer на experiment page про synthetic baseline
- [ ] Unit-тести `analyzeProduct`, `classifyRecommendation`

### P2 — документація (для диплому)

- [ ] Оновити `THESIS.md` і `README.md`
- [ ] Розділ записки «Взаємодія e-commerce та DSS»
- [ ] Сценарій демо на 7 хвилин

### P3 — UX / responsive (опційно)

- [ ] CSS class `.table-scroll { overflow-x: auto }` для Cart, Orders, Admin tables
- [ ] Collapsible nav / burger на mobile
- [ ] UI для DSS snapshots на admin dashboard
- [ ] Кнопка «Скасувати PO» в UI

### P4 — якість (опційно)

- [x] Frontend Vitest (CartContext, useAddToCart, CustomerRoute, dssConclusion)
- [ ] Playwright E2E: checkout flow
- [x] Підключити `CustomerRoute.tsx` (cart, checkout, payment, account)
- [ ] OpenAPI/Swagger

### P5 — розширення (за бажанням)

- [ ] Holt-Winters / сезонний прогноз
- [ ] Multi-warehouse
- [ ] Ролі admin/manager/analyst

---

## 9. Матриця «функція → працездатність»

| Модуль | Функція | Працює | Примітка |
|--------|---------|--------|----------|
| Магазин | Перегляд каталогу | ✅ | |
| Магазин | Кошик + checkout | ✅ | Потрібен customer login |
| Магазин | Mock-оплата | ✅ | |
| Магазин | Відгуки | ✅ | Тільки customer |
| Магазин | Sync stock у кошику | ✅ | |
| Auth | Admin DSS login | ✅ | Demo pre-fill |
| Auth | Customer login/register | ✅ | Demo pre-fill |
| Auth | Взаємовиключність сесій | ✅ | |
| DSS | ABC/XYZ | ✅ | |
| DSS | Прогноз ES + MAPE | ✅ | |
| DSS | ROP, SS, EOQ | ✅ | |
| DSS | Рекомендації | ✅ | |
| DSS | What-if | ✅ | |
| DSS | Висновок системи | ✅ | Новий блок |
| DSS | CSV export | ✅ | |
| DSS | Experiment | ⚠️ | Евристичний baseline (40%/25%); disclaimer у UI |
| Admin | CRUD товарів | ✅ | |
| Admin | Inventory + restock | ✅ | |
| Admin | Purchase Orders | ✅ | Cancel без UI |
| Admin | Dashboard KPI | ✅ | |
| Cache | TTL 60s | ✅ | `invalidateDssCache` після PATCH params |
| Snapshots | Збереження | ✅ | Перегляд без UI |
| Docker | PostgreSQL stack | ✅ | `docker compose up` |
| Tests | Backend 31 | ✅ | math + engine + orderAccess + integration |
| Tests | Frontend 14 | ✅ | CartContext, useAddToCart, CustomerRoute, dssConclusion |
| Security | Order API | ✅ | Ownership check; guest lookup по №+email |
| Responsive | Shop pages | ✅ | Breakpoints; `.table-scroll` у кошику/замовленнях |
| Responsive | Admin tables | ✅ | `.table-scroll` на dashboard/experiment |

---

## 10. Команди для перевірки

```bash
cd "/Users/user/Desktop/DIPLOM/DIPLOM 5"
npm install
npm run db:reset      # migrate + seed
npm run dev           # API :3001 + UI :5173
npm run test          # 45 tests (backend 31 + frontend 14)
npm run build         # production build
```

**Demo credentials:**

| Роль | Login | Password |
|------|-------|----------|
| DSS Admin | `admin` | `admin123` |
| Customer | `client@stockwise.demo` | `client123` |

---

## 11. Пов'язані документи

- `README.md` — інструкція запуску
- `THESIS.md` — чернетка структури захисту (**потребує оновлення**)
- `AboutPage.tsx` — in-app опис системи

---

*Звіт згенеровано на основі аудиту кодової бази StockWise. Для питань по конкретному модулю — див. file paths у таблицях вище.*
