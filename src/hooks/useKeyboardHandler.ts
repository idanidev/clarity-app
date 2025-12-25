import { useEffect } from 'react';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

interface KeyboardInfo {
    keyboardHeight: number;
}

/**
 * Hook para manejar el teclado nativo
 * Ajusta el viewport cuando el teclado aparece/desaparece
 * Optimizado para iOS y Android
 */
export const useKeyboardHandler = () => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const platform = Capacitor.getPlatform();

        const handleKeyboardShow = (info: KeyboardInfo) => {
            // Añadir padding al body cuando aparece el teclado
            document.body.style.paddingBottom = `${info.keyboardHeight}px`;

            // En Android, también ajustar el viewport
            if (platform === 'android') {
                document.documentElement.style.setProperty(
                    '--keyboard-height',
                    `${info.keyboardHeight}px`
                );
            }

            // Scroll al input activo
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement && activeElement.scrollIntoView) {
                setTimeout(() => {
                    activeElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 100);
            }
        };

        const handleKeyboardHide = () => {
            // Remover padding cuando se oculta
            document.body.style.paddingBottom = '0px';
            document.documentElement.style.setProperty('--keyboard-height', '0px');
        };

        // Listeners
        Keyboard.addListener('keyboardWillShow', handleKeyboardShow);
        Keyboard.addListener('keyboardDidShow', handleKeyboardShow); // Android usa didShow
        Keyboard.addListener('keyboardWillHide', handleKeyboardHide);
        Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

        // Configurar comportamiento según plataforma
        const setupKeyboard = async () => {
            try {
                if (platform === 'ios') {
                    await Keyboard.setAccessoryBarVisible({ isVisible: true });
                    await Keyboard.setScroll({ isDisabled: false });
                } else if (platform === 'android') {
                    // En Android, usar resize mode 'body' para mejor comportamiento
                    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
                }
            } catch (e) {
                // Silenciar errores de configuración
            }
        };

        setupKeyboard();

        return () => {
            Keyboard.removeAllListeners();
            document.body.style.paddingBottom = '0px';
            document.documentElement.style.setProperty('--keyboard-height', '0px');
        };
    }, []);
};

/**
 * Función helper para cerrar el teclado manualmente
 */
export const hideKeyboard = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await Keyboard.hide();
    } catch (e) {
        // Silenciar errores
    }
};

/**
 * Función helper para mostrar el teclado
 */
export const showKeyboard = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await Keyboard.show();
    } catch (e) {
        // Silenciar errores
    }
};

