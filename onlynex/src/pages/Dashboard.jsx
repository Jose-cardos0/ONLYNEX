import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import {
  Search,
  Crown,
  Heart,
  Image,
  LogOut,
  Verified,
  TrendingUp,
  Flame,
  Grid3X3,
  Loader2,
} from "lucide-react";
import { getAllModels } from "../services/modelsService";
import logo from "../assets/logo.png";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verifica autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Usa a parte antes do @ como nome de exibição
        const displayName =
          currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Usuário";
        setUsername(displayName);
        loadModels();
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadModels = async () => {
    try {
      const data = await getAllModels();
      setModels(data);
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("onlynex_user");
      localStorage.removeItem("onlynex_user_email");
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.username?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === "online") {
      return matchesSearch && model.isOnline;
    }
    if (activeFilter === "verified") {
      return matchesSearch && model.isVerified;
    }
    return matchesSearch;
  });

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src={logo} alt="ONLYNEX" className="h-8 sm:h-10 w-auto" />
              <span className="text-xl sm:text-2xl font-bold gradient-text hidden sm:block">
                ONLYNEX
              </span>
            </Link>

            {/* Search - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar modelos..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-100/80 border-0 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 transition-all"
                />
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-full">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-slate-700 font-medium">{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 sm:p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search - Mobile */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar modelos..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100/80 border-0 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Olá, {username}! 👋
          </h1>
          <p className="text-slate-500">
            Descubra modelos incríveis e conteúdo exclusivo
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all", label: "Todos", icon: Grid3X3 },
            { id: "online", label: "Online", icon: Flame },
            { id: "verified", label: "Verificados", icon: Verified },
            { id: "trending", label: "Em alta", icon: TrendingUp },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/25"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <filter.icon className="w-4 h-4" />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
          </div>
        )}

        {/* Models Grid */}
        {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {filteredModels.map((model) => (
            <Link
              key={model.id}
              to={`/model/${model.id}`}
              className="group bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl hover:shadow-sky-100/50 border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              {/* Cover Image */}
              <div className="relative h-28 sm:h-32 overflow-hidden">
                <img
                  src={model.cover}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Online Badge */}
                {model.isOnline && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-green-500 rounded-full shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-xs font-medium">
                      Online
                    </span>
                  </div>
                )}

                {/* Price Badge */}
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full">
                  <span className="text-sky-600 font-bold text-sm">
                    R$ {(model.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Avatar + Info */}
              <div className="relative px-4 sm:px-5 pb-4 sm:pb-5 pt-10 sm:pt-12">
                {/* Avatar */}
                <div className="absolute -top-8 sm:-top-10 left-4 sm:left-5">
                  <div className="relative">
                    <img
                      src={model.avatar}
                      alt={model.name}
                      className="w-16 sm:w-20 h-16 sm:h-20 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                    {model.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Verified className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name and Username */}
                <div className="mb-3">
                  <h3 className="font-bold text-slate-900 text-lg">
                    {model.name}
                  </h3>
                  <p className="text-sky-500 text-sm">{model.username}</p>
                </div>

                {/* Bio */}
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {model.bio}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">
                      {formatNumber(model.subscribers || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Image className="w-4 h-4 text-sky-500" />
                    <span className="font-medium">{model.posts || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="font-medium">
                      {formatNumber(model.likes || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        )}

        {/* Empty State */}
        {filteredModels.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Nenhum modelo encontrado
            </h3>
            <p className="text-slate-500">
              Tente buscar por outro termo ou filtro
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 sm:hidden z-50">
        <div className="flex items-center justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-sky-500">
            <Grid3X3 className="w-6 h-6" />
            <span className="text-xs font-medium">Explorar</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <Heart className="w-6 h-6" />
            <span className="text-xs">Favoritos</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <Crown className="w-6 h-6" />
            <span className="text-xs">Assinaturas</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

