import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', '3333')),
  databaseUrl: getEnv('DATABASE_URL', 'file:./dev.db'),
  adminToken: getEnv('ADMIN_TOKEN', 'dev-admin-token'),
  businessName: getEnv('BUSINESS_NAME', 'Clínica Estética Modelo'),
  businessAddress: getEnv('BUSINESS_ADDRESS', 'Rua Exemplo, nº 100, Goiânia - GO'),
  businessHours: getEnv('BUSINESS_HOURS', 'Segunda a sexta, das 08h às 18h'),
  evolutionApiUrl: getEnv('EVOLUTION_API_URL'),
  evolutionApiKey: getEnv('EVOLUTION_API_KEY'),
  evolutionInstanceName: getEnv('EVOLUTION_INSTANCE_NAME'),
  geminiApiKey: getEnv('GEMINI_API_KEY'),
  googleClientId: getEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
  googleRedirectUri: getEnv('GOOGLE_REDIRECT_URI'),
  googleCalendarId: getEnv('GOOGLE_CALENDAR_ID', 'primary'),
  allowedOrigins: getEnv('ALLOWED_ORIGINS', 'http://localhost:3333').split(',').map((origin) => origin.trim()).filter(Boolean),
};
