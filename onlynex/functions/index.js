const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Inicializa Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Configuração de email (opcional - configure como variáveis de ambiente)
// No Google Cloud Console > Cloud Functions > sua função > Variáveis de ambiente
// EMAIL_USER=seu-email@gmail.com
// EMAIL_PASS=sua-app-password
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = emailUser
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  : null;

// ==================== WEBHOOK PRINCIPAL ====================

exports.frendzWebhook = onRequest({ cors: true }, async (req, res) => {
  // Log do request para debug
  console.log("=== WEBHOOK RECEBIDO ===");
  console.log("Method:", req.method);
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Body:", JSON.stringify(req.body));

  // Só aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const payload = req.body;
    const event = payload.event;
    const status = payload.status;

    console.log("Processando:", { event, status });

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
      // Aqui você pode integrar com remarketing, enviar email, etc.
      return res.status(200).json({ message: "Abandono registrado" });
    }

    // Evento não tratado (mas retorna 200 para não reenviar)
    console.log("Evento não tratado:", event);
    return res.status(200).json({ message: "Evento recebido" });
  } catch (error) {
    console.error("ERRO no webhook:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== PAGAMENTO REALIZADO ====================

async function handlePaidTransaction(payload) {
  const customer = payload.customer;
  const email = customer.email.toLowerCase().trim();
  const name = customer.name || "Cliente";
  const phone = customer.phone_number || customer.phone || "";
  const document = customer.document || "";
  const transactionId = payload.transaction?.id || payload.token;
  const amount = payload.transaction?.amount || payload.offer?.price || 0;
  const paidAt = payload.paid_at || new Date().toISOString();
  const method = payload.method || payload.transaction?.method || "unknown";

  console.log(`💰 Processando pagamento de: ${email}`);
  console.log(`   Valor: R$ ${(amount / 100).toFixed(2)}`);
  console.log(`   Método: ${method}`);

  // Verifica se usuário já existe
  let user;
  let isNewUser = false;
  const defaultPassword = "onlynex";

  try {
    // Tenta buscar usuário existente
    user = await auth.getUserByEmail(email);
    console.log("✓ Usuário já existe:", user.uid);
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
      console.log("✓ Novo usuário criado:", user.uid);
    } else {
      throw error;
    }
  }

  // Calcula próxima data de vencimento (30 dias)
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

  // Dados da assinatura
  const subscriptionData = {
    email: email,
    name: name,
    phone: phone,
    document: document,
    status: "active",
    lastPaymentDate: new Date().toISOString(),
    nextPaymentDate: nextPaymentDate.toISOString(),
    lastTransactionId: transactionId,
    lastPaymentMethod: method,
    updatedAt: new Date().toISOString(),
  };

  // Se é novo usuário, adiciona campos de criação
  if (isNewUser) {
    subscriptionData.createdAt = new Date().toISOString();
    subscriptionData.totalPaid = amount;
    subscriptionData.paymentCount = 1;
    subscriptionData.paymentHistory = [
      {
        transactionId,
        amount,
        paidAt,
        method,
        status: "paid",
      },
    ];
  }

  // Salva/Atualiza assinatura no Firestore
  const docRef = db.collection("subscriptions").doc(user.uid);

  if (isNewUser) {
    await docRef.set(subscriptionData);
  } else {
    // Atualiza e incrementa valores
    await docRef.set(
      {
        ...subscriptionData,
        totalPaid: admin.firestore.FieldValue.increment(amount),
        paymentCount: admin.firestore.FieldValue.increment(1),
        paymentHistory: admin.firestore.FieldValue.arrayUnion({
          transactionId,
          amount,
          paidAt,
          method,
          status: "paid",
        }),
      },
      { merge: true }
    );

    // Se usuário estava suspenso, reativa
    const currentUser = await auth.getUser(user.uid);
    if (currentUser.disabled) {
      await auth.updateUser(user.uid, { disabled: false });
      console.log("✓ Acesso reativado para:", email);
    }
  }

  // Monta mensagem de resposta
  const message = isNewUser
    ? `🎉 Obrigado pela compra!\n\n📧 Login: ${email}\n🔐 Senha: ${defaultPassword}\n🌐 Acesse: https://onlynex.online\n\n💡 Recomendamos alterar sua senha após o primeiro acesso.`
    : `🎉 Pagamento confirmado!\n\nSeu acesso foi renovado por mais 30 dias.\n🌐 Acesse: https://onlynex.online`;

  // Envia email com as credenciais (se configurado)
  if (transporter && isNewUser) {
    try {
      await sendWelcomeEmail(email, name, defaultPassword);
      console.log("✓ Email enviado para:", email);
    } catch (emailError) {
      console.error("✗ Erro ao enviar email:", emailError);
    }
  }

  console.log("✓ Processamento concluído para:", email);
  console.log("📝 Mensagem:", message);

  return {
    success: true,
    isNewUser,
    message,
    user: {
      email,
      password: isNewUser ? defaultPassword : undefined,
      accessUrl: "https://onlynex.online",
    },
    subscription: {
      status: "active",
      expiresAt: nextPaymentDate.toISOString(),
    },
  };
}

// ==================== PAGAMENTO CANCELADO/RECUSADO ====================

async function handleCancelledTransaction(payload) {
  const customer = payload.customer;
  const email = customer.email.toLowerCase().trim();
  const status = payload.status;
  const transactionId = payload.transaction?.id || payload.token;

  console.log(`❌ Pagamento ${status} para: ${email}`);

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
        lastTransactionId: transactionId,
        updatedAt: new Date().toISOString(),
      });

    console.log("✓ Acesso suspenso para:", email);

    return {
      success: true,
      message: `Acesso suspenso devido a: ${status}`,
      user: { email },
    };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.log("⚠ Usuário não encontrado para suspensão:", email);
      return { success: true, message: "Usuário não encontrado" };
    }
    throw error;
  }
}

// ==================== VERIFICAÇÃO DIÁRIA DE ASSINATURAS ====================

exports.checkExpiredSubscriptions = onSchedule(
  {
    schedule: "every day 00:00",
    timeZone: "America/Sao_Paulo",
  },
  async (event) => {
    console.log("🔍 Verificando assinaturas expiradas...");

    const now = new Date();
    const nowISO = now.toISOString();

    try {
      // Busca assinaturas ativas com nextPaymentDate vencido
      const expiredSubs = await db
        .collection("subscriptions")
        .where("status", "==", "active")
        .where("nextPaymentDate", "<", nowISO)
        .get();

      console.log(`📊 Encontradas ${expiredSubs.size} assinaturas expiradas`);

      if (expiredSubs.empty) {
        console.log("✓ Nenhuma assinatura para suspender");
        return;
      }

      const batch = db.batch();
      let suspendedCount = 0;

      for (const doc of expiredSubs.docs) {
        const sub = doc.data();

        try {
          // Suspende o usuário no Auth
          await auth.updateUser(doc.id, { disabled: true });

          // Atualiza status no Firestore
          batch.update(doc.ref, {
            status: "expired",
            suspendedAt: nowISO,
            suspendReason: "payment_overdue",
            updatedAt: nowISO,
          });

          suspendedCount++;
          console.log(`  ❌ Suspenso: ${sub.email}`);
        } catch (error) {
          console.error(`  ✗ Erro ao suspender ${sub.email}:`, error.message);
        }
      }

      await batch.commit();

      console.log(
        `✓ Verificação concluída. ${suspendedCount} usuários suspensos.`
      );
    } catch (error) {
      console.error("✗ Erro na verificação:", error);
    }
  }
);

// ==================== ENVIO DE EMAIL ====================

async function sendWelcomeEmail(to, name, password) {
  if (!transporter) {
    console.log("⚠ Email não configurado, pulando envio");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f1f5f9; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0ea5e9, #06b6d4); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .credentials { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .credentials p { margin: 10px 0; font-size: 16px; }
        .credentials strong { color: #0ea5e9; }
        .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bem-vindo ao OnlyNex!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${name}</strong>,</p>
          <p>Sua compra foi confirmada com sucesso! Aqui estão seus dados de acesso:</p>
          
          <div class="credentials">
            <p>📧 <strong>Email:</strong> ${to}</p>
            <p>🔐 <strong>Senha:</strong> ${password}</p>
          </div>
          
          <center>
            <a href="https://onlynex.online" class="button">Acessar Agora</a>
          </center>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            💡 Recomendamos alterar sua senha após o primeiro acesso para maior segurança.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} OnlyNex. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"OnlyNex" <${emailUser}>`,
    to,
    subject: "🎉 Bem-vindo ao OnlyNex - Seus dados de acesso",
    html,
  });
}

// ==================== HEALTH CHECK ====================

exports.healthCheck = onRequest({ cors: true }, async (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "OnlyNex Webhook",
  });
});
