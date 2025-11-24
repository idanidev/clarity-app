// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

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

// Registrar Service Worker para notificaciones push
if ("serviceWorker" in navigator && typeof window !== "undefined") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("Service Worker registrado correctamente:", registration.scope);
      })
      .catch((error) => {
        console.log("Error al registrar Service Worker:", error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
