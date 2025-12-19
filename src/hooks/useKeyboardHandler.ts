import { useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

/**
 * Hook para manejar el teclado nativo
 * Ajusta el viewport cuando el teclado aparece/desaparece
 */
export const useKeyboardHandler = () => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const handleKeyboardShow = (info: any) => {
            // Añadir padding al body cuando aparece el teclado
            document.body.style.paddingBottom = `${info.keyboardHeight}px`;

            // Scroll al input activo
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement && activeElement.scrollIntoView) {
                setTimeout(() => {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        };

        const handleKeyboardHide = () => {
            // Remover padding cuando se oculta
            document.body.style.paddingBottom = '0px';
        };

        // Listeners
        Keyboard.addListener('keyboardWillShow', handleKeyboardShow);
        Keyboard.addListener('keyboardWillHide', handleKeyboardHide);

        // Configurar comportamiento
        if (Capacitor.getPlatform() === 'ios') {
            Keyboard.setAccessoryBarVisible({ isVisible: true });
            Keyboard.setScroll({ isDisabled: false });
        }

        return () => {
            Keyboard.removeAllListeners();
            document.body.style.paddingBottom = '0px';
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
