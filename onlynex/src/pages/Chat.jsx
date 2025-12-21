import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Verified,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  Heart,
  Gift,
  Smile,
  Play,
} from "lucide-react";
import { getModelById } from "../services/modelsService";
import { getResponse } from "../data/chatResponses";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [isDigitandoMode, setIsDigitandoMode] = useState(true); // true = vídeo digitando (loop), false = vídeo específico
  const [activeButtonId, setActiveButtonId] = useState(null); // ID do botão ativo (para highlight)
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  // Obtém um vídeo digitando aleatório
  const getRandomDigitandoVideo = (modelData) => {
    const videos = modelData?.videosDigitando || [];
    if (videos.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * videos.length);
    return videos[randomIndex].videoUrl;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("onlynex_user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    setUsername(storedUser);

    const loadModel = async () => {
      const modelData = await getModelById(id);
      if (!modelData) {
        navigate("/dashboard");
        return;
      }
      setModel(modelData);

      // Inicia com um vídeo digitando aleatório
      const randomVideo = getRandomDigitandoVideo(modelData);
      if (randomVideo) {
        setCurrentVideoUrl(randomVideo);
        setIsDigitandoMode(true);
      }

      // Mensagem de boas-vindas
      setTimeout(() => {
        setMessages([
          {
            id: 1,
            sender: "model",
            text: `Oi ${storedUser}! 💕 Que bom te ver por aqui! Como posso te ajudar hoje?`,
            time: new Date(),
          },
        ]);
      }, 1000);
    };

    loadModel();
  }, [id, navigate]);

  // Quando um vídeo específico (botão) termina, volta para digitando
  const handleVideoEnded = () => {
    if (!isDigitandoMode && model) {
      // Vídeo do botão terminou, volta para digitando aleatório
      const randomVideo = getRandomDigitandoVideo(model);
      if (randomVideo) {
        setCurrentVideoUrl(randomVideo);
        setIsDigitandoMode(true);
        setActiveButtonId(null);
      }
    }
  };

  // Troca para um vídeo específico (botão clicado)
  const handleVideoButtonClick = (videoChat) => {
    setCurrentVideoUrl(videoChat.videoUrl);
    setIsDigitandoMode(false);
    setActiveButtonId(videoChat.id);
    
    // Reinicia o vídeo
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play();
      }
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message.trim(),
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    // Simula a modelo digitando
    setIsTyping(true);

    // Tempo de resposta variável para parecer mais natural
    const responseTime = 1000 + Math.random() * 2000;

    setTimeout(() => {
      const response = getResponse(userMessage.text);
      const modelMessage = {
        id: Date.now() + 1,
        sender: "model",
        text: response,
        time: new Date(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, modelMessage]);
    }, responseTime);

    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!model) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col lg:flex-row overflow-hidden">
      {/* Video Section */}
      <div className="relative flex-1 min-h-[40vh] lg:min-h-full bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/model/${model.id}`)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">
                  AO VIVO
                </span>
              </div>
            </div>
          </div>

          {/* Video Chat Buttons */}
          {model.videosChat && model.videosChat.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {model.videosChat.map((videoChat) => (
                <button
                  key={videoChat.id}
                  onClick={() => handleVideoButtonClick(videoChat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeButtonId === videoChat.id
                      ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <Play className="w-4 h-4" />
                  {videoChat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Video Player or Fallback Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          {currentVideoUrl ? (
            <>
              {/* Video Player */}
              <video
                ref={videoRef}
                src={currentVideoUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop={isDigitandoMode} // Loop apenas para vídeos digitando
                muted={isMuted}
                playsInline
                onEnded={handleVideoEnded}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
            </>
          ) : (
            <>
              {/* Fallback - Model Image */}
              <img
                src={model.avatar}
                alt={model.name}
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

              {/* Central image frame when no video */}
              <div className="absolute inset-8 sm:inset-12 lg:inset-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={model.photos?.[0] || model.avatar}
                  alt={model.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </>
          )}
        </div>

        {/* Model info overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={model.avatar}
                  alt={model.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/30 object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-lg">{model.name}</h2>
                  {model.isVerified && (
                    <Verified className="w-5 h-5 text-sky-400" />
                  )}
                </div>
                <p className="text-white/60 text-sm">{model.username}</p>
              </div>
            </div>

            {/* Video controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full transition-all ${
                  isMuted
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3 rounded-full transition-all ${
                  isVideoOff
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {isVideoOff ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>
              <button className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all">
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-full lg:w-[400px] xl:w-[450px] h-[60vh] lg:h-full flex flex-col bg-white">
        {/* Chat header */}
        <div className="px-4 py-3 sm:py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={model.avatar}
                  alt={model.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">
                    {model.name}
                  </span>
                  {model.isVerified && (
                    <Verified className="w-4 h-4 text-sky-500" />
                  )}
                </div>
                <span className="text-sm text-green-500">Online agora</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-all">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-amber-500 hover:bg-amber-50 rounded-full transition-all">
                <Gift className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] ${
                  msg.sender === "user"
                    ? "order-2"
                    : "order-1 flex items-end gap-2"
                }`}
              >
                {msg.sender === "model" && (
                  <img
                    src={model.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-br-md"
                        : "bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100"
                    }`}
                  >
                    <p className="text-sm sm:text-base">{msg.text}</p>
                  </div>
                  <p
                    className={`text-xs text-slate-400 mt-1 ${
                      msg.sender === "user" ? "text-right" : "text-left ml-2"
                    }`}
                  >
                    {formatTime(msg.time)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-end gap-2">
              <img
                src={model.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-slate-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-slate-100 bg-white"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="w-full px-4 py-3 bg-slate-100 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 transition-all text-sm sm:text-base"
              />
            </div>

            <button
              type="submit"
              disabled={!message.trim()}
              className="p-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-full shadow-lg shadow-sky-500/25 disabled:shadow-none transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Quick responses */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {["Oi! 👋", "Você é linda! 😍", "Bom dia! ☀️", "Me conta mais..."].map(
              (quick, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMessage(quick)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-full whitespace-nowrap transition-all"
                >
                  {quick}
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

