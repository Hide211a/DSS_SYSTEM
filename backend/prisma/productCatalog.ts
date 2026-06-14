export interface ProductCatalogEntry {
  sku: string;
  description: string;
  specs: { name: string; value: string }[];
}

export const PRODUCT_CATALOG: Record<string, ProductCatalogEntry> = {
  'ELEC-001': {
    description:
      'Преміальні бездротові навушники з активним шумопоглинанням і до 30 годин автономності разом з кейсом. Мʼякі амбушури, стабільне Bluetooth 5.3 зʼєднання та вбудований мікрофон для дзвінків. Підходять для роботи, подорожей і щоденного прослуховування музики.',
    specs: [
      { name: 'Тип', value: 'Накладні, закриті' },
      { name: 'Bluetooth', value: '5.3' },
      { name: 'Акумулятор', value: '30 год (з кейсом)' },
      { name: 'Шумопоглинання', value: 'Активне (ANC)' },
      { name: 'Вага', value: '248 г' },
      { name: 'Гарантія', value: '24 міс.' },
    ],
  },
  'ELEC-002': {
    description:
      'Потужний powerbank ємністю 20000 mAh з підтримкою швидкої зарядки USB-C PD 22.5 W. Два порти USB-A та USB-C — заряджає телефон до 4 разів. Компактний корпус з індикатором рівня заряду, захист від перегріву та короткого замикання.',
    specs: [
      { name: 'Ємність', value: '20000 mAh' },
      { name: 'Вихід', value: 'USB-C PD 22.5 W, USB-A 18 W' },
      { name: 'Вхід', value: 'USB-C 18 W' },
      { name: 'Розміри', value: '148 × 68 × 28 мм' },
      { name: 'Вага', value: '380 г' },
      { name: 'Гарантія', value: '12 міс.' },
    ],
  },
  'ELEC-003': {
    description:
      'Універсальний USB-C хаб 7-in-1 для ноутбуків і планшетів: HDMI 4K, 3× USB 3.0, SD/microSD, USB-C PD 100 W pass-through та Gigabit Ethernet. Алюмінієвий корпус, plug-and-play без драйверів.',
    specs: [
      { name: 'Інтерфейс', value: 'USB-C 3.2' },
      { name: 'HDMI', value: '4K @ 30 Hz' },
      { name: 'USB порти', value: '3 × USB 3.0' },
      { name: 'Картридер', value: 'SD + microSD' },
      { name: 'Ethernet', value: 'RJ-45 1000 Mbps' },
      { name: 'PD pass-through', value: 'до 100 W' },
    ],
  },
  'ELEC-004': {
    description:
      'Ергономічна бездротова миша з регульованим DPI (800–3200), тихими кнопками та енергоефективним сенсором. USB-приймач 2.4 GHz у комплекті, до 12 місяців роботи від однієї AA-батарейки.',
    specs: [
      { name: 'Тип', value: 'Бездротова, 2.4 GHz' },
      { name: 'DPI', value: '800 / 1600 / 3200' },
      { name: 'Кнопки', value: '6 програмованих' },
      { name: 'Живлення', value: '1 × AA (до 12 міс.)' },
      { name: 'Сумісність', value: 'Windows, macOS, Linux' },
      { name: 'Гарантія', value: '12 міс.' },
    ],
  },
  'CLO-001': {
    description:
      'Класична футболка з 100% бавовни плотністю 180 g/m². Мʼяка тканина, округла горловина, подвійна прострочка на манжетах. Підходить для повсякденного носіння та друку — стійкий колір після прання.',
    specs: [
      { name: 'Склад', value: '100% бавовна' },
      { name: 'Щільність', value: '180 g/m²' },
      { name: 'Розміри', value: 'S, M, L, XL, XXL' },
      { name: 'Колір', value: 'Білий / Чорний / Сірий' },
      { name: 'Догляд', value: 'Машинне прання 40°C' },
      { name: 'Країна', value: 'Україна' },
    ],
  },
  'CLO-002': {
    description:
      'Джинси Slim Fit з еластаном для комфортної посадки. Міцний денім, класична п’ятикишенна модель, контрастна прострочка. Універсальний фасон для офісу та дозвілля.',
    specs: [
      { name: 'Склад', value: '98% бавовна, 2% еластан' },
      { name: 'Посадка', value: 'Slim Fit' },
      { name: 'Розміри', value: '28–38 (W)' },
      { name: 'Довжина', value: '32 / 34 дюйми' },
      { name: 'Колір', value: 'Індиго' },
      { name: 'Догляд', value: 'Машинне прання 30°C' },
    ],
  },
  'HOME-001': {
    description:
      'Сучасна LED-лампа з регулюванням яскравості та температури світла (3000–6500 K). Гнучкий нікелирований штатив, сенсорне керування, USB-порт для зарядки телефону. Економічне споживання — до 10 W.',
    specs: [
      { name: 'Потужність', value: '10 W LED' },
      { name: 'Яскравість', value: 'до 800 lm' },
      { name: 'Температура світла', value: '3000–6500 K' },
      { name: 'USB-порт', value: '5 V / 1 A' },
      { name: 'Висота', value: '35–52 см' },
      { name: 'Гарантія', value: '24 міс.' },
    ],
  },
  'HOME-002': {
    description:
      'Багатофункціональний органайзер для кухні та шафи: 4 відділення, знімні перегородки, вентильовані стінки. BPA-free пластик, легко миється, компактно складається.',
    specs: [
      { name: 'Матеріал', value: 'PP пластик (BPA-free)' },
      { name: 'Розміри', value: '32 × 24 × 18 см' },
      { name: 'Відділення', value: '4 (з перегородками)' },
      { name: 'Макс. навантаження', value: '5 кг' },
      { name: 'Колір', value: 'Сірий / Прозорий' },
      { name: 'Догляд', value: 'Миття в посудомийці' },
    ],
  },
  'SPORT-001': {
    description:
      'Професійний килимок для йоги та фітнесу товщиною 6 мм. Антиковзна текстурована поверхня з обох боків, стійкий до поту, легкий TPE-матеріал без запаху. Ремінь для переноски у комплекті.',
    specs: [
      { name: 'Матеріал', value: 'TPE (еко)' },
      { name: 'Товщина', value: '6 мм' },
      { name: 'Розмір', value: '183 × 61 см' },
      { name: 'Вага', value: '900 г' },
      { name: 'Колір', value: 'Фіолетовий / Синій / Сірий' },
      { name: 'Комплект', value: 'Ремінь-стrap' },
    ],
  },
  'SPORT-002': {
    description:
      'Комплект гантелей 2 × 5 кг з неопреновим покриттям для зручного хвату. Гексагональна форма — не котиться під час вправ. Підходить для домашніх тренувань, пілates та силових вправ.',
    specs: [
      { name: 'Вага', value: '2 × 5 кг' },
      { name: 'Покриття', value: 'Неопрен' },
      { name: 'Форма', value: 'Гексагональна' },
      { name: 'Діаметр диска', value: '17 см' },
      { name: 'Призначення', value: 'Силові, функціональні' },
      { name: 'Гарантія', value: '12 міс.' },
    ],
  },
};

export const SEED_REVIEWS: {
  sku: string;
  authorEmail: string;
  authorName: string;
  rating: number;
  comment: string;
}[] = [
  {
    sku: 'ELEC-001',
    authorEmail: 'client@stockwise.demo',
    authorName: 'Олена Koval',
    rating: 5,
    comment: 'Чудовий звук і ANC реально працює в метро. Батареї вистачає на тиждень офісу.',
  },
  {
    sku: 'ELEC-001',
    authorEmail: 'reviewer1@stockwise.demo',
    authorName: 'Андрій',
    rating: 4,
    comment: 'Якість на рівні, але кейс трохи великий для кишені. Загалом рекомендую.',
  },
  {
    sku: 'ELEC-002',
    authorEmail: 'client@stockwise.demo',
    authorName: 'Олена Koval',
    rating: 5,
    comment: 'Заряджає iPhone двічі і ще залишається запас. Швидка зарядка — топ.',
  },
  {
    sku: 'ELEC-003',
    authorEmail: 'reviewer2@stockwise.demo',
    authorName: 'Марія',
    rating: 5,
    comment: 'Підключила до MacBook — HDMI і USB працюють без проблем. Дуже зручно.',
  },
  {
    sku: 'CLO-001',
    authorEmail: 'reviewer1@stockwise.demo',
    authorName: 'Андрій',
    rating: 5,
    comment: 'Мʼяка бавовна, не линяє після прання. Брав XL — сів ідеально.',
  },
  {
    sku: 'CLO-002',
    authorEmail: 'client@stockwise.demo',
    authorName: 'Олена Koval',
    rating: 4,
    comment: 'Гарна посадка slim, трохи довгі на зріст 175 см, але ношу з підворотом.',
  },
  {
    sku: 'HOME-001',
    authorEmail: 'reviewer2@stockwise.demo',
    authorName: 'Марія',
    rating: 5,
    comment: 'Регулювання світла — те що треба для роботи ввечері. USB-порт — бонус.',
  },
  {
    sku: 'SPORT-001',
    authorEmail: 'client@stockwise.demo',
    authorName: 'Олена Koval',
    rating: 5,
    comment: 'Не ковзає навіть на плитці. Легкий, з ремнем зручно нести в зал.',
  },
  {
    sku: 'SPORT-002',
    authorEmail: 'reviewer1@stockwise.demo',
    authorName: 'Андрій',
    rating: 4,
    comment: 'Компактні, зручний хват. Для домашніх тренувань — саме те.',
  },
  {
    sku: 'ELEC-004',
    authorEmail: 'reviewer2@stockwise.demo',
    authorName: 'Марія',
    rating: 5,
    comment: 'Тихі кнопки, DPI перемикається на льоту. Працює і на macOS без проблем.',
  },
];
