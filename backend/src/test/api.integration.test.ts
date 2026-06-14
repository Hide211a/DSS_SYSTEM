import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('API integration', () => {
  let token = '';
  let productId = '';
  let categoryId = '';

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    token = login.body.token;

    const product = await prisma.product.findFirst({
      where: { isActive: true },
      include: { inventory: true },
    });
    if (!product) throw new Error('No seed products');
    productId = product.id;
    categoryId = product.categoryId;
  });

  it('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/login rejects bad password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('GET /api/dss/dashboard requires auth', async () => {
    const res = await request(app).get('/api/dss/dashboard');
    expect(res.status).toBe(401);
  });

  it('GET /api/dss/dashboard with token', async () => {
    const res = await request(app)
      .get('/api/dss/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.kpis).toBeDefined();
    expect(Array.isArray(res.body.topRisks)).toBe(true);
  });

  it('GET /api/dss/products returns pagination', async () => {
    const res = await request(app)
      .get('/api/dss/products?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('POST /api/products/stock-check', async () => {
    const res = await request(app)
      .post('/api/products/stock-check')
      .send({ productIds: [productId] });
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(productId);
    expect(typeof res.body[0].stock).toBe('number');
  });

  it('POST /api/orders reserves stock; pay completes sale', async () => {
    const customerLogin = await request(app)
      .post('/api/customer/login')
      .send({ email: 'client@stockwise.demo', password: 'client123' });
    const customerToken = customerLogin.body.token;

    const before = await prisma.inventoryItem.findUnique({ where: { productId } });
    const qty = 1;
    const stockBefore = before?.quantity ?? 0;
    const reservedBefore = before?.reservedQty ?? 0;
    if (stockBefore - reservedBefore < qty) return;

    const create = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ productId, quantity: qty }],
      });

    expect(create.status).toBe(201);
    expect(create.body.status).toBe('PENDING');
    expect(create.body.orderNumber).toMatch(/^ORD-/);

    const afterReserve = await prisma.inventoryItem.findUnique({ where: { productId } });
    expect(afterReserve!.quantity).toBe(stockBefore);
    expect(afterReserve!.reservedQty).toBe(reservedBefore + qty);

    const pay = await request(app)
      .post(`/api/orders/${create.body.orderNumber}/pay`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ paymentMethod: 'MOCK_CARD' });
    expect(pay.status).toBe(200);
    expect(pay.body.status).toBe('COMPLETED');

    const afterPay = await prisma.inventoryItem.findUnique({ where: { productId } });
    expect(afterPay!.quantity).toBe(stockBefore - qty);
    expect(afterPay!.reservedQty).toBe(reservedBefore);
  });

  it('POST /api/orders/:n/pay rejects unauthorized access', async () => {
    const order = await prisma.order.findFirst({ where: { status: 'PENDING' } });
    if (!order) return;
    const res = await request(app)
      .post(`/api/orders/${order.orderNumber}/pay`)
      .send({ paymentMethod: 'MOCK_CARD' });
    expect(res.status).toBe(403);
  });

  it('GET /api/orders/my requires customer auth', async () => {
    const res = await request(app).get('/api/orders/my?page=1');
    expect(res.status).toBe(401);
  });

  it('POST /api/admin/purchase-orders receive increases stock', async () => {
    const before = await prisma.inventoryItem.findUnique({ where: { productId } });
    const addQty = 3;

    const create = await request(app)
      .post('/api/admin/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: addQty });

    expect(create.status).toBe(201);
    expect(create.body.poNumber).toMatch(/^PO-/);

    const receive = await request(app)
      .post(`/api/admin/purchase-orders/${create.body.id}/receive`)
      .set('Authorization', `Bearer ${token}`);
    expect(receive.status).toBe(200);
    expect(receive.body.status).toBe('RECEIVED');

    const after = await prisma.inventoryItem.findUnique({ where: { productId } });
    expect(after!.quantity).toBe((before?.quantity ?? 0) + addQty);
  });

  it('POST /api/admin/products creates product', async () => {
    const sku = `TEST-${Date.now()}`;
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sku,
        name: 'Integration Test Product',
        description: 'Created by test',
        price: 100,
        unitCost: 50,
        categoryId,
        initialStock: 10,
      });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe(sku);

    await prisma.product.update({
      where: { id: res.body.id },
      data: { isActive: false },
    });
  });

  it('POST /api/admin/restock increases inventory', async () => {
    const before = await prisma.inventoryItem.findUnique({ where: { productId } });
    const res = await request(app)
      .post('/api/admin/restock')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 5, note: 'integration test' });
    expect(res.status).toBe(200);
    const after = await prisma.inventoryItem.findUnique({ where: { productId } });
    expect(after!.quantity).toBe((before?.quantity ?? 0) + 5);
  });

  it('GET /api/admin/movements paginated', async () => {
    const res = await request(app)
      .get('/api/admin/movements?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(10);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/customer/login returns customer token', async () => {
    const res = await request(app)
      .post('/api/customer/login')
      .send({ email: 'client@stockwise.demo', password: 'client123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.role).toBe('customer');
    expect(res.body.user.email).toBe('client@stockwise.demo');
  });

  it('GET /api/orders/my with customer token', async () => {
    const login = await request(app)
      .post('/api/customer/login')
      .send({ email: 'client@stockwise.demo', password: 'client123' });
    const res = await request(app)
      .get('/api/orders/my?page=1')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/products/:id includes specs and reviews', async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.specs)).toBe(true);
    expect(res.body.specs.length).toBeGreaterThan(0);
    expect(res.body.reviewSummary.reviewCount).toBeGreaterThan(0);
  });

  it('POST /api/products/:id/reviews creates review', async () => {
    const login = await request(app)
      .post('/api/customer/login')
      .send({ email: 'client@stockwise.demo', password: 'client123' });

    const res = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ rating: 5, comment: 'Integration test review update' });

    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);
    expect(res.body.summary.reviewCount).toBeGreaterThan(0);
  });
});
