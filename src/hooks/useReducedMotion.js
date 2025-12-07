import { useState, useEffect } from 'react';

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Hook para detectar si es móvil
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Hook combinado para optimizaciones móvil
export const useAnimationConfig = () => {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  return {
    // Deshabilitar animaciones complejas en móvil o si el usuario lo prefiere
    shouldAnimate: !prefersReducedMotion,
    // Animaciones más rápidas en móvil
    duration: isMobile ? 0.2 : 0.3,
    // Menos rebote en móvil
    bounce: isMobile ? 0 : 0.3,
    // Tipo de easing
    ease: prefersReducedMotion ? 'linear' : [0.4, 0, 0.2, 1],
  };
};

