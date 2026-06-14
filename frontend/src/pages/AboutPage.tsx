import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Інтернет-магазин',
    items: [
      'Каталог товарів з категоріями та пошуком',
      'Особистий акаунт клієнта та історія замовлень',
      'Кошик, оформлення та mock-оплата',
      'Актуальні залишки на складі в реальному часі',
    ],
  },
  {
    title: 'DSS для адміністратора',
    items: [
      'ABC/XYZ-класифікація SKU за оборотом і стабільністю попиту',
      'Прогноз попиту (експоненційне згладжування) та MAPE',
      'Точка замовлення (ROP), страховий запас, EOQ',
      'Рекомендації: поповнити, ризик дефіциту, надлишок',
      'What-if сценарії та заявки на закупівлю',
    ],
  },
];

const FLOW = [
  { step: '1', text: 'Клієнт оформлює замовлення в магазині' },
  { step: '2', text: 'Система резервує та списує товар зі складу' },
  { step: '3', text: 'DSS аналізує продажі та оновлює рекомендації' },
  { step: '4', text: 'Адміністратор приймає рішення про поповнення запасів' },
];

export function AboutPage() {
  return (
    <div className="container about-page">
      <section className="about-hero card">
        <span className="shop-hero-badge">Про StockWise</span>
        <h1>Система підтримки прийняття рішень для управління товарними запасами</h1>
        <p className="about-lead">
          StockWise — це навчальний веб-проєкт, який поєднує повноцінний інтернет-магазин і
          інтелектуальну підсистему управління запасами (DSS — Decision Support System). Одна
          платформа для покупців і для менеджерів складу.
        </p>
      </section>

      <section className="about-section">
        <h2>Чим є ця система</h2>
        <div className="about-grid">
          <div className="card">
            <h3>Для клієнта</h3>
            <p>
              Звичайний онлайн-магазин: перегляд товарів, реєстрація, кошик, замовлення та оплата.
              Кожна покупка впливає на склад — ви бачите лише те, що реально є в наявності.
            </p>
          </div>
          <div className="card">
            <h3>Для бізнесу</h3>
            <p>
              Закритий адмін-модуль аналізує історію продажів, прогнозує попит і підказує, коли та
              скільки товару замовляти. Це зменшує ризик дефіциту та надлишкових запасів.
            </p>
          </div>
          <div className="card">
            <h3>Для дипломної роботи</h3>
            <p>
              Демонстрація інтеграції e-commerce і DSS: від математичних моделей (ROP, EOQ, ABC) до
              робочого інтерфейсу з експериментом «без DSS vs з DSS».
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Можливості платформи</h2>
        <div className="about-features">
          {FEATURES.map((block) => (
            <div key={block.title} className="card">
              <h3>{block.title}</h3>
              <ul>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2>Як це працює разом</h2>
        <div className="about-flow">
          {FLOW.map((item) => (
            <div key={item.step} className="about-flow-step card">
              <span className="about-flow-num">{item.step}</span>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card about-cta">
        <h2 style={{ marginTop: 0 }}>Спробуйте самі</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Перегляньте каталог як покупець або увійдіть в адмін-панель DSS, щоб побачити аналітику
          запасів.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/catalog" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            До каталогу
          </Link>
          <Link to="/account/register" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Створити акаунт
          </Link>
        </div>
        <p style={{ marginTop: '1.25rem', marginBottom: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Адміністратор DSS: окремий вхід на{' '}
          <Link to="/login">/login</Link> (демо: admin / admin123)
        </p>
      </section>
    </div>
  );
}
