import { prisma } from '../../database/prisma'
import { ConversationStatuses, MessageFromValues } from '../../types'

export async function getConversations() {
  return prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { client: true, messages: { orderBy: { createdAt: 'asc' } } },
  })
}

export async function getConversationById(id: number) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { client: true, messages: { orderBy: { createdAt: 'asc' } } },
  })
}

export async function takeOverConversation(id: number) {
  return prisma.conversation.update({
    where: { id },
    data: { humanTakeover: true, status: ConversationStatuses.HUMAN_TAKEOVER },
  })
}

export async function releaseConversation(id: number) {
  return prisma.conversation.update({
    where: { id },
    data: { humanTakeover: false, status: ConversationStatuses.ACTIVE },
  })
}

export async function replyToConversation(id: number, message: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id } })
  if (!conversation) {
    throw new Error('Conversa não encontrada.')
  }

  return prisma.message.create({
    data: {
      conversationId: id,
      from: MessageFromValues.HUMAN,
      content: message,
    },
  })
}
