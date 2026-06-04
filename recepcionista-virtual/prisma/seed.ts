import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  let company = await prisma.company.findFirst({
    where: { name: process.env.BUSINESS_NAME ?? 'Clínica Estética Modelo' },
  })

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: process.env.BUSINESS_NAME ?? 'Clínica Estética Modelo',
        businessType: 'estetica',
        phone: '',
      },
    })
  }

  const services = [
    {
      name: 'Avaliação estética',
      description: 'Consulta para identificar o melhor tratamento.',
      durationMinutes: 30,
      priceFrom: 0,
      requiresEvaluation: true,
    },
    {
      name: 'Botox',
      description: 'Procedimento para suavizar linhas de expressão.',
      durationMinutes: 40,
      priceFrom: 450,
      requiresEvaluation: true,
    },
    {
      name: 'Preenchimento labial',
      description: 'Tratamento para definir volume e contorno labial.',
      durationMinutes: 60,
      priceFrom: 520,
      requiresEvaluation: true,
    },
    {
      name: 'Limpeza de pele',
      description: 'Remoção de impurezas e cuidados faciais.',
      durationMinutes: 60,
      priceFrom: 180,
      requiresEvaluation: true,
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      create: { ...service, companyId: company.id },
      update: { ...service, companyId: company.id },
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
