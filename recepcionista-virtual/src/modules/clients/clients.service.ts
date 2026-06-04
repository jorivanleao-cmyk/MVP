import { prisma } from '../../database/prisma'
import { env } from '../../config/env'

async function getDefaultCompanyId() {
  let company = await prisma.company.findFirst()
  if (!company) {
    company = await prisma.company.create({
      data: { name: env.businessName, businessType: 'estetica' },
    })
  }
  return company.id
}

export async function listClients() {
  return prisma.client.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createClient(data: {
  phone: string
  name?: string
  email?: string
}) {
  const companyId = await getDefaultCompanyId()

  return prisma.client.upsert({
    where: { phone: data.phone },
    create: {
      phone: data.phone,
      name: data.name,
      email: data.email,
      companyId,
    },
    update: {
      name: data.name ?? undefined,
      email: data.email ?? undefined,
    },
  })
}

export async function upsertClientByPhone(phone: string, name?: string) {
  const companyId = await getDefaultCompanyId()

  return prisma.client.upsert({
    where: { phone },
    create: { phone, name, companyId },
    update: { name: name ?? undefined },
  })
}

export async function getClientByPhone(phone: string) {
  return prisma.client.findUnique({ where: { phone } })
}
