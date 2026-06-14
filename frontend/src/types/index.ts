export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: Category;
  stock: number;
  inStock: boolean;
  leadTimeDays?: number;
  specs?: ProductSpec[];
  reviewSummary?: ReviewSummary;
}

export interface ProductSpec {
  id: string;
  name: string;
  value: string;
}

export interface ReviewSummary {
  avgRating: number;
  reviewCount: number;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName: string;
  userId: string;
}

export interface ProductReviewsResponse {
  summary: ReviewSummary;
  items: ProductReview[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type RecommendationType = 'ORDER' | 'REDUCE' | 'OK' | 'RISK_OOS';

export interface ProductDssAnalysis {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  unitCost: number;
  price: number;
  leadTimeDays: number;
  abcClass: 'A' | 'B' | 'C';
  abcSharePercent: number;
  xyzClass: 'X' | 'Y' | 'Z';
  demandCv: number;
  avgDailyDemand: number;
  planningDemand: number;
  demandStdDev: number;
  forecastMape: number;
  forecast: {
    method: string;
    horizonDays: number;
    dailyForecast: number;
    totalForecast: number;
    history: { date: string; quantity: number }[];
    projected: { date: string; quantity: number }[];
  };
  safetyStock: number;
  reorderPoint: number;
  economicOrderQty: number;
  daysOfSupply: number;
  stockValue: number;
  recommendation: RecommendationType;
  recommendedOrderQty: number;
  riskScore: number;
  explanation: string[];
  factors: Record<string, number | string>;
}

export interface DashboardKpis {
  totalSkus: number;
  totalStockValue: number;
  avgDaysOfSupply: number;
  atRiskCount: number;
  orderRecommendedCount: number;
  overstockCount: number;
  abcDistribution: { A: number; B: number; C: number };
  xyzDistribution: { X: number; Y: number; Z: number };
}

export interface AbcItem {
  id: string;
  sku: string;
  name: string;
  abcClass: 'A' | 'B' | 'C';
  xyzClass: 'X' | 'Y' | 'Z';
  revenueSharePercent: number;
  recommendation?: RecommendationType;
  currentStock?: number;
}

export interface DssExperiment {
  summary: {
    totalSkus: number;
    needsReplenishment: number;
    healthy: number;
    overstock: number;
    totalRecommendedUnits: number;
    avgMape: number;
  };
  comparison: {
    withoutDss: {
      description: string;
      estimatedOverstockSkus: number;
      estimatedStockoutRisk: number;
    };
    withDss: {
      description: string;
      overstockSkus: number;
      stockoutRiskSkus: number;
      orderSkus: number;
    };
  };
  needsAction: ProductDssAnalysis[];
}

export interface DssDashboard {
  kpis: DashboardKpis;
  topRisks: ProductDssAnalysis[];
}

export interface WhatIfResult {
  baseline: ProductDssAnalysis;
  scenario: ProductDssAnalysis;
  deltas: {
    reorderPoint: number;
    safetyStock: number;
    recommendedOrderQty: number;
    daysOfSupply: number;
    recommendationChanged: boolean;
  };
}

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product & { category: Category };
  warehouse: { name: string; code: string };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OrderItemRow {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { id: string; sku: string; name: string; imageUrl?: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  items: OrderItemRow[];
}

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  unitCost: number;
  categoryId: string;
  category?: Category;
  leadTimeDays: number;
  minOrderQty: number;
  imageUrl?: string;
  isActive: boolean;
  stock?: number;
}

export interface CustomerUser {
  id: string;
  email: string;
  name: string | null;
}

export interface CustomerProfile extends CustomerUser {
  ordersCount: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  productId: string;
  quantity: number;
  unitCost: number;
  status: string;
  note?: string;
  createdAt: string;
  receivedAt?: string;
  product: { id: string; sku: string; name: string };
}

export interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  reference?: string;
  note?: string;
  createdAt: string;
  product: { sku: string; name: string };
  warehouse: { code: string };
}
