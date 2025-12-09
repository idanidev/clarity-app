// src/App.tsx
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { auth } from "./firebase";
import { LanguageProvider, useTranslation } from "./contexts/LanguageContext";
import { saveUserLanguage } from "./services/firestoreService";
import { fadeIn, getTransition } from "./config/framerMotion";
import { isNative } from "./utils/platform";

// OPTIMIZACIÓN: Code splitting de rutas principales
const Auth = lazy(() => import("./screens/Auth/Auth"));
const Dashboard = lazy(() => import("./screens/Dashboard/Dashboard"));

const LoadingScreen = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <span className="text-purple-600 font-semibold text-lg">
        {t("common.loading")}
      </span>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const isMountedRef = useRef(true);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Configurar Capacitor (StatusBar y SplashScreen)
  useEffect(() => {
    if (isNative) {
      const configureCapacitor = async () => {
        try {
          // Configurar StatusBar
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#8B5CF6' });
          
          // Ocultar splash después de cargar
          setTimeout(async () => {
            try {
              await SplashScreen.hide();
            } catch (error) {
              console.warn('Error hiding splash screen:', error);
            }
          }, 2000);
        } catch (error) {
          console.warn('Error configuring Capacitor:', error);
        }
      };
      
      configureCapacitor();
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const initializeAuth = () => {
      // Limpiar timeout anterior si existe
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (unsubscribeRef.current) unsubscribeRef.current();

      // Timeout de seguridad para evitar pantalla en blanco infinita
      timeoutIdRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn("Auth initialization timeout, forcing completion");
          setInitializing(false);
        }
      }, 5000); // 5 segundos máximo

      unsubscribeRef.current = onAuthStateChanged(
        auth,
        (currentUser) => {
          console.log("🔐 App.tsx - Auth state changed:", {
            hasUser: !!currentUser,
            userId: currentUser?.uid,
            email: currentUser?.email,
            isMounted: isMountedRef.current,
          });
          if (isMountedRef.current) {
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
            setUser(currentUser);
            setInitializing(false);
            console.log("✅ App.tsx - User state updated:", {
              hasUser: !!currentUser,
              userId: currentUser?.uid,
            });
          }
        },
        (error) => {
          console.error("❌ App.tsx - Auth state error:", error);
          if (isMountedRef.current) {
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
            setInitializing(false);
          }
        }
      );
    };

    // Inicializar inmediatamente
    initializeAuth();

    // Listener para cuando la app vuelve a estar visible (iOS PWA)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMountedRef.current) {
        console.log("App became visible, re-checking auth state");
        // Forzar una verificación del estado de auth
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Si hay usuario, verificar que el estado esté actualizado
          currentUser.reload().catch(() => {
            // Si falla el reload, usar el usuario actual de todas formas
            if (isMountedRef.current) {
              setUser(currentUser);
              setInitializing(false);
            }
          });
        } else {
          // Si no hay usuario, asegurarse de que el estado esté actualizado
          if (isMountedRef.current) {
            setUser(null);
            setInitializing(false);
          }
        }
      }
    };

    // Listener para cuando la página se muestra (iOS PWA)
    const handlePageShow = (event: PageTransitionEvent) => {
      // Si la página se muestra desde cache (iOS PWA), re-inicializar
      if (event.persisted && isMountedRef.current) {
        console.log("Page shown from cache, re-initializing");
        setInitializing(true);
        initializeAuth();
      }
    };

    // Listener para cuando la app se reactiva (iOS específico)
    const handleFocus = () => {
      if (isMountedRef.current) {
        console.log("App focused, checking auth state");
        const currentUser = auth.currentUser;
        setUser((prevUser) => {
          if (currentUser !== prevUser) {
            return currentUser;
          }
          return prevUser;
        });
        setInitializing((prevInitializing) => {
          if (prevInitializing) {
            return false;
          }
          return prevInitializing;
        });
      }
    };

    // Listener para cuando la app se restaura desde cache (iOS PWA)
    const handleAppRestored = () => {
      if (isMountedRef.current) {
        console.log("App restored from cache, re-initializing");
        setInitializing(true);
        initializeAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("apprestored", handleAppRestored);

    return () => {
      isMountedRef.current = false;
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (unsubscribeRef.current) unsubscribeRef.current();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("apprestored", handleAppRestored);
    };
  }, []);

  const handleLanguageChange = async (language: string) => {
    if (user) {
      try {
        await saveUserLanguage(user.uid, language);
      } catch (error) {
        console.error("Error saving language:", error);
      }
    }
  };

  if (initializing) {
    return (
      <LanguageProvider user={null} onLanguageChange={handleLanguageChange}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={getTransition('fast')}
        >
          <LoadingScreen />
        </motion.div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider user={user} onLanguageChange={handleLanguageChange}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-purple-600 font-medium">Cargando...</p>
            </div>
          </div>
        }
      >
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="auth"
              {...fadeIn}
              transition={getTransition('fast')}
            >
              <Auth />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              {...fadeIn}
              transition={getTransition('fast')}
            >
              <Dashboard user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </LanguageProvider>
  );
};

export default App;

