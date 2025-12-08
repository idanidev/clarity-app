// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./styles/animations.css";
import "./styles/mobile.css";

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
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
      // Pequeño delay para asegurar que el teclado se haya cerrado
      setTimeout(() => {
        resetViewport();
        // Forzar un pequeño resize para resetear el zoom en algunos navegadores
        window.scrollTo(0, window.scrollY);
      }, 100);
    }
  }, true);
  
  // También resetear cuando se hace scroll (el usuario puede hacer zoom manual)
  let scrollTimeout;
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
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      console.log("Página restaurada desde cache, forzando re-render");
      // Pequeño delay para asegurar que todo esté listo
      setTimeout(() => {
        // Forzar un reflow
        document.body.offsetHeight;
        // Disparar un evento personalizado para que App.jsx lo maneje
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
        console.log("Service Worker registrado correctamente:", registration.scope);
        
        // Verificar actualizaciones periódicamente (menos frecuente para iOS)
        const updateInterval = setInterval(() => {
          registration.update();
        }, 300000); // Cada 5 minutos (reducido para iOS)
        
        // Escuchar actualizaciones del Service Worker
        registration.addEventListener("updatefound", () => {
          console.log("Nueva versión del Service Worker encontrada");
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                console.log("Nueva versión del Service Worker activada");
                // Solo recargar si la app está visible (evitar pantalla en blanco)
                if (document.visibilityState === "visible") {
                  // Pequeño delay antes de recargar para evitar pantalla en blanco
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("Error al registrar Service Worker:", error);
      });
  };

  window.addEventListener("load", registerServiceWorker);
  
  // También intentar registrar inmediatamente si el DOM ya está listo
  if (document.readyState === "complete" || document.readyState === "interactive") {
    registerServiceWorker();
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
