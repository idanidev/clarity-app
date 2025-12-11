// src/utils/statusBar.ts
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export const setupStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    // ✅ Status bar OPACO (no transparente) con fondo oscuro
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Light }); // Texto blanco (para fondo oscuro)
    await StatusBar.setBackgroundColor({ color: '#0f172a' }); // Mismo color que el fondo de la app
  } catch (error) {
    // Error silencioso
  }
};

