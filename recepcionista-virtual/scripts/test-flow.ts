import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';
const TEST_PHONE = '5562999990000';

async function run() {
  console.log('Iniciando teste de fluxo...');

  const health = await axios.get(`${BASE_URL}/health`);
  console.log('Health:', health.data);

  const servicesRes = await axios.get(`${BASE_URL}/services`);
  console.log('Serviços:', servicesRes.data.services.map((service: any) => service.name));

  let service = servicesRes.data.services.find((item: any) => item.name.toLowerCase().includes('botox')) || servicesRes.data.services[0];

  if (!service) {
    console.log('Nenhum serviço encontrado. Criando serviço padrão...');
    const createRes = await axios.post(
      `${BASE_URL}/services`,
      {
        name: 'Botox',
        description: 'Procedimento para suavizar linhas de expressão.',
        durationMinutes: 40,
        priceFrom: 450,
        requiresEvaluation: true,
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    service = createRes.data.service;
    console.log('Serviço criado:', service.name);
  }

  console.log('Simulando webhook do WhatsApp...');
  const webhookResponse = await axios.post(`${BASE_URL}/webhook/whatsapp`, {
    from: TEST_PHONE,
    body: 'Oi, gostaria de saber sobre botox',
  });
  console.log('Webhook response:', webhookResponse.data);

  const prisma = new PrismaClient();
  const client = await prisma.client.findUnique({ where: { phone: TEST_PHONE } });
  if (!client) {
    throw new Error('Cliente não encontrado após webhook.');
  }

  console.log('Cliente criado:', { id: client.id, phone: client.phone, name: client.name });

  const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const appointmentRes = await axios.post(
    `${BASE_URL}/appointments`,
    {
      clientId: client.id,
      serviceId: service.id,
      date: appointmentDate,
      startTime: '14:00',
      endTime: '15:00',
      notes: 'Teste de agendamento via script',
    },
    {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    }
  );
  console.log('Agendamento criado:', appointmentRes.data.appointment);

  const appointments = await axios.get(`${BASE_URL}/appointments`, { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
  console.log('Lista de agendamentos:', appointments.data.appointments.map((item: any) => ({
    id: item.id,
    date: item.date,
    startTime: item.startTime,
    service: item.service.name,
    client: item.client.phone,
    status: item.status,
  })));

  await prisma.$disconnect();
  console.log('Teste de fluxo concluído com sucesso.');
}

run().catch((error) => {
  console.error('Erro no teste de fluxo:', error.message || error);
  process.exit(1);
});
