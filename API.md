# Documentação API - Recepcionista Virtual

Documentação completa de todos os endpoints com exemplos `curl`.

> **Nota:** Substitua `<ADMIN_TOKEN>` pelo token definido em `.env` (variável `ADMIN_TOKEN`).

---

## Índice

1. [Health Check](#health-check)
2. [Admin Panel](#admin-panel)
3. [Autenticação Google Calendar](#autenticação-google-calendar)
4. [Google Calendar](#google-calendar)
5. [Serviços](#serviços)
6. [Clientes](#clientes)
7. [Agendamentos](#agendamentos)
8. [Conversas](#conversas)
9. [Webhook WhatsApp](#webhook-whatsapp)

---

## Health Check

### GET `/health`

Verifica o status do servidor.

**Método:** `GET`  
**Autenticação:** Não requerida  
**Resposta:** JSON com status, ambiente e uptime

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/health
```

#### Resposta Exemplo

```json
{
  "status": "ok",
  "environment": "development",
  "uptime": 1234.56
}
```

---

## Admin Panel

### GET `/admin`

Carrega o painel administrativo estático.

**Método:** `GET`  
**Autenticação:** Não requerida  
**Retorno:** HTML da interface

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/admin
```

---

## Autenticação Google Calendar

### GET `/auth/google`

Inicia o fluxo de autenticação OAuth 2.0 com o Google.

**Método:** `GET`  
**Autenticação:** Token de admin requerido  
**Retorno:** JSON com URL de autorização

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/auth/google \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

#### Resposta Exemplo

```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=..."
}
```

**Próximo passo:** Abra a URL retornada no navegador para autorizar. Você será redirecionado para `/auth/google/callback`.

---

### GET `/auth/google/callback`

Callback do Google OAuth. Chamado automaticamente após usuário autorizar.

**Método:** `GET`  
**Parâmetro Query:** `code=<authorization_code>`  
**Autenticação:** Não requerida  
**Retorno:** HTML de confirmação

#### Exemplo (automático após autenticação)

```bash
# Não é necessário fazer manualmente; o navegador fará o redirect
# Mas se quiser testar com um código:
curl -X GET "http://localhost:3333/auth/google/callback?code=seu-codigo-aqui"
```

#### Resposta Exemplo

```html
<p>Google Calendar conectado com sucesso! Pode fechar esta aba.</p>
```

---

### GET `/auth/google/status`

Verifica se o Google Calendar está autenticado.

**Método:** `GET`  
**Autenticação:** Token de admin requerido  
**Retorno:** JSON com status booleano

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/auth/google/status \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

#### Resposta Exemplo

```json
{
  "authorized": true
}
```

---

## Google Calendar

### GET `/calendar/status`

Retorna se o Google Calendar está conectado.

**Método:** `GET`  
**Autenticação:** Token de admin requerido  
**Retorno:** JSON com status da conexão

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/calendar/status \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

#### Resposta Exemplo

```json
{
  "connected": true
}
```

---

### GET `/calendar/events`

Lista eventos futuros do Google Calendar com status de vinculação.

**Método:** `GET`  
**Autenticação:** Token de admin requerido  
**Retorno:** JSON com array de eventos

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/calendar/events \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

#### Resposta Exemplo

```json
{
  "events": [
    {
      "id": "abc123def456",
      "summary": "Limpeza facial - Maria Silva",
      "description": "Tratamento completo",
      "start": {
        "dateTime": "2026-06-10T10:00:00-03:00"
      },
      "end": {
        "dateTime": "2026-06-10T11:00:00-03:00"
      },
      "linked": true,
      "linkedAppointmentId": 5,
      "eventId": "abc123def456"
    }
  ]
}
```

---

### POST `/calendar/events`

Cria um novo evento no Google Calendar.

**Método:** `POST`  
**Autenticação:** Token de admin requerido  
**Content-Type:** `application/json`  
**Corpo:**

```json
{
  "summary": "Limpeza facial - Maria Silva",
  "description": "Tratamento completo",
  "date": "2026-06-10",
  "startTime": "10:00",
  "endTime": "11:00"
}
```

**Retorno:** JSON com ID do evento criado

#### Exemplo cURL

```bash
curl -X POST http://localhost:3333/calendar/events \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Limpeza facial - Maria Silva",
    "description": "Tratamento completo",
    "date": "2026-06-10",
    "startTime": "10:00",
    "endTime": "11:00"
  }'
```

#### Resposta Exemplo

```json
{
  "eventId": "abc123def456"
}
```

---

### POST `/calendar/reconcile`

Reconciliador de eventos órfãos entre Google Calendar e agendamentos internos.

**Método:** `POST`  
**Autenticação:** Token de admin requerido  
**Corpo:** Vazio  
**Retorno:** JSON com resultado da reconciliação

#### Exemplo cURL

```bash
curl -X POST http://localhost:3333/calendar/reconcile \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json"
```

#### Resposta Exemplo

```json
{
  "linkedCount": 3,
  "orphanEventCount": 5
}
```

---

## Serviços

### GET `/services`

Lista todos os serviços cadastrados.

**Método:** `GET`  
**Autenticação:** Não requerida  
**Retorno:** JSON com array de serviços

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/services
```

#### Resposta Exemplo

```json
{
  "services": [
    {
      "id": 1,
      "name": "Limpeza facial",
      "description": "Tratamento completo com higienização e tonificação",
      "durationMinutes": 50,
      "priceFrom": 180.0,
      "requiresEvaluation": true,
      "active": true,
      "companyId": 1
    },
    {
      "id": 2,
      "name": "Drenagem linfática",
      "description": "Massagem terapêutica para drenagem de toxinas",
      "durationMinutes": 60,
      "priceFrom": 150.0,
      "requiresEvaluation": false,
      "active": true,
      "companyId": 1
    }
  ]
}
```

---

### POST `/services`

Cria um novo serviço.

**Método:** `POST`  
**Autenticação:** Token de admin requerido  
**Content-Type:** `application/json`  
**Corpo:**

```json
{
  "name": "Microagulhamento",
  "description": "Tratamento para estimulação de colágeno",
  "durationMinutes": 45,
  "priceFrom": 250.0,
  "requiresEvaluation": true
}
```

**Retorno:** JSON com serviço criado

#### Exemplo cURL

```bash
curl -X POST http://localhost:3333/services \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Microagulhamento",
    "description": "Tratamento para estimulação de colágeno",
    "durationMinutes": 45,
    "priceFrom": 250.0,
    "requiresEvaluation": true
  }'
```

#### Resposta Exemplo

```json
{
  "service": {
    "id": 3,
    "name": "Microagulhamento",
    "description": "Tratamento para estimulação de colágeno",
    "durationMinutes": 45,
    "priceFrom": 250.0,
    "requiresEvaluation": true,
    "active": true,
    "companyId": 1
  }
}
```

---

## Clientes

### GET `/clients`

Lista todos os clientes cadastrados.

**Método:** `GET`  
**Autenticação:** Token de admin requerido  
**Retorno:** JSON com array de clientes

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/clients \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

#### Resposta Exemplo

```json
{
  "clients": [
    {
      "id": 1,
      "name": "Maria Silva",
      "phone": "+5511999999999",
      "email": "maria@exemplo.com",
      "createdAt": "2026-06-01T10:30:00Z",
      "updatedAt": "2026-06-01T10:30:00Z",
      "companyId": 1
    },
    {
      "id": 2,
      "name": "João Santos",
      "phone": "+5511988888888",
      "email": "joao@exemplo.com",
      "createdAt": "2026-06-02T14:15:00Z",
      "updatedAt": "2026-06-02T14:15:00Z",
      "companyId": 1
    }
  ]
}
```

---

### POST `/clients`

Cria um novo cliente.

**Método:** `POST`  
**Autenticação:** Token de admin requerido  
**Content-Type:** `application/json`  
**Corpo:**

```json
{
  "phone": "+5511977777777",
  "name": "Ana Costa",
  "email": "ana@exemplo.com"
}
```

**Campos obrigatórios:** `phone`  
**Campos opcionais:** `name`, `email`

**Retorno:** JSON com cliente criado

#### Exemplo cURL

```bash
curl -X POST http://localhost:3333/clients \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511977777777",
    "name": "Ana Costa",
    "email": "ana@exemplo.com"
  }'
```

#### Resposta Exemplo

```json
{
  "client": {
    "id": 3,
    "name": "Ana Costa",
    "phone": "+5511977777777",
    "email": "ana@exemplo.com",
    "createdAt": "2026-06-04T09:45:00Z",
    "updatedAt": "2026-06-04T09:45:00Z",
    "companyId": 1
  }
}
```

---

## Agendamentos

### GET `/appointments`

Lista todos os agendamentos.

**Método:** `GET`  
**Autenticação:** Token de admin requerido  
**Retorno:** JSON com array de agendamentos

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/appointments \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

#### Resposta Exemplo

```json
{
  "appointments": [
    {
      "id": 1,
      "clientId": 1,
      "serviceId": 1,
      "googleEventId": "abc123def456",
      "date": "2026-06-10T00:00:00Z",
      "startTime": "10:00",
      "endTime": "11:00",
      "status": "confirmed",
      "notes": "Cliente prefere horário matutino",
      "createdAt": "2026-06-04T08:20:00Z",
      "client": {
        "id": 1,
        "name": "Maria Silva",
        "phone": "+5511999999999",
        "email": "maria@exemplo.com"
      },
      "service": {
        "id": 1,
        "name": "Limpeza facial",
        "description": "Tratamento completo com higienização e tonificação",
        "durationMinutes": 50,
        "priceFrom": 180.0
      },
      "companyId": 1
    }
  ]
}
```

---

### POST `/appointments`

Cria um novo agendamento.

**Método:** `POST`  
**Autenticação:** Token de admin requerido  
**Content-Type:** `application/json`  
**Corpo:**

```json
{
  "clientId": 1,
  "serviceId": 1,
  "date": "2026-06-10",
  "startTime": "10:00",
  "endTime": "11:00",
  "notes": "Cliente prefere horário matutino"
}
```

**Campos obrigatórios:** `clientId`, `serviceId`, `date`, `startTime`, `endTime`  
**Campos opcionais:** `notes`

**Retorno:** JSON com agendamento criado

#### Exemplo cURL

```bash
curl -X POST http://localhost:3333/appointments \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "serviceId": 1,
    "date": "2026-06-10",
    "startTime": "10:00",
    "endTime": "11:00",
    "notes": "Cliente prefere horário matutino"
  }'
```

#### Resposta Exemplo

```json
{
  "appointment": {
    "id": 2,
    "clientId": 1,
    "serviceId": 1,
    "googleEventId": null,
    "date": "2026-06-10T00:00:00Z",
    "startTime": "10:00",
    "endTime": "11:00",
    "status": "pending",
    "notes": "Cliente prefere horário matutino",
    "createdAt": "2026-06-04T09:50:00Z",
    "companyId": 1
  }
}
```

---

## Conversas

### GET `/conversations`

Lista conversas e histórico de mensagens.

**Método:** `GET`  
**Autenticação:** Token de admin requerido  
**Retorno:** JSON com array de conversas e mensagens

#### Exemplo cURL

```bash
curl -X GET http://localhost:3333/conversations \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

#### Resposta Exemplo

```json
{
  "conversations": [
    {
      "id": 1,
      "clientId": 1,
      "phone": "+5511999999999",
      "status": "active",
      "humanTakeover": false,
      "lastIntent": "agendar",
      "createdAt": "2026-06-01T10:30:00Z",
      "updatedAt": "2026-06-04T15:20:00Z",
      "messages": [
        {
          "id": 1,
          "conversationId": 1,
          "from": "client",
          "content": "Oi, gostaria de agendar um horário",
          "type": "text",
          "createdAt": "2026-06-01T10:35:00Z"
        },
        {
          "id": 2,
          "conversationId": 1,
          "from": "bot",
          "content": "Claro! Qual serviço você gostaria?",
          "type": "text",
          "createdAt": "2026-06-01T10:36:00Z"
        }
      ]
    }
  ]
}
```

---

## Webhook WhatsApp

### POST `/webhook/messages`

Recebe mensagens do WhatsApp Evolution API.

**Método:** `POST`  
**Autenticação:** Não requerida (validação interna via Evolution API)  
**Content-Type:** `application/json`  
**Corpo:** Varia conforme o evento do Evolution API

#### Exemplo de corpo para mensagem de texto

```json
{
  "instance": "seu-instance-name",
  "data": {
    "instanceName": "seu-instance-name",
    "messages": [
      {
        "key": {
          "id": "3EB0XXXXX@s.whatsapp.net",
          "fromMe": false,
          "remoteJid": "5511999999999@s.whatsapp.net"
        },
        "message": {
          "conversation": "Olá, gostaria de agendar"
        },
        "messageTimestamp": "1686045600"
      }
    ]
  }
}
```

#### Exemplo cURL

```bash
curl -X POST http://localhost:3333/webhook/messages \
  -H "Content-Type: application/json" \
  -d '{
    "instance": "seu-instance-name",
    "data": {
      "instanceName": "seu-instance-name",
      "messages": [
        {
          "key": {
            "id": "3EB0XXXXX@s.whatsapp.net",
            "fromMe": false,
            "remoteJid": "5511999999999@s.whatsapp.net"
          },
          "message": {
            "conversation": "Olá, gostaria de agendar"
          },
          "messageTimestamp": "1686045600"
        }
      ]
    }
  }'
```

#### Resposta Esperada

```json
{
  "status": "received"
}
```

---

## Exemplos de Fluxo Completo

### 1. Autenticar + Verificar Status

```bash
# 1. Obter URL de autenticação
AUTH_URL=$(curl -s -X GET http://localhost:3333/auth/google \
  -H "Authorization: Bearer seu-admin-token-aqui" | jq -r '.url')

echo "Acesse: $AUTH_URL"

# 2. Após autorizar no navegador, verificar status
curl -X GET http://localhost:3333/auth/google/status \
  -H "Authorization: Bearer seu-admin-token-aqui"
```

### 2. Criar Serviço + Cliente + Agendamento

```bash
# 1. Criar serviço
SERVICE=$(curl -s -X POST http://localhost:3333/services \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Limpeza facial",
    "description": "Tratamento completo",
    "durationMinutes": 50,
    "priceFrom": 180.0,
    "requiresEvaluation": true
  }')

SERVICE_ID=$(echo $SERVICE | jq '.service.id')
echo "Serviço criado com ID: $SERVICE_ID"

# 2. Criar cliente
CLIENT=$(curl -s -X POST http://localhost:3333/clients \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511999999999",
    "name": "Maria Silva",
    "email": "maria@exemplo.com"
  }')

CLIENT_ID=$(echo $CLIENT | jq '.client.id')
echo "Cliente criado com ID: $CLIENT_ID"

# 3. Criar agendamento
APPOINTMENT=$(curl -s -X POST http://localhost:3333/appointments \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": $CLIENT_ID,
    \"serviceId\": $SERVICE_ID,
    \"date\": \"2026-06-10\",
    \"startTime\": \"10:00\",
    \"endTime\": \"11:00\",
    \"notes\": \"Cliente prefere horário matutino\"
  }")

echo "Agendamento criado:"
echo $APPOINTMENT | jq '.'
```

### 3. Listar e Reconciliar Eventos

```bash
# 1. Listar eventos do Google Calendar
curl -X GET http://localhost:3333/calendar/events \
  -H "Authorization: Bearer seu-admin-token-aqui" | jq '.'

# 2. Reconciliar eventos órfãos
curl -X POST http://localhost:3333/calendar/reconcile \
  -H "Authorization: Bearer seu-admin-token-aqui" \
  -H "Content-Type: application/json" | jq '.'
```

---

## Códigos de Resposta HTTP

| Código | Significado                                |
| ------ | ------------------------------------------ |
| `200`  | Sucesso                                    |
| `201`  | Recurso criado                             |
| `400`  | Dados inválidos ou incompletos             |
| `401`  | Não autorizado (token inválido ou ausente) |
| `404`  | Rota não encontrada                        |
| `500`  | Erro interno do servidor                   |

---

## Erros Comuns

### Erro: `"Não autorizado. Token inválido."`

**Causa:** Token de admin ausente ou incorreto.  
**Solução:** Verifique a variável `ADMIN_TOKEN` em `.env` e adicione o cabeçalho `Authorization: Bearer <token>`.

### Erro: `"Campos obrigatórios ausentes."`

**Causa:** Faltam campos requeridos no corpo da requisição.  
**Solução:** Verifique a documentação de cada endpoint e inclua todos os campos obrigatórios.

### Erro: `"Google Calendar não está conectado."`

**Causa:** Ainda não autenticou com Google ou o token expirou.  
**Solução:** Execute `/auth/google` e complete a autenticação OAuth.

---

## Dicas de Uso

1. **Use `jq` para processar JSON:**

   ```bash
   curl ... | jq '.services[0].name'
   ```

2. **Salve respostas em variáveis:**

   ```bash
   RESPONSE=$(curl -s ...)
   ID=$(echo $RESPONSE | jq '.service.id')
   ```

3. **Teste com Postman ou Insomnia:**
   - Importe esta documentação ou configure manualmente os endpoints.
   - Salve o `ADMIN_TOKEN` em uma variável de ambiente.

4. **Para produção:**
   - Use HTTPS.
   - Proteja o token de admin.
   - Configure CORS apropriadamente.
   - Use variáveis de ambiente para tokens e URLs.
