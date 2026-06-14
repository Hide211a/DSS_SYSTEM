import { Router } from 'express';
import { z } from 'zod';
import { adminLogin } from '../services/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post('/login', (req, res) => {
  const body = loginSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Невірні дані' });
    return;
  }
  const token = adminLogin(body.data.username, body.data.password);
  if (!token) {
    res.status(401).json({ error: 'Невірний логін або пароль' });
    return;
  }
  res.json({ token, role: 'admin' });
});
