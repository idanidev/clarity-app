export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Habilita modo oscuro con clase 'dark'
  theme: {
    extend: {
      colors: {
        // Colores personalizados para modo oscuro
        dark: {
          50: "#f8f9fa",
          100: "#e9ecef",
          200: "#dee2e6",
          300: "#ced4da",
          400: "#adb5bd",
          500: "#6c757d",
          600: "#495057",
          700: "#343a40",
          800: "#212529",
          900: "#1a1d20",
        },
      },
      transitionDuration: {
        '250': '250ms',
        '150': '150ms',
        '100': '100ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-smooth': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ios': 'cubic-bezier(0.36, 0, 0.1, 1)',
        'android': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-in": "slideIn 0.15s ease-out",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "slide-up-native": "slideUpNative 0.25s cubic-bezier(0.36, 0, 0.1, 1)",
        "fade-in-native": "fadeInNative 0.15s cubic-bezier(0.36, 0, 0.1, 1)",
        "scale-in-native": "scaleInNative 0.25s cubic-bezier(0.36, 0, 0.1, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '44px', // iOS minimum
        'touch-android': '48px', // Android minimum
      },
      minWidth: {
        'touch': '44px',
        'touch-android': '48px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.pb-safe': {
          'padding-bottom': 'calc(1rem + env(safe-area-inset-bottom))',
        },
        '.pt-safe': {
          'padding-top': 'calc(1rem + env(safe-area-inset-top))',
        },
        '.pl-safe': {
          'padding-left': 'calc(1rem + env(safe-area-inset-left))',
        },
        '.pr-safe': {
          'padding-right': 'calc(1rem + env(safe-area-inset-right))',
        },
        '.p-safe': {
          'padding': 'calc(1rem + env(safe-area-inset-top)) calc(1rem + env(safe-area-inset-right)) calc(1rem + env(safe-area-inset-bottom)) calc(1rem + env(safe-area-inset-left))',
        },
        '.mb-safe': {
          'margin-bottom': 'calc(1rem + env(safe-area-inset-bottom))',
        },
        '.mt-safe': {
          'margin-top': 'calc(1rem + env(safe-area-inset-top))',
        },
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.h-dvh': {
          height: '100dvh',
        },
        '.min-h-dvh': {
          'min-height': '100dvh',
        },
        '.gpu-accelerate': {
          transform: 'translateZ(0)',
          '-webkit-transform': 'translateZ(0)',
          'backface-visibility': 'hidden',
          '-webkit-backface-visibility': 'hidden',
          'will-change': 'transform, opacity',
        },
        '.touch-feedback': {
          transition: 'transform 50ms cubic-bezier(0.36, 0, 0.1, 1), opacity 50ms cubic-bezier(0.36, 0, 0.1, 1)',
        },
        '.touch-feedback:active': {
          transform: 'scale(0.96) translateZ(0)',
          opacity: '0.8',
        },
        '.scroll-native': {
          '-webkit-overflow-scrolling': 'touch',
          'scroll-behavior': 'smooth',
          'overscroll-behavior': 'contain',
          'overscroll-behavior-y': 'contain',
        },
      });
    },
  ],
};
