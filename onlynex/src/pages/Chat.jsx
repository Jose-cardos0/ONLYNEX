import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
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
  Trophy,
  Download,
  Check,
  Image,
} from "lucide-react";
import { getModelById } from "../services/modelsService";
import { sendMessageToAI } from "../services/chatService";
import {
  saveCardToCollection,
  isCardInCollection,
} from "../services/collectionService";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [user, setUser] = useState(null); // Usuário autenticado do Firebase
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
  const cardTimerRef = useRef(null);
  const chatStartTimeRef = useRef(null);
  const [savedCards, setSavedCards] = useState({}); // { cardId: true/false }
  const [savingCard, setSavingCard] = useState(null); // cardId sendo salvo

  // Obtém um vídeo digitando aleatório
  const getRandomDigitandoVideo = (modelData) => {
    const videos = modelData?.videosDigitando || [];
    if (videos.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * videos.length);
    return videos[randomIndex].videoUrl;
  };

  // Mensagens para cards de FOTO (50 variações)
  const photoCardMessages = [
    "Tirei essa foto pensando em você... 📸🔥 Salva na sua coleção!",
    "Olha o que eu tenho pra você... 😏💋 Gostou? Salva!",
    "Essa é só pra você, amor... 🥵📸 Guarda bem!",
    "Tava me sentindo sexy e pensei em você... 💕🔥",
    "Quer ver mais? Salva essa primeiro... 😈📸",
    "Exclusivo pra quem eu gosto... 💋✨ Salva!",
    "Olha como eu tô gata hoje... 🔥😏 Pra você!",
    "Surpresa especial só pra você, bb... 💖📸",
    "Me conta o que achou... 😘🔥 Salva aí!",
    "Tava com saudade de te mandar algo assim... 💋😏",
    "Gostou do ângulo? 📸😈 Tem mais de onde veio...",
    "Só você tá vendo isso, viu? 🤫🔥 Exclusivo!",
    "Preparado pra isso? 😏💕 Salva na coleção!",
    "Achei que você ia gostar... 🥵📸 Acertei?",
    "Meu presentinho pra você... 🎁💋 Guarda!",
    "Olha o que você me faz fazer... 😈🔥",
    "Tô me sentindo ousada hoje... 💋📸 Gostou?",
    "Essa foto tá quente demais... 🔥🥵 Salva!",
    "Só pra te provocar um pouquinho... 😏💕",
    "Adivinha quem tá pensando em você? 💋🔥",
    "Queria que você tivesse aqui... 😘📸",
    "Me diz se você gostou... 🥵💋 Quero saber!",
    "Tô caprichando só pra você... 📸✨",
    "Essa merece um lugar especial na sua coleção... 💖🔥",
    "Aposto que você não esperava por essa... 😈📸",
    "Tô carente, olha pra mim... 💋😏",
    "Só você consegue me deixar assim... 🔥💕",
    "Guarda com carinho, tá? 📸💋",
    "Quer mais? Me diz... 😏🥵",
    "Isso é só uma prévia... 🔥📸 Salva!",
    "Tô me sentindo irresistível hoje... 💋✨",
    "Você merece essa exclusividade... 😈💕",
    "Olha o que eu fiz pra você... 📸🔥",
    "Me senti inspirada... 💋😏 Gostou?",
    "Essa foto tá diferente, né? 🥵📸",
    "Só pros meus favoritos... 💕🔥 Salva!",
    "Te provoquei? Era a intenção... 😈💋",
    "Minha coleção pessoal pra você... 📸✨",
    "Imagina se a gente tivesse junto agora... 🔥😏",
    "Tô louca pra saber sua reação... 💋🥵",
    "Guardei essa especialmente pra você... 📸💕",
    "Não mostra pra ninguém, é só nosso... 🤫🔥",
    "Tô me sentindo perigosa hoje... 😈💋",
    "Olha nos meus olhos... ou não... 📸😏",
    "Isso é só entre a gente... 💕🔥",
    "Me senti ousada, aproveita... 🥵📸",
    "Você me inspira a fazer essas coisas... 💋😈",
    "Exclusividade total pra você... 🔥✨",
    "Tô mandando antes que eu me arrependa... 📸💕",
    "Essa é daquelas que você vai querer guardar... 😏🔥",
  ];

  // Mensagens para cards de VÍDEO (20 variações)
  const videoCardMessages = [
    "Gravei esse vídeo só pra você... 🎬🔥 Assiste e salva!",
    "Olha o que eu fiz quando tava sozinha... 😏🎥 Exclusivo!",
    "Esse vídeo tá quente demais... 🥵🎬 Salva na coleção!",
    "Tava pensando em você quando gravei isso... 💋🎥",
    "Preparado pra esse vídeo? 😈🎬 Não mostra pra ninguém!",
    "Gravei umas coisinhas... 🔥🎥 Acho que você vai gostar...",
    "Esse vídeo é bem especial... 💕🎬 Só pra você!",
    "Olha como eu fico quando penso em você... 🥵🎥",
    "Vídeo exclusivo chegando... 😏🎬 Assiste até o final!",
    "Não resisti e gravei isso... 💋🔥 Salva!",
    "Tô me sentindo ousada... olha esse vídeo... 🎥😈",
    "Isso é só entre a gente, tá? 🤫🎬 Guarda bem!",
    "Fiz esse vídeo especial pra você... 💕🥵",
    "Assiste com fone de ouvido... 😏🎥 Vai entender...",
    "Gravei pensando em você o tempo todo... 🔥🎬",
    "Esse vídeo vai te deixar querendo mais... 💋🎥",
    "Meu vídeo mais ousado... só pra você... 😈🔥",
    "Não consegui me segurar... olha isso... 🎬🥵",
    "Vídeo novo quentinho pra você... 💕🎥 Salva!",
    "Se você gostou das fotos, espera ver isso... 🔥😏🎬",
  ];

  // Obtém mensagem aleatória baseada no tipo do card
  const getRandomCardMessage = (cardType) => {
    const messages =
      cardType === "video" ? videoCardMessages : photoCardMessages;
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  };

  // Obtém um card aleatório
  const getRandomCard = (modelData) => {
    const cards = modelData?.cards || [];
    if (cards.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  };

  // Envia um card aleatório no chat
  const sendRandomCard = (modelData) => {
    const card = getRandomCard(modelData);
    if (!card) return;

    const cardMessage = {
      id: Date.now(),
      sender: "model",
      type: "card", // Tipo especial para cards
      card: card,
      text: getRandomCardMessage(card.type),
      time: new Date(),
    };

    setMessages((prev) => [...prev, cardMessage]);
  };

  // Salva card na coleção do usuário
  const handleSaveCard = async (cardId) => {
    if (!user?.email || !model?.id) return;

    setSavingCard(cardId);
    try {
      const result = await saveCardToCollection(user.email, model.id, cardId);
      if (result.success) {
        setSavedCards((prev) => ({ ...prev, [cardId]: true }));
      }
    } catch (error) {
      console.error("Erro ao salvar card:", error);
    } finally {
      setSavingCard(null);
    }
  };

  // Verifica autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Usa a parte antes do @ como nome de exibição, ou o displayName se disponível
        const displayName =
          currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Usuário";
        setUsername(displayName);
      } else {
        // Se não estiver autenticado, redireciona para login
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return; // Aguarda autenticação

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
            text: `Oi ${username}! 💕 Que bom te ver por aqui! Como posso te ajudar hoje?`,
            time: new Date(),
          },
        ]);
      }, 1000);

      // Marca o início do chat e configura timer para cards
      chatStartTimeRef.current = Date.now();

      // Timer para enviar card a cada 5 minutos (300000ms)
      // Só começa após 5 minutos do chat aberto
      if (modelData.cards && modelData.cards.length > 0) {
        cardTimerRef.current = setInterval(() => {
          const timeInChat = Date.now() - chatStartTimeRef.current;
          // Só envia se passou pelo menos 5 minutos desde o início
          if (timeInChat >= 300000) {
            sendRandomCard(modelData);
          }
        }, 300000); // 5 minutos = 300000ms
      }
    };

    loadModel();

    // Cleanup: limpa o timer quando o chat fecha
    return () => {
      if (cardTimerRef.current) {
        clearInterval(cardTimerRef.current);
        cardTimerRef.current = null;
      }
    };
  }, [id, navigate, user, username]);

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

    // Mostra que a modelo está digitando
    setIsTyping(true);

    try {
      // Chama o serviço de IA (webhook n8n ou fallback local)
      const response = await sendMessageToAI({
        modelId: model.id,
        modelName: model.name,
        message: userMessage.text,
        userId: user?.email, // Email do Firebase Auth (identificador único)
        userName: username,
        history: messages.map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      });

      const modelMessage = {
        id: Date.now() + 1,
        sender: "model",
        text: response,
        time: new Date(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setIsTyping(false);

      // Mensagem de erro amigável
      const errorMessage = {
        id: Date.now() + 1,
        sender: "model",
        text: "Ops, tive um probleminha aqui! 😅 Tenta de novo, amor? 💕",
        time: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

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
                  {/* Mensagem com Card */}
                  {msg.type === "card" && msg.card ? (
                    <div className="bg-white rounded-2xl rounded-bl-md shadow-sm border border-slate-100 overflow-hidden">
                      {/* Preview do Card */}
                      <div className="relative">
                        {msg.card.type === "video" ? (
                          <video
                            src={msg.card.url}
                            className="w-full max-w-xs aspect-[3/4] object-cover"
                            controls
                            playsInline
                          />
                        ) : (
                          <img
                            src={msg.card.url}
                            alt=""
                            className="w-full max-w-xs aspect-[3/4] object-cover"
                          />
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center gap-1 text-white text-xs font-medium">
                          <Trophy className="w-3 h-3" />
                          Exclusivo
                        </div>
                      </div>
                      {/* Texto e botão de salvar */}
                      <div className="p-3 space-y-2">
                        <p className="text-sm text-slate-800">{msg.text}</p>
                        <button
                          onClick={() => handleSaveCard(msg.card.id)}
                          disabled={
                            savedCards[msg.card.id] ||
                            savingCard === msg.card.id
                          }
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                            savedCards[msg.card.id]
                              ? "bg-green-100 text-green-600 cursor-default"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
                          }`}
                        >
                          {savingCard === msg.card.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Salvando...
                            </>
                          ) : savedCards[msg.card.id] ? (
                            <>
                              <Check className="w-4 h-4" />
                              Salvo na Coleção
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Salvar na Coleção
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Mensagem de texto normal */
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-br-md"
                          : "bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100"
                      }`}
                    >
                      <p className="text-sm sm:text-base">{msg.text}</p>
                    </div>
                  )}
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
            {[
              "Oi! 👋",
              "Você é linda! 😍",
              "Bom dia! ☀️",
              "Me conta mais...",
            ].map((quick, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setMessage(quick)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-full whitespace-nowrap transition-all"
              >
                {quick}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
