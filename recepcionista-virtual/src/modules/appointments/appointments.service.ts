import { prisma } from '../../database/prisma';
import { env } from '../../config/env';

interface CreateAppointmentPayload {
  clientId: number;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export async function listAppointments() {
  return prisma.appointment.findMany({
    orderBy: { date: 'asc' },
    include: { client: true, service: true },
  });
}

export async function createAppointment(data: CreateAppointmentPayload) {
  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service) {
    throw new Error('Serviço não encontrado.');
  }

  const client = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!client) {
    throw new Error('Cliente não encontrado.');
  }

  const companyId = client.companyId;

  return prisma.appointment.create({
    data: {
      clientId: data.clientId,
      serviceId: data.serviceId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
      status: 'confirmed',
      companyId,
    },
    include: { client: true, service: true },
  });
}
