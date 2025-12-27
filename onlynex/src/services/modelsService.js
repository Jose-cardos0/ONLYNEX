import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { db, storage } from "../config/firebase";

const COLLECTION_NAME = "modelos";

// Formata o nome para pasta do Storage (remove acentos e caracteres especiais)
const formatFolderName = (name) => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
};

// ==================== CRUD DE MODELOS ====================

// Buscar todas as modelos
export const getAllModels = async () => {
  try {
    const modelsRef = collection(db, COLLECTION_NAME);
    const q = query(modelsRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar modelos:", error);
    throw error;
  }
};

// Buscar modelo por ID
export const getModelById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar modelo:", error);
    throw error;
  }
};

// Criar nova modelo
export const createModel = async (modelData) => {
  try {
    const modelsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(modelsRef, {
      ...modelData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return {
      id: docRef.id,
      ...modelData,
    };
  } catch (error) {
    console.error("Erro ao criar modelo:", error);
    throw error;
  }
};

// Atualizar modelo
export const updateModel = async (id, modelData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...modelData,
      updatedAt: new Date().toISOString(),
    });
    
    return {
      id,
      ...modelData,
    };
  } catch (error) {
    console.error("Erro ao atualizar modelo:", error);
    throw error;
  }
};

// Deletar modelo
export const deleteModel = async (id, modelName) => {
  try {
    // Deletar documento do Firestore
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    
    // Deletar pasta do Storage (opcional - se quiser manter os arquivos, comente isso)
    if (modelName) {
      const folderName = formatFolderName(modelName);
      await deleteModelFolder(folderName);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao deletar modelo:", error);
    throw error;
  }
};

// ==================== UPLOAD DE ARQUIVOS ====================

// Upload de imagem (avatar, cover, fotos)
export const uploadImage = async (file, modelName, type = "img") => {
  try {
    const folderName = formatFolderName(modelName);
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folderName}/${type}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    throw error;
  }
};

// Upload de vídeo
export const uploadVideo = async (file, modelName) => {
  try {
    const folderName = formatFolderName(modelName);
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folderName}/video/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload do vídeo:", error);
    throw error;
  }
};

// Upload de thumbnail do vídeo
export const uploadVideoThumbnail = async (file, modelName) => {
  try {
    const folderName = formatFolderName(modelName);
    const fileName = `thumb_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folderName}/video/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload da thumbnail:", error);
    throw error;
  }
};

// Upload de vídeo do chat (botões)
export const uploadVideoChatFile = async (file, modelName) => {
  try {
    const folderName = formatFolderName(modelName);
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folderName}/videosChat/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload do vídeo do chat:", error);
    throw error;
  }
};

// Upload de vídeo digitando (espera)
export const uploadVideoDigitandoFile = async (file, modelName) => {
  try {
    const folderName = formatFolderName(modelName);
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folderName}/videosDigitando/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload do vídeo digitando:", error);
    throw error;
  }
};

// ==================== CARDS (Coleção Exclusiva) ====================

// Upload de card (foto ou vídeo para coleção)
export const uploadCardFile = async (file, modelName) => {
  try {
    const folderName = formatFolderName(modelName);
    const fileName = `${Date.now()}_${file.name}`;
    const isVideo = file.type.startsWith("video/");
    const storageRef = ref(storage, `${folderName}/cards/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      id: `card_${Date.now()}`,
      url: downloadURL,
      type: isVideo ? "video" : "photo",
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Erro ao fazer upload do card:", error);
    throw error;
  }
};

// Buscar cards da modelo pelo Storage (pasta cards)
export const getModelCards = async (modelName) => {
  try {
    const folderName = formatFolderName(modelName);
    const cardsRef = ref(storage, `${folderName}/cards`);
    const list = await listAll(cardsRef);
    
    const cards = await Promise.all(
      list.items.map(async (item) => {
        const url = await getDownloadURL(item);
        const isVideo = item.name.match(/\.(mp4|webm|mov|avi)$/i);
        return {
          id: item.name,
          url,
          type: isVideo ? "video" : "photo",
          name: item.name,
        };
      })
    );
    
    return cards;
  } catch (error) {
    console.error("Erro ao buscar cards:", error);
    return [];
  }
};

// Deletar arquivo do Storage
export const deleteFile = async (fileUrl) => {
  try {
    // Extrai o path do URL do Firebase Storage
    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}/o/`;
    const filePath = decodeURIComponent(fileUrl.replace(baseUrl, "").split("?")[0]);
    
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    return true;
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    // Não propaga o erro para não quebrar o fluxo
    return false;
  }
};

// Deletar pasta inteira do Storage
const deleteModelFolder = async (folderName) => {
  try {
    const folderRef = ref(storage, folderName);
    const list = await listAll(folderRef);
    
    // Deletar arquivos na pasta
    for (const item of list.items) {
      await deleteObject(item);
    }
    
    // Deletar subpastas recursivamente
    for (const prefix of list.prefixes) {
      await deleteModelFolder(prefix.fullPath);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao deletar pasta:", error);
    return false;
  }
};

// ==================== HELPERS ====================

// Modelo inicial vazio para formulário
export const getEmptyModel = () => ({
  name: "",
  username: "",
  bio: "",
  avatar: "",
  cover: "",
  isOnline: false,
  isVerified: false,
  subscribers: 0,
  posts: 0,
  likes: 0,
  photos: [],
  videos: [],
  videosChat: [], // Vídeos do chat (botões): { id, label, videoUrl }
  videosDigitando: [], // Vídeos de espera/digitando: { id, videoUrl }
  cards: [], // Cards exclusivos para coleção: { id, url, type: 'photo'|'video' }
  price: 0,
});

