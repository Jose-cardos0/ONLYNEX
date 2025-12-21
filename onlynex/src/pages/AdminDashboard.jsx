import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import {
  getAllModels,
  createModel,
  updateModel,
  deleteModel,
  uploadImage,
  uploadVideo,
  uploadVideoThumbnail,
  uploadVideoChatFile,
  uploadVideoDigitandoFile,
  getEmptyModel,
} from "../services/modelsService";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  LogOut,
  X,
  Upload,
  Image,
  Video,
  Save,
  Loader2,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Heart,
  FileText,
  Link as LinkIcon,
  MessageCircle,
  Play,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [formData, setFormData] = useState(getEmptyModel());
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingVideoChat, setUploadingVideoChat] = useState(false);
  const [uploadingVideoDigitando, setUploadingVideoDigitando] = useState(false);

  // Verifica autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        if (currentUser.email === adminEmail) {
          setUser(currentUser);
          loadModels();
        } else {
          signOut(auth);
          navigate("/admin");
        }
      } else {
        navigate("/admin");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Carrega modelos
  const loadModels = async () => {
    try {
      const data = await getAllModels();
      setModels(data);
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin");
  };

  // Abre modal para criar
  const handleCreate = () => {
    setEditingModel(null);
    setFormData(getEmptyModel());
    setShowModal(true);
  };

  // Abre modal para editar
  const handleEdit = (model) => {
    setEditingModel(model);
    setFormData({
      name: model.name || "",
      username: model.username || "",
      bio: model.bio || "",
      avatar: model.avatar || "",
      cover: model.cover || "",
      isOnline: model.isOnline || false,
      isVerified: model.isVerified || false,
      subscribers: model.subscribers || 0,
      posts: model.posts || 0,
      likes: model.likes || 0,
      photos: model.photos || [],
      videos: model.videos || [],
      videosChat: model.videosChat || [],
      videosDigitando: model.videosDigitando || [],
      price: model.price || 0,
    });
    setShowModal(true);
  };

  // Deleta modelo
  const handleDelete = async (model) => {
    if (!confirm(`Tem certeza que deseja excluir ${model.name}?`)) return;

    try {
      await deleteModel(model.id, model.name);
      await loadModels();
    } catch (error) {
      alert("Erro ao excluir modelo");
    }
  };

  // Upload de avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !formData.name) {
      alert("Preencha o nome da modelo antes de fazer upload");
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, formData.name, "img");
      setFormData((prev) => ({ ...prev, avatar: url }));
    } catch (error) {
      alert("Erro ao fazer upload do avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Upload de cover
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !formData.name) {
      alert("Preencha o nome da modelo antes de fazer upload");
      return;
    }

    setUploadingCover(true);
    try {
      const url = await uploadImage(file, formData.name, "img");
      setFormData((prev) => ({ ...prev, cover: url }));
    } catch (error) {
      alert("Erro ao fazer upload da capa");
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload de fotos
  const handlePhotosUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !formData.name) {
      alert("Preencha o nome da modelo antes de fazer upload");
      return;
    }

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map((file) =>
        uploadImage(file, formData.name, "img")
      );
      const urls = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...urls],
      }));
    } catch (error) {
      alert("Erro ao fazer upload das fotos");
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Remove foto
  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Upload de vídeo
  const handleVideoUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file || !formData.name) {
      alert("Preencha o nome da modelo antes de fazer upload");
      return;
    }

    setUploadingVideo(true);
    try {
      const url = await uploadVideo(file, formData.name);
      const newVideos = [...formData.videos];
      newVideos[index] = {
        ...newVideos[index],
        videoUrl: url,
      };
      setFormData((prev) => ({ ...prev, videos: newVideos }));
    } catch (error) {
      alert("Erro ao fazer upload do vídeo");
    } finally {
      setUploadingVideo(false);
    }
  };

  // Upload de thumbnail do vídeo
  const handleThumbnailUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file || !formData.name) {
      alert("Preencha o nome da modelo antes de fazer upload");
      return;
    }

    try {
      const url = await uploadVideoThumbnail(file, formData.name);
      const newVideos = [...formData.videos];
      newVideos[index] = {
        ...newVideos[index],
        thumbnail: url,
      };
      setFormData((prev) => ({ ...prev, videos: newVideos }));
    } catch (error) {
      alert("Erro ao fazer upload da thumbnail");
    }
  };

  // Adiciona novo vídeo
  const handleAddVideo = () => {
    setFormData((prev) => ({
      ...prev,
      videos: [
        ...prev.videos,
        { thumbnail: "", duration: "", videoUrl: "" },
      ],
    }));
  };

  // Remove vídeo
  const handleRemoveVideo = (index) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  // Atualiza campo de vídeo
  const handleVideoFieldChange = (index, field, value) => {
    const newVideos = [...formData.videos];
    newVideos[index] = {
      ...newVideos[index],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, videos: newVideos }));
  };

  // ==================== VIDEOS CHAT ====================

  // Adiciona novo vídeo do chat
  const handleAddVideoChat = () => {
    setFormData((prev) => ({
      ...prev,
      videosChat: [
        ...prev.videosChat,
        { id: `video_${Date.now()}`, label: "", videoUrl: "" },
      ],
    }));
  };

  // Remove vídeo do chat
  const handleRemoveVideoChat = (index) => {
    setFormData((prev) => ({
      ...prev,
      videosChat: prev.videosChat.filter((_, i) => i !== index),
    }));
  };

  // Atualiza campo de vídeo do chat
  const handleVideoChatFieldChange = (index, field, value) => {
    const newVideosChat = [...formData.videosChat];
    newVideosChat[index] = {
      ...newVideosChat[index],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, videosChat: newVideosChat }));
  };

  // Upload de vídeo do chat
  const handleVideoChatUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file || !formData.name) {
      alert("Preencha o nome da modelo antes de fazer upload");
      return;
    }

    setUploadingVideoChat(true);
    try {
      const url = await uploadVideoChatFile(file, formData.name);
      const newVideosChat = [...formData.videosChat];
      newVideosChat[index] = {
        ...newVideosChat[index],
        videoUrl: url,
      };
      setFormData((prev) => ({ ...prev, videosChat: newVideosChat }));
    } catch (error) {
      alert("Erro ao fazer upload do vídeo do chat");
    } finally {
      setUploadingVideoChat(false);
    }
  };

  // ==================== VIDEOS DIGITANDO ====================

  // Adiciona novo vídeo digitando
  const handleAddVideoDigitando = () => {
    setFormData((prev) => ({
      ...prev,
      videosDigitando: [
        ...prev.videosDigitando,
        { id: `digitando_${Date.now()}`, videoUrl: "" },
      ],
    }));
  };

  // Remove vídeo digitando
  const handleRemoveVideoDigitando = (index) => {
    setFormData((prev) => ({
      ...prev,
      videosDigitando: prev.videosDigitando.filter((_, i) => i !== index),
    }));
  };

  // Upload de vídeo digitando
  const handleVideoDigitandoUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file || !formData.name) {
      alert("Preencha o nome da modelo antes de fazer upload");
      return;
    }

    setUploadingVideoDigitando(true);
    try {
      const url = await uploadVideoDigitandoFile(file, formData.name);
      const newVideosDigitando = [...formData.videosDigitando];
      newVideosDigitando[index] = {
        ...newVideosDigitando[index],
        videoUrl: url,
      };
      setFormData((prev) => ({ ...prev, videosDigitando: newVideosDigitando }));
    } catch (error) {
      alert("Erro ao fazer upload do vídeo digitando");
    } finally {
      setUploadingVideoDigitando(false);
    }
  };

  // Salva modelo
  const handleSave = async () => {
    if (!formData.name || !formData.username) {
      alert("Nome e username são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      if (editingModel) {
        await updateModel(editingModel.id, formData);
      } else {
        await createModel(formData);
      }
      await loadModels();
      setShowModal(false);
    } catch (error) {
      alert("Erro ao salvar modelo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Admin OnlyNex</h1>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{models.length}</p>
                <p className="text-xs text-slate-400">Modelos</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {models.filter((m) => m.isOnline).length}
                </p>
                <p className="text-xs text-slate-400">Online</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {models.reduce((acc, m) => acc + (m.photos?.length || 0), 0)}
                </p>
                <p className="text-xs text-slate-400">Fotos</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {models.reduce((acc, m) => acc + (m.videos?.length || 0), 0)}
                </p>
                <p className="text-xs text-slate-400">Vídeos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header com botão */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Gerenciar Modelos</h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Modelo</span>
          </button>
        </div>

        {/* Lista de modelos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-sky-500/50 transition-colors"
            >
              {/* Cover */}
              <div className="relative h-24 overflow-hidden">
                <img
                  src={model.cover || "https://via.placeholder.com/400x100"}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />
              </div>

              {/* Info */}
              <div className="p-4 -mt-8 relative">
                <div className="flex items-end gap-3 mb-3">
                  <img
                    src={model.avatar || "https://via.placeholder.com/80"}
                    alt={model.name}
                    className="w-16 h-16 rounded-full border-4 border-slate-800 object-cover"
                  />
                  <div className="flex-1 pb-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {model.name}
                      {model.isVerified && (
                        <CheckCircle className="w-4 h-4 text-sky-500" />
                      )}
                    </h3>
                    <p className="text-sm text-slate-400">{model.username}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {model.subscribers || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    {model.photos?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {model.videos?.length || 0}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      model.isOnline ? "text-green-500" : "text-slate-500"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        model.isOnline ? "bg-green-500" : "bg-slate-500"
                      }`}
                    />
                    {model.isOnline ? "Online" : "Offline"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(model)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(model)}
                    className="flex items-center justify-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {models.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhuma modelo cadastrada</p>
              <button
                onClick={handleCreate}
                className="mt-4 text-sky-500 hover:text-sky-400 transition-colors"
              >
                Criar primeira modelo
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-start justify-center overflow-y-auto p-4">
          <div className="relative w-full max-w-3xl bg-slate-800 rounded-2xl border border-slate-700 my-8">
            {/* Header do modal */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {editingModel ? "Editar Modelo" : "Nova Modelo"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Informações básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-500" />
                  Informações Básicas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Nome da modelo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="@username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    placeholder="Descrição da modelo"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Assinantes
                    </label>
                    <input
                      type="number"
                      value={formData.subscribers}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          subscribers: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Posts
                    </label>
                    <input
                      type="number"
                      value={formData.posts}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          posts: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Heart className="w-4 h-4 inline mr-1" />
                      Curtidas
                    </label>
                    <input
                      type="number"
                      value={formData.likes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          likes: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isOnline}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isOnline: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                    />
                    <span className="text-slate-300">Online</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isVerified: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                    />
                    <span className="text-slate-300">Verificada</span>
                  </label>
                </div>
              </div>

              {/* Avatar e Cover */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-sky-500" />
                  Avatar e Capa
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Avatar
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full object-cover border-2 border-slate-600"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                          <Image className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      <label className="flex-1">
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl cursor-pointer transition-colors">
                          {uploadingAvatar ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          <span>Upload Avatar</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Cover */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Capa
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.cover ? (
                        <img
                          src={formData.cover}
                          alt="Cover"
                          className="w-20 h-20 rounded-lg object-cover border-2 border-slate-600"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                          <Image className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      <label className="flex-1">
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl cursor-pointer transition-colors">
                          {uploadingCover ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          <span>Upload Capa</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fotos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Image className="w-5 h-5 text-sky-500" />
                    Fotos ({formData.photos.length})
                  </h3>
                  <label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors text-sm">
                      {uploadingPhotos ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>Adicionar Fotos</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={photo}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vídeos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-sky-500" />
                    Vídeos ({formData.videos.length})
                  </h3>
                  <button
                    onClick={handleAddVideo}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Vídeo</span>
                  </button>
                </div>

                {formData.videos.map((video, index) => (
                  <div
                    key={index}
                    className="bg-slate-700/50 rounded-xl p-4 space-y-4 border border-slate-600"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">
                        Vídeo {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveVideo(index)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Thumbnail */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Thumbnail
                        </label>
                        <div className="flex items-center gap-3">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="w-24 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-24 h-16 bg-slate-600 rounded-lg flex items-center justify-center">
                              <Image className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <label className="flex-1">
                            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors text-sm">
                              <Upload className="w-4 h-4" />
                              <span>Upload</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleThumbnailUpload(e, index)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Duração */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Duração
                        </label>
                        <input
                          type="text"
                          value={video.duration}
                          onChange={(e) =>
                            handleVideoFieldChange(index, "duration", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Ex: 2:34"
                        />
                      </div>
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <LinkIcon className="w-4 h-4 inline mr-1" />
                        URL do Vídeo (YouTube ou Upload)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={video.videoUrl}
                          onChange={(e) =>
                            handleVideoFieldChange(index, "videoUrl", e.target.value)
                          }
                          className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="https://youtube.com/watch?v=... ou upload"
                        />
                        <label>
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors">
                            {uploadingVideo ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoUpload(e, index)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vídeos Digitando (Espera) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-500" />
                    Vídeos Digitando ({formData.videosDigitando?.length || 0})
                  </h3>
                  <button
                    onClick={handleAddVideoDigitando}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Vídeo</span>
                  </button>
                </div>

                <p className="text-sm text-slate-400">
                  Vídeos de espera que ficam rodando em loop. Quando um vídeo do chat termina, volta automaticamente para um desses (aleatório).
                </p>

                {(formData.videosDigitando || []).map((videoDigitando, index) => (
                  <div
                    key={index}
                    className="bg-purple-900/20 rounded-xl p-4 space-y-4 border border-purple-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Play className="w-4 h-4 text-purple-400" />
                        Vídeo Digitando {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveVideoDigitando(index)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Video className="w-4 h-4 inline mr-1" />
                        Arquivo de Vídeo *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={videoDigitando.videoUrl}
                          className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          placeholder="URL do vídeo (faça upload ao lado)"
                          readOnly
                        />
                        <label>
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer transition-colors">
                            {uploadingVideoDigitando ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span className="text-sm">Upload</span>
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoDigitandoUpload(e, index)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {videoDigitando.videoUrl && (
                        <p className="text-xs text-purple-400 mt-1">✓ Vídeo carregado com sucesso</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vídeos do Chat (Botões) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                    Vídeos do Chat - Botões ({formData.videosChat?.length || 0})
                  </h3>
                  <button
                    onClick={handleAddVideoChat}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Vídeo Chat</span>
                  </button>
                </div>

                <p className="text-sm text-slate-400">
                  Esses vídeos aparecem como botões. Ao clicar, o vídeo toca UMA vez e depois volta para um vídeo "digitando".
                </p>

                {(formData.videosChat || []).map((videoChat, index) => (
                  <div
                    key={index}
                    className="bg-green-900/20 rounded-xl p-4 space-y-4 border border-green-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Play className="w-4 h-4 text-green-400" />
                        Vídeo Chat {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveVideoChat(index)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ID do vídeo */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          ID do Vídeo *
                        </label>
                        <input
                          type="text"
                          value={videoChat.id}
                          onChange={(e) =>
                            handleVideoChatFieldChange(index, "id", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ex: intro, apresentacao, promo1"
                        />
                      </div>

                      {/* Label do botão */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Label do Botão *
                        </label>
                        <input
                          type="text"
                          value={videoChat.label}
                          onChange={(e) =>
                            handleVideoChatFieldChange(index, "label", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ex: Me Conheça, Promoção, Exclusivo"
                        />
                      </div>
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Video className="w-4 h-4 inline mr-1" />
                        Arquivo de Vídeo *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={videoChat.videoUrl}
                          onChange={(e) =>
                            handleVideoChatFieldChange(index, "videoUrl", e.target.value)
                          }
                          className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="URL do vídeo (faça upload ao lado)"
                          readOnly
                        />
                        <label>
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg cursor-pointer transition-colors">
                            {uploadingVideoChat ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span className="text-sm">Upload</span>
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoChatUpload(e, index)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {videoChat.videoUrl && (
                        <p className="text-xs text-green-400 mt-1">✓ Vídeo carregado com sucesso</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer do modal */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-800 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{editingModel ? "Salvar Alterações" : "Criar Modelo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

