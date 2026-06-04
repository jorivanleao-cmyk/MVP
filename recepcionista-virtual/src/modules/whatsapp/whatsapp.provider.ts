import axios from 'axios';
import { env } from '../../config/env';

export async function sendTextMessage(phone: string, message: string) {
  if (!env.evolutionApiUrl || !env.evolutionApiKey) {
    console.log('[WhatsApp simulado] para', phone, ':', message);
    return;
  }

  const payload = {
    to: phone,
    message,
    instance: env.evolutionInstanceName,
  };

  await axios.post(`${env.evolutionApiUrl}/send-text`, payload, {
    headers: {
      Authorization: `Bearer ${env.evolutionApiKey}`,
      'Content-Type': 'application/json',
    },
  });
}
