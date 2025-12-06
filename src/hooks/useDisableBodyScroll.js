import { useEffect } from "react";

/**
 * Hook para deshabilitar el scroll del body cuando un modal está abierto
 * @param {boolean} isOpen - Si el modal está abierto
 */
export const useDisableBodyScroll = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      // Guardar el valor original de overflow
      const originalOverflow = document.body.style.overflow;
      // Deshabilitar scroll
      document.body.style.overflow = "hidden";
      
      // También prevenir scroll en iOS Safari
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const scrollY = window.scrollY;
      
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      // Cleanup: restaurar el scroll cuando el modal se cierra
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = "";
        
        // Restaurar la posición de scroll en iOS
        if (scrollY !== 0) {
          window.scrollTo(0, scrollY);
        }
      };
    }
  }, [isOpen]);
};


