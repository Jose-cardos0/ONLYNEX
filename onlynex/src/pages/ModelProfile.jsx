import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import {
  ArrowLeft,
  Verified,
  Crown,
  Heart,
  Image,
  Play,
  MessageCircle,
  Share2,
  Lock,
  X,
  Trophy,
} from "lucide-react";
import { getModelById } from "../services/modelsService";
import { getUserCollection } from "../services/collectionService";

export default function ModelProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [activeTab, setActiveTab] = useState("photos");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState(null);
  const [userCollection, setUserCollection] = useState([]); // IDs dos cards salvos

  // Verifica autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }

      setUser(currentUser);

      const loadModel = async () => {
        const modelData = await getModelById(id);
        if (!modelData) {
          navigate("/dashboard");
          return;
        }
        setModel(modelData);

        // Carrega a coleção do usuário para esta modelo
        if (currentUser.email) {
          const savedCards = await getUserCollection(currentUser.email, id);
          setUserCollection(savedCards);
        }
      };

      loadModel();
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num;
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    // Extrai o ID do vídeo do YouTube
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return null;
  };

  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  if (!model) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2.5 rounded-full transition-all ${
                  isLiked
                    ? "bg-rose-100 text-rose-500"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              </button>
              <button className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <div className="relative">
        {/* Cover */}
        <div className="h-40 sm:h-52 lg:h-64 overflow-hidden">
          <img
            src={model.cover}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Avatar */}
          <div className="absolute -top-16 sm:-top-20 left-4 sm:left-6 lg:left-8">
            <div className="relative">
              <img
                src={model.avatar}
                alt={model.name}
                className="w-28 sm:w-36 h-28 sm:h-36 rounded-full border-4 border-white shadow-xl object-cover"
              />
              {model.isOnline && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-lg">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50" />
                </div>
              )}
              {model.isVerified && (
                <div className="absolute bottom-2 left-2 w-7 h-7 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <Verified className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Name and Actions */}
          <div className="pt-16 sm:pt-20 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                  {model.name}
                </h1>
                <p className="text-sky-500 font-medium">{model.username}</p>
                <p className="text-slate-500 mt-2 max-w-md">{model.bio}</p>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5" />
                  <span>Assinar R$ {(model.price || 0).toFixed(2)}/mês</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {formatNumber(model.subscribers)}
                </p>
                <p className="text-sm text-slate-500">Assinantes</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {model.posts}
                </p>
                <p className="text-sm text-slate-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {formatNumber(model.likes)}
                </p>
                <p className="text-sm text-slate-500">Curtidas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 sm:top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              {
                id: "photos",
                label: "Fotos",
                icon: Image,
                count: model.photos?.length || 0,
              },
              {
                id: "videos",
                label: "Vídeos",
                icon: Play,
                count: model.videos?.length || 0,
              },
              {
                id: "colecao",
                label: "Coleção",
                icon: Trophy,
                count: model.cards?.length || 0,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-4 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? tab.id === "colecao"
                      ? "text-amber-500"
                      : "text-sky-500"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    tab.id === "colecao"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-slate-100"
                  }`}
                >
                  {tab.id === "colecao"
                    ? `${userCollection.length}/${tab.count}`
                    : tab.count}
                </span>
                {activeTab === tab.id && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      tab.id === "colecao"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : "bg-gradient-to-r from-sky-500 to-cyan-500"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Photos Grid */}
        {activeTab === "photos" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {(model.photos || []).map((photo, index) => (
              <div
                key={index}
                onClick={() => setSelectedMedia({ type: "photo", src: photo })}
                className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={photo}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {index > 2 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                      <span className="text-white font-medium text-sm">
                        Assine para ver
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Videos Grid */}
        {activeTab === "videos" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(model.videos || []).map((video, index) => (
              <div
                key={index}
                onClick={() => {
                  if (index === 0 && video.videoUrl) {
                    setSelectedMedia({ type: "video", src: video.videoUrl });
                  }
                }}
                className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={video.thumbnail}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-sky-500 fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-white text-sm font-medium">
                  {video.duration}
                </div>
                {index > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                      <span className="text-white font-medium text-sm">
                        Assine para ver
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Coleção Grid */}
        {activeTab === "colecao" && (
          <div className="space-y-6">
            {/* Info da Coleção */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    Sua Coleção de {model.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {userCollection.length} de {model.cards?.length || 0} cards
                    coletados
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                💬 Converse no chat para receber cards exclusivos e complete sua
                coleção!
              </p>
            </div>

            {/* Grid de Cards */}
            {(model.cards || []).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {(model.cards || []).map((card, index) => {
                  const isOwned = userCollection.includes(card.id);

                  return (
                    <div
                      key={card.id || index}
                      onClick={() => {
                        if (isOwned) {
                          setSelectedMedia({
                            type: card.type === "video" ? "video" : "photo",
                            src: card.url,
                          });
                        }
                      }}
                      className={`relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden group ${
                        isOwned ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                    >
                      {/* Preview do Card */}
                      {card.type === "video" ? (
                        <video
                          src={card.url}
                          className={`w-full h-full object-cover ${
                            !isOwned
                              ? "blur-lg scale-110"
                              : "group-hover:scale-105"
                          } transition-transform duration-500`}
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={card.url}
                          alt=""
                          className={`w-full h-full object-cover ${
                            !isOwned
                              ? "blur-lg scale-110"
                              : "group-hover:scale-105"
                          } transition-transform duration-500`}
                        />
                      )}

                      {/* Overlay para cards desbloqueados */}
                      {isOwned && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {/* Badge de tipo */}
                          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center gap-1 text-white text-xs font-medium">
                            <Trophy className="w-3 h-3" />
                            {card.type === "video" ? (
                              <Play className="w-3 h-3" />
                            ) : (
                              <Image className="w-3 h-3" />
                            )}
                          </div>
                          {/* Ícone de play para vídeos */}
                          {card.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-5 h-5 text-amber-500 fill-current ml-0.5" />
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Overlay para cards bloqueados */}
                      {!isOwned && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="text-center p-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                              <Lock className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-white font-medium text-sm">
                              Card Bloqueado
                            </span>
                            <p className="text-white/70 text-xs mt-1">
                              Converse no chat!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-amber-200 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-medium">
                  Nenhum card disponível ainda
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {model.name} ainda não adicionou cards exclusivos
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Button - Fixed */}
      <Link
        to={`/chat/${model.id}`}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold rounded-full shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 transition-all hover:scale-105"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline">Iniciar Chat</span>
      </Link>

      {/* Media Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
            onClick={() => setSelectedMedia(null)}
          >
            <X className="w-8 h-8" />
          </button>
          {selectedMedia.type === "photo" ? (
            <img
              src={selectedMedia.src}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : selectedMedia.type === "video" ? (
            <div
              className="w-full max-w-5xl aspect-video rounded-lg overflow-hidden bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              {isYouTubeUrl(selectedMedia.src) ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedMedia.src)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                />
              ) : (
                <video
                  src={selectedMedia.src}
                  className="w-full h-full"
                  controls
                  autoPlay
                  playsInline
                >
                  Seu navegador não suporta reprodução de vídeo.
                </video>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
