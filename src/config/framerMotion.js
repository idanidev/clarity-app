export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
};

// Transiciones predefinidas - OPTIMIZADAS para mejor rendimiento
export const getTransition = (type = "default") => {
  if (typeof window === "undefined") {
    return { duration: 0.15 };
  }

  // Respetar prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  const isMobile = window.innerWidth < 768;
  // Reducir duraciones: 0.2-0.3s → 0.1-0.15s (50% más rápido)
  const duration = isMobile ? 0.1 : 0.15;

  const transitions = {
    default: {
      type: "tween", // Cambiar de spring a tween (más rápido)
      ease: [0.4, 0, 0.2, 1],
      duration,
    },
    fast: {
      type: "tween",
      ease: "easeOut",
      duration: isMobile ? 0.08 : 0.1, // Muy rápido
    },
    smooth: {
      type: "tween",
      ease: [0.4, 0, 0.2, 1],
      duration: isMobile ? 0.12 : 0.15,
    },
    bounce: {
      type: "spring",
      stiffness: 500, // Aumentar stiffness (más rápido)
      damping: 35, // Aumentar damping (menos rebote)
      bounce: isMobile ? 0 : 0.2, // Reducir bounce
    },
    modal: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      duration: 0.12,
    },
    page: {
      type: "tween",
      ease: "easeInOut",
      duration: 0.15, // máximo 150ms
    },
  };

  return transitions[type] || transitions.default;
};
