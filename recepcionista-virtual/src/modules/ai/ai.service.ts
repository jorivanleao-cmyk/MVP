import { prisma } from '../../database/prisma';
import { AIAnalysisResponse, AIIntent } from '../../types';

interface AnalyzeMessageOptions {
  text: string;
  phone: string;
  conversationId: number;
  clientId: number;
}

const intentPatterns: Array<{ regex: RegExp; intent: AIIntent }> = [
  { regex: /^(oi|olá|ola|bom dia|boa tarde|boa noite)/i, intent: 'saudacao' },
  { regex: /(horário|horario|agenda|agendamento)/i, intent: 'faq_horario' },
  { regex: /(endereço|endereco|onde fica|localização)/i, intent: 'faq_endereco' },
  { regex: /(valor|preço|preco|quanto custa)/i, intent: 'consultar_preco' },
  { regex: /(agendar|marcar|avaliar|consulta)/i, intent: 'agendar' },
  { regex: /(confirmar|confirmo|pode|ok|certo)/i, intent: 'confirmar_agendamento' },
  { regex: /(remarcar|remarca|mudar horário|mudar horario)/i, intent: 'remarcar' },
  { regex: /(cancelar|cancelamento)/i, intent: 'cancelar' },
  { regex: /(atendente|humano|pessoa|atendimento humano)/i, intent: 'falar_com_humano' },
  { regex: /(dor|alergia|complicação|complicacao|emergência|emergencia)/i, intent: 'caso_sensivel' },
];

function detectIntent(text: string): AIIntent {
  const normalized = text.toLowerCase();
  for (const sample of intentPatterns) {
    if (sample.regex.test(normalized)) {
      return sample.intent;
    }
  }
  return 'faq_servico';
}

function buildReply(intent: AIIntent, text: string): string {
  switch (intent) {
    case 'saudacao':
      return 'Olá! Sou a Recepcionista Virtual. Posso ajudar com serviços, valores, horários ou agendamento de avaliação.';
    case 'faq_horario':
      return 'Nosso horário é de segunda a sexta, das 08h às 18h. Quer agendar uma avaliação?';
    case 'faq_endereco':
      return 'Estamos localizados na nossa clínica. Posso enviar o endereço completo ou agendar sua visita?';
    case 'consultar_preco':
      return 'Os valores variam conforme o procedimento e avaliação. Quer marcar uma avaliação para receber um orçamento?';
    case 'agendar':
      return 'Claro! Para agendar, preciso apenas do seu nome e do melhor dia para você.';
    case 'confirmar_agendamento':
      return 'Perfeito, estou confirmando o agendamento. Em breve envio todos os detalhes.';
    case 'remarcar':
      return 'Tudo bem. Qual novo dia ou horário prefere para o atendimento?';
    case 'cancelar':
      return 'Entendido. Deseja cancelar o agendamento ou só adiar para outra data?';
    case 'falar_com_humano':
      return 'Vou encaminhar sua conversa para um atendente humano. Aguarde um momento, por favor.';
    case 'caso_sensivel':
      return 'Esse assunto será encaminhado para um atendente humano especializado.';
    case 'fora_do_escopo':
      return 'Desculpe, não consigo ajudar com isso aqui. Posso encaminhar para um atendimento humano?';
    default:
      return 'Posso ajudar com serviços, valores, horários ou agendamento de avaliação. Como posso ajudar você hoje?';
  }
}

export async function analyzeMessage(options: AnalyzeMessageOptions): Promise<AIAnalysisResponse> {
  const services = await prisma.service.findMany({ where: { active: true } });
  const intent = detectIntent(options.text);
  const reply = buildReply(intent, options.text);
  const serviceMatch = services.find((service) => options.text.toLowerCase().includes(service.name.toLowerCase()));

  return {
    intent,
    reply,
    data: {
      service: serviceMatch?.name ?? null,
      clientName: null,
      preferredDate: null,
      preferredPeriod: options.text.toLowerCase().includes('manhã') ? 'manhã' : options.text.toLowerCase().includes('tarde') ? 'tarde' : null,
    },
    requiresHuman: intent === 'falar_com_humano' || intent === 'caso_sensivel',
  };
}
