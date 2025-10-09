// src/components/Auth.jsx
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { AlertCircle, Chrome, Lock, Mail } from "lucide-react";
import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "Email ya registrado"
          : err.code === "auth/invalid-email"
          ? "Email inválido"
          : err.code === "auth/user-not-found"
          ? "Usuario no encontrado"
          : err.code === "auth/wrong-password"
          ? "Contraseña incorrecta"
          : err.code === "auth/weak-password"
          ? "Contraseña muy débil (mínimo 6 caracteres)"
          : "Error al autenticar. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === "auth/unauthorized-domain") {
        const host = window?.location?.hostname;
        console.error("Google popup sign-in error", err);
        setError(
          `Dominio no autorizado${
            host ? ` (${host})` : ""
          }. Añádelo en Firebase Authentication → Configuración → Dominios autorizados.`
        );
        return;
      }

      if (err.code === "auth/operation-not-supported-in-this-environment") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error("Google redirect sign-in error", redirectError);
          setError("Google no está disponible en este entorno. Inténtalo más tarde.");
        }
      } else {
        console.error("Google popup sign-in error", err);
        setError("Error al iniciar sesión con Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Introduce tu email para recuperar la contraseña");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError("Error al enviar email de recuperación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/90 border border-white/60 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Clarity
          </h1>
          <p className="text-purple-600">Gestiona tus gastos con claridad</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError("");
              setResetSent(false);
            }}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              isLogin
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "bg-white/60 text-purple-600 hover:bg-white/80"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError("");
              setResetSent(false);
            }}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              !isLogin
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "bg-white/60 text-purple-600 hover:bg-white/80"
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Error/Success Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {resetSent && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-green-600">
              ✓ Email de recuperación enviado. Revisa tu bandeja de entrada.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-900 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-900 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {isLogin && (
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg transition-all"
          >
            {loading
              ? "Cargando..."
              : isLogin
              ? "Iniciar Sesión"
              : "Registrarse"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-purple-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white/90 text-purple-600">
              o continúa con
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-50 border border-purple-200 text-purple-900 font-medium py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Chrome className="w-5 h-5" />
          Google
        </button>

        {/* Terms */}
        <p className="text-xs text-purple-500 text-center mt-6">
          Al continuar, aceptas nuestros Términos de Servicio y Política de
          Privacidad
        </p>
      </div>
    </div>
  );
};

export default Auth;
