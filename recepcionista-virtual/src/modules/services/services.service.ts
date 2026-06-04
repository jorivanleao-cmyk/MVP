import { prisma } from '../../database/prisma'
import { env } from '../../config/env'

export async function listServices() {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
}

export async function createService(data: {
  name: string
  description: string
  durationMinutes: number
  priceFrom: number
  requiresEvaluation?: boolean
}) {
  let company = await prisma.company.findFirst()
  if (!company) {
    company = await prisma.company.create({
      data: { name: env.businessName, businessType: 'estetica' },
    })
  }

  return prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      durationMinutes: data.durationMinutes,
      priceFrom: data.priceFrom,
      requiresEvaluation: data.requiresEvaluation ?? true,
      active: true,
      companyId: company.id,
    },
  })
}
