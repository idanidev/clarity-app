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

// Transiciones predefinidas
export const getTransition = (type = "default") => {
  if (typeof window === "undefined") {
    return { duration: 0.3 };
  }

  const isMobile = window.innerWidth < 768;
  const duration = isMobile ? 0.2 : 0.3;

  const transitions = {
    default: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration,
    },
    fast: {
      type: "spring",
      stiffness: 500,
      damping: 35,
      duration: isMobile ? 0.15 : 0.2,
    },
    smooth: {
      type: "tween",
      ease: [0.4, 0, 0.2, 1],
      duration,
    },
    bounce: {
      type: "spring",
      stiffness: 400,
      damping: 20,
      bounce: isMobile ? 0 : 0.3,
      duration,
    },
  };

  return transitions[type] || transitions.default;
};
