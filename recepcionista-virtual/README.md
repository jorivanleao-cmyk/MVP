# Recepcionista Virtual

Backend e painel administrativo para recepção virtual de clínicas e estéticas.

## O que está no projeto

- Backend em Node.js + TypeScript + Express
- Banco SQLite gerenciado por Prisma
- Interface administrativa para atendimento humano
- Proteção básica por token de administrador
- Rotas para webhook WhatsApp, serviços, agendamentos, conversas e takeover humano

## Setup

1. Copie o `.env.example` para `.env` e preencha os valores.
2. Execute:

```powershell
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

3. Abra o painel humano em:

```text
http://localhost:3333/admin
```

## Scripts úteis

- `npm run dev` — servidor em modo desenvolvimento
- `npm run build` — compila o backend em `dist`
- `npm run start` — inicia `dist/server.js`
- `npm run seed` — insere dados iniciais de empresa e serviços
- `npm run test:flow` — fluxo de teste automático

## Segurança e operações

- `Authorization: Bearer <ADMIN_TOKEN>` protege endpoints administrativos
- `helmet` e `express-rate-limit` ajudam a reduzir riscos de rede
- JSON body limitado a 10KB
- Admin UI usa `localStorage` para manter token do usuário

## Observações

- A UI administrativa funciona como painel de atendimento humano.
- O webhook aceita payloads básicos de WhatsApp e simula envio por console se a evolução não estiver configurada.
