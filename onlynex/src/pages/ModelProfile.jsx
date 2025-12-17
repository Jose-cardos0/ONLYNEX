import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";
import { getModelById } from "../data/models";

export default function ModelProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [activeTab, setActiveTab] = useState("photos");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("onlynex_user");
    if (!storedUser) {
      navigate("/");
      return;
    }

    const modelData = getModelById(id);
    if (!modelData) {
      navigate("/dashboard");
      return;
    }
    setModel(modelData);
  }, [id, navigate]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num;
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
                <Heart
                  className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                />
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
                  <span>Assinar R$ {model.price.toFixed(2)}/mês</span>
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
              { id: "photos", label: "Fotos", icon: Image, count: model.photos.length },
              { id: "videos", label: "Vídeos", icon: Play, count: model.videos.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? "text-sky-500"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-cyan-500" />
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
            {model.photos.map((photo, index) => (
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
            {model.videos.map((video, index) => (
              <div
                key={index}
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
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
            onClick={() => setSelectedMedia(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedMedia.src}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

