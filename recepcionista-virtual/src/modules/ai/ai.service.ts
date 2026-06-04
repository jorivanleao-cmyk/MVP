import axios from 'axios'
import { env } from '../../config/env'
import { prisma } from '../../database/prisma'
import { AIAnalysisResponse, AIIntent } from '../../types'

interface AnalyzeMessageOptions {
  text: string
  phone: string
  conversationId: number
  clientId: number
}

const intentPatterns: Array<{ regex: RegExp; intent: AIIntent }> = [
  { regex: /^(oi|olá|ola|bom dia|boa tarde|boa noite)/i, intent: 'saudacao' },
  { regex: /(horário|horario|agenda|agendamento)/i, intent: 'faq_horario' },
  {
    regex: /(endereço|endereco|onde fica|localização|localizacao)/i,
    intent: 'faq_endereco',
  },
  { regex: /(valor|preço|preco|quanto custa)/i, intent: 'consultar_preco' },
  { regex: /(agendar|marcar|avaliar|consulta)/i, intent: 'agendar' },
  {
    regex: /(confirmar|confirmo|pode|ok|certo)/i,
    intent: 'confirmar_agendamento',
  },
  {
    regex: /(remarcar|remarca|mudar horário|mudar horario)/i,
    intent: 'remarcar',
  },
  { regex: /(cancelar|cancelamento)/i, intent: 'cancelar' },
  {
    regex: /(atendente|humano|pessoa|atendimento humano)/i,
    intent: 'falar_com_humano',
  },
  {
    regex: /(dor|alergia|complicação|complicacao|emergência|emergencia)/i,
    intent: 'caso_sensivel',
  },
]

function detectIntent(text: string): AIIntent {
  const normalized = text.toLowerCase()
  for (const sample of intentPatterns) {
    if (sample.regex.test(normalized)) {
      return sample.intent
    }
  }
  return 'faq_servico'
}

function buildPrompt(
  text: string,
  intent: AIIntent,
  serviceName: string | null,
): string {
  return `Você é a recepcionista virtual de uma clínica de estética. Responda de forma gentil, concisa e profissional.
Usuário: ${text}
Intenção: ${intent}
Serviço: ${serviceName ?? 'não identificado'}
Resposta:`
}

function buildFallbackReply(intent: AIIntent): string {
  switch (intent) {
    case 'saudacao':
      return 'Olá! Sou a Recepcionista Virtual. Posso ajudar com serviços, valores, horários ou agendamento de avaliação.'
    case 'faq_horario':
      return 'Nosso horário é de segunda a sexta, das 08h às 18h. Quer agendar uma avaliação?'
    case 'faq_endereco':
      return 'Estamos localizados na clínica. Posso enviar o endereço completo ou agendar sua visita?'
    case 'consultar_preco':
      return 'Os valores variam conforme o procedimento e avaliação. Deseja agendar uma avaliação?'
    case 'agendar':
      return 'Claro! Para agendar, preciso apenas do seu nome e de um dia que seja bom para você.'
    case 'confirmar_agendamento':
      return 'Perfeito, estou confirmando o agendamento. Em breve envio todos os detalhes.'
    case 'remarcar':
      return 'Tudo bem, posso ajudar a remarcar seu horário. Qual novo dia você prefere?'
    case 'cancelar':
      return 'Entendido. Deseja cancelar o agendamento ou apenas adiar para outra data?'
    case 'falar_com_humano':
      return 'Vou encaminhar sua conversa para um atendente humano. Aguarde um momento, por favor.'
    case 'caso_sensivel':
      return 'Esse assunto será encaminhado para um atendente humano especializado.'
    case 'fora_do_escopo':
      return 'Desculpe, não consigo ajudar com isso aqui. Posso encaminhar para um atendimento humano?'
    default:
      return 'Posso ajudar com serviços, valores, horários ou agendamento de avaliação. Como posso ajudar você hoje?'
  }
}

async function callGemini(prompt: string): Promise<string> {
  if (!env.geminiApiKey) {
    throw new Error('Gemini não configurado.')
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.geminiApiKey}`,
    'Content-Type': 'application/json',
  }

  let url = env.geminiApiUrl
  let body: any

  if (url) {
    body = {
      model: env.geminiModel,
      prompt,
      max_output_tokens: 256,
      temperature: 0.3,
    }
  } else if (env.googleProjectId && env.googleProjectLocation) {
    url = `https://${env.googleProjectLocation}-aiplatform.googleapis.com/v1/projects/${env.googleProjectId}/locations/${env.googleProjectLocation}/publishers/google/models/${env.geminiModel}:predict?key=${env.geminiApiKey}`
    body = {
      instances: [{ content: prompt }],
      parameters: { temperature: 0.3, maxOutputTokens: 256 },
    }
  } else {
    throw new Error(
      'Configuração Gemini incompleta. Use GEMINI_API_URL ou GOOGLE_PROJECT_ID/GOOGLE_PROJECT_LOCATION.',
    )
  }

  const response = await axios.post(url, body, { headers })
  const data = response.data

  return (
    data?.predictions?.[0]?.content ||
    data?.predictions?.[0]?.candidates?.[0]?.content ||
    data?.candidates?.[0]?.content ||
    data?.output?.[0] ||
    data?.text ||
    JSON.stringify(data)
  )
}

export async function analyzeMessage(
  options: AnalyzeMessageOptions,
): Promise<AIAnalysisResponse> {
  const services = await prisma.service.findMany({ where: { active: true } })
  const intent = detectIntent(options.text)
  const serviceMatch = services.find((service) =>
    options.text.toLowerCase().includes(service.name.toLowerCase()),
  )

  let reply = buildFallbackReply(intent)

  if (env.geminiApiKey) {
    try {
      reply = await callGemini(
        buildPrompt(options.text, intent, serviceMatch?.name ?? null),
      )
    } catch (error) {
      console.error('Falha ao chamar Gemini, usando fallback local:', error)
    }
  }

  return {
    intent,
    reply,
    data: {
      service: serviceMatch?.name ?? null,
      clientName: null,
      preferredDate: null,
      preferredPeriod: options.text.toLowerCase().includes('manhã')
        ? 'manhã'
        : options.text.toLowerCase().includes('tarde')
          ? 'tarde'
          : null,
    },
    requiresHuman: intent === 'falar_com_humano' || intent === 'caso_sensivel',
  }
}
