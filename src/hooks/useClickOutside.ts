import { useEffect, RefObject, useRef } from 'react';

/**
 * Hook para detectar clicks fuera de un elemento
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: () => void,
  enabled: boolean = true
) => {
  // ✅ Use ref to avoid re-running effect when handler changes
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handlerRef.current();
      }
    };

    // Pequeño delay para evitar cierre inmediato
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, enabled]); // ✅ Removed handler from dependencies
};

