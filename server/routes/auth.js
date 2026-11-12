import { Router } from 'express';
import { createSession } from '../authStore.js';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = createSession();
  res.json({ token });
});

export default router;
