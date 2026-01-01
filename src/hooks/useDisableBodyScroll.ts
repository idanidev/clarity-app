import { useEffect } from "react";

/**
 * Hook para deshabilitar el scroll del body cuando un modal está abierto
 * Permite scroll dentro de elementos marcados con [data-scrollable] o .overflow-y-auto
 */
export const useDisableBodyScroll = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    // Guardar estilos originales
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    // Handler para permitir scroll solo en contenedores scrollables
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;

      // Buscar si estamos dentro de un contenedor scrollable
      let element: HTMLElement | null = target;
      while (element && element !== document.body) {
        // Verificar atributo data-scrollable o clases de overflow
        if (
          element.hasAttribute('data-scrollable') ||
          element.classList.contains('overflow-y-auto') ||
          element.classList.contains('overflow-auto')
        ) {
          // Permitir scroll en este contenedor
          return;
        }

        // Verificar estilo computado
        const style = window.getComputedStyle(element);
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          element.scrollHeight > element.clientHeight
        ) {
          // Es un contenedor con scroll, permitir
          return;
        }

        element = element.parentElement;
      }

      // Si no estamos en un contenedor scrollable, prevenir scroll del body
      e.preventDefault();
    };

    // Añadir listener
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Cleanup
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);
};
