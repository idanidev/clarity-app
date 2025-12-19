// src/screens/Auth/Auth.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "./LoginForm.tsx";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import AnimatedLogo from "./components/AnimatedLogo";
import SocialLoginButtons from "./components/SocialLoginButtons";
import { Sparkles } from "@/components/icons";

const Auth = () => {
  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'forgot'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-400/30 dark:bg-pink-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-3xl"
        />
      </div>

      {/* Grid pattern de fondo */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      {/* Card principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Header con logo */}
          <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 p-8 pb-20">
            <div className="flex items-center justify-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-bold text-white text-center mb-1">
              Clarity
            </h1>
            <p className="text-white/90 text-center text-sm">
              Tu control financiero personal
            </p>
          </div>

          {/* Tabs flotantes */}
          <div className="relative -mt-12 mx-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${mode === "login"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${mode === "register"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                Crear cuenta
              </button>
            </div>
          </div>

          {/* Formularios */}
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {mode === "login" && (
                <LoginForm
                  key="login"
                  onForgotPassword={() => setMode("forgot")}
                />
              )}
              {mode === "register" && <RegisterForm key="register" />}
              {mode === "forgot" && (
                <ForgotPasswordForm
                  key="forgot"
                  onBack={() => setMode("login")}
                />
              )}
            </AnimatePresence>

            {/* Social login */}
            {mode !== "forgot" && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      o continúa con
                    </span>
                  </div>
                </div>
                <SocialLoginButtons />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 dark:text-gray-400 text-xs mt-6 px-4">
          Al continuar, aceptas nuestros{" "}
          <button className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            Términos de Servicio
          </button>{" "}
          y{" "}
          <button className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            Política de Privacidad
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;








