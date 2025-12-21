/**
 * Serviço de Chat com IA (n8n + GPT)
 *
 * Este serviço gerencia as chamadas para o webhook do n8n
 * que está conectado ao ChatGPT para respostas personalizadas.
 */

import { getResponse as getLocalResponse } from "../data/chatResponses";

// URL do webhook do n8n (configurar no .env)
const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// Se deve usar fallback local quando o webhook falhar
const USE_LOCAL_FALLBACK = import.meta.env.VITE_USE_LOCAL_FALLBACK !== "false";

/**
 * Envia mensagem para o webhook do n8n e recebe resposta do GPT
 *
 * @param {Object} params - Parâmetros da mensagem
 * @param {string} params.modelId - ID do documento da modelo no Firestore (obrigatório)
 * @param {string} params.modelName - Nome da modelo (obrigatório)
 * @param {string} params.message - Mensagem do usuário (obrigatório)
 * @param {string} params.userId - Email do usuário autenticado no Firebase (obrigatório)
 * @param {string} params.userName - Nome do usuário para exibição
 * @param {Array} params.history - Histórico de mensagens (opcional)
 * @returns {Promise<string>} - Resposta da IA
 */
export const sendMessageToAI = async ({
  modelId,
  modelName,
  message,
  userId, // Email do Firebase Auth (obrigatório)
  userName = "amor",
  history = [],
}) => {
  // Valida parâmetros obrigatórios
  if (!modelId || !modelName || !message || !userId) {
    console.error("[ChatService] Parâmetros obrigatórios faltando:", {
      modelId: !!modelId,
      modelName: !!modelName,
      message: !!message,
      userId: !!userId,
    });
    return getLocalResponse(message);
  }

  // Se não tiver webhook configurado, usa resposta local
  if (!WEBHOOK_URL) {
    console.log(
      "[ChatService] Webhook não configurado, usando respostas locais"
    );
    return getLocalResponse(message);
  }

  try {
    console.log("[ChatService] Enviando para webhook:", WEBHOOK_URL);

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelId,
        modelName,
        message,
        userId, // Email do usuário (identificador único)
        userName,
        history: history.slice(-10), // Últimas 10 mensagens para contexto
        timestamp: new Date().toISOString(),
      }),
    });

    console.log("[ChatService] Status da resposta:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ChatService] Erro HTTP:", response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("[ChatService] Resposta raw:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log("[ChatService] Resposta não é JSON, usando como texto");
      return responseText;
    }

    // Log para debug - mostra o que o webhook retornou
    console.log("[ChatService] Resposta do webhook:", data);

    // Helper para limpar o "=" do início (n8n expression prefix)
    const cleanN8nExpression = (value) => {
      if (typeof value === "string" && value.startsWith("=")) {
        return value.substring(1);
      }
      return value;
    };

    // Aceita diferentes formatos de resposta

    // Formato N8N BUGADO: { node: "Respond to Webhook", settings: { responseBody: { response: "=mensagem" } } }
    if (
      data.node === "Respond to Webhook" &&
      data.settings?.responseBody?.response
    ) {
      console.log("[ChatService] Detectado formato n8n aninhado");
      return cleanN8nExpression(data.settings.responseBody.response);
    }

    // Formato 1: { success: true, response: "mensagem" }
    if (data.success && data.response) {
      return cleanN8nExpression(data.response);
    }

    // Formato 2: { response: "mensagem" } (sem success)
    if (data.response) {
      return cleanN8nExpression(data.response);
    }

    // Formato 3: { message: "mensagem" }
    if (data.message) {
      return cleanN8nExpression(data.message);
    }

    // Formato 4: { text: "mensagem" }
    if (data.text) {
      return cleanN8nExpression(data.text);
    }

    // Formato 5: { output: "mensagem" } (comum no n8n)
    if (data.output) {
      return cleanN8nExpression(data.output);
    }

    // Formato 6: { content: "mensagem" } (formato OpenAI)
    if (data.content) {
      return cleanN8nExpression(data.content);
    }

    // Formato 7: Array com resposta (n8n às vezes retorna array)
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      const result =
        firstItem.response ||
        firstItem.message ||
        firstItem.text ||
        firstItem.output ||
        firstItem.content ||
        JSON.stringify(firstItem);
      return cleanN8nExpression(result);
    }

    // Formato 8: String direta
    if (typeof data === "string") {
      return cleanN8nExpression(data);
    }

    // Se nenhum formato reconhecido, loga e usa fallback
    console.error("[ChatService] Formato de resposta não reconhecido:", data);
    throw new Error("Resposta inválida do webhook");
  } catch (error) {
    console.error("[ChatService] Erro ao chamar webhook:", error);

    // Fallback para respostas locais
    if (USE_LOCAL_FALLBACK) {
      console.log("[ChatService] Usando fallback local");
      return getLocalResponse(message);
    }

    // Se não usar fallback, retorna mensagem genérica
    return "Ops, tive um probleminha aqui! 😅 Tenta de novo, amor? 💕";
  }
};

/**
 * Verifica se o webhook está disponível
 *
 * @returns {Promise<boolean>} - true se o webhook está funcionando
 */
export const checkWebhookHealth = async () => {
  if (!WEBHOOK_URL) return false;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        healthCheck: true,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Retorna se está usando IA ou respostas locais
 *
 * @returns {boolean} - true se está usando IA (webhook configurado)
 */
export const isUsingAI = () => {
  return !!WEBHOOK_URL;
};

export default {
  sendMessageToAI,
  checkWebhookHealth,
  isUsingAI,
};
