# Recepcionista Virtual

Sistema backend + painel administrativo para clínicas, estéticas e pequenos consultórios, com suporte a:
- agendamentos e serviços,
- cadastro de clientes,
- integração com Google Calendar,
- painel administrativo em `public/index.html`,
- autenticação por token de administrador.

## Conteúdo

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração de ambiente](#configuração-de-ambiente)
- [Configurar Google Calendar](#configurar-google-calendar)
- [Executando o sistema](#executando-o-sistema)
- [Endpoints da API](#endpoints-da-api)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como usar](#como-usar)
- [Notas adicionais](#notas-adicionais)

## Visão Geral

Este projeto é uma recepcionista virtual para quem precisa automatizar o fluxo de atendimento e agendamentos.
A aplicação fornece:
- cadastro e listagem de serviços,
- cadastro e listagem de clientes,
- criação de agendamentos,
- interface administrativa moderna,
- integração com Google Calendar para eventos e reconciliação.

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta Google para criar credenciais OAuth 2.0
- Banco de dados SQLite (o projeto já usa SQLite local por padrão)

## Instalação

1. Abra o terminal na pasta do projeto:
   ```powershell
   cd c:\Users\Devleao\Documents\GitHub\MVP\recepcionista-virtual
   ```
2. Instale dependências:
   ```powershell
   npm install
   ```
3. Gere o banco de dados e aplique o esquema Prisma:
   ```powershell
   npx prisma db push
   ```
4. Opcional: gere dados iniciais com seed:
   ```powershell
   npm run seed
   ```

## Configuração de ambiente

Crie um arquivo `.env` na raiz de `recepcionista-virtual` com as variáveis necessárias.
Exemplo mínimo:

```env
NODE_ENV=development
PORT=3333
DATABASE_URL=file:./dev.db
ADMIN_TOKEN=senha-admin-secreta
BUSINESS_NAME=Minha Clínica
BUSINESS_ADDRESS=Rua Exemplo, 123
BUSINESS_HOURS=Segunda a Sexta, 08:00-18:00
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3333/auth/google/callback
GOOGLE_PROJECT_ID=
GOOGLE_PROJECT_LOCATION=us-central1
GOOGLE_CALENDAR_ID=primary
GOOGLE_TIMEZONE=America/Sao_Paulo
ALLOWED_ORIGINS=http://localhost:3333
```

### Variáveis principais

- `NODE_ENV`: ambiente (`development` ou `production`)
- `PORT`: porta do servidor
- `DATABASE_URL`: string de conexão do banco SQLite
- `ADMIN_TOKEN`: token de autenticação para rotas administrativas
- `GOOGLE_CLIENT_ID`: ID do cliente OAuth do Google
- `GOOGLE_CLIENT_SECRET`: segredo OAuth do Google
- `GOOGLE_REDIRECT_URI`: URI de callback OAuth do Google
- `GOOGLE_CALENDAR_ID`: ID do calendário do Google (geralmente `primary`)
- `GOOGLE_TIMEZONE`: fuso horário para eventos do Google
- `ALLOWED_ORIGINS`: origens permitidas para CORS

## Configurar Google Calendar

### Passo a passo completo

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No canto superior esquerdo, clique em `Selecionar projeto` e depois `Novo projeto`.
   - Dê um nome ao projeto, por exemplo: `Recepcionista Virtual`.
   - Clique em `Criar`.
3. Após criar o projeto, confirme que ele está selecionado no topo.
4. Vá até `APIs e Serviços` > `Biblioteca`.
5. Pesquise por `Google Calendar API`.
6. Clique em `Google Calendar API` e depois em `Ativar`.

### Criar credenciais OAuth 2.0

1. Ainda em `APIs e Serviços`, abra `Credenciais`.
2. Clique em `Criar credenciais` e escolha `ID do cliente OAuth`.
3. Se solicitado, configure a tela de consentimento do OAuth:
   - Tipo de usuário: `Externo` (ou `Interno`, se for conta organizacional).
   - Preencha nome do aplicativo, e-mail do suporte e domínios autorizados (pode deixar em branco para desenvolvimento local).
   - Salve.
4. Na criação do `ID do cliente OAuth`:
   - `Tipo de aplicativo`: `Aplicativo da Web`.
   - Em `URIs de redirecionamento autorizados`, adicione:
     - `http://localhost:3333/auth/google/callback`
   - Clique em `Criar`.
5. Copie os valores:
   - `CLIENT_ID`
   - `CLIENT_SECRET`

### Configurar o `.env`

No arquivo `.env` do projeto, preencha as variáveis:

```env
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_REDIRECT_URI=http://localhost:3333/auth/google/callback
GOOGLE_PROJECT_ID=seu-project-id-do-google
GOOGLE_PROJECT_LOCATION=us-central1
GOOGLE_CALENDAR_ID=primary
GOOGLE_TIMEZONE=America/Sao_Paulo
```

- `GOOGLE_PROJECT_ID`: o ID do projeto do Google Cloud onde você criou as credenciais.
- `GOOGLE_PROJECT_LOCATION`: pode ficar em `us-central1` por padrão.
- `GOOGLE_CALENDAR_ID`: deixe `primary` para usar o calendário principal da conta.
- `GOOGLE_TIMEZONE`: use `America/Sao_Paulo` para Brasil.

### Autenticar e gerar token

1. Inicie o servidor:
   ```powershell
   npm run dev
   ```
2. Abra um navegador e acesse:
   ```text
   http://localhost:3333/admin
   ```
3. No painel, clique em `Conectar Google Calendar`.
4. Você será redirecionado para a tela de login do Google.
5. Autorize o acesso ao calendário.
6. Após aprovação, o servidor deve salvar o token em `.google-token.json`.

### Verificar conexão

No painel ou usando cURL, verifique se a conexão foi estabelecida:

```bash
curl -X GET http://localhost:3333/calendar/status \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

A resposta esperada é:

```json
{
  "connected": true
}
```

> Se aparecer erro de redirecionamento, verifique se o `GOOGLE_REDIRECT_URI` no `.env` é exatamente `http://localhost:3333/auth/google/callback` e se este URI está autorizado nas credenciais.

## Executando o sistema

### No modo de desenvolvimento

```powershell
npm run dev
```

### Build de produção

```powershell
npm run build
npm start
```

### URLs importantes

- Painel administrativo: `http://localhost:3333/admin`
- Healthcheck: `http://localhost:3333/health`

## Endpoints da API

A maioria das rotas administrativas exige o cabeçalho `Authorization` com o token do `.env`:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

### `/health`
- Método: `GET`
- Autenticação: não
- Retorno: status do servidor

### `/admin`
- Método: `GET`
- Entrega a interface administrativa estática

### `/services`
- `GET /services`
  - Lista serviços cadastrados.
- `POST /services`
  - Cria um novo serviço.
  - Corpo JSON:
    ```json
    {
      "name": "Limpeza facial",
      "description": "Tratamento completo",
      "durationMinutes": 50,
      "priceFrom": 180.0,
      "requiresEvaluation": true
    }
    ```
  - Requer `Authorization`.

### `/clients`
- `GET /clients`
  - Lista clientes cadastrados.
- `POST /clients`
  - Cria um novo cliente.
  - Corpo JSON:
    ```json
    {
      "phone": "+5511999999999",
      "name": "Maria Silva",
      "email": "maria@exemplo.com"
    }
    ```
  - Requer `Authorization`.

### `/appointments`
- `GET /appointments`
  - Lista agendamentos.
- `POST /appointments`
  - Cria um novo agendamento.
  - Corpo JSON:
    ```json
    {
      "clientId": 1,
      "serviceId": 1,
      "date": "2026-06-10",
      "startTime": "10:00",
      "endTime": "11:00",
      "notes": "Cliente prefere horário da manhã"
    }
    ```
  - Requer `Authorization`.

### `/conversations`
- `GET /conversations`
  - Lista conversas e histórico de mensagens.
  - Requer `Authorization`.

### `/auth/google`
- `GET /auth/google`
  - Inicia a autenticação OAuth com Google.
  - Retorna JSON com `url` para autorizar.
  - Requer `Authorization`.

### `/auth/google/callback`
- `GET /auth/google/callback?code=...`
  - Recebe o código OAuth do Google.
  - Salva o token em `.google-token.json`.
  - Não exige token de admin para receber o callback.

### `/auth/google/status`
- `GET /auth/google/status`
  - Retorna se o Google Calendar está conectado.
  - Exige `Authorization`.

### `/calendar/status`
- `GET /calendar/status`
  - Retorna se o Calendar está conectado.
  - Exige `Authorization`.

### `/calendar/events`
- `GET /calendar/events`
  - Lista eventos futuros do Google Calendar com estado de vínculo.
  - Exige `Authorization`.
- `POST /calendar/events`
  - Cria um evento diretamente no Google Calendar.
  - Corpo JSON:
    ```json
    {
      "summary": "Agendamento: Limpeza facial",
      "description": "Cliente: Maria Silva",
      "date": "2026-06-10",
      "startTime": "10:00",
      "endTime": "11:00"
    }
    ```
  - Exige `Authorization`.

### `/calendar/reconcile`
- `POST /calendar/reconcile`
  - Reconciliador de eventos órfãos entre Google Calendar e agendamentos.
  - Exige `Authorization`.

## Estrutura do projeto

```
recepcionista-virtual/
  public/                # painel administrativo e frontend estático
    index.html
    app.js
    styles.css
  prisma/
    schema.prisma        # modelo do banco de dados
    seed.ts              # script de seed inicial
  src/
    app.ts               # configuração do servidor Express
    server.ts            # inicializa a aplicação
    config/env.ts        # carregamento de variáveis de ambiente
    database/prisma.ts   # cliente Prisma
    middleware/adminAuth.ts # valida token de admin
    modules/
      auth/              # conexão OAuth Google Calendar
      calendar/          # integração com Google Calendar
      clients/           # rotas e serviços de clientes
      services/          # rotas e serviços de serviços
      appointments/      # rotas e serviços de agendamentos
      human/             # conversas / mensagens
      whatsapp/          # webhook e provider WhatsApp
```

## Como usar

1. Abra o painel administrativo em `http://localhost:3333/admin`.
2. Conecte o Google Calendar via botão `Conectar Google Calendar`.
3. Cadastre serviços oferecidos.
4. Cadastre clientes.
5. Crie agendamentos utilizando cliente, serviço, data e horário.
6. Use `Refrescar` para ver dados atualizados e `Reconciliação` para alinhar eventos órfãos.

## Como criar APIs neste sistema

### 1. Defina a rota

No Express, as rotas ficam em `src/modules/<nome>/`. Exemplo:
- `src/modules/services/services.routes.ts`
- `src/modules/clients/clients.routes.ts`

### 2. Crie a camada de serviço

Use `Prisma` para acessar o banco em `src/modules/<nome>/<nome>.service.ts`.
Ela deve expor funções como `listServices`, `createService`, `listClients`, `createClient`.

### 3. Proteja a rota

Use o middleware `requireAdminAuth` em rotas que precisam de token de administrador:
```ts
router.use(requireAdminAuth);
```

### 4. Exponha a rota no `src/app.ts`

Adicione o caminho no app principal:
```ts
app.use('/clients', clientsRoutes);
```

### 5. Atualize o frontend

Adicione chamadas `fetch` em `public/app.js` e mapeie os dados para componentes da interface.

## Notas adicionais

- O token do admin é simples e funciona via cabeçalho `Authorization: Bearer <ADMIN_TOKEN>`.
- O banco padrão é SQLite local em `dev.db`.
- A autenticação Google usa OAuth e salva o token em `.google-token.json`.
- Se for usar em produção, ajuste `ALLOWED_ORIGINS`, `NODE_ENV`, e proteja o `.env` e o `.google-token.json`.

---

