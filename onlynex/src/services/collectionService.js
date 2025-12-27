import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION_NAME = "userCollections";

/**
 * Estrutura no Firestore:
 * userCollections/{userEmail} -> {
 *   models: {
 *     [modelId]: {
 *       savedCards: ["cardId1", "cardId2", ...],
 *       lastUpdated: "timestamp"
 *     }
 *   }
 * }
 */

// Buscar coleção do usuário para uma modelo específica
export const getUserCollection = async (userEmail, modelId) => {
  try {
    // Sanitiza o email para usar como ID do documento (Firebase não aceita '.' em IDs)
    const sanitizedEmail = userEmail.replace(/\./g, "_");
    const docRef = doc(db, COLLECTION_NAME, sanitizedEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.models?.[modelId]?.savedCards || [];
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar coleção:", error);
    return [];
  }
};

// Buscar todas as coleções do usuário (para todas as modelos)
export const getAllUserCollections = async (userEmail) => {
  try {
    const sanitizedEmail = userEmail.replace(/\./g, "_");
    const docRef = doc(db, COLLECTION_NAME, sanitizedEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.models || {};
    }
    return {};
  } catch (error) {
    console.error("Erro ao buscar coleções:", error);
    return {};
  }
};

// Salvar um card na coleção do usuário
export const saveCardToCollection = async (userEmail, modelId, cardId) => {
  try {
    const sanitizedEmail = userEmail.replace(/\./g, "_");
    const docRef = doc(db, COLLECTION_NAME, sanitizedEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Documento existe, atualiza
      const data = docSnap.data();
      const modelData = data.models?.[modelId] || { savedCards: [] };
      
      // Verifica se o card já foi salvo
      if (modelData.savedCards.includes(cardId)) {
        return { success: false, message: "Card já está na coleção" };
      }

      await updateDoc(docRef, {
        [`models.${modelId}.savedCards`]: arrayUnion(cardId),
        [`models.${modelId}.lastUpdated`]: new Date().toISOString(),
      });
    } else {
      // Documento não existe, cria
      await setDoc(docRef, {
        email: userEmail,
        models: {
          [modelId]: {
            savedCards: [cardId],
            lastUpdated: new Date().toISOString(),
          },
        },
        createdAt: new Date().toISOString(),
      });
    }

    return { success: true, message: "Card salvo na coleção!" };
  } catch (error) {
    console.error("Erro ao salvar card:", error);
    return { success: false, message: "Erro ao salvar card" };
  }
};

// Verificar se um card específico está na coleção do usuário
export const isCardInCollection = async (userEmail, modelId, cardId) => {
  try {
    const savedCards = await getUserCollection(userEmail, modelId);
    return savedCards.includes(cardId);
  } catch (error) {
    console.error("Erro ao verificar card:", error);
    return false;
  }
};

// Contar quantos cards o usuário tem de uma modelo
export const countUserCards = async (userEmail, modelId) => {
  try {
    const savedCards = await getUserCollection(userEmail, modelId);
    return savedCards.length;
  } catch (error) {
    console.error("Erro ao contar cards:", error);
    return 0;
  }
};

