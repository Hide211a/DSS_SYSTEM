# Аналітика дипломного проєкту StockWise

> Актуалізовано: 14.06.2026 · детальний аудит: `PROJECT_AUDIT.md`

## 1) Сильні сторони проєкту

1. **Чітка відповідність темі DSS для inventory management**
   - Проєкт не просто e-commerce, а містить повноцінну підсистему підтримки рішень.

2. **Практична цінність для e-commerce**
   - Проблеми дефіциту/надлишку запасів покрито рекомендаційною логікою.

3. **Формалізована математична основа**
   - Safety Stock, ROP, EOQ, прогноз ES, MAPE, ABC/XYZ.

4. **Explainability (пояснюваність рішень)**
   - Для кожного SKU: пояснення, фактори, метрики + блок «Висновок системи».

5. **What-if аналіз**
   - Сценарне моделювання параметрів (LT, service level, safety days, demand multiplier).

6. **Експериментальний модуль для записки**
   - Сторінка «без DSS vs з DSS» з явним описом методології baseline.

7. **Захищений адмін-контур**
   - DSS/API та admin routes недоступні без Bearer token.

8. **Замкнений бізнес-контур**
   - Продаж → списання складу → invalidate DSS cache → перерахунок → поповнення/PO.

9. **Customer accounts + відгуки**
   - bcrypt auth, профіль, історія замовлень, відгуки на товари.

10. **Purchase Orders**
    - Створення заявок з DSS, прийом на склад, інтеграційні тести.

11. **Тестове покриття backend**
    - Unit: DSS math, engine, orderAccess · Integration: 18 API-сценаріїв.

12. **Готовність до демонстрації**
    - Seed за 12 місяців, demo credentials, повноцінний UI.

## 2) Слабкі сторони / обмеження

1. **SQLite та single-warehouse** — для production: PostgreSQL + multi-warehouse.

2. **Спрощена авторизація** — custom token (не JWT standard); demo credentials у frontend.

3. **Прогноз без ML/сезонності** — свідомий вибір інтерпретованої моделі (ES).

4. **Experiment baseline** — «без DSS» використовує оцінкову евристику (40%/25%), не historical simulation.

5. **Немає постачальників/vendor workflow** — PO product-centric, без procurement ERP.

6. **Frontend tests = 0** — UI перевірено вручну; E2E не реалізовано.

7. **Mobile admin tables** — базова адаптивність є; широкі таблиці потребують scroll (частково додано).

## 3) Що реалізовано (checklist)

- [x] E-commerce: каталог, кошик, checkout (customer login), mock-оплата
- [x] Customer accounts: register, login, profile, orders
- [x] Product specs + reviews
- [x] DSS: ABC/XYZ, прогноз, ROP, EOQ, рекомендації, what-if, висновок
- [x] Dashboard KPI + CSV export
- [x] Склад: restock, movements, sync з продажами
- [x] Purchase Orders: create, receive
- [x] Admin + customer auth (взаємовиключні сесії)
- [x] Order access control (pay/cancel/view — ownership check)
- [x] Backend tests: math + engine + orderAccess + integration
- [x] Docker PostgreSQL path

## 4) Рекомендована структура захисту

1. **Проблема** — дефіцит/надлишок запасів у e-commerce.
2. **Модель DSS** — формули та логіка рішень.
3. **Архітектура** — React + Express + Prisma, замкнутий контур.
4. **Демонстрація:**
   - Клієнт купує → залишок падає
   - DSS dashboard → SKU → what-if → висновок системи
   - Popovнення / PO
5. **Експеримент** — з disclaimer про методологію baseline.
6. **Висновок** — зниження ризику дефіциту, керованість запасів.

## 5) Перспективи розвитку (опційно)

- Frontend/E2E tests (Playwright)
- Holt-Winters / сезонний прогноз
- UI для DSS snapshots, PO cancel
- Multi-warehouse, ролі admin/manager
- OpenAPI documentation
