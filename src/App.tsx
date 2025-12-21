// src/App.tsx
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import { App as AppCapacitor } from "@capacitor/app";
import { auth } from "./firebase";
import { LanguageProvider, useTranslation } from "./contexts/LanguageContext";
import { saveUserLanguage } from "./services/firestoreService";
import { fadeIn, getTransition } from "./config/framerMotion";
import { isNative } from "./utils/platform";
import NetworkStatus from "./components/NetworkStatus";

// OPTIMIZACIÓN: Code splitting de rutas principales
const Auth = lazy(() => import("./screens/Auth/Auth"));
const Dashboard = lazy(() => import("./screens/Dashboard/Dashboard"));
const AdminMigration = lazy(() => import("./screens/Admin/AdminMigration"));

// Prefetch helpers para mejorar la navegación
const preloadAuth = () => import("./screens/Auth/Auth");
const preloadDashboard = () => import("./screens/Dashboard/Dashboard");

const LoadingScreen = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-purple-400 font-medium text-sm">
          {t("common.loading")}
        </span>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const isMountedRef = useRef(true);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Custom hash routing for admin panel
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Configurar Capacitor (SplashScreen)
  useEffect(() => {
    if (isNative) {
      const configureCapacitor = async () => {
        try {
          // StatusBar ya se configura en main.tsx con setupStatusBar()
        } catch (error) {
          // Error silencioso
        }

        try {
          if (Capacitor.getPlatform() === 'ios') {
            await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
          }
        } catch (error) {
          console.error('Error setting keyboard resize mode', error);
        }

        // Deep Linking Listener
        AppCapacitor.addListener('appUrlOpen', (data) => {
          console.log('App opened with URL:', data.url);
          try {
            // url: clarity://dashboard/add-expense
            const url = new URL(data.url);
            const path = url.pathname || url.hostname; // Dependiendo del esquema

            // Manejo de rutas simple
            if (data.url.includes('add-expense')) {
              // Emitir evento o navegar (usando hash por simplicidad en esta arquitectura)
              window.location.hash = '#/dashboard?action=add-expense';
            } else if (data.url.includes('dashboard')) {
              window.location.hash = '#/dashboard';
            }
          } catch (e) {
            console.error('Error handling deep link:', e);
          }
        });
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
          setInitializing(false);
        }
      }, 2000); // 2 segundos máximo - reducido para carga más rápida

      unsubscribeRef.current = onAuthStateChanged(
        auth,
        (currentUser) => {
          if (isMountedRef.current) {
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
            setUser(currentUser);
            setInitializing(false);
            if (isNative) SplashScreen.hide().catch(() => { });
          }
        },
        (error) => {
          if (isMountedRef.current) {
            console.error(error); // Log error to fix unused var
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
            setInitializing(false);
            if (isNative) SplashScreen.hide().catch(() => { });
          }
        }
      );
    };

    // Inicializar inmediatamente
    initializeAuth();

    // Listener para cuando la app vuelve a estar visible (iOS PWA)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMountedRef.current) {
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
        setInitializing(true);
        initializeAuth();
      }
    };

    // Listener para cuando la app se reactiva (iOS específico)
    const handleFocus = () => {
      if (isMountedRef.current) {
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
        // Error silencioso
      }
    }
  };

  // Prefetch básico de rutas según estado
  useEffect(() => {
    if (user) {
      preloadDashboard();
    } else {
      preloadAuth();
    }
  }, [user]);

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
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
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
              className="flex flex-col h-full overflow-hidden relative"
            >
              <NetworkStatus />
              {currentHash === '#/admin/migration' ? (
                <AdminMigration />
              ) : (
                <Dashboard user={user} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </LanguageProvider >
  );
};

export default App;

