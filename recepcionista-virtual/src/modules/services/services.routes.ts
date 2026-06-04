import { Router, Request, Response } from 'express';
import { listServices, createService } from './services.service';
import { requireAdminAuth } from '../../middleware/adminAuth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const services = await listServices();
  res.json({ services });
});

router.post('/', requireAdminAuth, async (req: Request, res: Response) => {
  const { name, description, durationMinutes, priceFrom, requiresEvaluation } = req.body;
  if (!name || !description || !durationMinutes || !priceFrom) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  const service = await createService({ name, description, durationMinutes, priceFrom, requiresEvaluation });
  res.status(201).json({ service });
});

export default router;
