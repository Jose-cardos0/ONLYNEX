import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../config/firebase";
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
} from "lucide-react";
import logo from "../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      if (isRegister) {
        // Criar nova conta
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        // Fazer login
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      // Salva o email do usuário no localStorage para fácil acesso
      localStorage.setItem("onlynex_user", email.trim());
      localStorage.setItem("onlynex_user_email", email.trim());

      // Navega para o dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro de autenticação:", err);

      // Mensagens de erro amigáveis
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Este email já está cadastrado. Faça login.");
          setIsRegister(false);
          break;
        case "auth/invalid-email":
          setError("Email inválido.");
          break;
        case "auth/weak-password":
          setError("Senha muito fraca. Use pelo menos 6 caracteres.");
          break;
        case "auth/user-not-found":
          setError("Usuário não encontrado. Crie uma conta.");
          setIsRegister(true);
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Email ou senha incorretos.");
          break;
        case "auth/too-many-requests":
          setError("Muitas tentativas. Tente novamente mais tarde.");
          break;
        default:
          setError("Erro ao autenticar. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex flex-col">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card de login */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-sky-100/50 border border-white/50 p-8 sm:p-10 fade-in">
            {/* Logo e título */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-6">
                <img
                  src={logo}
                  alt="ONLYNEX"
                  className="h-16 sm:h-20 w-auto float"
                />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
                ONLYNEX
              </h1>
              <p className="text-slate-500 text-sm sm:text-base">
                {isRegister ? "Crie sua conta" : "Acesse conteúdo exclusivo"}
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-sky-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all duration-300"
                    autoFocus
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-sky-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Botão de submit */}
              <button
                type="submit"
                disabled={!email.trim() || !password.trim() || isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold rounded-2xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegister ? (
                      <UserPlus className="w-5 h-5" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    <span>{isRegister ? "Criar Conta" : "Entrar"}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Toggle Login/Registro */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                  }}
                  className="text-sm text-sky-500 hover:text-sky-600 transition-colors"
                >
                  {isRegister
                    ? "Já tem conta? Faça login"
                    : "Não tem conta? Cadastre-se"}
                </button>
              </div>
            </form>

            {/* Decoração inferior */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Conteúdo premium exclusivo</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-400 mt-6">
            +18 anos • Conteúdo adulto
          </p>

          {/* Link Admin - discreto */}
          <Link
            to="/admin"
            className="fixed bottom-4 right-4 flex items-center gap-1 p-2 text-slate-300 hover:text-sky-500 transition-colors opacity-50 hover:opacity-100 text-sm"
            title="Painel Admin"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
