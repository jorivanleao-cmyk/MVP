export type AIIntent =
  | 'saudacao'
  | 'faq_horario'
  | 'faq_endereco'
  | 'faq_pagamento'
  | 'faq_servico'
  | 'consultar_preco'
  | 'agendar'
  | 'confirmar_agendamento'
  | 'remarcar'
  | 'cancelar'
  | 'falar_com_humano'
  | 'caso_sensivel'
  | 'fora_do_escopo';

export interface AIAnalysisResponse {
  intent: AIIntent;
  reply: string;
  data: {
    service?: string | null;
    clientName?: string | null;
    preferredDate?: string | null;
    preferredPeriod?: string | null;
  };
  requiresHuman: boolean;
}

export const ConversationStatuses = {
  ACTIVE: 'active',
  HUMAN_TAKEOVER: 'human_takeover',
  WAITING_CONFIRMATION: 'waiting_confirmation',
  CANCELLED: 'cancelled',
} as const;

export const MessageFromValues = {
  CLIENT: 'client',
  AI: 'ai',
  HUMAN: 'human',
} as const;
