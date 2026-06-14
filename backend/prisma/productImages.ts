/** Локальні фото товарів (frontend/public/products/) */
export const PRODUCT_IMAGES: Record<string, string> = {
  'ELEC-001': '/products/elec-001.jpg',
  'ELEC-002': '/products/elec-002.jpg',
  'ELEC-003': '/products/elec-003.jpg',
  'ELEC-004': '/products/elec-004.jpg',
  'CLO-001': '/products/clo-001.jpg',
  'CLO-002': '/products/clo-002.jpg',
  'HOME-001': '/products/home-001.jpg',
  'HOME-002': '/products/home-002.jpg',
  'SPORT-001': '/products/sport-001.jpg',
  'SPORT-002': '/products/sport-002.jpg',
};

export function productImageUrl(sku: string): string {
  return PRODUCT_IMAGES[sku] ?? `/products/${sku.toLowerCase()}.jpg`;
}
