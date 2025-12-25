// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import { setupStatusBar } from './utils/statusBar';
import App from "./App";
import "./index.css";
import "./styles/animations.css";
import "./styles/mobile.css";
// native.css se importa desde index.css para evitar duplicación

// Configurar StatusBar antes de renderizar (solo en apps nativas)
if (Capacitor.isNativePlatform()) {
  setupStatusBar();
}

// Prevenir zoom permanente en móviles cuando se cierra el teclado
if (typeof window !== "undefined") {
  let viewport = document.querySelector('meta[name="viewport"]');
  const originalContent = viewport?.getAttribute("content") || "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes";

  const resetViewport = () => {
    if (viewport) {
      viewport.setAttribute("content", originalContent);
    }
  };

  // Detectar cuando un input/textarea pierde el foco
  document.addEventListener("focusout", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
      // Pequeño delay para asegurar que el teclado se haya cerrado
      setTimeout(() => {
        resetViewport();
        // Forzar un pequeño resize para resetear el zoom en algunos navegadores
        window.scrollTo(0, window.scrollY);
      }, 100);
    }
  }, true);

  // También resetear cuando se hace scroll (el usuario puede hacer zoom manual)
  let scrollTimeout: NodeJS.Timeout;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      resetViewport();
    }, 150);
  });
}

// Manejar reactivación de la app (especialmente importante para iOS PWA)
if (typeof window !== "undefined") {
  // Listener para cuando la app vuelve a estar visible
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Forzar un pequeño reflow para asegurar que el contenido se renderice
      document.body.offsetHeight;
    }
  });

  // Listener para cuando la página se muestra desde cache (iOS PWA)
  window.addEventListener("pageshow", (event: PageTransitionEvent) => {
    if (event.persisted) {
      // Pequeño delay para asegurar que todo esté listo
      setTimeout(() => {
        // Forzar un reflow
        document.body.offsetHeight;
        // Disparar un evento personalizado para que App.tsx lo maneje
        window.dispatchEvent(new Event("apprestored"));
      }, 100);
    }
  });

  // Listener para cuando la app recibe foco
  window.addEventListener("focus", () => {
    // Forzar un reflow para asegurar renderizado
    document.body.offsetHeight;
  });
}

// Registrar Service Worker para notificaciones push
if ("serviceWorker" in navigator && typeof window !== "undefined") {
  const registerServiceWorker = () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js", {
        scope: "/",
        updateViaCache: "none", // Siempre verificar actualizaciones
      })
      .then((registration) => {
        // Verificar actualizaciones periódicamente (menos frecuente para iOS)
        const updateInterval = setInterval(() => {
          registration.update();
        }, 900000); // Cada 15 minutos
        // Guardar el intervalo en la instancia por si se necesita limpiarlo en el futuro
        // @ts-ignore - propiedad interna no tipada
        registration.__clarityUpdateInterval = updateInterval;

        // ✅ NO recargar automáticamente cuando el Service Worker se actualiza
        // Esto causaba un bucle de recargas con skipWaiting()
        // Los usuarios verán los cambios en la próxima recarga natural
        registration.addEventListener("updatefound", () => {
          console.log("[SW] Nueva versión detectada, se aplicará en la próxima recarga");
        });
      })
      .catch(() => {
        // Error silencioso
      });
  };

  window.addEventListener("load", registerServiceWorker);

  // También intentar registrar inmediatamente si el DOM ya está listo
  if (document.readyState === "complete" || document.readyState === "interactive") {
    registerServiceWorker();
  }
}

import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // ✅ TEMPORALMENTE sin StrictMode para diagnosticar problema de spinners
  // React.StrictMode causa dobles renders en desarrollo que pueden parecer "bucles"
  // <React.StrictMode>
    <ErrorBoundary level="global">
      <App />
    </ErrorBoundary>
  // </React.StrictMode>
);

