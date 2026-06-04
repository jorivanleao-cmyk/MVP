import { prisma } from '../../database/prisma';
import { env } from '../../config/env';

async function getDefaultCompanyId() {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: { name: env.businessName, businessType: 'estetica' },
    });
  }
  return company.id;
}

export async function upsertClientByPhone(phone: string, name?: string) {
  const companyId = await getDefaultCompanyId();

  return prisma.client.upsert({
    where: { phone },
    create: { phone, name, companyId },
    update: { name: name ?? undefined },
  });
}

export async function getClientByPhone(phone: string) {
  return prisma.client.findUnique({ where: { phone } });
}
