import { Request, Response } from 'express';
import { processIncomingMessage } from './whatsapp.service';

export async function handleIncomingWebhook(req: Request, res: Response) {
  try {
    await processIncomingMessage(req.body);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook do WhatsApp:', error.message || error);
    return res.status(500).json({ success: false, error: 'Erro interno no webhook.' });
  }
}
