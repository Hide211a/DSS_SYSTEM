import express from 'express';
import cors from 'cors';
import { productsRouter } from './routes/products.js';
import { categoriesRouter } from './routes/categories.js';
import { ordersRouter } from './routes/orders.js';
import { dssRouter } from './routes/dss.js';
import { adminRouter } from './routes/admin.js';
import { purchaseOrdersRouter } from './routes/purchaseOrders.js';
import { authRouter } from './routes/auth.js';
import { customerRouter } from './routes/customer.js';
import { requireAdmin } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

const corsOrigins = process.env.CORS_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors(
    corsOrigins?.length
      ? {
          origin: corsOrigins,
          credentials: true,
        }
      : undefined
  )
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Inventory DSS API' });
});

app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/customer', customerRouter);
app.use('/api/dss', requireAdmin, dssRouter);
app.use('/api/admin', requireAdmin, adminRouter);
app.use('/api/admin/purchase-orders', requireAdmin, purchaseOrdersRouter);

app.use(errorHandler);
