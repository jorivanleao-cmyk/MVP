import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes';
import servicesRoutes from './modules/services/services.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import humanRoutes from './modules/human/human.routes';
import { env } from './config/env';

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.allowedOrigins.includes('*') || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Não autorizado por CORS.'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(apiLimiter);
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', environment: env.nodeEnv, uptime: process.uptime() });
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use('/webhook', whatsappRoutes);
app.use('/services', servicesRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/conversations', humanRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

export default app;
