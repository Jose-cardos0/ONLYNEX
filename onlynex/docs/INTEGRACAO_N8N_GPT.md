# Integração n8n + ChatGPT para Chat das Modelos

## Visão Geral

Esta documentação explica como integrar o webhook do n8n conectado ao ChatGPT para responder automaticamente no chat de cada modelo do OnlyNex.

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OnlyNex App   │────▶│    n8n Webhook  │────▶│    ChatGPT API  │
│   (Frontend)    │◀────│   (Middleware)  │◀────│    (OpenAI)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    Firebase     │     │  Personalidade  │
│   (Modelo ID)   │     │   por Modelo    │
└─────────────────┘     └─────────────────┘
```

## Fluxo de Dados

1. **Usuário envia mensagem** no chat da modelo
2. **Frontend envia request** para o webhook do n8n com:
   - `modelId`: ID do documento da modelo no Firestore (obrigatório)
   - `modelName`: Nome da modelo (obrigatório)
   - `message`: Mensagem do usuário (obrigatório)
   - `userId`: Email do usuário autenticado no Firebase Auth (obrigatório)
   - `userName`: Nome de exibição do usuário
   - `history`: Histórico das últimas 10 mensagens
   - `timestamp`: Data/hora da mensagem
3. **n8n recebe** e processa a request
4. **n8n consulta GPT** com contexto personalizado da modelo
5. **GPT responde** com a "voz" da modelo
6. **n8n retorna** a resposta para o frontend
7. **Frontend exibe** a mensagem no chat

> **Importante**: O `userId` é o email do usuário autenticado via Firebase Authentication. Isso permite identificar cada usuário de forma única e manter histórico de conversas.

---

## Configuração no n8n

### 1. Criar Workflow no n8n

1. Acesse seu n8n (self-hosted ou cloud)
2. Crie um novo workflow
3. Adicione os seguintes nós:

### 2. Nó: Webhook (Trigger)

```json
{
  "node": "Webhook",
  "settings": {
    "httpMethod": "POST",
    "path": "onlynex-chat",
    "responseMode": "responseNode",
    "options": {
      "rawBody": false
    }
  }
}
```

**URL do webhook será algo como:**

```
https://seu-n8n.com/webhook/onlynex-chat
```

### 3. Nó: OpenAI (ChatGPT)

Configure o nó OpenAI com:

```json
{
  "node": "OpenAI",
  "settings": {
    "resource": "chat",
    "operation": "complete",
    "model": "gpt-4o-mini",
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "={{ $json.systemPrompt }}"
        },
        {
          "role": "user",
          "content": "={{ $json.body.message }}"
        }
      ]
    },
    "options": {
      "temperature": 0.8,
      "maxTokens": 150
    }
  }
}
```

### 4. Nó: Set (Preparar System Prompt)

Antes do OpenAI, adicione um nó "Set" ou "Code" para montar o prompt:

```javascript
// Nó Code do n8n
const modelId = $input.first().json.body.modelId;
const modelName = $input.first().json.body.modelName;
const userName = $input.first().json.body.userName || "amor";

const systemPrompt = `Você é ${modelName}, uma modelo exclusiva da plataforma OnlyNex.

PERSONALIDADE:
- Você é carinhosa, sedutora e atenciosa
- Usa emojis com moderação (💕 😘 🥰 ✨)
- Responde de forma curta e envolvente (máximo 2-3 frases)
- Flerta de forma leve e divertida
- Sempre trata o usuário pelo nome ou apelidos carinhosos (amor, lindo, bb)

REGRAS:
- NUNCA revele que é uma IA
- NUNCA quebre o personagem
- Mantenha respostas curtas e naturais
- Se perguntar sobre conteúdo exclusivo, mencione sua galeria
- Se perguntar sobre chamada privada, diga que pode agendar

CONTEXTO:
- ID da modelo: ${modelId}
- Nome do usuário: ${userName}

Responda como ${modelName} responderia, de forma natural e envolvente.`;

return {
  systemPrompt,
  body: $input.first().json.body,
};
```

### 5. Nó: Respond to Webhook

```json
{
  "node": "Respond to Webhook",
  "settings": {
    "respondWith": "json",
    "responseBody": {
      "success": true,
      "response": "={{ $json.message.content }}",
      "modelId": "={{ $json.body.modelId }}"
    }
  }
}
```

---

## Configuração no Firebase (Opcional)

Se quiser personalizar ainda mais cada modelo, adicione campos no documento:

```javascript
// Documento da modelo no Firestore
{
  id: "abc123",
  name: "Isabella Santos",
  // ... outros campos ...

  // Campos para IA (opcional)
  aiPersonality: {
    tone: "carinhosa e sedutora",
    interests: ["moda", "viagens", "fitness"],
    catchphrases: ["amor", "lindo", "bb"],
    age: 24,
    location: "Rio de Janeiro"
  }
}
```

---

## Configuração no Frontend (OnlyNex)

### 1. Arquivo de configuração do webhook

Crie/edite o arquivo `.env`:

```env
# Webhook do n8n
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/onlynex-chat

# Fallback para respostas locais (caso webhook falhe)
VITE_USE_LOCAL_FALLBACK=true
```

### 2. Serviço de Chat com IA

O arquivo `src/services/chatService.js` foi criado para gerenciar as chamadas:

```javascript
// Importar no Chat.jsx
import { sendMessageToAI } from "../services/chatService";

// Usar no handleSend
const response = await sendMessageToAI({
  modelId: model.id,
  modelName: model.name,
  message: userMessage.text,
  userName: username,
});
```

---

## Testando a Integração

### 1. Teste o webhook diretamente

```bash
curl -X POST https://seu-n8n.com/webhook/onlynex-chat \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "abc123",
    "modelName": "Isabella Santos",
    "message": "Oi, tudo bem?",
    "userId": "usuario@email.com",
    "userName": "João",
    "history": [],
    "timestamp": "2024-12-21T15:30:00.000Z"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "response": "Oii João! 💕 Tudo ótimo, ainda mais agora falando com você! Como foi seu dia?",
  "modelId": "abc123"
}
```

### Parâmetros do Request

| Parâmetro   | Tipo   | Obrigatório | Descrição                              |
| ----------- | ------ | ----------- | -------------------------------------- |
| `modelId`   | string | ✅ Sim      | ID do documento da modelo no Firestore |
| `modelName` | string | ✅ Sim      | Nome da modelo                         |
| `message`   | string | ✅ Sim      | Mensagem do usuário                    |
| `userId`    | string | ✅ Sim      | Email do usuário (Firebase Auth)       |
| `userName`  | string | Não         | Nome de exibição do usuário            |
| `history`   | array  | Não         | Últimas 10 mensagens da conversa       |
| `timestamp` | string | Não         | Data/hora ISO da mensagem              |

### 2. Teste no app

1. Acesse o chat de uma modelo
2. Envie uma mensagem
3. Verifique se a resposta vem do GPT

---

## Personalização Avançada

### Memória de Conversa

Para manter contexto da conversa, você pode:

1. **Armazenar no Firestore:**

   - Crie uma subcoleção `chats/{modelId}/messages`
   - Envie os últimos N mensagens para o GPT

2. **No n8n:**
   - Use um nó de banco de dados para buscar histórico
   - Inclua no array de mensagens do GPT

### Exemplo com histórico:

```javascript
// No nó Code do n8n
const messages = [
  { role: "system", content: systemPrompt },
  // Histórico (últimas 5 mensagens)
  ...history.map((msg) => ({
    role: msg.sender === "user" ? "user" : "assistant",
    content: msg.text,
  })),
  // Mensagem atual
  { role: "user", content: currentMessage },
];
```

---

## Custos e Limites

### OpenAI Pricing (GPT-4o-mini)

- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

### Estimativa por mensagem

- ~50 tokens input + ~50 tokens output = ~100 tokens
- Custo: ~$0.0001 por mensagem
- 10.000 mensagens = ~$1.00

### Rate Limits

- Configure limites no n8n para evitar abusos
- Implemente debounce no frontend (já feito)

---

## Troubleshooting

### Webhook não responde

1. Verifique se o workflow está ativo no n8n
2. Confira a URL do webhook
3. Teste com curl primeiro

### Respostas genéricas demais

1. Ajuste o system prompt
2. Aumente a temperature (0.7-0.9)
3. Adicione mais contexto sobre a modelo

### Respostas muito longas

1. Reduza maxTokens (100-150)
2. Adicione "Responda em 1-2 frases" no prompt

### Erro de CORS

1. Configure headers no n8n:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

---

## Próximos Passos

1. [ ] Configure o webhook no n8n
2. [ ] Adicione a URL no `.env`
3. [ ] Teste a integração
4. [ ] Personalize os prompts por modelo
5. [ ] Implemente histórico de conversa (opcional)
6. [ ] Configure limites de uso (opcional)

---

## Suporte

Dúvidas? Entre em contato ou abra uma issue no repositório.
