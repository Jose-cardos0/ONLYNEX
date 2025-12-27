# Integração Frendz + Firebase - Sistema de Assinatura

## 📋 Visão Geral

Este documento explica como integrar os webhooks da Frendz com o Firebase para:

1. **Criar conta automaticamente** quando um usuário pagar
2. **Enviar credenciais** por email/WhatsApp
3. **Gerenciar recorrência** - suspender acesso se não pagar
4. **Reativar acesso** quando o pagamento for confirmado

---

## 🚀 DEPLOY RÁPIDO

O código já está pronto na pasta `functions/`. Siga estes passos:

### 1. Instalar Firebase CLI (se ainda não tiver)

```bash
npm install -g firebase-tools
```

### 2. Fazer login no Firebase

```bash
firebase login
```

### 3. Conectar ao seu projeto Firebase

```bash
firebase use --add
# Selecione seu projeto (ex: onlynex-12345)
```

### 4. Instalar dependências das functions

```bash
cd functions
npm install
cd ..
```

### 5. (Opcional) Configurar envio de email

```bash
firebase functions:config:set email.user="seu-email@gmail.com" email.pass="sua-app-password"
```

### 6. Fazer deploy

```bash
firebase deploy --only functions
```

### 7. Pegar a URL do webhook

Após o deploy, você verá:

```
✓ functions[frendzWebhook]: https://us-central1-SEU-PROJETO.cloudfunctions.net/frendzWebhook
```

### 8. Configurar na Frendz

Cole essa URL nas configurações de webhook da Frendz.

---

## 🏗️ Arquitetura da Solução

```
┌─────────────────┐     POST webhook      ┌─────────────────┐
│                 │ ──────────────────►   │                 │
│  Frendz (Loja)  │                       │  Seu Backend    │
│                 │ ◄──────────────────   │  (Webhook)      │
└─────────────────┘     Resposta 200      └────────┬────────┘
                                                   │
                                                   │ Firebase Admin SDK
                                                   ▼
                              ┌─────────────────────────────────────┐
                              │           Firebase                   │
                              │  ┌─────────────┐  ┌──────────────┐  │
                              │  │    Auth     │  │  Firestore   │  │
                              │  │ (usuários)  │  │ (assinaturas)│  │
                              │  └─────────────┘  └──────────────┘  │
                              └─────────────────────────────────────┘
```

---

## 🛠️ O Que Você Precisa

### 1. Um Servidor Backend

Você precisa de um servidor para receber os webhooks. Opções:

| Opção                        | Custo           | Dificuldade | Recomendado |
| ---------------------------- | --------------- | ----------- | ----------- |
| **Firebase Cloud Functions** | Grátis (limite) | Fácil       | ✅ Sim      |
| Vercel Serverless            | Grátis (limite) | Fácil       | ✅ Sim      |
| Railway.app                  | Grátis (limite) | Médio       | Sim         |
| VPS (Hostinger, etc)         | Pago            | Difícil     | Não         |

### 2. Firebase Admin SDK

Para criar usuários e gerenciar o Firestore pelo backend.

### 3. Serviço de Email (Opcional)

Para enviar as credenciais. Opções: SendGrid, Mailgun, Resend.

---

## 📁 Estrutura do Projeto Backend

```
onlynex-webhook/
├── functions/
│   ├── index.js          # Webhook principal
│   ├── services/
│   │   ├── firebase.js   # Firebase Admin
│   │   ├── email.js      # Envio de emails
│   │   └── subscription.js # Lógica de assinatura
│   └── package.json
├── .env                   # Variáveis de ambiente
└── firebase.json
```

---

## 💻 Código do Webhook (Firebase Cloud Functions)

### 1. Instalar Firebase Functions

```bash
# Na pasta do projeto
npm install -g firebase-tools
firebase login
firebase init functions
```

### 2. Instalar Dependências

```bash
cd functions
npm install firebase-admin cors nodemailer
```

### 3. Código Principal (`functions/index.js`)

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Inicializa Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ==================== WEBHOOK PRINCIPAL ====================

exports.frendzWebhook = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Só aceita POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    try {
      const payload = req.body;
      const event = payload.event;
      const status = payload.status;

      console.log("Webhook recebido:", { event, status });

      // ========== PAGAMENTO REALIZADO ==========
      if (event === "transaction" && status === "paid") {
        const result = await handlePaidTransaction(payload);
        return res.status(200).json(result);
      }

      // ========== PAGAMENTO RECUSADO/CANCELADO ==========
      if (
        event === "transaction" &&
        ["refused", "cancelled", "chargeback", "refunded"].includes(status)
      ) {
        const result = await handleCancelledTransaction(payload);
        return res.status(200).json(result);
      }

      // ========== ABANDONO DE CARRINHO ==========
      if (event === "cart.abandoned") {
        console.log("Carrinho abandonado:", payload.customer?.email);
        return res.status(200).json({ message: "Abandono registrado" });
      }

      // Evento não tratado
      return res.status(200).json({ message: "Evento recebido" });
    } catch (error) {
      console.error("Erro no webhook:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// ==================== PAGAMENTO REALIZADO ====================

async function handlePaidTransaction(payload) {
  const customer = payload.customer;
  const email = customer.email.toLowerCase().trim();
  const name = customer.name;
  const phone = customer.phone_number || customer.phone;
  const transactionId = payload.transaction?.id;
  const amount = payload.transaction?.amount || 0;
  const paidAt = payload.paid_at;

  console.log(`Processando pagamento de: ${email}`);

  // Verifica se usuário já existe
  let user;
  let isNewUser = false;
  const defaultPassword = "onlynex";

  try {
    // Tenta buscar usuário existente
    user = await auth.getUserByEmail(email);
    console.log("Usuário já existe:", user.uid);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      // Cria novo usuário
      user = await auth.createUser({
        email: email,
        password: defaultPassword,
        displayName: name,
        disabled: false,
      });
      isNewUser = true;
      console.log("Novo usuário criado:", user.uid);
    } else {
      throw error;
    }
  }

  // Calcula próxima data de vencimento (30 dias)
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

  // Salva/Atualiza assinatura no Firestore
  await db
    .collection("subscriptions")
    .doc(user.uid)
    .set(
      {
        email: email,
        name: name,
        phone: phone,
        status: "active", // active, suspended, cancelled
        lastPaymentDate: new Date().toISOString(),
        nextPaymentDate: nextPaymentDate.toISOString(),
        lastTransactionId: transactionId,
        totalPaid: admin.firestore.FieldValue.increment(amount),
        paymentHistory: admin.firestore.FieldValue.arrayUnion({
          transactionId,
          amount,
          paidAt,
          status: "paid",
        }),
        createdAt: isNewUser
          ? new Date().toISOString()
          : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

  // Se usuário estava suspenso, reativa
  if (!isNewUser) {
    await auth.updateUser(user.uid, { disabled: false });
    console.log("Acesso reativado para:", email);
  }

  // Monta mensagem de resposta
  const message = isNewUser
    ? `🎉 Obrigado pela compra!\n\n📧 Login: ${email}\n🔐 Senha: ${defaultPassword}\n🌐 Acesse: https://onlynex.online\n\n💡 Recomendamos alterar sua senha após o primeiro acesso.`
    : `🎉 Pagamento confirmado!\n\nSeu acesso foi renovado por mais 30 dias.\n🌐 Acesse: https://onlynex.online`;

  // TODO: Enviar email/WhatsApp com as credenciais
  // await sendEmail(email, "Bem-vindo ao OnlyNex!", message);
  // await sendWhatsApp(phone, message);

  console.log("Mensagem para o cliente:", message);

  return {
    success: true,
    isNewUser,
    message,
    user: {
      email,
      accessUrl: "https://onlynex.online",
    },
  };
}

// ==================== PAGAMENTO CANCELADO/RECUSADO ====================

async function handleCancelledTransaction(payload) {
  const customer = payload.customer;
  const email = customer.email.toLowerCase().trim();
  const status = payload.status;

  console.log(`Pagamento ${status} para: ${email}`);

  try {
    const user = await auth.getUserByEmail(email);

    // Suspende o acesso
    await auth.updateUser(user.uid, { disabled: true });

    // Atualiza status no Firestore
    await db
      .collection("subscriptions")
      .doc(user.uid)
      .update({
        status: status === "refunded" ? "refunded" : "suspended",
        suspendedAt: new Date().toISOString(),
        suspendReason: status,
        updatedAt: new Date().toISOString(),
      });

    console.log("Acesso suspenso para:", email);

    return {
      success: true,
      message: `Acesso suspenso devido a: ${status}`,
    };
  } catch (error) {
    console.log("Usuário não encontrado para suspensão:", email);
    return { success: true, message: "Usuário não encontrado" };
  }
}

// ==================== VERIFICAÇÃO DIÁRIA DE ASSINATURAS ====================

exports.checkExpiredSubscriptions = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    console.log("Verificando assinaturas expiradas...");

    const now = new Date();

    // Busca assinaturas ativas com nextPaymentDate vencido
    const expiredSubs = await db
      .collection("subscriptions")
      .where("status", "==", "active")
      .where("nextPaymentDate", "<", now.toISOString())
      .get();

    console.log(`Encontradas ${expiredSubs.size} assinaturas expiradas`);

    const batch = db.batch();

    for (const doc of expiredSubs.docs) {
      const sub = doc.data();

      try {
        // Suspende o usuário no Auth
        await auth.updateUser(doc.id, { disabled: true });

        // Atualiza status no Firestore
        batch.update(doc.ref, {
          status: "expired",
          suspendedAt: now.toISOString(),
          suspendReason: "payment_overdue",
          updatedAt: now.toISOString(),
        });

        console.log(`Suspenso: ${sub.email}`);
      } catch (error) {
        console.error(`Erro ao suspender ${sub.email}:`, error);
      }
    }

    await batch.commit();

    console.log("Verificação concluída");
    return null;
  });
```

### 4. Deploy das Functions

```bash
firebase deploy --only functions
```

Após o deploy, você receberá uma URL como:

```
https://us-central1-seu-projeto.cloudfunctions.net/frendzWebhook
```

---

## ⚙️ Configurar Webhook na Frendz

1. Acesse o painel da Frendz
2. Vá em **Configurações > Webhooks**
3. Adicione a URL do seu webhook:
   ```
   https://us-central1-seu-projeto.cloudfunctions.net/frendzWebhook
   ```
4. Selecione os eventos:
   - ✅ transaction (para pagamentos)
   - ✅ cart.abandoned (opcional, para remarketing)

---

## 🔐 Verificar Autenticação no Frontend

No seu app React, você precisa verificar se o usuário está ativo:

### Atualizar `src/pages/Login.jsx`

```javascript
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Após o login com sucesso, verificar status da assinatura
const checkSubscription = async (user) => {
  const subDoc = await getDoc(doc(db, "subscriptions", user.uid));

  if (!subDoc.exists()) {
    // Usuário não tem assinatura
    throw new Error(
      "Assinatura não encontrada. Entre em contato com o suporte."
    );
  }

  const subscription = subDoc.data();

  if (subscription.status !== "active") {
    throw new Error("Sua assinatura está suspensa. Renove para continuar.");
  }

  // Verifica se está dentro do período de 30 dias
  const nextPayment = new Date(subscription.nextPaymentDate);
  if (nextPayment < new Date()) {
    throw new Error("Sua assinatura expirou. Renove para continuar.");
  }

  return true;
};
```

---

## 📊 Estrutura do Firestore

### Coleção: `subscriptions`

```javascript
{
  // Documento ID = UID do usuário no Auth
  "email": "usuario@email.com",
  "name": "Nome do Usuário",
  "phone": "+5511999999999",
  "status": "active", // active, suspended, expired, cancelled, refunded
  "lastPaymentDate": "2025-01-15T10:00:00.000Z",
  "nextPaymentDate": "2025-02-14T10:00:00.000Z",
  "lastTransactionId": "abc123",
  "totalPaid": 9900, // em centavos
  "paymentHistory": [
    {
      "transactionId": "abc123",
      "amount": 9900,
      "paidAt": "2025-01-15T10:00:00.000Z",
      "status": "paid"
    }
  ],
  "suspendedAt": null,
  "suspendReason": null,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

---

## 🔄 Fluxo Completo

### Novo Cliente Compra

```
1. Cliente paga na Frendz
2. Frendz envia webhook com status "paid"
3. Webhook recebe e cria usuário no Firebase Auth
4. Webhook salva assinatura no Firestore (30 dias)
5. Webhook retorna credenciais
6. (Opcional) Envia email/WhatsApp com login
7. Cliente acessa https://onlynex.online
8. Cliente faz login com email + senha "onlynex"
```

### Cliente Existente Renova

```
1. Cliente paga novamente na Frendz
2. Frendz envia webhook com status "paid"
3. Webhook atualiza nextPaymentDate (+30 dias)
4. Se estava suspenso, reativa o acesso
5. Webhook retorna confirmação
```

### Cliente Não Paga (Expiração)

```
1. Cloud Function roda diariamente às 00:00
2. Busca assinaturas com nextPaymentDate < hoje
3. Suspende usuário no Firebase Auth
4. Atualiza status para "expired" no Firestore
5. Cliente não consegue mais fazer login
```

### Cliente Paga Após Suspensão

```
1. Cliente paga na Frendz
2. Webhook atualiza nextPaymentDate (+30 dias)
3. Reativa usuário no Firebase Auth
4. Atualiza status para "active" no Firestore
5. Cliente volta a ter acesso
```

---

## 📧 Envio de Email (Opcional)

### Usando Nodemailer + Gmail

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password do Gmail
  },
});

async function sendEmail(to, subject, text) {
  await transporter.sendMail({
    from: '"OnlyNex" <seu-email@gmail.com>',
    to,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">🎉 Bem-vindo ao OnlyNex!</h1>
        <p>Seus dados de acesso:</p>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 10px;">
          <p><strong>📧 Email:</strong> ${to}</p>
          <p><strong>🔐 Senha:</strong> onlynex</p>
          <p><strong>🌐 Acesse:</strong> <a href="https://onlynex.online">https://onlynex.online</a></p>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
          Recomendamos alterar sua senha após o primeiro acesso.
        </p>
      </div>
    `,
  });
}
```

---

## 🔒 Regras do Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem ler sua própria assinatura
    match /subscriptions/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Apenas o backend pode escrever
    }

    // Outras coleções...
    match /modelos/{modelId} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    match /userCollections/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## ⚠️ Considerações Importantes

### 1. Segurança do Webhook

Adicione validação do token/secret da Frendz:

```javascript
const FRENDZ_SECRET = process.env.FRENDZ_WEBHOOK_SECRET;

// No início do webhook
if (req.headers["x-frendz-secret"] !== FRENDZ_SECRET) {
  return res.status(401).json({ error: "Não autorizado" });
}
```

### 2. Senha Padrão

Considere gerar senhas aleatórias ou forçar o usuário a criar uma:

```javascript
const crypto = require("crypto");
const randomPassword = crypto.randomBytes(4).toString("hex"); // ex: "a1b2c3d4"
```

### 3. Grace Period

Considere dar 3 dias de "tolerância" antes de suspender:

```javascript
// Em vez de suspender imediatamente
nextPaymentDate.setDate(nextPaymentDate.getDate() + 3); // 3 dias de tolerância
```

### 4. Notificações

Envie lembretes antes do vencimento:

- 7 dias antes
- 3 dias antes
- 1 dia antes
- No dia do vencimento

---

## 🚀 Próximos Passos

1. [ ] Criar projeto Firebase Functions
2. [ ] Configurar Firebase Admin SDK
3. [ ] Implementar o código do webhook
4. [ ] Fazer deploy
5. [ ] Configurar URL do webhook na Frendz
6. [ ] Testar com uma compra de teste
7. [ ] Implementar envio de emails
8. [ ] Configurar regras do Firestore
9. [ ] Atualizar Login.jsx para verificar assinatura

---

## 📞 Suporte

Se precisar de ajuda com a implementação, entre em contato!
