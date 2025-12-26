import { useEffect } from "react";

/**
 * Hook para deshabilitar el scroll del body cuando un modal está abierto
 * Optimizado para iOS Capacitor - evita el espacio blanco/negro en safe-area
 * @param {boolean} isOpen - Si el modal está abierto
 */
export const useDisableBodyScroll = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    // Guardar valores originales
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    const originalOverscroll = document.body.style.overscrollBehavior;

    // Añadir clase para CSS adicional
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    // Fijar el body
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overscrollBehavior = 'none';

    // Prevenir touchmove en el documento mientras el modal está abierto
    // Esto evita el "bounce" de iOS
    const preventTouchMove = (e: TouchEvent) => {
      // Permitir scroll dentro de elementos scrolleables del modal
      const target = e.target as HTMLElement;
      const isScrollable = target.closest('.overflow-y-auto, .overflow-auto, [data-scrollable]');

      if (!isScrollable) {
        // Solo prevenir si no estamos en un área scrolleable
        let el: HTMLElement | null = target;
        while (el) {
          const style = window.getComputedStyle(el);
          const overflowY = style.overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') {
            // Es un contenedor scrolleable, permitir
            return;
          }
          el = el.parentElement;
        }
      }
    };

    // Añadir listener con passive: false para poder prevenir
    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    // Cleanup
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');

      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight || '';
      document.body.style.overscrollBehavior = originalOverscroll || '';
      document.body.style.left = '';
      document.body.style.right = '';

      // Remover listener
      document.removeEventListener('touchmove', preventTouchMove);

      // Restaurar posición de scroll
      window.scrollTo(scrollX, scrollY);
    };
  }, [isOpen]);
};
