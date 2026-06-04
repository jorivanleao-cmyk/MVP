import { prisma } from '../../database/prisma'
import { env } from '../../config/env'
import { analyzeMessage } from '../ai/ai.service'
import { upsertClientByPhone } from '../clients/clients.service'
import { sendTextMessage } from './whatsapp.provider'
import { ConversationStatuses, MessageFromValues } from '../../types'

interface WhatsAppPayload {
  from?: string
  text?: { body?: string }
  body?: string
  contact?: { phoneNumber?: string }
}

function extractPhone(payload: WhatsAppPayload) {
  return payload.from || payload.contact?.phoneNumber || ''
}

function extractText(payload: WhatsAppPayload) {
  if (payload.text?.body) return payload.text.body
  if (typeof payload.body === 'string') return payload.body
  return ''
}

function isAdminMessage(text: string) {
  return (
    text.startsWith('/assumir') ||
    text.startsWith('/liberar') ||
    text.startsWith('/status')
  )
}

async function handleAdminMessage(
  conversationId: number,
  phone: string,
  text: string,
) {
  if (text.startsWith('/assumir')) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        humanTakeover: true,
        status: ConversationStatuses.HUMAN_TAKEOVER,
      },
    })
    return 'Atendimento humano ativado. Aguarde um atendente humano.'
  }

  if (text.startsWith('/liberar')) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { humanTakeover: false, status: ConversationStatuses.ACTIVE },
    })
    return 'Atendimento humano liberado. A IA retorna a ajudar.'
  }

  if (text.startsWith('/status')) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })
    return conversation
      ? `Status atual: ${conversation.status}. humanTakeover=${conversation.humanTakeover}`
      : 'Conversa não encontrada.'
  }

  return 'Comando não reconhecido.'
}

export async function processIncomingMessage(payload: WhatsAppPayload) {
  const phone = extractPhone(payload).trim()
  const text = extractText(payload).trim()

  if (!phone || !text) {
    throw new Error('Telefone ou texto inválido.')
  }

  const conversation = await prisma.conversation.upsert({
    where: { phone },
    create: { phone, status: ConversationStatuses.ACTIVE },
    update: { updatedAt: new Date() },
  })

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      from: MessageFromValues.CLIENT,
      content: text,
    },
  })

  if (conversation.humanTakeover) {
    return
  }

  if (isAdminMessage(text)) {
    const reply = await handleAdminMessage(conversation.id, phone, text)
    await sendTextMessage(phone, reply)
    return
  }

  const client = await upsertClientByPhone(phone)
  const analysis = await analyzeMessage({
    text,
    phone,
    conversationId: conversation.id,
    clientId: client.id,
  })

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      from: MessageFromValues.AI,
      content: analysis.reply,
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      status:
        analysis.intent === 'agendar'
          ? ConversationStatuses.WAITING_CONFIRMATION
          : conversation.status,
      lastIntent: analysis.intent,
    },
  })

  await sendTextMessage(phone, analysis.reply)
}
