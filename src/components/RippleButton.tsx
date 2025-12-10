// ============================================
// RippleButton.tsx - Botón con ripple effect (Material Design)
// ============================================
import { memo, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  rippleColor?: string;
  hapticFeedback?: boolean;
  className?: string;
}

const isAndroid = Capacitor.getPlatform() === "android";
const isNative = Capacitor.isNativePlatform();

const RippleButton = memo<RippleButtonProps>(
  ({
    children,
    variant = "primary",
    size = "md",
    rippleColor,
    hapticFeedback = true,
    className = "",
    onClick,
    disabled,
    ...props
  }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const createRipple = useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        const button = buttonRef.current;
        if (!button || disabled) return;

        // Haptic feedback (nativo)
        if (hapticFeedback && isNative) {
          try {
            await Haptics.impact({ style: ImpactStyle.Light });
          } catch {}
        }

        // Ripple effect (Android principalmente, pero funciona en todos)
        if (isAndroid || rippleColor) {
          const rect = button.getBoundingClientRect();
          const diameter = Math.max(rect.width, rect.height);
          const radius = diameter / 2;

          const x = event.clientX - rect.left - radius;
          const y = event.clientY - rect.top - radius;

          const ripple = document.createElement("span");
          ripple.style.width = ripple.style.height = `${diameter}px`;
          ripple.style.left = `${x}px`;
          ripple.style.top = `${y}px`;
          ripple.style.position = "absolute";
          ripple.style.borderRadius = "50%";
          ripple.style.background = rippleColor || "rgba(255, 255, 255, 0.5)";
          ripple.style.transform = "scale(0)";
          ripple.style.animation = "ripple-animation 0.6s ease-out";
          ripple.style.pointerEvents = "none";
          ripple.classList.add("ripple");

          button.appendChild(ripple);

          setTimeout(() => {
            ripple.remove();
          }, 600);
        }

        // Call original onClick
        if (onClick) {
          onClick(event);
        }
      },
      [onClick, disabled, hapticFeedback, rippleColor]
    );

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm min-h-[36px]",
      md: "px-4 py-2.5 text-base min-h-[44px]",
      lg: "px-6 py-3.5 text-lg min-h-[52px]",
    };

    const variantClasses = {
      primary:
        "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90",
      secondary:
        "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600",
      ghost:
        "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
    };

    return (
      <>
        <style>{`
          @keyframes ripple-animation {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        `}</style>
        <button
          ref={buttonRef}
          onClick={createRipple}
          disabled={disabled}
          className={`
            relative overflow-hidden
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            rounded-xl font-medium
            transition-all duration-150
            active:scale-95
            touch-manipulation
            select-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {children}
        </button>
      </>
    );
  }
);

RippleButton.displayName = "RippleButton";

export default RippleButton;

